import type { ReactNode } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KakaoLoginButton } from "@/features/auth/kakao";
import { NaverLoginButton } from "@/features/auth/naver";
import { GoogleLoginButton } from "@/features/auth/google";
import RecentLoginBadge from "@/features/auth/ui/RecentLoginBadge";
import LoginTimeoutDialog from "./LoginTimeoutDialog";
import LoginStatusDialog from "./LoginStatusDialog";
import {
  useAuthStore,
  type SocialProvider,
} from "@/entities/auth/model/authStore";


type SocialLoginButtonItem = {
  provider: SocialProvider;
  button: ReactNode;
};

const socialLoginButtons: SocialLoginButtonItem[] = [
  { provider: "kakao", button: <KakaoLoginButton /> },
  { provider: "naver", button: <NaverLoginButton /> },
  { provider: "google", button: <GoogleLoginButton /> },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const recentLoginProvider = useAuthStore(
    (state) => state.recentLoginProvider,
  );
  const loginTimedOut = useAuthStore((state) => state.loginTimedOut);
  const clearLoginTimedOut = useAuthStore((state) => state.clearLoginTimedOut);
  const loginAlert = useAuthStore((state) => state.loginAlert);
  const setLoginAlert = useAuthStore((state) => state.setLoginAlert);

  useEffect(() => {
    if (!accessToken) return;
    // loginAlert가 있으면 다이얼로그를 먼저 보여준 뒤 이동
    if (loginAlert) return;
    navigate("/", { replace: true });
  }, [accessToken, loginAlert, navigate]);

  return (
    <div className="flex w-full h-screen items-center justify-center min-h-screen bg-white text-text-primary">
      <div className="mx-auto flex w-full justify-center flex-col min-h-screen max-w-5xl items-center gap-10 px-5 py-12 box-border">
        <section className="flex flex-col justify-center text-center gap-3">
          <h1 className="font-bold text-[24px]">
            자주 사용하는 계정으로
            <br className="sm:hidden" />
            간편하게 로그인하세요
          </h1>
          <p className="text-[14px] text-text-secondary">
            아직 가입하지 않은 사용자는 가입 단계로 이동됩니다.
          </p>
        </section>
        <section className="flex w-full flex-col justify-center items-center gap-3">
          {socialLoginButtons.map(({ provider, button }) => (
            <div key={provider} className="relative w-full max-w-95">
              {recentLoginProvider === provider ? <RecentLoginBadge /> : null}
              {button}
            </div>
          ))}
        </section>
      </div>
      <LoginTimeoutDialog open={loginTimedOut} onConfirm={clearLoginTimedOut} />
      <LoginStatusDialog
        alert={loginAlert}
        onConfirm={() => {
          const alert = loginAlert;
          setLoginAlert(null);
          // redirectPath가 있는 타입(failed_under_5, dormant)은 해당 경로로 이동
          if (alert && 'redirectPath' in alert) {
            navigate(alert.redirectPath, { replace: true });
          }
        }}
      />

    </div>
  );
};

export default LoginPage;
