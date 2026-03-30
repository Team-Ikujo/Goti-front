// src/pages/mypage/ui/MypagePage.tsx

import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, Settings, Check, SlidersHorizontal, Search, X } from 'lucide-react';
import HistoryCard from './HistoryCard';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/shared/ui/drawer';
import { useMyProfileData, useMyOrdersData, useMyResaleListData } from '../model/useMypageData';

type HistoryTab = 'purchase' | 'sale';
type PurchaseStatusFilter = '전체' | '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
type SaleStatusFilter = '전체' | '판매 중' | '정산 대기' | '판매 완료' | '취소 대기' | '취소 완료';
type PeriodFilter = '전체 내역' | '1개월' | '3개월' | '6개월' | '직접설정';
type PurchaseTypeFilter = '전체 내역' | '리셀' | '예매';
type SaleTypeFilter = '리셀';

const PURCHASE_STATUS_CHIPS: PurchaseStatusFilter[] = [
   '전체',
   '입금 대기',
   '예매 완료',
   '부분 처리',
   '관람 완료',
   '취소/환불',
];
const SALE_STATUS_CHIPS: SaleStatusFilter[] = ['전체', '판매 중', '정산 대기', '판매 완료', '취소 대기', '취소 완료'];
const PERIOD_OPTIONS: PeriodFilter[] = ['전체 내역', '1개월', '3개월', '6개월', '직접설정'];
const PURCHASE_TYPE_OPTIONS: PurchaseTypeFilter[] = ['전체 내역', '리셀', '예매'];
const SALE_TYPE_OPTIONS: SaleTypeFilter[] = ['리셀'];

const toISODate = (s: string) => s.replace(/\./g, '-');
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

   const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatusFilter>('전체');
   const [saleStatus, setSaleStatus] = useState<SaleStatusFilter>('전체');

   const [pendingPeriod, setPendingPeriod] = useState<PeriodFilter>('전체 내역');
   const [pendingStartDate, setPendingStartDate] = useState(() => calcPeriodDates('전체 내역', DATA_MIN_DATE).start);
   const [pendingEndDate, setPendingEndDate] = useState(() => calcPeriodDates('전체 내역', DATA_MIN_DATE).end);
   const [pendingPurchaseType, setPendingPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');
   const [pendingSaleType, setPendingSaleType] = useState<SaleTypeFilter>('리셀');
   const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
   const [showTypeDropdown, setShowTypeDropdown] = useState(false);
   const periodDropdownRef = useRef<HTMLDivElement>(null);
   const typeDropdownRef = useRef<HTMLDivElement>(null);

   const [searchQuery, setSearchQuery] = useState('');
   const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
   const [searchError, setSearchError] = useState('');

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         if (periodDropdownRef.current && !periodDropdownRef.current.contains(e.target as Node)) {
            setShowPeriodDropdown(false);
         }
         if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
            setShowTypeDropdown(false);
         }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const [appliedStartDate, setAppliedStartDate] = useState('');
   const [appliedEndDate, setAppliedEndDate] = useState('');
   const [appliedPurchaseType, setAppliedPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');
   const [appliedSaleType, setAppliedSaleType] = useState<SaleTypeFilter>('리셀');

   const [currentPage, setCurrentPage] = useState(1);
   const ITEMS_PER_PAGE = 5;

   const handlePeriodChange = (period: PeriodFilter) => {
      setPendingPeriod(period);
      setShowPeriodDropdown(false);
      if (period !== '직접설정') {
         const { start, end } = calcPeriodDates(period, DATA_MIN_DATE);
         setPendingStartDate(start);
         setPendingEndDate(end);
      }
   };

   const handleApply = () => {
      const trimmed = searchQuery.trim();
      if (searchQuery.length > 0 && trimmed.length === 0) {
         setSearchError('공백만으로는 검색할 수 없습니다.');
         return;
      }
      if (trimmed.length > 0 && trimmed.length < 2) {
         setSearchError('2글자 이상 입력해주세요.');
         return;
      }
      setSearchError('');
      setAppliedStartDate(pendingStartDate);
      setAppliedEndDate(pendingEndDate);
      setAppliedPurchaseType(pendingPurchaseType);
      setAppliedSaleType(pendingSaleType);
      setAppliedSearchQuery(trimmed);
      setCurrentPage(1);
   };

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
            if (appliedSearchQuery) {
               const q = appliedSearchQuery.toLowerCase();
               const matches =
                  item.game.teams.toLowerCase().includes(q) ||
                  item.orderId.toLowerCase().includes(q) ||
                  item.game.venue.toLowerCase().includes(q);
               if (!matches) return false;
            }
            return matchesDate(item.orderDate);
         }),
      [purchaseItems, purchaseStatus, appliedPurchaseType, appliedStartDate, appliedEndDate, appliedSearchQuery],
   );

   const filteredSaleItems = useMemo(
      () =>
         saleItems.filter(item => {
            if (saleStatus !== '전체' && item.saleStatus !== saleStatus) return false;
            if (item.type !== '리셀') return false;
            if (appliedSearchQuery) {
               const q = appliedSearchQuery.toLowerCase();
               const matches =
                  item.game.teams.toLowerCase().includes(q) ||
                  item.orderId.toLowerCase().includes(q) ||
                  item.game.venue.toLowerCase().includes(q);
               if (!matches) return false;
            }
            return matchesDate(item.orderDate);
         }),
      [saleItems, saleStatus, appliedSaleType, appliedStartDate, appliedEndDate, appliedSearchQuery],
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
                           <span className="text-heading-1-bold text-foreground">{profile?.name?.[0] || '유'}</span>
                        </div>
                        <div className="flex flex-col">
                           <p className="text-heading-1-bold text-foreground">{profile?.name || '로딩 중...'}</p>
                           <p className="text-body-1-regular text-muted-foreground">
                              {profile?.email || '이메일 정보 없음'}
                           </p>
                           <p className="text-body-1-regular text-muted-foreground">
                              {profile?.mobile || '전화번호 정보 없음'}
                           </p>
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
                  const unsettledAmount = saleItems
                     .filter(i => i.saleStatus === '정산 대기')
                     .reduce((sum, i) => sum + i.salePrice, 0);
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

                  <div className="flex flex-col gap-5">
                     {/* 탭 목록 — Figma: fill=#e9ebee, r=14, p=4 */}
                     <div className="bg-[#e9ebee] rounded-[14px] p-1 flex">
                        {(['purchase', 'sale'] as const).map(tab => (
                           <Button
                              key={tab}
                              variant="none"
                              onClick={() => handleTabChange(tab)}
                              className={`flex-1 py-2.5 px-2 text-[14px] font-medium text-[#0a0a0a] transition-all ${
                                 activeTab === tab ? 'bg-white rounded-[10px] shadow-sm' : 'rounded-[14px]'
                              }`}
                           >
                              {tab === 'purchase' ? '구매 내역' : '판매 내역'}
                           </Button>
                        ))}
                     </div>

                     {/* 상태 필터 칩 — Figma: Team chip r=80, gap=12 */}
                     <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
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
                                 className={`shrink-0 px-4 py-2 rounded-full text-[14px] font-bold transition-all ${
                                    isActive
                                       ? 'bg-[#161d24] text-white'
                                       : 'bg-white border border-[#e9ebee] text-[#acb4bb]'
                                 }`}
                              >
                                 {chip}
                              </Button>
                           );
                        })}
                     </div>

                     {/* 필터 바 — Figma: Card 1150×70, r=14, p=16, stroke=#d0d6db */}
                     <div className="flex flex-col gap-2.5 p-4 bg-white rounded-[14px] border border-[#d0d6db]">
                        {/* 모바일 전용: 검색 인풋 — Figma: 230×36, r=20, stroke=#e5e5e5, 아이콘 우측 */}
                        <div className="flex flex-col gap-1 lg:hidden">
                           <div className="flex items-center w-full h-10 border border-[#e5e5e5] rounded-[20px] bg-background overflow-hidden">
                              <input
                                 type="text"
                                 value={searchQuery}
                                 onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setSearchError('');
                                 }}
                                 onKeyDown={e => {
                                    if (e.key === 'Enter') handleApply();
                                 }}
                                 placeholder="경기명, 주문번호, 구장 검색 (2글자 이상)"
                                 className="flex-1 h-full pl-3 text-[14px] text-foreground placeholder:text-[#646f7c] bg-transparent focus:outline-none"
                              />
                              <div className="flex items-center justify-center shrink-0 w-7 pr-3">
                                 {searchQuery ? (
                                    <button
                                       type="button"
                                       onClick={() => {
                                          setSearchQuery('');
                                          setSearchError('');
                                       }}
                                       aria-label="검색어 초기화"
                                    >
                                       <X size={11} className="text-muted-foreground" />
                                    </button>
                                 ) : (
                                    <Search size={16} className="text-[#161d24]" />
                                 )}
                              </div>
                           </div>
                           {searchError && (
                              <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>
                           )}
                        </div>

                        {/* 필터 행 — 데스크톱: SPACE_BETWEEN (Figma: OrdersPage primaryAxisAlignItems=SPACE_BETWEEN) */}
                        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-between">
                           {/* 왼쪽 그룹 — Figma: Container 411×36, gap=8 */}
                           <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-2">
                              {/* 데스크톱 전용: "조회기간:" 라벨 — Figma: 14px/500/#364153 */}
                              <span className="hidden lg:inline text-[14px] font-medium text-[#364153] whitespace-nowrap">
                                 조회기간:
                              </span>

                              {/* 조회기간 드롭다운 — Figma: 119×36, r=8, fill=#fff, stroke=#d0d6db, SPACE_BETWEEN */}
                              <div ref={periodDropdownRef} className="relative shrink-0">
                                 <button
                                    type="button"
                                    className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] whitespace-nowrap lg:w-[119px]"
                                    onClick={() => {
                                       setShowPeriodDropdown(v => !v);
                                       setShowTypeDropdown(false);
                                    }}
                                 >
                                    <span className="lg:hidden mr-1">조회기간: </span>
                                    <span className="lg:flex-1">{pendingPeriod}</span>
                                    <ChevronDown
                                       size={15}
                                       className={`shrink-0 ml-1 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                                    />
                                 </button>
                                 {showPeriodDropdown && (
                                    <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-[8px] p-1 w-[119px]">
                                       {PERIOD_OPTIONS.map(opt => (
                                          <button
                                             key={opt}
                                             type="button"
                                             className={`w-full flex items-center justify-between h-8 px-1.5 rounded-[6px] text-[14px] transition-colors ${
                                                pendingPeriod === opt
                                                   ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                                   : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                             }`}
                                             onClick={() => handlePeriodChange(opt)}
                                          >
                                             <span>{opt}</span>
                                             {pendingPeriod === opt && (
                                                <Check size={13} className="shrink-0 text-[#374553]" />
                                             )}
                                          </button>
                                       ))}
                                    </div>
                                 )}
                              </div>

                              {/* 직접설정 날짜 — Figma: 96×36 / 99×36, r=8, stroke=#d0d6db, 구분 "~" */}
                              {pendingPeriod === '직접설정' && (
                                 <div className="flex items-center gap-2 shrink-0">
                                    <DatePicker
                                       value={pendingStartDate}
                                       onChange={setPendingStartDate}
                                       placeholder="시작일"
                                       className="w-[140px]"
                                       triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                                    />
                                    <span className="text-[14px] font-medium text-black shrink-0">~</span>
                                    <DatePicker
                                       value={pendingEndDate}
                                       onChange={setPendingEndDate}
                                       placeholder="종료일"
                                       className="w-[140px]"
                                       triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                                    />
                                 </div>
                              )}
                           </div>

                           {/* 오른쪽 그룹 — Figma: Frame 442×36, gap=20 */}
                           <div className="flex items-center gap-2 lg:gap-5">
                              {/* 데스크톱 전용: 검색 인풋 — Figma: 230×36, r=20, fill=#fff, stroke=#e5e5e5, 아이콘 우측 */}
                              <div className="hidden lg:flex items-center w-[230px] h-9 border border-[#e5e5e5] rounded-[20px] bg-white overflow-hidden">
                                 <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => {
                                       setSearchQuery(e.target.value);
                                       setSearchError('');
                                    }}
                                    onKeyDown={e => {
                                       if (e.key === 'Enter') handleApply();
                                    }}
                                    placeholder="Search"
                                    className="flex-1 h-full pl-3 text-[14px] text-[#161d24] placeholder:text-[#646f7c] bg-transparent focus:outline-none"
                                 />
                                 {/* 아이콘 영역 — Figma: 28×28, pad=(6,12,6,0) */}
                                 <div className="flex items-center justify-center shrink-0 w-7 pr-3">
                                    {searchQuery ? (
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setSearchQuery('');
                                             setSearchError('');
                                          }}
                                          aria-label="검색어 초기화"
                                       >
                                          <X size={11} className="text-muted-foreground" />
                                       </button>
                                    ) : (
                                       <Search size={16} className="text-[#161d24]" />
                                    )}
                                 </div>
                              </div>

                              {/* 종류 label + 드롭다운 — 구매: 전체/리셀/예매, 판매: 전체/리셀 */}
                              <div className="flex items-center gap-2 shrink-0">
                                 {/* 데스크톱 전용: "종류:" 라벨 — Figma: 14px/500/#364153 */}
                                 <span className="hidden lg:inline text-[14px] font-medium text-[#364153] whitespace-nowrap">
                                    종류:
                                 </span>
                                 {/* 드롭다운 — Figma: 119×36, r=8, fill=#fff, stroke=#d0d6db, SPACE_BETWEEN */}
                                 <div ref={typeDropdownRef} className="relative">
                                    <button
                                       type="button"
                                       className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] whitespace-nowrap lg:w-[119px]"
                                       onClick={() => {
                                          setShowTypeDropdown(v => !v);
                                          setShowPeriodDropdown(false);
                                       }}
                                    >
                                       <span className="lg:hidden mr-1">종류: </span>
                                       <span className="lg:flex-1">
                                          {activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType}
                                       </span>
                                       <ChevronDown
                                          size={15}
                                          className={`shrink-0 ml-1 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
                                       />
                                    </button>
                                    {showTypeDropdown && (
                                       <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-[8px] p-1 w-[119px]">
                                          {(activeTab === 'purchase' ? PURCHASE_TYPE_OPTIONS : SALE_TYPE_OPTIONS).map(
                                             opt => {
                                                const isSelected =
                                                   activeTab === 'purchase'
                                                      ? pendingPurchaseType === opt
                                                      : pendingSaleType === opt;
                                                return (
                                                   <button
                                                      key={opt}
                                                      type="button"
                                                      className={`w-full flex items-center justify-between h-8 px-1.5 rounded-[6px] text-[14px] transition-colors ${
                                                         isSelected
                                                            ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                                            : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                                      }`}
                                                      onClick={() => {
                                                         if (activeTab === 'purchase')
                                                            setPendingPurchaseType(opt as PurchaseTypeFilter);
                                                         else setPendingSaleType(opt as SaleTypeFilter);
                                                         setShowTypeDropdown(false);
                                                      }}
                                                   >
                                                      <span>{opt}</span>
                                                      {isSelected && (
                                                         <Check size={13} className="shrink-0 text-[#374553]" />
                                                      )}
                                                   </button>
                                                );
                                             },
                                          )}
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* 조회 버튼 — Figma: 53×33, r=8, stroke=#d0d6db, Settings+조회 텍스트 */}
                              <button
                                 type="button"
                                 onClick={handleApply}
                                 className="flex items-center gap-2 h-[33px] px-[14px] border border-[#d0d6db] rounded-lg bg-transparent text-[14px] font-medium text-[#374553] whitespace-nowrap ml-auto lg:ml-0"
                              >
                                 조회
                              </button>
                           </div>
                        </div>

                        {/* 데스크톱 전용: 검색 에러 */}
                        {searchError && (
                           <p className="hidden lg:block text-caption-1-regular text-destructive pl-1">{searchError}</p>
                        )}
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
