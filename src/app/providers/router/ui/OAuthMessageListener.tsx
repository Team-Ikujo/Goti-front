import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/entities/auth/model/authStore";
import { isOAuthSuccessMessage } from "@/shared/lib/oauthMessage";

// 팝업 OAuth 로그인 완료 시 토큰을 받아 store에 저장하고 SPA 이동
const OAuthMessageListener = () => {
  const navigate = useNavigate();
  const setAuthTokens = useAuthStore((s) => s.setAuthTokens);
  const setRecentLoginProvider = useAuthStore((s) => s.setRecentLoginProvider);
  const clearLoginPopupTimer = useAuthStore((s) => s.clearLoginPopupTimer);
  const setLoginAlert = useAuthStore((s) => s.setLoginAlert);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isOAuthSuccessMessage(event.data)) return;
      clearLoginPopupTimer();
      setAuthTokens({
        accessToken: event.data.accessToken,
        socialVerifyToken: event.data.socialVerifyToken,
      });
      if (event.data.provider) setRecentLoginProvider(event.data.provider);

      if (event.data.loginAlert) {
        // 계정 상태 알림이 있으면 navigate 하지 않고 LoginPage에서 다이얼로그 표시 후 이동
        setLoginAlert(event.data.loginAlert);
        return;
      }

      navigate(event.data.redirectPath ?? "/", { replace: true });
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [navigate, setAuthTokens, setRecentLoginProvider, clearLoginPopupTimer, setLoginAlert]);

  return null;
};

export default OAuthMessageListener;
