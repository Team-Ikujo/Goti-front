import { Button } from '@/shared/ui/button';
import { formatPrice } from '@/pages/books/model/zoneData';
import type { SeatItem, ZoneItem } from '@/pages/books/model/types';
import type { ResellZoneInsights } from '@/pages/books/model/resellData';

type SelectedSeatSummaryItem = {
   seat: SeatItem;
   zoneId: string;
   zoneName: string;
   price: number;
};

type ResellSeatSidebarProps = {
   insights: ResellZoneInsights;
   selectedSeats: SelectedSeatSummaryItem[];
   selectedPrice: number;
   zone: ZoneItem;
   zoneOverviewImage: string;
   onClearAllSelections: () => void;
   onRemoveSeat: (zoneId: string, seatId: string) => void;
   onSubmit: () => void;
};

function ResellSeatSidebar({
   insights,
   selectedSeats,
   selectedPrice,
   zone,
   zoneOverviewImage,
   onClearAllSelections,
   onRemoveSeat,
   onSubmit,
}: ResellSeatSidebarProps) {
   const chartMin = Math.min(...insights.pricePoints.map((point) => point.price));
   const chartMax = Math.max(...insights.pricePoints.map((point) => point.price));
   const chartWidth = 300;
   const chartHeight = 124;
   const yRange = Math.max(1, chartMax - chartMin);

   const path = insights.pricePoints
      .map((point, index) => {
         const x = (index / Math.max(1, insights.pricePoints.length - 1)) * chartWidth;
         const y = chartHeight - ((point.price - chartMin) / yRange) * chartHeight;

         return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

   return (
      <aside className="flex w-full shrink-0 flex-col border-l border-border-light bg-background xl:w-[420px]">
         <div className="relative h-[160px] overflow-hidden border-b border-border-light bg-[#e9ebee] px-5 py-3">
            <div className="relative mx-auto h-full w-[170px] shrink-0">
               <img
                  src={zoneOverviewImage}
                  alt={`${zone.name} 선택 상태가 반영된 기아 챔피언스필드 좌석도`}
                  className="h-full w-full object-contain"
                  draggable={false}
               />
            </div>
         </div>

         <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
            <section className="space-y-4 rounded-[20px] border border-border-light bg-background p-4">
               <div className="flex items-baseline gap-1.5">
                  <h2 className="text-heading-3-bold text-foreground">거래 변동</h2>
                  <span className="text-body-1-bold text-[#ef4444]">
                     +{formatPrice(insights.changeAmount)} ({insights.changeRate}%)
                  </span>
               </div>

               <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-2-regular">
                  <Metric label="전일 종가" value={formatPrice(insights.previousClose)} />
                  <Metric label="최근 거래 체결가" value={formatPrice(insights.recentTrade)} />
                  <Metric label="금일 하한가" value={formatPrice(insights.dayLow)} valueClassName="text-primary" />
                  <Metric label="금일 상한가" value={formatPrice(insights.dayHigh)} valueClassName="text-[#ef4444]" />
               </div>

               <div className="rounded-[16px] border border-border-light bg-white px-3 py-3">
                  <div className="relative">
                     <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-[136px] w-full" role="img" aria-label={`${zone.name} 리셀 가격 추이`}>
                        {[0, 1, 2, 3].map((line) => {
                           const y = 8 + line * 30;

                           return (
                              <line
                                 key={line}
                                 x1="0"
                                 y1={y}
                                 x2={chartWidth}
                                 y2={y}
                                 stroke="#d9dde3"
                                 strokeDasharray="4 4"
                              />
                           );
                        })}
                        <path d={path} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        {insights.pricePoints.map((point, index) => {
                           const x = (index / Math.max(1, insights.pricePoints.length - 1)) * chartWidth;
                           const y = chartHeight - ((point.price - chartMin) / yRange) * chartHeight;

                           return <circle key={point.time} cx={x} cy={y} r="4" fill="#2563eb" />;
                        })}
                     </svg>
                     <div className="mt-2 flex justify-between text-[11px] font-medium leading-[1.45] text-[#7d8793]">
                        {insights.pricePoints.map((point) => (
                           <span key={point.time}>{point.time}</span>
                        ))}
                     </div>
                  </div>
               </div>
            </section>

            <section className="space-y-3 rounded-[20px] border border-border-light bg-background p-4">
               <h3 className="text-heading-3-bold text-foreground">최근 거래 내역</h3>
               <ul className="space-y-2">
                  {insights.tradeHistory.map((item) => (
                     <li key={item.id} className="flex items-center justify-between gap-3 text-body-2-regular">
                        <div className="min-w-0">
                           <p className="text-body-2-semibold text-foreground">{formatPrice(item.price)}</p>
                           <p className="truncate text-muted-foreground">{item.seatLabel}</p>
                        </div>
                        <span className="shrink-0 text-caption-1-medium text-[#7d8793]">{item.tradedAt}</span>
                     </li>
                  ))}
               </ul>
            </section>

            <section className="space-y-3 rounded-[20px] border border-border-light bg-background p-4">
               <div className="flex items-center gap-2">
                  <h3 className="text-heading-3-bold text-foreground">리셀 매물</h3>
                  <span className="text-heading-4-bold text-primary">{insights.listings.length}</span>
               </div>
               <ul className="space-y-3">
                  {insights.listings.map((item) => (
                     <li key={item.id} className="rounded-[16px] border border-border-light px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                           <div className="min-w-0">
                              <p className="text-body-2-semibold text-foreground">{item.seatLabel}</p>
                              <p className="text-caption-1-medium text-muted-foreground">{item.seller}</p>
                           </div>
                           <span className="shrink-0 text-body-2-bold text-primary">{formatPrice(item.price)}</span>
                        </div>
                     </li>
                  ))}
               </ul>
            </section>

            <section className="space-y-3 rounded-[20px] bg-surface p-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <h3 className="text-heading-3-bold text-foreground">선택 좌석</h3>
                     {selectedSeats.length > 0 ? <span className="text-heading-4-bold text-primary">{selectedSeats.length}</span> : null}
                  </div>
                  {selectedSeats.length > 0 ? (
                     <button
                        type="button"
                        onClick={onClearAllSelections}
                        className="text-body-2-medium text-muted-foreground transition-colors hover:text-foreground"
                     >
                        전체 삭제
                     </button>
                  ) : null}
               </div>

               {selectedSeats.length > 0 ? (
                  <ul className="space-y-3">
                     {selectedSeats.map((item) => (
                        <li key={item.seat.id} className="flex items-center justify-between rounded-[16px] border border-border-light bg-background px-4 py-3">
                           <div>
                              <p className="text-body-2-semibold text-foreground">{item.zoneName}</p>
                              <p className="text-body-2-regular text-muted-foreground">
                                 {item.seat.block}구역 {item.seat.rowLabel} {item.seat.seatNumber}번
                              </p>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className="text-body-2-semibold text-primary">{formatPrice(item.price)}</span>
                              <button
                                 type="button"
                                 onClick={() => onRemoveSeat(item.zoneId, item.seat.id)}
                                 className="text-caption-1-medium text-muted-foreground transition-colors hover:text-foreground"
                              >
                                 삭제
                              </button>
                           </div>
                        </li>
                     ))}
                  </ul>
               ) : (
                  <div className="rounded-[16px] border border-dashed border-border-light bg-background px-4 py-6 text-center text-body-2-regular text-muted-foreground">
                     선택한 좌석이 없습니다.
                  </div>
               )}

               <div className="flex items-center justify-between text-body-1-semibold text-foreground">
                  <span>예상 결제 금액</span>
                  <span>{formatPrice(selectedPrice)}</span>
               </div>

               <Button type="button" disabled={selectedSeats.length === 0} className="h-14 w-full rounded-[8px]" onClick={onSubmit}>
                  예매하기
               </Button>
            </section>
         </div>
      </aside>
   );
}

function Metric({
   label,
   value,
   valueClassName,
}: {
   label: string;
   value: string;
   valueClassName?: string;
}) {
   return (
      <div className="flex items-center justify-between gap-2">
         <span className="text-muted-foreground">{label}</span>
         <span className={valueClassName ?? 'text-foreground'}>{value}</span>
      </div>
   );
}

export default ResellSeatSidebar;
