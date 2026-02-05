import { buildNaverAuthUrl } from "../lib/buildNaverAuthUrl";
import { createOAuthState } from "../../kakao/model/createOAuthState";
import { openOAuthPopup } from "@/shared/lib/openOAuthPopup";
import { Button } from "@/shared/ui/button";

const NaverLoginButton = () => {
  const handleClick = () => {
    const state: string = createOAuthState();
    const authUrl: string = buildNaverAuthUrl(state);
    openOAuthPopup(authUrl);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] bg-[#00C73C] px-5 py-3.5 text-[16px] font-semibold text-white hover:bg-[#03B753] active:bg-[#00B14F]"
    >
      <img
        src="/Naver.svg"
        alt="naver icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      네이버로 시작하기
    </Button>
  );
};

export default NaverLoginButton;
