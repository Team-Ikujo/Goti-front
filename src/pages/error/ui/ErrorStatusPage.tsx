import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/shared/ui/button';

const RETRY_COUNTDOWN_SECONDS = 59;

type ErrorPageStatus = '302' | '404' | '503';

type ErrorPageConfig = {
   title: string;
   description: string;
   primaryLabel: string;
   secondaryLabel?: string;
};

const getErrorPageConfig = (statusCode?: string): ErrorPageConfig | null => {
   switch (statusCode) {
      case '302':
         return {
            title: '일시적인 오류가 발생했어요',
            description: 'GoTi 팀이 빠르게 해결하고 있으니 잠시 후 다시 시도해주세요.',
            primaryLabel: '홈으로 가기',
            secondaryLabel: '뒤로 가기',
         };
      case '404':
         return {
            title: '요청하신 페이지를 찾을 수 없어요',
            description: '입력하신 주소가 잘못되었거나 페이지가 삭제되었을 수 있어요.',
            primaryLabel: '홈으로 가기',
         };
      case '503':
         return {
            title: '일시적인 오류가 발생했어요',
            description: 'GoTi 팀이 빠르게 해결하고 있으니 잠시 후 다시 시도해주세요.',
            primaryLabel: '홈으로 가기',
         };
      default:
         return null;
   }
};

const formatCountdown = (seconds: number) => {
   const minutes = Math.floor(seconds / 60);
   const remainder = seconds % 60;

   return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

const ErrorStatusPage = () => {
   const { statusCode } = useParams<{ statusCode: ErrorPageStatus }>();
   const navigate = useNavigate();
   const location = useLocation();
   const [countdown, setCountdown] = useState(RETRY_COUNTDOWN_SECONDS);

   const config = getErrorPageConfig(statusCode);

   useEffect(() => {
      if (statusCode !== '302') {
         return;
      }

      setCountdown(RETRY_COUNTDOWN_SECONDS);

      const timer = window.setInterval(() => {
         setCountdown(previous => (previous > 0 ? previous - 1 : 0));
      }, 1000);

      return () => {
         window.clearInterval(timer);
      };
   }, [statusCode]);

   if (!config) {
      return <Navigate to="/error/404" replace />;
   }

   const fallbackPath = new URLSearchParams(location.search).get('from');

   const handleHome = () => {
      navigate('/', { replace: true });
   };

   const handleBack = () => {
      if (window.history.length > 1) {
         navigate(-1);
         return;
      }

      if (fallbackPath?.startsWith('/')) {
         navigate(fallbackPath, { replace: true });
         return;
      }

      navigate('/', { replace: true });
   };

   return (
      <main className="flex min-h-screen bg-(--background-base) px-5 py-10 md:px-[120px]">
         <section className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center justify-center text-center">
            <div className="w-full py-10">
               <div className="flex flex-col items-center gap-3">
                  <h1 className="w-full text-heading-3-bold font-bold text-(--text-primary)">{config.title}</h1>
                  <p className="w-full text-body-2-regular text-(--text-secondary)">{config.description}</p>
               </div>
            </div>

            <div className="w-full max-w-[380px]">
               {statusCode === '302' ? (
                  <div className="flex flex-col gap-8">
                     <div className="rounded-xl bg-(--background-surface) px-6 py-6 text-center">
                        <p className="text-body-2-medium text-(--text-tertiary)">다시 시도까지</p>
                        <p aria-live="polite" className="mt-1 text-title-1-bold font-bold text-(--primary-normal)">
                           {formatCountdown(countdown)}
                        </p>
                     </div>
                     <div className="flex flex-col gap-2">
                        <Button type="button" variant="primary" className="w-full" onClick={handleHome}>
                           {config.primaryLabel}
                        </Button>
                        <Button type="button" variant="tertiary" className="w-full" onClick={handleBack}>
                           {config.secondaryLabel}
                        </Button>
                     </div>
                  </div>
               ) : (
                  <Button type="button" variant="primary" className="w-full" onClick={handleHome}>
                     {config.primaryLabel}
                  </Button>
               )}
            </div>
         </section>
      </main>
   );
};

export default ErrorStatusPage;
