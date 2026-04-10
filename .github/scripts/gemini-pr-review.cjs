/**
 * .github/scripts/gemini-pr-review.cjs
 *
 * - ESM 레포("type":"module")에서도 동작하도록 CommonJS(.cjs)로 작성
 * - PR 변경 파일 중 "reviewable"만 diff로 구성 (md/dist/build/coverage/lock 등 제외)
 * - 민감정보 마스킹
 * - PR 코멘트 upsert(누적 방지)
 * - Gemini 모델 하드코딩 제거: v1beta ListModels로 generateContent 지원 모델 자동 선택
 */

const axios = require("axios");

const { GEMINI_API_KEY, GITHUB_TOKEN, PR_TITLE, PR_NUMBER, REPO } = process.env;

if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN");
if (!PR_TITLE || !PR_NUMBER || !REPO) throw new Error("Missing PR env");

const [owner, repo] = REPO.split("/");

const COMMENT_MARKER = "<!-- gemini-fe-review -->";
const GEMINI_MAX_RETRIES = 3;
const GEMINI_RETRY_BASE_MS = 1500;

/** --- helpers --- **/

class GeminiTransientError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "GeminiTransientError";
        this.status = options.status;
        this.modelName = options.modelName;
        this.cause = options.cause;
    }
}

function maskSecrets(text) {
    if (!text) return text;
    let t = text;

    const patterns = [
        [
            /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
            "[REDACTED_PRIVATE_KEY]",
        ],
        [/\bAKIA[0-9A-Z]{16}\b/g, "[REDACTED_AWS_ACCESS_KEY]"],
        [/(api[_-]?key\s*[:=]\s*)(['"]?)[^'"\s]+(\2)/gi, "$1[REDACTED]$3"],
        [/(access[_-]?token\s*[:=]\s*)(['"]?)[^'"\s]+(\2)/gi, "$1[REDACTED]$3"],
        [/(refresh[_-]?token\s*[:=]\s*)(['"]?)[^'"\s]+(\2)/gi, "$1[REDACTED]$3"],
        [/(secret\s*[:=]\s*)(['"]?)[^'"\s]+(\2)/gi, "$1[REDACTED]$3"],
        [/Authorization:\s*Bearer\s+[A-Za-z0-9\-\._~\+\/]+=*/gi, "Authorization: Bearer [REDACTED]"],
    ];

    for (const [re, repl] of patterns) t = t.replace(re, repl);
    return t;
}

function chunkString(str, chunkSize) {
    const chunks = [];
    for (let i = 0; i < str.length; i += chunkSize) chunks.push(str.slice(i, i + chunkSize));
    return chunks;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiStatus(status) {
    return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function formatAxiosError(err) {
    const status = err?.response?.status;
    const apiMessage = err?.response?.data?.error?.message;
    return apiMessage ? `status=${status} message=${apiMessage}` : err?.message || `status=${status}`;
}

// 워크플로우 filters와 동일한 제외 기준
function isExcludedFile(filename) {
    const f = String(filename || "");

    if (f.endsWith(".md") || f.endsWith(".mdx")) return true;

    if (f.includes("/dist/") || f.startsWith("dist/")) return true;
    if (f.includes("/build/") || f.startsWith("build/")) return true;
    if (f.includes("/coverage/") || f.startsWith("coverage/")) return true;
    if (f.includes("/.next/") || f.startsWith(".next/")) return true;

    if (f.endsWith(".lock")) return true;
    if (f === "pnpm-lock.yaml" || f.endsWith("/pnpm-lock.yaml")) return true;
    if (f === "yarn.lock" || f.endsWith("/yarn.lock")) return true;

    return false;
}

/** --- GitHub API --- **/

async function getPRFiles() {
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}/files?per_page=100`;
    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
        },
    });
    return res.data || [];
}

async function listIssueComments() {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments?per_page=100`;
    const res = await axios.get(url, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
        },
    });
    return res.data || [];
}

async function createIssueComment(body) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${PR_NUMBER}/comments`;
    await axios.post(
        url,
        { body },
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
            },
        }
    );
}

async function updateIssueComment(commentId, body) {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/comments/${commentId}`;
    await axios.patch(
        url,
        { body },
        {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: "application/vnd.github+json",
            },
        }
    );
}

/** --- Diff build --- **/

async function buildReviewableDiff(files) {
    const reviewableFiles = (files || []).filter((f) => !isExcludedFile(f.filename));

    const patches = reviewableFiles
        .map((f) => (f.patch ? `FILE: ${f.filename}\n---\n${f.patch}\n` : null))
        .filter(Boolean);

    return patches.join("\n");
}

/** --- Prompt --- **/

function buildPrompt() {
    return `
You are a senior frontend reviewer for the project.

You are an expert in:
- TypeScript, React, modern bundlers (e.g., Rsbuild/Vite)
- Tailwind CSS, component libraries (shadcn/ui, Ant Design)
- React Query, Zustand, React Hook Form, Zod, Axios
- FSD-oriented architecture

Folder structure (FSD):
- app: app bootstrapping/composition
- pages: route-level screens
- widgets: large UI blocks
- features: domain-specific logic + UI
- entities: domain model management
- shared: cross-cutting utilities/components

When reviewing:
- Focus ONLY on frontend code (ignore build outputs/docs/lockfiles).
- Evaluate structure, readability, performance, and maintainability.
- Point out violations of FSD structure.
- Check consistency with existing patterns.
- Identify potential bugs and edge cases.
- Suggest concrete improvements.

Important:
- Write the entire review in Korean.
- Be constructive and practical.
- Do not repeat the diff verbatim.

Output format (in Korean):
1. 요약 (핵심 변경 사항 요약)
2. 주요 개선 포인트 (중요도 높은 문제 위주)
3. 구조/아키텍처 관점 피드백
4. 코드 품질 및 성능 관련 제안
5. 개선 제안 예시 (필요 시 코드 스니펫)
6. 체크리스트 (머지 전 확인 사항)
`;
}

/** --- Gemini API (model auto-pick) --- **/

async function listGeminiModels() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
        try {
            const res = await axios.get(url, { headers: { Accept: "application/json" } });
            return res.data?.models ?? [];
        } catch (err) {
            const status = err?.response?.status;
            const retryable = isRetryableGeminiStatus(status);

            console.log(
                `Gemini model listing failed attempt=${attempt}/${GEMINI_MAX_RETRIES} ${formatAxiosError(err)}`
            );

            if (!retryable || attempt === GEMINI_MAX_RETRIES) {
                if (retryable) {
                    throw new GeminiTransientError("Gemini model listing is temporarily unavailable.", {
                        status,
                        cause: err,
                    });
                }
                throw err;
            }

            await sleep(GEMINI_RETRY_BASE_MS * attempt);
        }
    }

    return [];
}

function pickModelForGenerateContent(models) {
    const usable = (models || []).filter(
        (m) =>
            Array.isArray(m.supportedGenerationMethods) &&
            m.supportedGenerationMethods.includes("generateContent") &&
            typeof m.name === "string"
    );

    if (usable.length === 0) return null;

    // 지원되는 것 중 선호 순위
    const preferredBaseIds = [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
    ];

    for (const base of preferredBaseIds) {
        const found = usable.find((m) => m.baseModelId === base);
        if (found) return found.name; // e.g. "models/gemini-2.0-flash"
    }

    return usable[0].name;
}

async function callGemini(prompt, diffText) {
    const models = await listGeminiModels();
    const preferredModelName = pickModelForGenerateContent(models);

    if (!preferredModelName) {
        const debug = JSON.stringify(models?.slice?.(0, 3) ?? [], null, 2);
        throw new Error(`No Gemini models support generateContent. models(sample)=${debug}`);
    }

    const body = {
        contents: [
            {
                role: "user",
                parts: [{ text: `PR Title: ${PR_TITLE}\n\n${prompt}\n\nPR diff:\n${diffText}` }],
            },
        ],
        generationConfig: { temperature: 0.2, topP: 0.9, maxOutputTokens: 6000 },
    };

    const modelCandidates = [
        preferredModelName,
        ...models.map((m) => m.name).filter((name) => typeof name === "string" && name !== preferredModelName),
    ];
    let lastTransientError = null;

    for (const modelName of modelCandidates) {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

        for (let attempt = 1; attempt <= GEMINI_MAX_RETRIES; attempt++) {
            try {
                const res = await axios.post(url, body, { headers: { "Content-Type": "application/json" } });
                const text =
                    res.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
                    "No response from Gemini.";
                return text;
            } catch (err) {
                const status = err?.response?.status;
                const data = err?.response?.data;
                const retryable = isRetryableGeminiStatus(status);

                console.log(
                    `Gemini call failed for ${modelName}:generateContent attempt=${attempt}/${GEMINI_MAX_RETRIES} status=${status}`
                );
                if (data) console.log("Gemini error body:", JSON.stringify(data).slice(0, 2000));

                if (!retryable) {
                    throw err;
                }

                lastTransientError = new GeminiTransientError(
                    `Gemini generateContent is temporarily unavailable for ${modelName}.`,
                    {
                        status,
                        modelName,
                        cause: err,
                    }
                );

                if (attempt < GEMINI_MAX_RETRIES) {
                    await sleep(GEMINI_RETRY_BASE_MS * attempt);
                }
            }
        }
    }

    throw lastTransientError || new GeminiTransientError("Gemini generateContent is temporarily unavailable.");
}

/** --- Comment rendering --- **/

function buildCommentBody(reviewMarkdown, meta) {
    const { chunksUsed, truncated } = meta;

    return [
        COMMENT_MARKER,
        "## 🤖 Gemini FE Automated Review",
        `**PR Title:** ${PR_TITLE}`,
        "",
        reviewMarkdown,
        "",
        "---",
        `**Notes:** chunks=${chunksUsed}${truncated ? ", truncated=true" : ""}`,
        "<sub>Generated by GitHub Actions + Gemini</sub>",
    ].join("\n");
}

function buildUnavailableCommentBody(meta = {}) {
    const { reason } = meta;

    return [
        COMMENT_MARKER,
        "## 🤖 Gemini FE Automated Review",
        `**PR Title:** ${PR_TITLE}`,
        "",
        "Gemini API의 일시적인 과부하로 자동 리뷰를 생성하지 못했습니다.",
        "",
        `- 사유: ${reason || "일시적 외부 API 장애"}`,
        "- 조치: 재시도 후에도 실패하여 이번 실행은 실패 처리하지 않고 종료했습니다.",
        "- 다음 실행: PR 업데이트 또는 워크플로 재실행 시 다시 리뷰 생성을 시도합니다.",
        "",
        "---",
        "<sub>Generated by GitHub Actions + Gemini</sub>",
    ].join("\n");
}

/** --- main --- **/

(async () => {
    const files = await getPRFiles();
    let diff = await buildReviewableDiff(files);

    if (!diff.trim()) {
        console.log("No reviewable patches found. Skip.");
        return;
    }

    diff = maskSecrets(diff);

    const prompt = buildPrompt();

    // 너무 크게 보내면 실패/품질저하가 나서 분할
    const MAX_CHARS_PER_CHUNK = 45000;
    const chunks = chunkString(diff, MAX_CHARS_PER_CHUNK);

    const MAX_CHUNKS = 4;
    const usedChunks = chunks.slice(0, MAX_CHUNKS);
    const truncated = chunks.length > MAX_CHUNKS;

    const results = [];
    for (let i = 0; i < usedChunks.length; i++) {
        const header = usedChunks.length > 1 ? `\n\n[Chunk ${i + 1}/${usedChunks.length}]\n` : "\n";
        const review = await callGemini(prompt, header + usedChunks[i]);
        results.push(review);
    }

    const combinedReview =
        results.length === 1
            ? results[0]
            : results.map((r, idx) => `### Part ${idx + 1}\n\n${r}`).join("\n\n");

    const body = buildCommentBody(combinedReview, {
        chunksUsed: usedChunks.length,
        truncated,
    });

    const comments = await listIssueComments();
    const existing = comments.find((c) => typeof c.body === "string" && c.body.includes(COMMENT_MARKER));

    if (existing) {
        await updateIssueComment(existing.id, body);
        console.log("✅ Updated existing Gemini review comment.");
    } else {
        await createIssueComment(body);
        console.log("✅ Created Gemini review comment.");
    }
})().catch(async (e) => {
    if (e instanceof GeminiTransientError) {
        console.warn("⚠️ Gemini PR review skipped due to transient API failure:", e.message);

        try {
            const comments = await listIssueComments();
            const existing = comments.find((c) => typeof c.body === "string" && c.body.includes(COMMENT_MARKER));
            const body = buildUnavailableCommentBody({
                reason: e.status ? `HTTP ${e.status}` : e.message,
            });

            if (existing) {
                await updateIssueComment(existing.id, body);
                console.log("⚠️ Updated existing Gemini review comment with temporary failure note.");
            } else {
                await createIssueComment(body);
                console.log("⚠️ Created Gemini review temporary failure comment.");
            }
        } catch (commentError) {
            console.warn("Failed to write temporary Gemini failure comment:", commentError?.message ?? commentError);
        }

        process.exit(0);
        return;
    }

    console.error("❌ Gemini PR review action failed:", e?.message ?? e);
    process.exit(1);
});
