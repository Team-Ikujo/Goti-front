// src/pages/mypage/ui/ResellRegisterDialog.tsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { PurchaseHistoryItem } from './PurchaseHistoryCard';
import ResellRegisterCompleteDialog from './ResellRegisterCompleteDialog';
import type { ResellZoneInsights } from '@/pages/books/model/resellData';
import ResellPriceChart from '@/pages/books/ui/components/ResellPriceChart';
import { formatPrice } from '@/pages/books/model/zoneData';

interface Props {
   open: boolean;
   onClose: () => void;
   item: PurchaseHistoryItem;
}

// ─── 정적 mock 데이터 (실제로는 API에서 수신) ──────────────────────
const MOCK_INSIGHTS: ResellZoneInsights = {
   changeAmount: 6000,
   changeRate: 25,
   previousClose: 15000,
   recentTrade: 21000,
   dayLow: 16800,
   dayHigh: 31200,
   pricePointsByRange: {
      minute: [
         { time: '14:00', price: 13000, occurredAt: '2026-03-20T14:00:00+09:00' },
         { time: '14:45', price: 15500, occurredAt: '2026-03-20T14:45:00+09:00' },
         { time: '15:30', price: 18500, occurredAt: '2026-03-20T15:30:00+09:00' },
         { time: '16:15', price: 21000, occurredAt: '2026-03-20T16:15:00+09:00' },
         { time: '17:00', price: 19500, occurredAt: '2026-03-20T17:00:00+09:00' },
         { time: '17:45', price: 23000, occurredAt: '2026-03-20T17:45:00+09:00' },
         { time: '18:30', price: 22000, occurredAt: '2026-03-20T18:30:00+09:00' },
      ],
      day: [
         { time: '03/14', price: 12000, occurredAt: '2026-03-14T18:00:00+09:00' },
         { time: '03/15', price: 13500, occurredAt: '2026-03-15T18:00:00+09:00' },
         { time: '03/16', price: 15500, occurredAt: '2026-03-16T18:00:00+09:00' },
         { time: '03/17', price: 16500, occurredAt: '2026-03-17T18:00:00+09:00' },
         { time: '03/18', price: 17800, occurredAt: '2026-03-18T18:00:00+09:00' },
         { time: '03/19', price: 19200, occurredAt: '2026-03-19T18:00:00+09:00' },
         { time: '03/20', price: 21000, occurredAt: '2026-03-20T18:00:00+09:00' },
      ],
   },
   tradeHistory: [
      { id: 't1', price: 52000, seatLabel: '110구역 0열 0번', tradedAt: '40분 전' },
      { id: 't2', price: 81000, seatLabel: '110구역 10열 11번', tradedAt: '6시간 전' },
      { id: 't3', price: 1052000, seatLabel: '110구역 27열 9번', tradedAt: '03/07 14:23' },
      { id: 't4', price: 52000, seatLabel: '110구역 0열 0번', tradedAt: '03/07 14:23' },
   ],
   listings: [],
};

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
export default function ResellRegisterDialog({ open, onClose, item }: Props) {
   const [checkedSeats, setCheckedSeats] = useState<Set<number>>(new Set());
   const [prices, setPrices] = useState<Record<number, string>>({});
   const [bulkPrice, setBulkPrice] = useState('');
   const [bulkToggle, setBulkToggle] = useState(false);
   const [completeOpen, setCompleteOpen] = useState(false);

   // 열릴 때마다 상태 초기화
   useEffect(() => {
      if (open) {
         setCheckedSeats(new Set());
         setPrices({});
         setBulkPrice('');
         setBulkToggle(false);
         setCompleteOpen(false);
      }
   }, [open]);

   if (!open) return null;

   const checkedCount = checkedSeats.size;
   const showBulkToggle = checkedCount >= 2;
   const unitPrice = item.game.quantity > 0 ? Math.round(item.price / item.game.quantity) : item.price;

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

   return createPortal(
      <>
         {/* 판매 등록 완료 팝업 */}
         <ResellRegisterCompleteDialog
            open={completeOpen}
            onClose={() => {
               setCompleteOpen(false);
               onClose();
            }}
            saleId={item.id}
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
                  <ResellPriceChart insights={MOCK_INSIGHTS} />

                  {/* 최근 거래 내역 */}
                  <div className="flex flex-col gap-3">
                     <p className="text-[20px] font-bold text-[#161d24] leading-normal">최근 거래 내역</p>
                     <ul className="flex flex-col gap-1">
                        {MOCK_INSIGHTS.tradeHistory.map(trade => (
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
                     className="flex-1 bg-primary rounded-lg py-3 text-[16px] font-bold text-white leading-normal hover:bg-primary/90 transition-colors"
                     onClick={() => setCompleteOpen(true)}
                  >
                     판매 등록하기
                  </Button>
               </div>
            </div>
         </div>
      </>,
      document.body,
   );
}
