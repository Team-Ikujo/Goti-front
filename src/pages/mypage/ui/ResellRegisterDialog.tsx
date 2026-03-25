// src/pages/mypage/ui/ResellRegisterDialog.tsx

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { PurchaseHistoryItem } from './PurchaseHistoryCard';

interface Props {
   open: boolean;
   onClose: () => void;
   item: PurchaseHistoryItem;
}

// ─── 정적 mock 데이터 (실제로는 API에서 수신) ──────────────────────
const MOCK_PRICE = {
   lastPrice: 15000,
   lowPrice: 16800,
   highPrice: 31200,
   changeText: '+6,000원 (25%)',
};

const MOCK_RECENT_TRADES = [
   { price: 52000, seat: '110구역 0열 0번', time: '40분 전' },
   { price: 81000, seat: '110구역 10열 11번', time: '6시간 전' },
   { price: 1052000, seat: '110구역 27열 9번', time: '03/07 14:23' },
   { price: 52000, seat: '110구역 0열 0번', time: '03/07 14:23' },
];

// ─── 체크박스 아이콘 ────────────────────────────────────────────────
function CheckboxIcon({ checked }: { checked: boolean }) {
   if (checked) {
      return (
         <div className="relative size-5 shrink-0">
            <div className="absolute left-px top-px size-[18px] bg-primary rounded-[4px]" />
            <svg className="absolute inset-0 size-full" viewBox="0 0 20 20" fill="none">
               <path d="M5 10.5l3 3L15 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
         </div>
      );
   }
   return (
      <div className="relative size-5 shrink-0">
         <div className="absolute left-px top-px size-[18px] bg-white border-[1.5px] border-[#d0d6db] rounded-[4px]" />
      </div>
   );
}

// ─── 가격 추이 차트 ────────────────────────────────────────────────
function PriceTrendChart() {
   const CW = 420;  // 차트 영역 너비 (Y 라벨 제외)
   const CH = 130;  // 차트 영역 높이 (X 라벨 제외)
   const YW = 58;   // Y축 라벨 열 너비
   const XH = 20;   // X축 라벨 행 높이
   const VW = CW + YW;
   const VH = CH + XH;

   const PRICE_MIN = 10000;
   const PRICE_MAX = 30000;
   const PRICE_RANGE = PRICE_MAX - PRICE_MIN;

   const yGrid = [30000, 25000, 20000, 15000, 10000];
   const xTicks = ['14:00', '14:45', '15:30', '16:15', '17:00', '17:45'];

   // 8개 mock 데이터 포인트 [시간비율 0~1, 가격]
   const RAW: [number, number][] = [
      [0,     24000],
      [0.133, 21000],
      [0.267, 26000],
      [0.4,   17000],
      [0.533, 22000],
      [0.667, 19000],
      [0.8,   20000],
      [1.0,   25000],
   ];

   const pts = RAW.map(([r, p]) => ({
      x: r * CW,
      y: CH - ((p - PRICE_MIN) / PRICE_RANGE) * CH,
   }));

   const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
   const area =
      `M ${pts[0].x},${pts[0].y} ` +
      pts.slice(1).map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${pts[pts.length - 1].x},${CH} L ${pts[0].x},${CH} Z`;

   // 툴팁 앵커 = index 6 (17:00, 20,000)
   const tip = pts[6];

   return (
      <div className="border border-[#e2e8f0] rounded-[8px] overflow-hidden w-full">
         <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: 'block' }}>
            <defs>
               <linearGradient id="chartAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
               </linearGradient>
            </defs>

            {/* 수평 점선 그리드 (25k, 20k, 15k, 10k) */}
            {yGrid.slice(1).map((price, i) => {
               const gy = CH - ((price - PRICE_MIN) / PRICE_RANGE) * CH;
               return (
                  <line
                     key={i}
                     x1={0} y1={gy} x2={CW} y2={gy}
                     stroke="#e2e8f0"
                     strokeWidth="1"
                     strokeDasharray="4 3"
                  />
               );
            })}

            {/* 영역 채우기 */}
            <path d={area} fill="url(#chartAreaGrad)" />

            {/* 꺾은선 */}
            <polyline
               points={polyline}
               fill="none"
               stroke="#3b82f6"
               strokeWidth="1.5"
               strokeLinejoin="round"
               strokeLinecap="round"
            />

            {/* 데이터 포인트 점 */}
            {pts.map((p, i) => (
               <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#3b82f6" strokeWidth="1.5" />
            ))}

            {/* 툴팁 */}
            <g>
               <line
                  x1={tip.x} y1={0} x2={tip.x} y2={CH}
                  stroke="#475569"
                  strokeWidth="0.8"
                  strokeDasharray="3 2"
               />
               <rect x={tip.x - 90} y={tip.y - 50} width="86" height="44" rx="4" fill="#1e293b" />
               <text x={tip.x - 47} y={tip.y - 36} textAnchor="middle" fill="white" fontSize="8.5" fontWeight="600">
                  체결 가격: 20,000
               </text>
               <text x={tip.x - 47} y={tip.y - 25} textAnchor="middle" fill="#94a3b8" fontSize="8">
                  (-16.67%)
               </text>
               <text x={tip.x - 47} y={tip.y - 14} textAnchor="middle" fill="#94a3b8" fontSize="7.5">
                  금, 2026-03-13, 17:19
               </text>
            </g>

            {/* Y축 라벨 (우측) */}
            {yGrid.map((price, i) => {
               const gy = CH - ((price - PRICE_MIN) / PRICE_RANGE) * CH;
               return (
                  <text
                     key={i}
                     x={CW + YW / 2}
                     y={gy + 4}
                     textAnchor="middle"
                     fill="#64748b"
                     fontSize="9"
                  >
                     {price.toLocaleString()}
                  </text>
               );
            })}

            {/* X축 라벨 (하단) */}
            {xTicks.map((label, i) => {
               const xPos = (i / (xTicks.length - 1)) * CW;
               return (
                  <text
                     key={i}
                     x={xPos}
                     y={CH + XH - 3}
                     textAnchor={i === 0 ? 'start' : i === xTicks.length - 1 ? 'end' : 'middle'}
                     fill="#64748b"
                     fontSize="9"
                  >
                     {label}
                  </text>
               );
            })}
         </svg>
      </div>
   );
}

// ─── 가격 입력 필드 ────────────────────────────────────────────────
function PriceInput({
   value,
   onChange,
}: {
   value: string;
   onChange: (v: string) => void;
}) {
   return (
      <div className="flex items-center bg-white border border-[#d0d6db] rounded-[8px] h-12 px-4 gap-1">
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

   // 열릴 때마다 상태 초기화
   useEffect(() => {
      if (open) {
         setCheckedSeats(new Set());
         setPrices({});
         setBulkPrice('');
         setBulkToggle(false);
      }
   }, [open]);

   if (!open) return null;

   const checkedCount = checkedSeats.size;
   const showBulkToggle = checkedCount >= 2;
   const unitPrice = item.game.quantity > 0
      ? Math.round(item.price / item.game.quantity)
      : item.price;

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

   return (
      // 스크림
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
         onClick={onClose}
      >
         {/* 모달 */}
         <div
            className="bg-background rounded-[12px] w-[588px] max-h-[760px] flex flex-col shadow-xl overflow-hidden"
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
               <div className="bg-[#f7f8fa] rounded-[8px] px-5 py-4 flex flex-col gap-1">
                  <p className="text-[18px] font-bold text-[#2c3e50] text-center leading-[1.6]">
                     {item.game.teams}
                  </p>
                  <p className="text-[14px] text-[#666] text-center leading-[1.6]">
                     {item.game.datetime}
                  </p>
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
                     <div className="bg-surface rounded-[12px] px-5 py-3 flex flex-col gap-3">
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
                                    bulkToggle ? 'left-[22px]' : 'left-0.5'
                                 }`}
                              />
                           </button>
                        </div>
                        {/* 토글 On: 통합 가격 입력 */}
                        {bulkToggle && (
                           <PriceInput value={bulkPrice} onChange={setBulkPrice} />
                        )}
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
                                 <div className="border-2 border-primary rounded-[8px] overflow-hidden">
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
                                    className="bg-background border border-[#e5e5e5] rounded-[8px] flex gap-3 items-center px-4 py-5 cursor-pointer hover:bg-surface transition-colors"
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

               {/* 거래 변동 */}
               <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1">
                     <span className="text-[20px] font-bold text-[#161d24] leading-normal">거래 변동</span>
                     <span className="text-[14px] font-semibold text-destructive leading-[1.45]">
                        {MOCK_PRICE.changeText}
                     </span>
                  </div>
                  {/* 가격 카드 3칸 */}
                  <div className="bg-surface rounded-[12px] grid grid-cols-3 gap-2 p-3 h-[79px]">
                     <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[13px] font-medium text-[#64748b] text-center leading-normal">
                           최근 거래 체결가
                        </span>
                        <span className="text-[16px] font-bold text-[#0f172a] text-center leading-normal">
                           {MOCK_PRICE.lastPrice.toLocaleString()}원
                        </span>
                     </div>
                     <div className="flex flex-col items-center justify-center gap-1 border-x border-[#e2e8f0]">
                        <span className="text-[13px] font-medium text-[#64748b] text-center leading-normal">
                           금일 하한가
                        </span>
                        <span className="text-[16px] font-bold text-primary text-center leading-normal">
                           {MOCK_PRICE.lowPrice.toLocaleString()}원
                        </span>
                     </div>
                     <div className="flex flex-col items-center justify-center gap-1">
                        <span className="text-[13px] font-medium text-[#64748b] text-center leading-normal">
                           금일 상한가
                        </span>
                        <span className="text-[16px] font-bold text-destructive text-center leading-normal">
                           {MOCK_PRICE.highPrice.toLocaleString()}원
                        </span>
                     </div>
                  </div>
                  {/* 가격 추이 차트 */}
                  <PriceTrendChart />
               </div>

               {/* 최근 거래 내역 */}
               <div className="flex flex-col gap-3">
                  <p className="text-[20px] font-bold text-[#161d24] leading-normal">최근 거래 내역</p>
                  <div className="flex flex-col gap-1">
                     {MOCK_RECENT_TRADES.map((trade, i) => (
                        <div key={i} className="flex items-center gap-12">
                           <div className="flex flex-1 items-center gap-3 min-w-0">
                              <span className="flex-1 text-[14px] font-semibold text-[#374553]">
                                 {trade.price.toLocaleString()}원
                              </span>
                              <span className="flex-1 text-[14px] text-[#374553] text-right">
                                 {trade.seat}
                              </span>
                           </div>
                           <span className="text-[12px] text-[#646f7c] w-[66px] text-right shrink-0">
                              {trade.time}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* 판매 유의사항 */}
               <div className="bg-surface rounded-[12px] p-5 flex flex-col gap-2">
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
                  className="flex-1 border border-[#d0d6db] rounded-[8px] py-3 text-[16px] font-bold text-[#374553] leading-normal hover:bg-surface transition-colors"
               >
                  닫기
               </Button>
               <Button
                  variant="none"
                  className="flex-1 bg-primary rounded-[8px] py-3 text-[16px] font-bold text-white leading-normal hover:bg-primary/90 transition-colors"
               >
                  판매 등록하기
               </Button>
            </div>
         </div>
      </div>
   );
}
