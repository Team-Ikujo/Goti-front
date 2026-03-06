import { buildGoogleAuthUrl } from "../lib/buildGoogleAuthUrl";
import { Button } from "@/shared/ui/button";
import { useSocialOAuthLogin } from "@/features/auth/model/useSocialOAuthLogin";

const GoogleLoginButton = () => {
  const handleClick = useSocialOAuthLogin({
    provider: "google",
    requiresIssuedState: true,
    buildAuthUrl: (state) => buildGoogleAuthUrl(state ?? ""),
  });

  return (
    <Button
      type="button"
      onClick={() => void handleClick()}
      variant="none"
      className="cursor-pointer h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] border border-border-normal bg-white px-5 py-3.5 text-[16px] font-semibold text-text-primary hover:bg-[#F7F8F9] active:bg-[#F7F8F9] active:border-[#ACB4BB]"
    >
      {/*TODO: 일부 색상 global css에 존재하지 않아 보류*/}
      <img
        src="/Icon/Logo/Google.svg"
        alt="google icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      구글로 시작하기
    </Button>
  );
};

export default GoogleLoginButton;
