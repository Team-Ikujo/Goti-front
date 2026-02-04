import { Link } from "react-router-dom";

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center gap-10 px-6 py-12">
        <section className="hidden w-1/2 flex-col gap-6 lg:flex">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">
              BallX Sign In
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              다시 돌아온 당신을 위한 경기 경험
            </h1>
            <p className="mt-4 text-base text-slate-300">
              시즌 티켓, 실시간 리세일, 멤버십 혜택을 한 곳에서 관리하세요.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <p className="text-sm text-slate-300">
              로그인 후 다음 기능을 바로 이용할 수 있습니다.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              <li>티켓 보관함</li>
              <li>좌석 즐겨찾기</li>
              <li>리세일 관리</li>
            </ul>
          </div>
        </section>

        <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-[0_24px_60px_-30px_rgba(16,185,129,0.5)]">
          <div>
            <h2 className="text-2xl font-semibold">로그인</h2>
            <p className="mt-2 text-sm text-slate-400">
              이메일과 비밀번호를 입력해 주세요.
            </p>
          </div>
          <form className="mt-8 space-y-5">
            <label className="block text-sm text-slate-200">
              이메일
              <input
                type="email"
                placeholder="you@ballx.com"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>
            <label className="block text-sm text-slate-200">
              비밀번호
              <input
                type="password"
                placeholder="비밀번호 입력"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
              />
            </label>
            <button
              type="button"
              className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              로그인
            </button>
          </form>
          <div className="mt-6 text-sm text-slate-400">
            아직 계정이 없으신가요?{" "}
            <button type="button" className="font-semibold text-emerald-300">
              회원가입
            </button>
          </div>
          <div className="mt-8 text-xs text-slate-500">
            <Link className="text-emerald-300 hover:text-emerald-200" to="/">
              홈으로 돌아가기
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
