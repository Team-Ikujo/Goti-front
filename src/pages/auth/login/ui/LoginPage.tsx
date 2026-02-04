import { KakaoLoginButton } from "@/features/auth/kakao";
import { NaverLoginButton } from "@/features/auth/naver";

const LoginPage = () => {
  //TODO: 구글, 네이버, 디자인 시스템 값이 설정완료되면 색상 변경

  return (
    <div className="flex w-full h-screen items-center justify-center min-h-screen bg-white text-[#161D24]">
      <div className="mx-auto flex w-full justify-center flex-col min-h-screen max-w-5xl items-center gap-10 px-5 py-12 box-border">
        <section className="flex flex-col justify-center text-center gap-3">
          <h1 className="font-bold text-[24px]">
            자주 사용하는 계정으로
            <br className="sm:hidden" />
            간편하게 로그인하세요
          </h1>
          <p className="text-[14px] text-[#374553]">
            아직 가입하지 않은 사용자는 가입 단계로 이동됩니다.
          </p>
        </section>
        <section className="flex w-full flex-col justify-center items-center gap-3">
          <KakaoLoginButton />
          <NaverLoginButton />
          <button className="h-13 inline-flex w-full max-w-95 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 text-[16px] font-bold text-gray-800">
            구글
          </button>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
