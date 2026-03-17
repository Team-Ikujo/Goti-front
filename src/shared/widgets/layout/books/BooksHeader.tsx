import { useState } from 'react';
import { ChevronLeft, HelpCircle, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import BooksExitDialog from './BooksExitDialog';

const steps = ['구역 선택', '좌석 선택', '배송/주문자 확인', '결제'];
const EXIT_DESTINATIONS = {
   home: '/',
   mypage: '/mypage',
} as const;

type ExitDestinationKey = keyof typeof EXIT_DESTINATIONS;

const BooksHeader = () => {
   const navigate = useNavigate();
   const { pathname } = useLocation();
   const currentStepIndex = pathname.includes('/books/seats/') ? 1 : 0;
   const isSeatPage = currentStepIndex === 1;
   const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
   const [exitDestination, setExitDestination] = useState<ExitDestinationKey>('home');

   const openExitDialog = (destination: ExitDestinationKey) => {
      setExitDestination(destination);
      setIsExitDialogOpen(true);
   };

   return (
      <>
         <BooksExitDialog
            open={isExitDialogOpen}
            onOpenChange={setIsExitDialogOpen}
            onConfirm={() => {
               setIsExitDialogOpen(false);
               navigate(EXIT_DESTINATIONS[exitDestination]);
            }}
         />

         <header className="border-b border-border-light bg-background">
         <div className="flex h-16 items-center justify-between px-4 lg:h-[68px] lg:px-8">
            <button
               type="button"
               className="text-heading-4-bold tracking-tight text-foreground"
               onClick={() => openExitDialog('home')}
            >
               goTi
            </button>
            <div className="flex items-center gap-5">
               <div className="relative flex items-center gap-1 text-heading-4-medium text-muted-foreground">
                  <span>예매 시간</span>
                  <span className="text-heading-4-bold text-primary">9:59</span>
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                  <div className="absolute right-0 top-7 z-10 hidden w-[230px] rounded-lg bg-fill-inverse p-3 text-caption-1-medium text-white shadow-lg lg:block">
                     시간이 종료되면 해당 화면에서 나가게 되며, 처음부터 다시 진행해야 합니다.
                  </div>
               </div>
               <button
                  type="button"
                  aria-label="마이페이지"
                  onClick={() => openExitDialog('mypage')}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-icon-secondary"
               >
                  <User className="h-5 w-5" aria-hidden="true" />
               </button>
            </div>
         </div>

         <div className="flex flex-col gap-4 border-t border-border-light px-4 py-4 lg:h-[72px] lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-8 lg:py-0">
            <div className="flex flex-wrap items-center gap-2 text-body-1-medium text-muted-foreground">
               {isSeatPage ? (
                  <button
                     type="button"
                     aria-label="구역 선택 화면으로 이동"
                     onClick={() => navigate('/books')}
                     className="inline-flex h-8 w-8 items-center justify-center rounded-md text-icon-secondary transition-colors hover:bg-fill-hover"
                  >
                     <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
               ) : null}
               <h1 className="mr-2 text-heading-2-bold text-foreground">기아 vs LG</h1>
               <span>기아 챔피언스필드</span>
               <span aria-hidden="true">·</span>
               <span>3.21 (토) 오후 18:30</span>
            </div>
            <ol className="flex flex-wrap items-center gap-1 lg:gap-2" aria-label="예매 진행 단계">
               {steps.map((step, index) => {
                  const isCurrent = index === currentStepIndex;

                  return (
                     <li key={step} className="flex items-center gap-1 lg:gap-2">
                        <span
                           className={[
                              'rounded-full px-3 py-1 text-label-2-medium',
                              isCurrent ? 'text-label-2-semibold text-muted-foreground' : 'text-disabled-foreground',
                           ].join(' ')}
                           aria-current={isCurrent ? 'step' : undefined}
                        >
                           {step}
                        </span>
                        {index < steps.length - 1 ? (
                           <span className="text-body-1-bold text-border" aria-hidden="true">
                              ›
                           </span>
                        ) : null}
                     </li>
                  );
               })}
            </ol>
         </div>
         </header>
      </>
   );
};

export default BooksHeader;
