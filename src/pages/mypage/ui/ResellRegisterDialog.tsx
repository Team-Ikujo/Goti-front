import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';

import { createResaleListings } from '@/entities/resale/api/resaleApi';
import { useResellRegisterInsights } from '@/features/resale/model/useResellRegisterInsights';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';
import { Button } from '@/shared/ui/button';

import type { PurchaseHistoryItem } from '../model/historyCard';
import ResellRegisterCompleteDialog from './ResellRegisterCompleteDialog';
import { ResellInsightsSection, ResellNoticeSection, ResellSeatSelector } from './ResellRegisterSections';

interface Props {
   open: boolean;
   onClose: () => void;
   onCompleteConfirm?: () => void;
   item: PurchaseHistoryItem;
}

export default function ResellRegisterDialog({ open, onClose, onCompleteConfirm, item }: Props) {
   const [checkedSeats, setCheckedSeats] = useState<Set<number>>(new Set());
   const [prices, setPrices] = useState<Record<number, string>>({});
   const [bulkPrice, setBulkPrice] = useState('');
   const [bulkToggle, setBulkToggle] = useState(false);
   const [completeOpen, setCompleteOpen] = useState(false);
   const [createdSaleId, setCreatedSaleId] = useState<string | null>(null);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const queryClient = useQueryClient();
   const unitPrice = item.game.quantity > 0 ? Math.round(item.price / item.game.quantity) : item.price;

   const resaleInsightsQuery = useResellRegisterInsights({
      enabled: open,
      gameId: item.gameId,
      seatGradeName: item.seatGradeName,
      sectionCode: item.game.section,
      unitPrice,
   });

   const insights = resaleInsightsQuery.data?.insights ?? null;
   const checkedCount = checkedSeats.size;

   useEffect(() => {
      if (!open) {
         return;
      }

      setCheckedSeats(new Set());
      setPrices({});
      setBulkPrice('');
      setBulkToggle(false);
      setCompleteOpen(false);
      setCreatedSaleId(null);
   }, [open]);

   if (!open) {
      return null;
   }

   const toggleSeat = (idx: number) => {
      setCheckedSeats(prev => {
         const next = new Set(prev);
         if (next.has(idx)) {
            next.delete(idx);
         } else {
            next.add(idx);
         }
         return next;
      });
   };

   const handleBulkToggle = () => {
      setBulkToggle(prev => {
         if (prev) {
            setBulkPrice('');
         }
         return !prev;
      });
   };

   const handleRegister = async () => {
      const indices = Array.from(checkedSeats);
      if (indices.length === 0) {
         alert('판매할 좌석을 선택해주세요.');
         return;
      }

      const ticketIds = item.ticketIds ?? [item.id];
      const requests = indices.map(idx => ({
         ticketId: ticketIds[idx] ?? item.id,
         listingPrice: bulkToggle ? Number(bulkPrice) : Number(prices[idx]),
      }));

      if (requests.some(({ listingPrice }) => !listingPrice || Number.isNaN(listingPrice))) {
         alert('판매 가격을 올바르게 입력해주세요.');
         return;
      }

      setIsSubmitting(true);
      try {
         const response = await createResaleListings({ listings: requests });
         setCreatedSaleId(response.listings[0]?.listingId ?? null);

         await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['myResales'] }),
            queryClient.invalidateQueries({ queryKey: ['myResaleSummary'] }),
         ]);

         setCompleteOpen(true);
      } catch (error) {
         const message = getErrorMessage(error, '판매 등록에 실패했습니다. 다시 시도해주세요.');
         switch (message) {
            case '이미 등록된 티켓입니다':
            case '판매가는 35000원 ~ 65000원 이내여야 합니다.':
               alert(message);
               break;
            default:
               alert('판매 등록에 실패했습니다. 다시 시도해주세요.');
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   return createPortal(
      <>
         <ResellRegisterCompleteDialog
            open={completeOpen}
            onClose={() => {
               setCompleteOpen(false);
               onClose();
               onCompleteConfirm?.();
            }}
            onConfirm={() => {
               setCompleteOpen(false);
               onClose();
               onCompleteConfirm?.();
            }}
            saleId={createdSaleId ?? item.id}
         />

         <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 lg:items-center" onClick={onClose}>
            <div
               className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-147 max-h-[90vh] lg:max-h-190 flex flex-col shadow-xl overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               <div className="relative flex items-center gap-2 p-5 shrink-0">
                  <p className="flex-1 text-[18px] font-bold text-[#161d24] leading-[1.55] text-center">리셀 판매 등록</p>
                  <button
                     onClick={onClose}
                     className="absolute right-5 top-1/2 -translate-y-1/2 text-[#161d24] hover:text-muted-foreground transition-colors"
                     aria-label="닫기"
                  >
                     <X size={24} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto pb-5 px-5 flex flex-col gap-8 min-h-0">
                  <div className="bg-[#f7f8fa] rounded-lg px-5 py-4 flex flex-col gap-1">
                     <p className="text-[18px] font-bold text-[#2c3e50] text-center leading-[1.6]">{item.game.teams}</p>
                     <p className="text-[14px] text-[#666] text-center leading-[1.6]">{item.game.datetime}</p>
                  </div>

                  <ResellSeatSelector
                     item={item}
                     checkedSeats={checkedSeats}
                     checkedCount={checkedCount}
                     bulkToggle={bulkToggle}
                     bulkPrice={bulkPrice}
                     prices={prices}
                     onToggleBulk={handleBulkToggle}
                     onBulkPriceChange={setBulkPrice}
                     onToggleSeat={toggleSeat}
                     onSeatPriceChange={(index, value) => setPrices(prev => ({ ...prev, [index]: value }))}
                  />

                  <ResellInsightsSection
                     isLoading={resaleInsightsQuery.isLoading}
                     isError={resaleInsightsQuery.isError}
                     insights={insights}
                     onRetry={() => {
                        void resaleInsightsQuery.refetch();
                     }}
                  />

                  <ResellNoticeSection />
               </div>

               <div className="shrink-0 bg-background px-5 pt-5 pb-5 flex gap-2">
                  <Button
                     variant="none"
                     onClick={onClose}
                     className="flex-1 border border-border rounded-lg py-3 text-[16px] font-bold text-[#374553] leading-normal hover:bg-surface transition-colors"
                  >
                     닫기
                  </Button>
                  <Button
                     variant="none"
                     className="flex-1 bg-primary rounded-lg py-3 text-[16px] font-bold text-white leading-normal hover:bg-primary/90 transition-colors disabled:opacity-50"
                     onClick={handleRegister}
                     disabled={isSubmitting}
                  >
                     {isSubmitting ? '등록 중...' : '판매 등록하기'}
                  </Button>
               </div>
            </div>
         </div>
      </>,
      document.body,
   );
}
