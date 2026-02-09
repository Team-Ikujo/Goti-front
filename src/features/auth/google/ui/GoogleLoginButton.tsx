import { buildGoogleAuthUrl } from "../lib/buildGoogleAuthUrl";
import { createOAuthState } from "../../kakao/model/createOAuthState";
import { openOAuthPopup } from "@/shared/lib/openOAuthPopup";
import { Button } from "@/shared/ui/button";

const GoogleLoginButton = () => {
  const handleClick = () => {
    const state = createOAuthState();
    const authUrl = buildGoogleAuthUrl(state);
    openOAuthPopup(authUrl);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] border border-border-normal bg-white px-5 py-3.5 text-[16px] font-semibold text-text-primary hover:bg-[#F7F8F9] active:bg-[#F7F8F9] active:border-[#ACB4BB]"
    >
      {/*TODO: 일부 색상 global css에 존재하지 않아 보류*/}
      <img
        src="/Google.svg"
        alt="google icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      구글로 시작하기
    </Button>
  );
};

export default GoogleLoginButton;
