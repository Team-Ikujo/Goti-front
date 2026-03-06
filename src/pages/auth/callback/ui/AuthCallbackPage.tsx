import { useParams } from "react-router-dom";
import { useOAuthCallbackFlow } from "@/pages/auth/callback/model/useOAuthCallbackFlow";

const AuthCallbackPage = () => {
  const { provider } = useParams<{ provider: string }>();
  const { message, errorMessage, normalizedProvider } = useOAuthCallbackFlow({
    provider,
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm">{message}</p>
        <div className="text-xs text-slate-500">
          provider: {normalizedProvider ?? "none"}
        </div>
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
