import { Button } from "@/shared/ui/button";
import { buildKakaoAuthUrl } from "../lib/buildKakaoAuthUrl";
import { createOAuthState } from "../model/createOAuthState";

const KakaoLoginButton = () => {
  const handleClick = () => {
    const state = createOAuthState();
    const authUrl = buildKakaoAuthUrl(state);
    window.location.assign(authUrl);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="h-13 max-w-95 inline-flex w-screen items-center justify-center gap-2 rounded-xl bg-yellow-300 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-600"
    >
      <img src="/Kakao.svg" alt="" className="h-4 w-4" aria-hidden="true" />
      카카오로 로그인
    </Button>
  );
};

export default KakaoLoginButton;
