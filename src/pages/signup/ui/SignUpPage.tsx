import { useState } from 'react';
import { Link } from 'react-router-dom';

const SignUpPage = () => {
   const [agree, setAgree] = useState(false);
   return (
      <div
         className="min-h-screen bg-(--color-surface) text-(--color-foreground)
      flex items-center justify-center"
      >
         <section className="w-full max-w-md p-8">
            <div className="text-center">
               <h2 className="text-2xl font-semibold">본인 확인을 위해 </h2>
               <h2 className="text-2xl font-semibold">인증을 진행해주세요</h2>
            </div>
            <form className="mt-8 space-y-5">
               <label className="block text-sm text-(--color-muted-foreground)">
                  이름*
                  <input
                     type="text"
                     placeholder="30자 이내 입력"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <label className="block text-sm text-(--color-muted-foreground)">
                  국적
                  <div className="flex gap-2">
                     <button
                        type="button"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        내국인
                     </button>
                     <button
                        type="button"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        외국인
                     </button>
                  </div>
               </label>
               <label className="block text-sm text-(--color-muted-foreground)">
                  생년월일*
                  <input
                     type="text"
                     placeholder="예: 19990101 (8자리)"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <label className="block text-sm text-(--color-muted-foreground)">
                  성별
                  <div className="flex gap-2">
                     <button
                        type="button"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        남성
                     </button>
                     <button
                        type="button"
                        className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        여성
                     </button>
                  </div>
               </label>
               <label className="block text-sm text-(--color-muted-foreground)">
                  통신사
                  <div className="grid grid-cols-3 gap-2 mt-2">
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        SKT
                     </button>
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        KT
                     </button>
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        LG U+
                     </button>
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        SKT 알뜰폰
                     </button>
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        KT 알뜰폰
                     </button>
                     <button
                        type="button"
                        className=" w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                     >
                        LG U+ 알뜰폰
                     </button>
                  </div>
               </label>
               <label className="block text-sm text-(--color-muted-foreground)">
                  휴대폰 번호*
                  <input
                     type="text"
                     placeholder="'-'를 제외한 숫자만 입력"
                     className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
                  />
               </label>
               <div className="gap-2">
                  <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                     <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                     <label
                        htmlFor="agree"
                        className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                     >
                        전체 동의
                     </label>
                  </div>
                  <div className="mt-2">
                     <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                        <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                        <label
                           htmlFor="agree"
                           className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                        >
                           (필수) 개인정보 취급 동의
                        </label>
                     </div>
                     <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                        <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                        <label
                           htmlFor="agree"
                           className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                        >
                           (필수) 고유식별 정보처리 동의
                        </label>
                     </div>
                     <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                        <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                        <label
                           htmlFor="agree"
                           className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                        >
                           (필수) 본인 확인 서비스 이용약관 동의
                        </label>
                     </div>
                     <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                        <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                        <label
                           htmlFor="agree"
                           className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                        >
                           (필수) 통신사 이용약관 동의
                        </label>
                     </div>
                     <div className="flex items-center gap-2 bg-(--color-background) border-(--color-border) px-4 py-3 rounded-lg">
                        <input id="agree" type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                        <label
                           htmlFor="agree"
                           className="text-(text-display-1-bold) text-(--color-foreground) cursor-pointer"
                        >
                           (필수) 만 14세 이상입니다.
                        </label>
                     </div>
                  </div>
               </div>
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
