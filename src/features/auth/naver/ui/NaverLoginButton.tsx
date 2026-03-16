import { buildNaverAuthUrl } from "../lib/buildNaverAuthUrl";
import { Button } from "@/shared/ui/button";
import { useSocialOAuthLogin } from "@/features/auth/model/useSocialOAuthLogin";

const NaverLoginButton = () => {
  const handleClick = useSocialOAuthLogin({
    provider: "naver",
    buildAuthUrl: (state) => buildNaverAuthUrl(state ?? ""),
  });

  return (
    <Button
      variant="none"
      type="button"
      onClick={() => void handleClick()}
      className="cursor-pointer h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] bg-[#00C73C] px-5 py-3.5 text-[16px] font-semibold text-white hover:bg-[#03B753] active:bg-[#00B14F]"
    >
      <img
        src="/Icon/Logo/Naver.svg"
        alt="naver icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      네이버로 시작하기
    </Button>
  );
};

export default NaverLoginButton;
