import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_RANK = 9960;
const DEFAULT_PROGRESS = 66.67;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parsePositiveNumber = (value: string | null, fallback: number) => {
   if (!value) return fallback;

   const parsed = Number(value.replaceAll(',', ''));

   if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
   }

   return parsed;
};

const formatRank = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

const QueueIllustration = () => {
   return (
      <div
         aria-hidden="true"
         className="h-[216px] w-[335px] rounded-[120px] bg-[linear-gradient(180deg,#ddecff_0%,#cfe0fb_100%)]"
      >
         <div className="h-full w-full animate-pulse rounded-[120px] bg-[linear-gradient(180deg,#ddecff_0%,#cfe0fb_100%)]" />
      </div>
   );
};

const QueuePage = () => {
   const [searchParams] = useSearchParams();

   const rank = useMemo(
      () => parsePositiveNumber(searchParams.get('rank'), DEFAULT_RANK),
      [searchParams]
   );

   const progress = useMemo(
      () => clamp(parsePositiveNumber(searchParams.get('progress'), DEFAULT_PROGRESS), 0, 100),
      [searchParams]
   );

   return (
      <main className="flex min-h-screen bg-[var(--background-base)] px-6 py-10 text-[var(--text-primary)]">
         <section className="m-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-10">
            <header className="flex flex-col items-center gap-4">
               <h1 className="text-center text-[32px] leading-[1.45] font-bold tracking-[-0.032px]">
                  접속자가 많아 잠시 대기 중이에요
               </h1>
               <QueueIllustration />
            </header>

            <div className="flex w-full flex-col items-center gap-5">
               <div className="flex flex-col items-center">
                  <p className="text-center text-[22px] leading-[1.55] font-semibold text-[var(--text-tertiary)]">
                     나의 대기 순서
                  </p>
                  <p className="flex items-center gap-1 text-center">
                     <strong className="text-[48px] leading-[1.33] font-bold tracking-[-0.048px] text-[var(--primary-normal)]">
                        {formatRank(rank)}
                     </strong>
                     <span className="pt-3 text-[24px] leading-[1.5] font-semibold text-[var(--text-tertiary)]">번째</span>
                  </p>
               </div>

               <div
                  aria-label={`현재 대기 진행률 ${Math.round(progress)}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={Math.round(progress)}
                  className="h-4 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]"
                  role="progressbar"
               >
                  <div
                     className="h-full rounded-full bg-[linear-gradient(135deg,#6ca4f8_0%,#2563eb_100%)] transition-[width] duration-500 ease-out"
                     style={{ width: `${progress}%` }}
                  />
               </div>
            </div>

            <p className="text-center text-[16px] leading-[1.5] font-medium text-[var(--text-tertiary)]">
               순서에 따라 예매 페이지로 연결되며,
               <br />
               새로고침 및 재접속 시 대기 순서가 다시 부여되니 유의해주세요.
            </p>
         </section>
      </main>
   );
};

export default QueuePage;
