import { Button } from '@/shared/ui/button';

interface MypageSummaryCardProps {
   totalHeld: number;
   onSale: number;
   soldCount: number;
   unsettledAmount: number;
   isLoading: boolean;
   isError: boolean;
   onRetry: () => void;
}

export function MypageSummaryCard({
   totalHeld,
   onSale,
   soldCount,
   unsettledAmount,
   isLoading,
   isError,
   onRetry,
}: MypageSummaryCardProps) {
   const stats = [
      { icon: '/Icon/Line/ticket.svg', label: '전체 소지', value: String(totalHeld) },
      { icon: '/Icon/Line/increase.svg', label: '판매 중', value: String(onSale) },
      { icon: '/Icon/Line/complete.svg', label: '판매 완료', value: String(soldCount) },
      {
         icon: '/Icon/Line/won.svg',
         label: '미정산 금액',
         value: `${unsettledAmount.toLocaleString()}원`,
      },
   ];

   return (
      <div className="bg-background border border-border rounded-[14px] p-6">
         <p className="text-heading-3-bold text-foreground mb-7.5">티켓 현황</p>
         {isLoading ? (
            <div className="rounded-[10px] bg-surface px-4 py-8 text-center text-body-2-regular text-muted-foreground">
               판매 요약 정보를 불러오는 중입니다.
            </div>
         ) : isError ? (
            <div className="rounded-[10px] bg-surface px-4 py-8 text-center">
               <p className="text-body-2-regular text-muted-foreground">판매 요약 정보를 불러오지 못했습니다.</p>
               <Button variant="tertiary" className="mt-3" onClick={onRetry}>
                  다시 시도
               </Button>
            </div>
         ) : (
            <div className="grid grid-cols-2 lg:flex lg:items-start gap-y-4 lg:gap-y-0">
               {stats.map((stat) => (
                  <div
                     key={stat.label}
                     className="flex flex-1 flex-col items-center gap-1.5 px-4 py-1 rounded-[10px]"
                  >
                     <img src={stat.icon} alt={stat.label} className="size-8 text-primary" />
                     <p className="text-body-1-regular text-muted-foreground text-center">{stat.label}</p>
                     <p className="text-heading-1-bold text-primary text-center">{stat.value}</p>
                  </div>
               ))}
            </div>
         )}
      </div>
   );
}
