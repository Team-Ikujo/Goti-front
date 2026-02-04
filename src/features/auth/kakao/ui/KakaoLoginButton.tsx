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
      className="h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-xl bg-[#FFDE00] px-5 py-3.5 text-[16px] font-semibold text-black hover:bg-[#FECB00] active:bg-[#FECF00]"
    >
      <img
        src="/Kakao.svg"
        alt="kakao icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      카카오로 로그인
    </Button>
  );
};

export default KakaoLoginButton;
