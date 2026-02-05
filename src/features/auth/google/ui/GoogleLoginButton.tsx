import { buildGoogleAuthUrl } from "../lib/buildGoogleAuthUrl";
import { createOAuthState } from "../../kakao/model/createOAuthState";
import { Button } from "@/shared/ui/button";

const GoogleLoginButton = () => {
  const handleClick = () => {
    const state = createOAuthState();
    const authUrl = buildGoogleAuthUrl(state);
    window.location.assign(authUrl);
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] border border-gray-200 bg-white px-5 py-3.5 text-[16px] font-bold text-gray-800 hover:bg-gray-50"
    >
      구글로 로그인
    </Button>
  );
};

export default GoogleLoginButton;
