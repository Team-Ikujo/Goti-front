// src/pages/mypage/ui/MypagePage.tsx

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Settings, Check, SlidersHorizontal } from 'lucide-react';
import HistoryCard from './HistoryCard';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { useMyProfileData, useMyOrdersData, useMyResaleListData } from '../model/useMypageData';

type HistoryTab = 'purchase' | 'sale';
type PurchaseStatusFilter = '전체' | '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
type SaleStatusFilter = '전체' | '판매 중' | '판매 완료' | '정산 대기';
type PeriodFilter = '전체 내역' | '1개월' | '3개월' | '6개월' | '직접설정';
type PurchaseTypeFilter = '전체 내역' | '리셀' | '예매';

const PURCHASE_STATUS_CHIPS: PurchaseStatusFilter[] = [
   '전체',
   '입금 대기',
   '예매 완료',
   '부분 처리',
   '관람 완료',
   '취소/환불',
];
const SALE_STATUS_CHIPS: SaleStatusFilter[] = ['전체', '판매 중', '판매 완료', '정산 대기'];
const PERIOD_OPTIONS: PeriodFilter[] = ['전체 내역', '1개월', '3개월', '6개월', '직접설정'];
const PURCHASE_TYPE_OPTIONS: PurchaseTypeFilter[] = ['전체 내역', '리셀', '예매'];

// YYYY.MM.DD → YYYY-MM-DD
const toISODate = (s: string) => s.replace(/\./g, '-');
// YYYY-MM-DD → YYYY.MM.DD
const toDisplay = (s: string) => s.replace(/-/g, '.');
// Date → YYYY-MM-DD
const toInput = (d: Date) => d.toISOString().slice(0, 10);

const calcPeriodDates = (period: PeriodFilter, dataMinDate?: string) => {
   const today = new Date();
   if (period === '직접설정') return { start: '', end: '' };
   if (period === '전체 내역') return { start: dataMinDate || toInput(new Date(2025, 0, 1)), end: toInput(today) };
   const months = period === '1개월' ? 1 : period === '3개월' ? 3 : 6;
   const start = new Date(today);
   start.setMonth(start.getMonth() - months);
   return { start: toInput(start), end: toInput(today) };
};

export default function MypagePage() {
   const navigate = useNavigate();
   const location = useLocation();
   const [activeTab, setActiveTab] = useState<HistoryTab>(
      (location.state as { activeTab?: HistoryTab } | null)?.activeTab || 'purchase',
   );

   const { data: profile } = useMyProfileData();
   const { data: purchaseItems = [] } = useMyOrdersData();
   const { data: saleItems = [] } = useMyResaleListData();

   // 전체 내역 기간의 시작일: 데이터 중 가장 이른 날짜
   const DATA_MIN_DATE = useMemo(() => {
      const dates = [...purchaseItems, ...saleItems].map(i => toISODate(i.orderDate)).sort();
      return dates[0] || toInput(new Date(2025, 0, 1));
   }, [purchaseItems, saleItems]);

   // ── 상태 칩 필터 (즉시 반영) ──
   const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatusFilter>('전체');
   const [saleStatus, setSaleStatus] = useState<SaleStatusFilter>('전체');

   // ── 필터 바 Pending 상태 (조회 버튼 클릭 시 반영) ──
   const [pendingPeriod, setPendingPeriod] = useState<PeriodFilter>('전체 내역');
   const [pendingStartDate, setPendingStartDate] = useState(() => calcPeriodDates('전체 내역', DATA_MIN_DATE).start);
   const [pendingEndDate, setPendingEndDate] = useState(() => calcPeriodDates('전체 내역', DATA_MIN_DATE).end);
   const [pendingPurchaseType, setPendingPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');
   const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
   const [showTypeDropdown, setShowTypeDropdown] = useState(false);
   const periodDropdownRef = useRef<HTMLDivElement>(null);
   const typeDropdownRef = useRef<HTMLDivElement>(null);

   // ── 모바일 필터 시트 ──
   const [filterSheetOpen, setFilterSheetOpen] = useState(false);
   const [mobilePeriodOpen, setMobilePeriodOpen] = useState(false);
   const [mobileTypeOpen, setMobileTypeOpen] = useState(false);
   const mobilePeriodRef = useRef<HTMLDivElement>(null);
   const mobileTypeRef = useRef<HTMLDivElement>(null);

   // 드롭다운 외부 클릭 시 닫기
   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
            setShowPeriodDropdown(false);
         }
         if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
            setShowTypeDropdown(false);
         }
         if (mobilePeriodRef.current && !mobilePeriodRef.current.contains(e.target as Node)) {
            setMobilePeriodOpen(false);
         }
         if (mobileTypeRef.current && !mobileTypeRef.current.contains(e.target as Node)) {
            setMobileTypeOpen(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   // ── 실제 적용된 필터 ──
   const [appliedStartDate, setAppliedStartDate] = useState('');
   const [appliedEndDate, setAppliedEndDate] = useState('');
   const [appliedPurchaseType, setAppliedPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');

   const [currentPage, setCurrentPage] = useState(1);
   const ITEMS_PER_PAGE = 5;

   // 기간 선택 시 날짜 pending 자동 설정
   const handlePeriodChange = (period: PeriodFilter) => {
      setPendingPeriod(period);
      setShowPeriodDropdown(false);
      if (period !== '직접설정') {
         const { start, end } = calcPeriodDates(period, DATA_MIN_DATE);
         setPendingStartDate(start);
         setPendingEndDate(end);
      }
   };

   // 조회 버튼: pending → applied 반영
   const handleApply = () => {
      setAppliedStartDate(pendingStartDate);
      setAppliedEndDate(pendingEndDate);
      setAppliedPurchaseType(pendingPurchaseType);
      setCurrentPage(1);
   };

   // 탭 변경 시 필터 전체 초기화
   const handleTabChange = (tab: HistoryTab) => {
      setActiveTab(tab);
      setPurchaseStatus('전체');
      setSaleStatus('전체');
      setPendingPeriod('전체 내역');
      setPendingStartDate(calcPeriodDates('전체 내역', DATA_MIN_DATE).start);
      setPendingEndDate(calcPeriodDates('전체 내역', DATA_MIN_DATE).end);
      setPendingPurchaseType('전체 내역');
      setAppliedStartDate('');
      setAppliedEndDate('');
      setAppliedPurchaseType('전체 내역');
      setCurrentPage(1);
   };

   // 날짜 범위 필터 (applied 기준)
   const matchesDate = (orderDate: string) => {
      const d = toISODate(orderDate);
      if (appliedStartDate && d < appliedStartDate) return false;
      if (appliedEndDate && d > appliedEndDate) return false;
      return true;
   };

   const filteredPurchaseItems = useMemo(
      () =>
         purchaseItems.filter(item => {
            if (purchaseStatus !== '전체' && item.paymentStatus !== purchaseStatus) return false;
            if (appliedPurchaseType !== '전체 내역') {
               const target = appliedPurchaseType === '예매' ? '티켓' : '리셀';
               if (item.type !== target) return false;
            }
            return matchesDate(item.orderDate);
         }),
      [purchaseItems, purchaseStatus, appliedPurchaseType, appliedStartDate, appliedEndDate],
   );

   const filteredSaleItems = useMemo(
      () =>
         saleItems.filter(item => {
            if (saleStatus !== '전체' && item.saleStatus !== saleStatus) return false;
            return matchesDate(item.orderDate);
         }),
      [saleItems, saleStatus, appliedStartDate, appliedEndDate],
   );

   return (
      <div className="flex-1 bg-background px-4">
         <div className="mx-auto max-w-300 pt-7.5 lg:pt-12.5 pb-30">
            <h1 className="text-[30px] font-bold text-foreground mb-8">MY고티</h1>

            <div className="flex flex-col gap-4">
               {/* 유저 정보 카드 */}
               <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6">
                  <div className="flex items-start justify-between gap-3">
                     <div className="flex items-center gap-4 lg:gap-5">
                        <div className="size-16 lg:size-21 rounded-full border border-border flex items-center justify-center shrink-0">
                           <span className="text-heading-1-bold text-foreground">
                              {profile?.name?.[0] || '유'}
                           </span>
                        </div>
                        <div className="flex flex-col">
                           <p className="text-heading-1-bold text-foreground">{profile?.name || '로딩 중...'}</p>
                           <p className="text-body-1-regular text-muted-foreground">{profile?.email || 'goti1234@google.com'}</p>
                           <p className="text-body-1-regular text-muted-foreground">{profile?.mobile || '010-0000-0000'}</p>
                        </div>
                     </div>
                     <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => navigate('/mypage/account')}
                        className="text-body-2-regular font-normal [&_svg]:size-4"
                     >
                        <Settings size={16} />
                        <span className="hidden lg:inline">계정 정보 수정</span>
                     </Button>
                  </div>
               </div>

               {/* 티켓 현황 카드 */}
               {(() => {
                  const totalHeld = purchaseItems.filter(i => i.paymentStatus === '예매 완료').length;
                  const onSale = saleItems.filter(i => i.saleStatus === '판매 중').length;
                  const soldCount = saleItems.filter(i => i.saleStatus === '판매 완료').length;
                  const unsettledAmount = saleItems.filter(i => i.saleStatus === '정산 대기').reduce(
                     (sum, i) => sum + i.salePrice,
                     0,
                  );
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
                     <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6">
                        <p className="text-heading-3-bold text-foreground mb-7.5">티켓 현황</p>
                        <div className="grid grid-cols-2 lg:flex lg:items-start gap-y-4 lg:gap-y-0">
                           {stats.map(stat => (
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
                     </div>
                  );
               })()}

               {/* 구매/판매 내역 카드 */}
               <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6">
                  <p className="text-heading-4-bold text-foreground mb-4">구매 / 판매 내역</p>

                  {/* 탭 */}
                  <div className="flex flex-col gap-5">
                     <div className="bg-[#f1f2f4] rounded-lg p-1 flex">
                        {(['purchase', 'sale'] as const).map(tab => (
                           <Button
                              key={tab}
                              variant="none"
                              onClick={() => handleTabChange(tab)}
                              className={`flex-1 py-2.5 text-body-2-semibold rounded-md transition-all ${
                                 activeTab === tab
                                    ? 'bg-background text-foreground shadow-sm'
                                    : 'text-(--text-tertiary)'
                              }`}
                           >
                              {tab === 'purchase' ? '구매 내역' : '판매 내역'}
                           </Button>
                        ))}
                     </div>

                     {/* 필터 바 — 데스크톱 전용 */}
                     <div className="hidden lg:block bg-background border border-border rounded-lg px-4 py-3">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                           {/* 조회기간 */}
                           <div className="flex items-center gap-2 overflow-x-auto">
                              <span className="text-body-2-regular text-foreground whitespace-nowrap">조회기간:</span>

                              {/* 기간 드롭다운 */}
                              <div className="relative" ref={periodDropdownRef}>
                                 <Button
                                    variant="none"
                                    onClick={() => setShowPeriodDropdown(p => !p)}
                                    className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-29.75 justify-between [&_svg]:size-4"
                                 >
                                    <span>{pendingPeriod}</span>
                                    <ChevronDown size={16} />
                                 </Button>
                                 {showPeriodDropdown && (
                                    <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-29.75 p-0.75 flex flex-col gap-0.5">
                                       {PERIOD_OPTIONS.map(opt => {
                                          const isSelected = pendingPeriod === opt;
                                          return (
                                             <Button
                                                key={opt}
                                                variant="none"
                                                onClick={() => handlePeriodChange(opt)}
                                                className={`w-full flex items-center justify-between px-1 py-1 rounded-sm text-body-2-medium text-foreground tracking-[-0.15px] hover:bg-[#f1f2f4] [&_svg]:size-4 ${isSelected ? 'bg-fill-disabled' : ''}`}
                                             >
                                                <span>{opt}</span>
                                                {isSelected && <Check size={16} className="shrink-0" />}
                                             </Button>
                                          );
                                       })}
                                    </div>
                                 )}
                              </div>

                              {/* 날짜 범위 — 직접설정이면 DatePicker, 아니면 읽기 전용 버튼 */}
                              {pendingPeriod === '직접설정' ? (
                                 <>
                                    <div className="w-44">
                                       <DatePicker
                                          value={pendingStartDate}
                                          onChange={setPendingStartDate}
                                          placeholder="시작 날짜"
                                       />
                                    </div>
                                    <span className="text-body-2-regular text-foreground">~</span>
                                    <div className="w-44">
                                       <DatePicker
                                          value={pendingEndDate}
                                          onChange={setPendingEndDate}
                                          placeholder="종료 날짜"
                                       />
                                    </div>
                                 </>
                              ) : (
                                 <>
                                    <Button
                                       variant="none"
                                       disabled
                                       className="border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-24 cursor-default"
                                    >
                                       {pendingStartDate ? toDisplay(pendingStartDate) : '날짜 선택'}
                                    </Button>
                                    <span className="text-body-2-regular text-foreground">~</span>
                                    <Button
                                       variant="none"
                                       disabled
                                       className="border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-24 cursor-default"
                                    >
                                       {pendingEndDate ? toDisplay(pendingEndDate) : '날짜 선택'}
                                    </Button>
                                 </>
                              )}
                           </div>

                           {/* 종류 + 조회 */}
                           <div className="flex items-center gap-3 overflow-x-auto">
                              {/* 종류 드롭다운 */}
                              <div className="flex items-center gap-1">
                                 <span className="text-body-2-regular text-foreground whitespace-nowrap">종류:</span>
                                 {activeTab === 'purchase' ? (
                                    <div className="relative" ref={typeDropdownRef}>
                                       <Button
                                          variant="none"
                                          onClick={() => setShowTypeDropdown(p => !p)}
                                          className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-29.75 justify-between [&_svg]:size-4"
                                       >
                                          <span>{pendingPurchaseType}</span>
                                          <ChevronDown size={16} />
                                       </Button>
                                       {showTypeDropdown && (
                                          <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-29.75 p-0.75 flex flex-col gap-0.5">
                                             {PURCHASE_TYPE_OPTIONS.map(opt => {
                                                const isSelected = pendingPurchaseType === opt;
                                                return (
                                                   <Button
                                                      key={opt}
                                                      variant="none"
                                                      onClick={() => {
                                                         setPendingPurchaseType(opt);
                                                         setShowTypeDropdown(false);
                                                      }}
                                                      className={`w-full flex items-center justify-between px-1 py-1 rounded-sm text-body-2-medium text-foreground tracking-[-0.15px] hover:bg-[#f1f2f4] [&_svg]:size-4 ${isSelected ? 'bg-fill-disabled' : ''}`}
                                                   >
                                                      <span>{opt}</span>
                                                      {isSelected && <Check size={16} className="shrink-0" />}
                                                   </Button>
                                                );
                                             })}
                                          </div>
                                       )}
                                    </div>
                                 ) : (
                                    /* 판매 내역: 리셀 단일 옵션 */
                                    <div className="relative" ref={typeDropdownRef}>
                                       <Button
                                          variant="none"
                                          onClick={() => setShowTypeDropdown(p => !p)}
                                          className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-29.75 justify-between [&_svg]:size-4"
                                       >
                                          <span>리셀</span>
                                          <ChevronDown size={16} />
                                       </Button>
                                       {showTypeDropdown && (
                                          <div className="absolute top-full right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-29.75 p-0.75 flex flex-col gap-0.5">
                                             <Button
                                                variant="none"
                                                onClick={() => setShowTypeDropdown(false)}
                                                className="w-full flex items-center justify-between px-1 py-1 rounded-sm text-body-2-medium text-foreground tracking-[-0.15px] bg-fill-disabled [&_svg]:size-4"
                                             >
                                                <span>리셀</span>
                                                <Check size={16} className="shrink-0" />
                                             </Button>
                                          </div>
                                       )}
                                    </div>
                                 )}
                              </div>

                              {/* 조회 버튼 — 클릭 시 필터 적용 */}
                              <Button
                                 variant="tertiary"
                                 className="text-body-2-medium px-4 py-1.5 rounded-lg"
                                 onClick={handleApply}
                              >
                                 조회
                              </Button>
                           </div>
                        </div>
                     </div>

                     {/* 모바일 필터 버튼 */}
                     <div className="flex items-center justify-end lg:hidden">
                        <Button
                           variant="tertiary"
                           size="sm"
                           onClick={() => setFilterSheetOpen(true)}
                           className="flex items-center gap-1.5 text-body-2-medium w-full"
                        >
                           <SlidersHorizontal size={15} />
                           필터
                        </Button>
                     </div>

                     {/* 모바일 필터 Drawer */}
                     <Drawer open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                        <DrawerContent>
                           <DrawerHeader>
                              <DrawerTitle>구매/판매 내역</DrawerTitle>
                           </DrawerHeader>

                           <div className="px-5 flex flex-col gap-4">
                              {/* 조회기간 */}
                              <div className="flex flex-col gap-2">
                                 <span className="text-body-2-medium text-foreground">조회기간:</span>
                                 <div className="flex items-center gap-2">
                                    {/* 기간 드롭다운 */}
                                    <div className="relative shrink-0" ref={mobilePeriodRef}>
                                       <Button
                                          variant="none"
                                          onClick={() => setMobilePeriodOpen(p => !p)}
                                          className="flex items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground min-w-29.75 justify-between [&_svg]:size-4"
                                       >
                                          <span>{pendingPeriod}</span>
                                          <ChevronDown size={16} />
                                       </Button>
                                       {mobilePeriodOpen && (
                                          <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 min-w-29.75 p-0.75 flex flex-col gap-0.5">
                                             {PERIOD_OPTIONS.map(opt => {
                                                const isSelected = pendingPeriod === opt;
                                                return (
                                                   <Button
                                                      key={opt}
                                                      variant="none"
                                                      onClick={() => {
                                                         handlePeriodChange(opt);
                                                         setMobilePeriodOpen(false);
                                                      }}
                                                      className={`w-full flex items-center justify-between px-1 py-1 rounded-sm text-body-2-medium text-foreground tracking-[-0.15px] hover:bg-[#f1f2f4] [&_svg]:size-4 ${isSelected ? 'bg-fill-disabled' : ''}`}
                                                   >
                                                      <span>{opt}</span>
                                                      {isSelected && <Check size={16} className="shrink-0" />}
                                                   </Button>
                                                );
                                             })}
                                          </div>
                                       )}
                                    </div>

                                    {/* 날짜 범위 */}
                                    {pendingPeriod === '직접설정' ? (
                                       <div className="flex items-center gap-2 flex-1">
                                          <div className="flex-1">
                                             <DatePicker
                                                value={pendingStartDate}
                                                onChange={setPendingStartDate}
                                                placeholder="시작 날짜"
                                             />
                                          </div>
                                          <span className="text-body-2-regular text-foreground shrink-0">~</span>
                                          <div className="flex-1">
                                             <DatePicker
                                                value={pendingEndDate}
                                                onChange={setPendingEndDate}
                                                placeholder="종료 날짜"
                                             />
                                          </div>
                                       </div>
                                    ) : (
                                       <div className="flex items-center gap-2 flex-1">
                                          <Button
                                             variant="none"
                                             disabled
                                             className="border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground flex-1 cursor-default"
                                          >
                                             {pendingStartDate ? toDisplay(pendingStartDate) : '날짜 선택'}
                                          </Button>
                                          <span className="text-body-2-regular text-foreground shrink-0">~</span>
                                          <Button
                                             variant="none"
                                             disabled
                                             className="border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground flex-1 cursor-default"
                                          >
                                             {pendingEndDate ? toDisplay(pendingEndDate) : '날짜 선택'}
                                          </Button>
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* 종류 */}
                              <div className="flex flex-col gap-2">
                                 <span className="text-body-2-medium text-foreground">종류:</span>
                                 <div className="relative" ref={mobileTypeRef}>
                                    {activeTab === 'purchase' ? (
                                       <>
                                          <Button
                                             variant="none"
                                             onClick={() => setMobileTypeOpen(p => !p)}
                                             className="flex w-full items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground justify-between [&_svg]:size-4"
                                          >
                                             <span>{pendingPurchaseType}</span>
                                             <ChevronDown size={16} />
                                          </Button>
                                          {mobileTypeOpen && (
                                             <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-10 w-full p-0.75 flex flex-col gap-0.5">
                                                {PURCHASE_TYPE_OPTIONS.map(opt => {
                                                   const isSelected = pendingPurchaseType === opt;
                                                   return (
                                                      <Button
                                                         key={opt}
                                                         variant="none"
                                                         onClick={() => {
                                                            setPendingPurchaseType(opt);
                                                            setMobileTypeOpen(false);
                                                         }}
                                                         className={`w-full flex items-center justify-between px-1 py-1 rounded-sm text-body-2-medium text-foreground tracking-[-0.15px] hover:bg-[#f1f2f4] [&_svg]:size-4 ${isSelected ? 'bg-fill-disabled' : ''}`}
                                                      >
                                                         <span>{opt}</span>
                                                         {isSelected && <Check size={16} className="shrink-0" />}
                                                      </Button>
                                                   );
                                                })}
                                             </div>
                                          )}
                                       </>
                                    ) : (
                                       <Button
                                          variant="none"
                                          className="flex w-full items-center gap-2 border border-border rounded-lg px-3 py-1.5 text-body-2-regular text-foreground justify-between [&_svg]:size-4 cursor-default"
                                       >
                                          <span>리셀</span>
                                          <ChevronDown size={16} />
                                       </Button>
                                    )}
                                 </div>
                              </div>

                              {/* 조회 버튼 */}
                              <Button
                                 variant="tertiary"
                                 className="w-full py-2.5 text-body-2-medium rounded-lg mt-1"
                                 onClick={() => {
                                    handleApply();
                                    setFilterSheetOpen(false);
                                 }}
                              >
                                 조회
                              </Button>
                           </div>
                        </DrawerContent>
                     </Drawer>

                     {/* 상태 필터 칩 (즉시 반영) */}
                     <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                        {(activeTab === 'purchase'
                           ? PURCHASE_STATUS_CHIPS
                           : (SALE_STATUS_CHIPS as (PurchaseStatusFilter | SaleStatusFilter)[])
                        ).map(chip => {
                           const isActive = activeTab === 'purchase' ? chip === purchaseStatus : chip === saleStatus;
                           return (
                              <Button
                                 key={chip}
                                 variant="none"
                                 onClick={() => {
                                    if (activeTab === 'purchase') setPurchaseStatus(chip as PurchaseStatusFilter);
                                    else setSaleStatus(chip as SaleStatusFilter);
                                    setCurrentPage(1);
                                 }}
                                 className={`shrink-0 px-4 py-2 rounded-full text-body-2-medium transition-all ${
                                    isActive
                                       ? 'bg-fill-inverse text-white'
                                       : 'border border-border text-muted-foreground hover:bg-surface'
                                 }`}
                              >
                                 {chip}
                              </Button>
                           );
                        })}
                     </div>

                     {/* 내역 리스트 */}
                     {(() => {
                        const items = activeTab === 'purchase' ? filteredPurchaseItems : filteredSaleItems;
                        const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
                        const safePage = Math.min(currentPage, totalPages);
                        const pageItems = items.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

                        return (
                           <>
                              <div className="flex flex-col gap-5">
                                 {pageItems.length > 0 ? (
                                    activeTab === 'purchase' ? (
                                       (pageItems as typeof filteredPurchaseItems).map(item => (
                                          <HistoryCard
                                             key={item.id}
                                             mode="purchase"
                                             item={item}
                                          />
                                       ))
                                    ) : (
                                       (pageItems as typeof filteredSaleItems).map(item => (
                                          <HistoryCard
                                             key={item.id}
                                             mode="sale"
                                             item={item}
                                          />
                                       ))
                                    )
                                 ) : (
                                    <p className="text-center text-(--text-tertiary) text-body-2-regular h-full">
                                       조건에 맞는 {activeTab === 'purchase' ? '구매' : '판매'} 내역이 없습니다.
                                    </p>
                                 )}
                              </div>

                              {/* 페이지네이션 */}
                              {totalPages > 1 && (
                                 <div className="flex items-center justify-center gap-1">
                                    <Button
                                       variant="none"
                                       onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                       className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
                                    >
                                       <ChevronLeft size={16} />
                                    </Button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                       <Button
                                          key={page}
                                          variant="none"
                                          onClick={() => setCurrentPage(page)}
                                          className={`size-6 p-0 flex items-center justify-center text-body-2-regular rounded-xs transition-all ${
                                             safePage === page
                                                ? 'bg-primary text-white'
                                                : 'border border-border text-muted-foreground hover:bg-[#f1f2f4]'
                                          }`}
                                       >
                                          {page}
                                       </Button>
                                    ))}
                                    <Button
                                       variant="none"
                                       onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                       className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
                                    >
                                       <ChevronRight size={16} />
                                    </Button>
                                 </div>
                              )}
                           </>
                        );
                     })()}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
