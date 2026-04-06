// src/pages/mypage/ui/ResellRegisterDialog.tsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import type { PurchaseHistoryItem } from './HistoryCard';
import ResellRegisterCompleteDialog from './ResellRegisterCompleteDialog';
import ResellPriceChart from '@/pages/books/ui/components/ResellPriceChart';
import { formatPrice } from '@/pages/books/model/zoneData';
import { createResaleListings } from '@/entities/resale/api/resaleApi';
import { useResellRegisterInsights } from '@/features/resale/model/useResellRegisterInsights';
import { getErrorMessage } from '@/shared/lib/error/getErrorMessage';

interface Props {
   open: boolean;
   onClose: () => void;
   onCompleteConfirm?: () => void;
   item: PurchaseHistoryItem;
}

// ─── 체크박스 아이콘 ────────────────────────────────────────────────
function CheckboxIcon({ checked }: { checked: boolean }) {
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

// ─── 가격 입력 필드 ────────────────────────────────────────────────
function PriceInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
   return (
      <div className="flex items-center bg-white border border-[#d0d6db] rounded-lg h-12 px-4 gap-1">
         <input
            type="number"
            placeholder="판매할 금액을 입력해주세요."
            value={value}
            onChange={e => onChange(e.target.value)}
            className="flex-1 text-[16px] leading-normal outline-none text-[#161d24] placeholder:text-[#acb4bb] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
         />
         <span className="text-[16px] font-medium text-[#374553] shrink-0">원</span>
      </div>
   );
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────
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

   const getResaleRegisterAlertMessage = (error: unknown) => {
      const message = getErrorMessage(error, '판매 등록에 실패했습니다. 다시 시도해주세요.');

      switch (message) {
         case '이미 등록된 티켓입니다':
         case '판매가는 35000원 ~ 65000원 이내여야 합니다.':
            return message;
         default:
            return '판매 등록에 실패했습니다. 다시 시도해주세요.';
      }
   };

   // 열릴 때마다 상태 초기화
   useEffect(() => {
      if (open) {
         setCheckedSeats(new Set());
         setPrices({});
         setBulkPrice('');
         setBulkToggle(false);
         setCompleteOpen(false);
         setCreatedSaleId(null);
      }
   }, [open]);

   if (!open) return null;

   const checkedCount = checkedSeats.size;
   const showBulkToggle = checkedCount >= 2;
   const resaleInsightsState = resaleInsightsQuery.data;
   const insights = resaleInsightsState?.status === 'success' ? resaleInsightsState.insights : null;

   const toggleSeat = (idx: number) => {
      setCheckedSeats(prev => {
         const next = new Set(prev);
         if (next.has(idx)) next.delete(idx);
         else next.add(idx);
         return next;
      });
   };

   const handleBulkToggle = () => {
      setBulkToggle(prev => {
         if (prev) setBulkPrice('');
         return !prev;
      });
   };

   const handleRegister = async () => {
      const indices = Array.from(checkedSeats);
      if (indices.length === 0) {
         alert('판매할 좌석을 선택해주세요.');
         return;
      }

      // 좌석별 ticketId 매핑 (ticketIds 배열 우선, 없으면 item.id로 fallback)
      const ticketIds = item.ticketIds ?? [item.id];

      const requests = indices.map(idx => ({
         ticketId: ticketIds[idx] ?? item.id,
         listingPrice: bulkToggle ? Number(bulkPrice) : Number(prices[idx]),
      }));

      if (requests.some(r => !r.listingPrice || isNaN(r.listingPrice))) {
         alert('판매 가격을 올바르게 입력해주세요.');
         return;
      }

      setIsSubmitting(true);
      try {
         const response = await createResaleListings({ listings: requests });
         const firstCreatedListingId = response.listings[0]?.listingId ?? null;

         setCreatedSaleId(firstCreatedListingId);
         await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['myResales'] }),
            queryClient.invalidateQueries({ queryKey: ['myResaleSummary'] }),
         ]);
         setCompleteOpen(true);
      } catch (error) {
         alert(getResaleRegisterAlertMessage(error));
      } finally {
         setIsSubmitting(false);
      }
   };

   return createPortal(
      <>
         {/* 판매 등록 완료 팝업 */}
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

         {/* 스크림 */}
         <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/50" onClick={onClose}>
            {/* 모달 */}
            <div
               className="bg-background rounded-t-xl lg:rounded-xl w-full lg:w-147 max-h-[90vh] lg:max-h-190 flex flex-col shadow-xl overflow-hidden"
               onClick={e => e.stopPropagation()}
            >
               {/* 헤더 */}
               <div className="relative flex items-center gap-2 p-5 shrink-0">
                  <p className="flex-1 text-[18px] font-bold text-[#161d24] leading-[1.55] text-center">
                     리셀 판매 등록
                  </p>
                  <button
                     onClick={onClose}
                     className="absolute right-5 top-1/2 -translate-y-1/2 text-[#161d24] hover:text-muted-foreground transition-colors"
                     aria-label="닫기"
                  >
                     <X size={24} />
                  </button>
               </div>

               {/* 스크롤 콘텐츠 */}
               <div className="flex-1 overflow-y-auto pb-5 px-5 flex flex-col gap-8 min-h-0">
                  {/* 경기 정보 */}
                  <div className="bg-[#f7f8fa] rounded-lg px-5 py-4 flex flex-col gap-1">
                     <p className="text-[18px] font-bold text-[#2c3e50] text-center leading-[1.6]">{item.game.teams}</p>
                     <p className="text-[14px] text-[#666] text-center leading-[1.6]">{item.game.datetime}</p>
                  </div>

                  {/* 보유 중인 티켓 */}
                  <div className="flex flex-col gap-3">
                     {/* 섹션 타이틀 */}
                     <div className="flex items-center">
                        <p className="flex-1 text-[20px] font-bold text-[#161d24] leading-normal">보유 중인 티켓</p>
                        <span className="text-[16px] font-bold text-primary leading-normal">{checkedCount}</span>
                        <span className="text-[16px] font-medium text-[#646f7c] leading-normal">매 선택</span>
                     </div>

                     {/* 2개 이상 선택 시 — 동일 가격 토글 */}
                     {showBulkToggle && (
                        <div className="bg-surface rounded-xl px-5 py-3 flex flex-col gap-3">
                           <div className="flex items-center gap-3">
                              <span className="flex-1 text-[14px] font-semibold text-[#374553] leading-normal">
                                 모든 티켓 동일 가격 적용하기
                              </span>
                              {/* 토글 스위치 */}
                              <button
                                 onClick={handleBulkToggle}
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
                           {/* 토글 On: 통합 가격 입력 */}
                           {bulkToggle && <PriceInput value={bulkPrice} onChange={setBulkPrice} />}
                        </div>
                     )}

                     {/* 좌석 목록 */}
                     <div className="flex flex-col gap-5">
                        {item.game.seats.map((seat, idx) => {
                           const isChecked = checkedSeats.has(idx);
                           return (
                              <div key={idx}>
                                 {isChecked ? (
                                    /* 선택된 좌석: 파란 테두리 + 가격 입력 */
                                    <div className="border-2 border-primary rounded-lg overflow-hidden">
                                       <div
                                          className="bg-[#f4f7fe] flex gap-3 items-center p-5 cursor-pointer"
                                          onClick={() => toggleSeat(idx)}
                                       >
                                          <CheckboxIcon checked />
                                          <div className="flex flex-1 items-center gap-2 min-w-0">
                                             <span className="text-[16px] font-bold text-[#374553] whitespace-nowrap">
                                                {item.game.section}
                                             </span>
                                             <span className="text-[14px] font-medium text-[#666] whitespace-nowrap">
                                                {seat}
                                             </span>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                             <span className="text-[14px] text-[#646f7c] leading-[1.45]">구매가</span>
                                             <span className="text-[16px] font-bold text-primary">
                                                {unitPrice.toLocaleString()}원
                                             </span>
                                          </div>
                                       </div>
                                       {/* 토글 Off일 때만 개별 가격 입력 */}
                                       {!bulkToggle && (
                                          <div className="px-5 py-5">
                                             <PriceInput
                                                value={prices[idx] ?? ''}
                                                onChange={v => setPrices(prev => ({ ...prev, [idx]: v }))}
                                             />
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    /* 미선택 좌석 */
                                    <div
                                       className="bg-background border border-[#e5e5e5] rounded-lg flex gap-3 items-center px-4 py-5 cursor-pointer hover:bg-surface transition-colors"
                                       onClick={() => toggleSeat(idx)}
                                    >
                                       <CheckboxIcon checked={false} />
                                       <div className="flex flex-1 items-center gap-2 min-w-0">
                                          <span className="text-[16px] font-bold text-[#374553] whitespace-nowrap">
                                             {item.game.section}
                                          </span>
                                          <span className="text-[14px] font-medium text-[#666] whitespace-nowrap">
                                             {seat}
                                          </span>
                                       </div>
                                       <div className="flex items-center gap-1 shrink-0">
                                          <span className="text-[14px] text-[#646f7c] leading-[1.45]">구매가</span>
                                          <span className="text-[16px] font-bold text-[#374553]">
                                             {unitPrice.toLocaleString()}원
                                          </span>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* 거래 변동 + 차트 */}
                  {resaleInsightsQuery.isLoading ? (
                     <div className="bg-surface rounded-xl px-5 py-10 text-center text-[14px] text-[#646f7c]">
                        거래 변동 정보를 불러오는 중입니다.
                     </div>
                  ) : resaleInsightsQuery.isError ? (
                     <div className="bg-surface rounded-xl px-5 py-8 flex flex-col items-center gap-3 text-center">
                        <p className="text-[14px] text-[#374553]">
                           리셀 그래프 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
                        </p>
                        <Button
                           variant="tertiary"
                           type="button"
                           className="px-4 py-2"
                           onClick={() => {
                              void resaleInsightsQuery.refetch();
                           }}
                        >
                           다시 시도
                        </Button>
                     </div>
                  ) : resaleInsightsState?.status === 'missing-game-id' ? (
                     <div className="bg-surface rounded-xl px-5 py-10 text-center text-[14px] text-[#646f7c]">
                        경기 정보가 없어 리셀 그래프를 표시할 수 없습니다.
                     </div>
                  ) : resaleInsightsState?.status === 'missing-grade' ? (
                     <div className="bg-surface rounded-xl px-5 py-10 text-center text-[14px] text-[#646f7c]">
                        좌석 등급 정보를 찾지 못해 리셀 그래프를 표시할 수 없습니다.
                     </div>
                  ) : resaleInsightsState?.status === 'empty' ? (
                     <div className="bg-surface rounded-xl px-5 py-10 text-center text-[14px] text-[#646f7c]">
                        아직 해당 좌석 등급의 최근 거래 내역이 없습니다.
                     </div>
                  ) : insights ? (
                     <ResellPriceChart insights={insights} />
                  ) : null}

                  {/* 최근 거래 내역 */}
                  <div className="flex flex-col gap-3">
                     <p className="text-[20px] font-bold text-[#161d24] leading-normal">최근 거래 내역</p>
                     {insights ? (
                        <ul className="flex flex-col gap-1">
                           {insights.tradeHistory.map(trade => (
                              <li
                                 key={trade.id}
                                 className="grid grid-cols-[max-content_minmax(0,1fr)_66px] items-center gap-x-3"
                              >
                                 <span className="whitespace-nowrap text-[14px] font-semibold text-[#374553]">
                                    {formatPrice(trade.price)}
                                 </span>
                                 <span className="min-w-0 truncate text-right text-[14px] text-[#374553]">
                                    {trade.seatLabel}
                                 </span>
                                 <span className="whitespace-nowrap text-right text-[12px] text-[#646f7c]">
                                    {trade.tradedAt}
                                 </span>
                              </li>
                           ))}
                        </ul>
                     ) : (
                        <div className="rounded-xl bg-surface px-5 py-6 text-center text-[14px] text-[#646f7c]">
                           최근 거래 내역을 표시할 수 없습니다.
                        </div>
                     )}
                  </div>

                  {/* 판매 유의사항 */}
                  <div className="bg-surface rounded-xl p-5 flex flex-col gap-2">
                     <p className="text-[14px] font-bold text-[#374553] leading-normal">판매 유의사항</p>
                     <div className="flex flex-col gap-0.5 text-[12px] text-[#374553] leading-normal">
                        <p>• 등록 후 1시간 이내 해지 시 즉시 해지되며, 별도 제한 없이 이용 가능합니다.</p>
                        <p>• 등록 후 1시간 이후 해지 시 해지 시점부터 6시간 동안 해당 티켓의 기능들이 제한됩니다.</p>
                        <p>• 제한 시간 동안 해당 티켓은 판매 등록, 거래, 티켓 사용, 취소 및 환불이 불가능합니다.</p>
                        <p>• 정산 시 수수료 5% 및 VAT(별도)가 차감됩니다.</p>
                     </div>
                  </div>
               </div>

               {/* 하단 고정 버튼 */}
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
