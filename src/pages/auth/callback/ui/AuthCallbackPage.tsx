import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSubmitAuthCode } from "@/features/auth/model/useSubmitAuthCode";
import type {
  SocialProvider,
  SubmitAuthCodeResponse,
} from "@/features/auth/api/submitAuthCode";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { ApiError } from "@/shared/api/client";

const AuthCallbackPage = () => {
  const { provider } = useParams<{ provider: string }>();
  const [message, setMessage] = useState("로그인 중...");
  const [authCode, setAuthCode] = useState<string | null>(null); //OAuth 확인용 TODO: 확인 후 지울 것
  const [authResponse, setAuthResponse] =
    useState<SubmitAuthCodeResponse | null>(null); //OAuth 확인용 TODO: 확인 후 지울 것
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizedProvider = useMemo(() => provider?.toLowerCase(), [provider]);
  const submitAuthCodeMutation = useSubmitAuthCode();
  const setAuthTokens = useAuthStore((state) => state.setAuthTokens);
  const didRunRef = useRef(false);
  const navigate = useNavigate();

  const redirectFromPopup = (path: string) => {
    if (window.opener && !window.opener.closed) {
      window.opener.location.assign(path);
      window.close();
      return true;
    }
    return false;
  };

  const isSocialProvider = (value?: string): value is SocialProvider => {
    return value === "kakao" || value === "naver" || value === "google";
  };

  useEffect(() => {
    if (didRunRef.current) {
      return;
    }
    didRunRef.current = true;

    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        setAuthCode(code);

        if (!code) {
          throw new Error("Missing authorization code.");
        }

        if (!isSocialProvider(normalizedProvider)) {
          throw new Error(
            `Unsupported provider: ${normalizedProvider ?? "none"}`,
          );
        }

        const response = await submitAuthCodeMutation.mutateAsync({
          provider: normalizedProvider,
          code,
          state: params.get("state") ?? undefined,
        });

        setAuthResponse(response);
        setAuthTokens({
          accessToken: response.accessToken,
          tempToken: response.tempToken,
          isLinked: response.isLinked,
        });
        setMessage("로그인 완료!");
        // TODO: 테스트를 위한 임시 코드, 삭제 필요
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (response.isLinked) {
          if (!redirectFromPopup("/")) {
            navigate("/", { replace: true });
          }
        } else {
          if (!redirectFromPopup("/signup")) {
            navigate("/signup", { replace: true });
          }
        }
      } catch (error) {
        setMessage("로그인에 실패했어요. 다시 시도해 주세요.");
        if (error instanceof ApiError) {
          const details =
            typeof error.data === "string"
              ? error.data
              : JSON.stringify(error.data, null, 2);
          setErrorMessage(
            `[${error.status ?? "NO_STATUS"}] ${error.message}${
              details ? `\n${details}` : ""
            }`,
          );
        } else if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage(String(error));
        }
        console.error(error);
      }
    };

    run();
  }, [navigate, normalizedProvider, submitAuthCodeMutation]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm">{message}</p>
        <div className="text-xs text-slate-500">
          provider: {normalizedProvider ?? "none"}
        </div>
        {authCode ? (
          <div className="w-full break-all rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-200">
            code: {authCode}
          </div>
        ) : null}
        {authResponse ? (
          <div className="w-full rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left text-xs text-slate-200">
            response:
            <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-slate-200">
              {JSON.stringify(authResponse, null, 2)}
            </pre>
          </div>
        ) : null}
        {errorMessage ? (
          <div className="w-full rounded-xl border border-red-400/60 bg-red-950/40 p-3 text-left text-xs text-red-200">
            error:
            <pre className="mt-2 whitespace-pre-wrap break-all text-xs text-red-200">
              {errorMessage}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
