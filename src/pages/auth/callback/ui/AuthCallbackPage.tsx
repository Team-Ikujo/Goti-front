import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { handleKakaoCallback } from "@/features/auth/kakao";
import { handleGoogleCallback } from "@/features/auth/google";
import { handleNaverCallback } from "@/features/auth/naver";

const AuthCallbackPage = () => {
  const { provider } = useParams<{ provider: string }>();
  const [message, setMessage] = useState("로그인 중...");
  const [authCode, setAuthCode] = useState<string | null>(null); //OAuth 확인용 TODO: 확인 후 지울 것

  const normalizedProvider = useMemo(() => provider?.toLowerCase(), [provider]);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        setAuthCode(code);

        switch (normalizedProvider) {
          case "kakao":
            await handleKakaoCallback(window.location.search);
            break;
          case "google":
            await handleGoogleCallback(window.location.search);
            break;
          case "naver":
            await handleNaverCallback(window.location.search);
            break;
          default:
            throw new Error(
              `Unsupported provider: ${normalizedProvider ?? "none"}`,
            );
        }

        setMessage("로그인 완료!");
      } catch (error) {
        setMessage("로그인에 실패했어요. 다시 시도해 주세요.");
        console.error(error);
      }
    };

    run();
  }, [normalizedProvider]);

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
      </div>
    </div>
  );
};

export default AuthCallbackPage;
