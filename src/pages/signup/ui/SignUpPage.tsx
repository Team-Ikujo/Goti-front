import { Link } from 'react-router-dom';

const SignUpPage = () => {
   return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
         <section className="w-full max-w-md p-8">
            <div className="text-center">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>
            <form className="mt-8 space-y-5">
               <label className="block text-sm text-slate-200">
                  이름*
                  <input
                     type="text"
                     placeholder="30자 이내 입력"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <label className="block text-sm text-slate-200">
                  생년월일*
                  <input
                     type="text"
                     placeholder="예: 19990101 (8자리)"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <label className="block text-sm text-slate-200">
                  휴대폰 번호*
                  <input
                     type="text"
                     placeholder="'-'를 제외한 숫자만 입력"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <button
                  type="button"
                  className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
               >
                  인증번호 전송
               </button>
            </form>
            <div className="mt-8 text-xs text-slate-500">
               <Link className="text-emerald-300 hover:text-emerald-200" to="/">
                  홈으로 돌아가기
               </Link>
            </div>
         </section>
      </div>
   );
};

export default SignUpPage;
