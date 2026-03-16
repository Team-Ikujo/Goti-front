import { Button } from "@/shared/ui/button";
import { buildKakaoAuthUrl } from "../lib/buildKakaoAuthUrl";
import { useSocialOAuthLogin } from "@/features/auth/model/useSocialOAuthLogin";

const KakaoLoginButton = () => {
  const handleClick = useSocialOAuthLogin({
    provider: "kakao",
    buildAuthUrl: buildKakaoAuthUrl,
  });

  return (
    <Button
      variant="none"
      type="button"
      onClick={() => void handleClick()}
      className="cursor-pointer h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-[8px] bg-[#FFDE00] px-5 py-3.5 text-[16px] font-semibold text-black hover:bg-[#FECB00] active:bg-[#FECF00]"
    >
      <img
        src="/Icon/Logo/Kakao.svg"
        alt="kakao icon"
        className="h-5 w-5"
        aria-hidden="true"
      />
      카카오로 시작하기
    </Button>
  );
};

export default KakaoLoginButton;
