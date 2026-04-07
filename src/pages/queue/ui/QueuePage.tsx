import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createBookingFlowSearch, getBookingFlowMode } from '@/shared/lib/booking-flow';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';

const DEFAULT_RANK = 9960;
const DEFAULT_TICK_MS = 1200;
const DEFAULT_STEP = 37;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const parsePositiveNumber = (value: string | null, fallback: number) => {
   if (!value) return fallback;

   const parsed = Number(value.replace(/,/g, ''));

   if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
   }

   return parsed;
};

const formatRank = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

const QueueIllustration = () => {
   const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);

   useEffect(() => {
      let isMounted = true;

      const loadAnimation = async () => {
         const response = await fetch('/animation/queueAnimation.json');

         if (!response.ok) {
            throw new Error('queueAnimation.json을 불러오지 못했습니다.');
         }

         const data = (await response.json()) as Record<string, unknown>;

         if (isMounted) {
            setAnimationData(data);
         }
      };

      void loadAnimation().catch(() => {
         if (isMounted) {
            setAnimationData(null);
         }
      });

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <div aria-hidden="true" className="flex h-[216px] w-[335px] items-center justify-center">
         {animationData ? (
            <Lottie
               animationData={animationData}
               autoplay
               loop
               className="h-full w-full"
               rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
            />
         ) : (
            <div className="h-full w-full animate-pulse rounded-[120px] bg-[linear-gradient(180deg,#ddecff_0%,#cfe0fb_100%)]" />
         )}
      </div>
   );
};

const QueuePage = () => {
   const navigate = useNavigate();
   const location = useLocation();
   const [searchParams] = useSearchParams();
   const routeBookingEntryState = location.state as BookingEntryState | null;
   const storedBookingEntryState = useBookingEntryStore(state => state.entry);
   const setBookingEntry = useBookingEntryStore(state => state.setEntry);
   const bookingEntryState = routeBookingEntryState ?? storedBookingEntryState;
   const bookingFlowMode = getBookingFlowMode(location.search);
   const hasForwardedRef = useRef(false);

   const initialRank = useMemo(
      () => parsePositiveNumber(searchParams.get('rank'), DEFAULT_RANK),
      [searchParams]
   );
   const [currentRank, setCurrentRank] = useState(initialRank);

   const tickMs = useMemo(
      () => Math.max(250, parsePositiveNumber(searchParams.get('tickMs'), DEFAULT_TICK_MS)),
      [searchParams]
   );

   const step = useMemo(
      () => Math.max(1, parsePositiveNumber(searchParams.get('step'), DEFAULT_STEP)),
      [searchParams]
   );

   useEffect(() => {
      setCurrentRank(initialRank);
      hasForwardedRef.current = false;
   }, [initialRank]);

   useEffect(() => {
      if (routeBookingEntryState) {
         setBookingEntry(routeBookingEntryState);
      }
   }, [routeBookingEntryState, setBookingEntry]);

   useEffect(() => {
      if (bookingEntryState) {
         return;
      }

      navigate('/', { replace: true });
   }, [bookingEntryState, navigate]);

   useEffect(() => {
      if (currentRank <= 0) return;

      const timer = window.setInterval(() => {
         setCurrentRank(previousRank => Math.max(0, previousRank - step));
      }, tickMs);

      return () => {
         window.clearInterval(timer);
      };
   }, [currentRank, step, tickMs]);

   useEffect(() => {
      if (!bookingEntryState || currentRank > 0 || hasForwardedRef.current) {
         return;
      }

      hasForwardedRef.current = true;

      navigate(
         {
            pathname: '/books',
            search: createBookingFlowSearch(bookingFlowMode),
         },
         {
            replace: true,
            state: bookingEntryState,
         },
      );
   }, [bookingEntryState, bookingFlowMode, currentRank, navigate]);

   const progress = useMemo(
      () => clamp(((initialRank - currentRank) / Math.max(initialRank, 1)) * 100, 0, 100),
      [currentRank, initialRank]
   );

   if (!bookingEntryState) {
      return null;
   }

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
                        {formatRank(currentRank)}
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
