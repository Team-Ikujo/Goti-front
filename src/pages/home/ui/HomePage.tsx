import { Link } from 'react-router-dom';

const HomePage = () => {
   return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
         <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-8 px-6 py-12">
            <div>
               <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">BallX</p>
               <h1 className="mt-4 text-4xl font-semibold leading-tight">로그인 라우팅 예시 페이지</h1>
               <p className="mt-3 max-w-2xl text-base text-slate-300">
                  React Router를 사용해 `/login` 페이지로 이동하는 단순한 예시입니다.
               </p>
            </div>
            <div className="flex flex-wrap gap-3">
               <Link
                  to="/login"
                  className="rounded-full border border-emerald-300 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300 hover:text-slate-950"
               >
                  로그인 페이지로 이동
               </Link>
               <Link
                  to="/signup"
                  className="rounded-full border border-emerald-300 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-300 hover:text-slate-950"
               >
                  회원가입 페이지로 이동
               </Link>
               <Link
                  to="/"
                  className="rounded-full border border-slate-800 px-6 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-600"
               >
                  홈 유지
               </Link>
            </div>
         </div>
      </div>
   );
};

export default HomePage;
