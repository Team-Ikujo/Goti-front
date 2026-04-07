import { Button } from '@/shared/ui/button';
import { formatPrice } from '@/pages/books/model/zoneData';
import ResellPriceChart from '@/pages/books/ui/components/ResellPriceChart';
import type { PurchaseHistoryItem } from '../model/historyCard';

export function CheckboxIcon({ checked }: { checked: boolean }) {
   if (checked) {
      return (
         <div className="relative size-5 shrink-0">
            <div className="absolute left-px top-px size-4.5 bg-primary rounded-sm" />
            <svg className="absolute inset-0 size-full" viewBox="0 0 20 20" fill="none">
               <path
                  d="M5 10.5l3 3L15 7"
                  stroke="white"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
               />
            </svg>
         </div>
      );
   }

   return (
      <div className="relative size-5 shrink-0">
         <div className="absolute left-px top-px size-4.5 bg-white border-[1.5px] border-[#d0d6db] rounded-sm" />
      </div>
   );
}

export function PriceInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
   return (
      <div className="flex items-center bg-white border border-[#d0d6db] rounded-lg h-12 px-4 gap-1">
         <input
            type="number"
            placeholder="판매할 금액을 입력해주세요."
            value={value}
            onChange={event => onChange(event.target.value)}
            className="flex-1 text-[16px] leading-normal outline-none text-[#161d24] placeholder:text-[#acb4bb] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
         />
         <span className="text-[16px] font-medium text-[#374553] shrink-0">원</span>
      </div>
   );
}

export function ResellSeatSelector({
   item,
   checkedSeats,
   checkedCount,
   bulkToggle,
   bulkPrice,
   prices,
   onToggleBulk,
   onBulkPriceChange,
   onToggleSeat,
   onSeatPriceChange,
}: {
   item: PurchaseHistoryItem;
   checkedSeats: Set<number>;
   checkedCount: number;
   bulkToggle: boolean;
   bulkPrice: string;
   prices: Record<number, string>;
   onToggleBulk: () => void;
   onBulkPriceChange: (value: string) => void;
   onToggleSeat: (index: number) => void;
   onSeatPriceChange: (index: number, value: string) => void;
}) {
   const unitPrice = item.game.quantity > 0 ? Math.round(item.price / item.game.quantity) : item.price;
   const showBulkToggle = checkedCount >= 2;

   return (
      <div className="flex flex-col gap-3">
         <div className="flex items-center">
            <p className="flex-1 text-[20px] font-bold text-[#161d24] leading-normal">보유 중인 티켓</p>
            <span className="text-[16px] font-bold text-primary leading-normal">{checkedCount}</span>
            <span className="text-[16px] font-medium text-[#646f7c] leading-normal">매 선택</span>
         </div>

         {showBulkToggle ? (
            <div className="bg-surface rounded-xl px-5 py-3 flex flex-col gap-3">
               <div className="flex items-center gap-3">
                  <span className="flex-1 text-[14px] font-semibold text-[#374553] leading-normal">
                     모든 티켓 동일 가격 적용하기
                  </span>
                  <button
                     onClick={onToggleBulk}
                     className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${
                        bulkToggle ? 'bg-primary' : 'bg-[#646f7c]'
                     }`}
                     aria-pressed={bulkToggle}
                  >
                     <div
                        className={`absolute top-0.5 size-6 bg-white rounded-full shadow-[0px_3px_8px_rgba(0,0,0,0.15)] transition-[left] duration-200 ${
                           bulkToggle ? 'left-5.5' : 'left-0.5'
                        }`}
                     />
                  </button>
               </div>
               {bulkToggle ? <PriceInput value={bulkPrice} onChange={onBulkPriceChange} /> : null}
            </div>
         ) : null}

         <div className="flex flex-col gap-5">
            {item.game.seats.map((seat, index) => {
               const isChecked = checkedSeats.has(index);
               return (
                  <div key={index}>
                     {isChecked ? (
                        <div className="border-2 border-primary rounded-lg overflow-hidden">
                           <div
                              className="bg-[#f4f7fe] flex gap-3 items-center p-5 cursor-pointer"
                              onClick={() => onToggleSeat(index)}
                           >
                              <CheckboxIcon checked />
                              <div className="flex flex-1 items-center gap-2 min-w-0">
                                 <span className="text-[16px] font-bold text-[#374553] whitespace-nowrap">{item.game.section}</span>
                                 <span className="text-[14px] font-medium text-[#666] whitespace-nowrap">{seat}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                 <span className="text-[14px] text-[#646f7c] leading-[1.45]">구매가</span>
                                 <span className="text-[16px] font-bold text-primary">{unitPrice.toLocaleString()}원</span>
                              </div>
                           </div>
                           {!bulkToggle ? (
                              <div className="px-5 py-5">
                                 <PriceInput value={prices[index] ?? ''} onChange={value => onSeatPriceChange(index, value)} />
                              </div>
                           ) : null}
                        </div>
                     ) : (
                        <div
                           className="bg-background border border-[#e5e5e5] rounded-lg flex gap-3 items-center px-4 py-5 cursor-pointer hover:bg-surface transition-colors"
                           onClick={() => onToggleSeat(index)}
                        >
                           <CheckboxIcon checked={false} />
                           <div className="flex flex-1 items-center gap-2 min-w-0">
                              <span className="text-[16px] font-bold text-[#374553] whitespace-nowrap">{item.game.section}</span>
                              <span className="text-[14px] font-medium text-[#666] whitespace-nowrap">{seat}</span>
                           </div>
                           <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[14px] text-[#646f7c] leading-[1.45]">구매가</span>
                              <span className="text-[16px] font-bold text-[#374553]">{unitPrice.toLocaleString()}원</span>
                           </div>
                        </div>
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );
}

type ResellInsights = NonNullable<ReturnType<typeof import('@/features/resale/model/useResellRegisterInsights').useResellRegisterInsights>['data']>['insights'];

export function ResellInsightsSection({
   isLoading,
   isError,
   insights,
   onRetry,
}: {
   isLoading: boolean;
   isError: boolean;
   insights: ResellInsights | null;
   onRetry: () => void;
}) {
   if (isLoading) {
      return (
         <div className="bg-surface rounded-xl px-5 py-10 text-center text-[14px] text-[#646f7c]">
            거래 변동 정보를 불러오는 중입니다.
         </div>
      );
   }

   if (isError) {
      return (
         <div className="bg-surface rounded-xl px-5 py-8 flex flex-col items-center gap-3 text-center">
            <p className="text-[14px] text-[#374553]">리셀 그래프 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
            <Button variant="tertiary" type="button" className="px-4 py-2" onClick={onRetry}>
               다시 시도
            </Button>
         </div>
      );
   }

   if (!insights) {
      return null;
   }

   return (
      <>
         <ResellPriceChart insights={insights} />

         <div className="flex flex-col gap-3">
            <p className="text-[20px] font-bold text-[#161d24] leading-normal">최근 거래 내역</p>
            <ul className="flex flex-col gap-1">
               {insights.tradeHistory.map(trade => (
                  <li key={trade.id} className="grid grid-cols-[max-content_minmax(0,1fr)_66px] items-center gap-x-3">
                     <span className="whitespace-nowrap text-[14px] font-semibold text-[#374553]">
                        {formatPrice(trade.price)}
                     </span>
                     <span className="min-w-0 truncate text-right text-[14px] text-[#374553]">{trade.seatLabel}</span>
                     <span className="whitespace-nowrap text-right text-[12px] text-[#646f7c]">{trade.tradedAt}</span>
                  </li>
               ))}
            </ul>
         </div>
      </>
   );
}

export function ResellNoticeSection() {
   return (
      <div className="bg-surface rounded-xl p-5 flex flex-col gap-2">
         <p className="text-[14px] font-bold text-[#374553] leading-normal">판매 유의사항</p>
         <div className="flex flex-col gap-0.5 text-[12px] text-[#374553] leading-normal">
            <p>• 등록 후 1시간 이내 해지 시 즉시 해지되며, 별도 제한 없이 이용 가능합니다.</p>
            <p>• 등록 후 1시간 이후 해지 시 해지 시점부터 6시간 동안 해당 티켓의 기능들이 제한됩니다.</p>
            <p>• 제한 시간 동안 해당 티켓은 판매 등록, 거래, 티켓 사용, 취소 및 환불이 불가능합니다.</p>
            <p>• 정산 시 수수료 5% 및 VAT(별도)가 차감됩니다.</p>
         </div>
      </div>
   );
}
