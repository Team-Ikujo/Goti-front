import { Link } from "react-router-dom";
import { KakaoLoginButton } from "@/features/auth/kakao";
import { Button } from "@/shared/ui/button";

const LoginPage = () => {
  //TODO: 구글, 네이버

  return (
    <div className="flex w-full h-screen items-center justify-center min-h-screen bg-white">
      <div className="mx-auto flex justify-center flex-col min-h-screen w-full max-w-5xl items-center gap-10 px-6 py-12">
        <section className="flex flex-col justify-center text-center gap-3">
          <h1 className="font-bold text-2xl">
            자주 사용하는 계정으로 간편하게 로그인하세요
          </h1>
          <p>아직 가입하지 않은 사용자는 가입 단계로 이동됩니다.</p>
        </section>
        <section className="flex w-full flex-col justify-center items-center gap-3">
          <KakaoLoginButton />
          <Button>네이버</Button>
          <Button>구글</Button>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
