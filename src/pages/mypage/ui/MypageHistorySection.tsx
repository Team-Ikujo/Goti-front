import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import HistoryCard, { type PurchaseHistoryItem, type SaleHistoryItem } from './HistoryCard';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';

type HistoryTab = 'purchase' | 'sale';
type PurchaseStatusFilter = '전체' | '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
type SaleStatusFilter = '전체' | '판매 중' | '정산 대기' | '판매 완료' | '취소 대기' | '취소 완료';
type PeriodFilter = '전체 내역' | '1개월' | '3개월' | '6개월' | '직접설정';
type PurchaseTypeFilter = '전체 내역' | '리셀' | '예매';
type SaleTypeFilter = '리셀';

const PURCHASE_STATUS_CHIPS: PurchaseStatusFilter[] = [
   '전체',
   '예매 완료',
   '취소/환불',
   '입금 대기',
   '부분 처리',
   '관람 완료',
];
const SALE_STATUS_CHIPS: SaleStatusFilter[] = ['전체', '판매 중', '판매 완료', '정산 대기', '취소 대기', '취소 완료'];
const PERIOD_OPTIONS: PeriodFilter[] = ['전체 내역', '1개월', '3개월', '6개월', '직접설정'];
const PURCHASE_TYPE_OPTIONS: PurchaseTypeFilter[] = ['전체 내역', '리셀', '예매'];
const SALE_TYPE_OPTIONS: SaleTypeFilter[] = ['리셀'];
const ITEMS_PER_PAGE = 5;

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

interface MypageHistorySectionProps {
   purchaseItems: PurchaseHistoryItem[];
   saleItems: SaleHistoryItem[];
   initialActiveTab: HistoryTab;
   mockTicketInfoError?: boolean;
}

export function MypageHistorySection({
   purchaseItems,
   saleItems,
   initialActiveTab,
   mockTicketInfoError = false,
}: MypageHistorySectionProps) {
   const dataMinDate = useMemo(() => {
      const dates = [...purchaseItems, ...saleItems].map((item) => toISODate(item.orderDate)).sort();
      return dates[0] || toInput(new Date(2025, 0, 1));
   }, [purchaseItems, saleItems]);

   const [activeTab, setActiveTab] = useState<HistoryTab>(initialActiveTab);
   const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatusFilter>('전체');
   const [saleStatus, setSaleStatus] = useState<SaleStatusFilter>('전체');
   const [pendingPeriod, setPendingPeriod] = useState<PeriodFilter>('전체 내역');
   const [pendingStartDate, setPendingStartDate] = useState(() => calcPeriodDates('전체 내역', dataMinDate).start);
   const [pendingEndDate, setPendingEndDate] = useState(() => calcPeriodDates('전체 내역', dataMinDate).end);
   const [pendingPurchaseType, setPendingPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');
   const [pendingSaleType, setPendingSaleType] = useState<SaleTypeFilter>('리셀');
   const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
   const [showTypeDropdown, setShowTypeDropdown] = useState(false);
   const [showFilterSheet, setShowFilterSheet] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
   const [searchError, setSearchError] = useState('');
   const [appliedStartDate, setAppliedStartDate] = useState('');
   const [appliedEndDate, setAppliedEndDate] = useState('');
   const [appliedPurchaseType, setAppliedPurchaseType] = useState<PurchaseTypeFilter>('전체 내역');
   const [currentPage, setCurrentPage] = useState(1);
   const periodDropdownRef = useRef<HTMLDivElement>(null);
   const typeDropdownRef = useRef<HTMLDivElement>(null);
   const mobilePeriodDropdownRef = useRef<HTMLDivElement>(null);
   const mobileTypeDropdownRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
         const target = e.target as Node;
         const inPeriod =
            periodDropdownRef.current?.contains(target) || mobilePeriodDropdownRef.current?.contains(target);
         const inType = typeDropdownRef.current?.contains(target) || mobileTypeDropdownRef.current?.contains(target);
         if (!inPeriod) setShowPeriodDropdown(false);
         if (!inType) setShowTypeDropdown(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);

   const handlePeriodChange = (period: PeriodFilter) => {
      setPendingPeriod(period);
      setShowPeriodDropdown(false);
      if (period !== '직접설정') {
         const { start, end } = calcPeriodDates(period, dataMinDate);
         setPendingStartDate(start);
         setPendingEndDate(end);
      }
   };

   const handleApply = (): boolean => {
      const trimmed = searchQuery.trim();
      if (searchQuery.length > 0 && trimmed.length === 0) {
         setSearchError('공백만으로는 검색할 수 없습니다.');
         return false;
      }
      if (trimmed.length > 0 && trimmed.length < 2) {
         setSearchError('2글자 이상 입력해주세요.');
         return false;
      }
      setSearchError('');
      setAppliedStartDate(pendingStartDate);
      setAppliedEndDate(pendingEndDate);
      setAppliedPurchaseType(pendingPurchaseType);
      setAppliedSearchQuery(trimmed);
      setCurrentPage(1);
      return true;
   };

   const handleTabChange = (tab: HistoryTab) => {
      setActiveTab(tab);
      setPurchaseStatus('전체');
      setSaleStatus('전체');
      setPendingPeriod('전체 내역');
      setPendingStartDate(calcPeriodDates('전체 내역', dataMinDate).start);
      setPendingEndDate(calcPeriodDates('전체 내역', dataMinDate).end);
      setPendingPurchaseType('전체 내역');
      setAppliedStartDate('');
      setAppliedEndDate('');
      setAppliedPurchaseType('전체 내역');
      setCurrentPage(1);
   };

   const matchesDate = (orderDate: string) => {
      const date = toISODate(orderDate);
      if (appliedStartDate && date < appliedStartDate) return false;
      if (appliedEndDate && date > appliedEndDate) return false;
      return true;
   };

   const filteredPurchaseItems = useMemo(
      () =>
         purchaseItems.filter((item) => {
            if (purchaseStatus !== '전체' && item.paymentStatus !== purchaseStatus) return false;
            if (appliedPurchaseType !== '전체 내역') {
               const target = appliedPurchaseType === '예매' ? '티켓' : '리셀';
               if (item.type !== target) return false;
            }
            if (appliedSearchQuery) {
               const query = appliedSearchQuery.toLowerCase();
               const matches =
                  item.game.teams.toLowerCase().includes(query) ||
                  item.orderId.toLowerCase().includes(query) ||
                  item.game.venue.toLowerCase().includes(query);
               if (!matches) return false;
            }
            return matchesDate(item.orderDate);
         }),
      [purchaseItems, purchaseStatus, appliedPurchaseType, appliedStartDate, appliedEndDate, appliedSearchQuery],
   );

   const filteredSaleItems = useMemo(
      () =>
         saleItems.filter((item) => {
            if (saleStatus !== '전체' && item.saleStatus !== saleStatus) return false;
            if (item.type !== '리셀') return false;
            if (appliedSearchQuery) {
               const query = appliedSearchQuery.toLowerCase();
               const matches =
                  item.game.teams.toLowerCase().includes(query) ||
                  item.orderId.toLowerCase().includes(query) ||
                  item.game.venue.toLowerCase().includes(query);
               if (!matches) return false;
            }
            return matchesDate(item.orderDate);
         }),
      [saleItems, saleStatus, appliedStartDate, appliedEndDate, appliedSearchQuery],
   );

   const items = activeTab === 'purchase' ? filteredPurchaseItems : filteredSaleItems;
   const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
   const safePage = Math.min(currentPage, totalPages);
   const pageItems = items.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

   return (
      <>
         <div className="bg-background border border-[rgba(0,0,0,0.1)] rounded-[14px] p-6">
            <p className="text-heading-4-bold text-foreground mb-4">구매 / 판매 내역</p>

            <div className="flex flex-col gap-5">
               <div className="bg-[#e9ebee] rounded-[14px] p-1 flex">
                  {(['purchase', 'sale'] as const).map((tab) => (
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

               <button
                  type="button"
                  onClick={() => setShowFilterSheet(true)}
                  className="flex lg:hidden items-center gap-2 w-full h-8.25 px-3.5 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#374553] justify-center"
               >
                  <img src="/Icon/Line/Filter.svg" alt="" className="size-4 shrink-0" />
                  필터
               </button>

               <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                  {(activeTab === 'purchase'
                     ? PURCHASE_STATUS_CHIPS
                     : (SALE_STATUS_CHIPS as (PurchaseStatusFilter | SaleStatusFilter)[])
                  ).map((chip) => {
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
                              isActive ? 'bg-[#161d24] text-white' : 'bg-white border border-[#e9ebee] text-[#acb4bb]'
                           }`}
                        >
                           {chip}
                        </Button>
                     );
                  })}
               </div>

               <div className="hidden lg:flex flex-col gap-2.5 p-4 bg-white rounded-[14px] border border-[#d0d6db]">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-[#364153] whitespace-nowrap">조회기간:</span>
                        <div ref={periodDropdownRef} className="relative shrink-0">
                           <button
                              type="button"
                              className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] whitespace-nowrap w-29.75"
                              onClick={() => {
                                 setShowPeriodDropdown((value) => !value);
                                 setShowTypeDropdown(false);
                              }}
                           >
                              <span className="flex-1">{pendingPeriod}</span>
                              <ChevronDown
                                 size={15}
                                 className={`shrink-0 ml-1 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                              />
                           </button>
                           {showPeriodDropdown && (
                              <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                                 {PERIOD_OPTIONS.map((option) => (
                                    <button
                                       key={option}
                                       type="button"
                                       className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                          pendingPeriod === option
                                             ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                             : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                       }`}
                                       onClick={() => handlePeriodChange(option)}
                                    >
                                       <span>{option}</span>
                                       {pendingPeriod === option && <Check size={13} className="shrink-0 text-[#374553]" />}
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {pendingPeriod === '직접설정' && (
                           <div className="flex items-center gap-2 shrink-0">
                              <DatePicker
                                 value={pendingStartDate}
                                 onChange={setPendingStartDate}
                                 placeholder="시작일"
                                 className="w-35"
                                 triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                              />
                              <span className="text-[14px] font-medium text-black shrink-0">~</span>
                              <DatePicker
                                 value={pendingEndDate}
                                 onChange={setPendingEndDate}
                                 placeholder="종료일"
                                 className="w-35"
                                 triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                              />
                           </div>
                        )}
                     </div>

                     <div className="flex items-center gap-5">
                        <div className="flex items-center w-57.5 h-9 border border-[#e5e5e5] rounded-[20px] bg-white overflow-hidden">
                           <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                 setSearchQuery(e.target.value);
                                 setSearchError('');
                              }}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleApply();
                              }}
                              placeholder="Search"
                              className="flex-1 h-full pl-3 text-[14px] text-[#161d24] placeholder:text-[#646f7c] bg-transparent focus:outline-none"
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

                        <div className="flex items-center gap-2 shrink-0">
                           <span className="text-[14px] font-medium text-[#364153] whitespace-nowrap">종류:</span>
                           <div ref={typeDropdownRef} className="relative">
                              <button
                                 type="button"
                                 className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] whitespace-nowrap w-29.75"
                                 onClick={() => {
                                    setShowTypeDropdown((value) => !value);
                                    setShowPeriodDropdown(false);
                                 }}
                              >
                                 <span className="flex-1">
                                    {activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType}
                                 </span>
                                 <ChevronDown
                                    size={15}
                                    className={`shrink-0 ml-1 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
                                 />
                              </button>
                              {showTypeDropdown && (
                                 <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                                    {(activeTab === 'purchase' ? PURCHASE_TYPE_OPTIONS : SALE_TYPE_OPTIONS).map((option) => {
                                       const isSelected =
                                          activeTab === 'purchase'
                                             ? pendingPurchaseType === option
                                             : pendingSaleType === option;

                                       return (
                                          <button
                                             key={option}
                                             type="button"
                                             className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                                isSelected
                                                   ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                                   : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                             }`}
                                             onClick={() => {
                                                if (activeTab === 'purchase') setPendingPurchaseType(option as PurchaseTypeFilter);
                                                else setPendingSaleType(option as SaleTypeFilter);
                                                setShowTypeDropdown(false);
                                             }}
                                          >
                                             <span>{option}</span>
                                             {isSelected && <Check size={13} className="shrink-0 text-[#374553]" />}
                                          </button>
                                       );
                                    })}
                                 </div>
                              )}
                           </div>
                        </div>

                        <button
                           type="button"
                           onClick={handleApply}
                           className="flex items-center gap-2 h-8.25 px-3.5 border border-[#d0d6db] rounded-lg bg-transparent text-[14px] font-medium text-[#374553] whitespace-nowrap"
                        >
                           조회
                        </button>
                     </div>
                  </div>

                  {searchError && <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>}
               </div>

               <div className="flex flex-col gap-5">
                  {pageItems.length > 0 ? (
                     activeTab === 'purchase' ? (
                        (pageItems as PurchaseHistoryItem[]).map((item) => (
                           <HistoryCard key={item.id} mode="purchase" item={item} mockTicketInfoError={mockTicketInfoError} />
                        ))
                     ) : (
                        (pageItems as SaleHistoryItem[]).map((item) => <HistoryCard key={item.id} mode="sale" item={item} />)
                     )
                  ) : (
                     <p className="text-center text-(--text-tertiary) text-body-2-regular h-full">
                        조건에 맞는 {activeTab === 'purchase' ? '구매' : '판매'} 내역이 없습니다.
                     </p>
                  )}
               </div>

               {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1">
                     <Button
                        variant="none"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
                     >
                        <ChevronLeft size={16} />
                     </Button>
                     {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
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
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
                     >
                        <ChevronRight size={16} />
                     </Button>
                  </div>
               )}
            </div>
         </div>

         {showFilterSheet && (
            <>
               <div
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                  onClick={() => setShowFilterSheet(false)}
                  aria-hidden="true"
               />
               <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[20px] lg:hidden">
                  <div className="flex justify-center pt-[10px] pb-[6px]">
                     <div className="w-9 h-1 bg-[#d0d6db] rounded-full" />
                  </div>

                  <div className="flex items-center px-5 py-4">
                     <h2 className="text-[20px] font-bold text-[#161d24]">구매/판매 내역</h2>
                  </div>

                  <div className="px-5 pt-5 pb-5 flex flex-col gap-4">
                     <div className="flex flex-col gap-2">
                        <span className="text-[14px] font-medium text-[#364153]">조회기간:</span>
                        <div className="flex items-center gap-2">
                           <div
                              ref={mobilePeriodDropdownRef}
                              className={`relative ${pendingPeriod === '직접설정' ? 'shrink-0' : 'flex-1'}`}
                           >
                              <button
                                 type="button"
                                 className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] w-full"
                                 onClick={() => {
                                    setShowPeriodDropdown((value) => !value);
                                    setShowTypeDropdown(false);
                                 }}
                              >
                                 <span className="flex-1">{pendingPeriod}</span>
                                 <ChevronDown
                                    size={15}
                                    className={`shrink-0 ml-1 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                                 />
                              </button>
                              {showPeriodDropdown && (
                                 <div className="absolute top-[calc(100%+4px)] left-0 z-60 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                                    {PERIOD_OPTIONS.map((option) => (
                                       <button
                                          key={option}
                                          type="button"
                                          className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                             pendingPeriod === option
                                                ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                                : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                          }`}
                                          onClick={() => handlePeriodChange(option)}
                                       >
                                          <span>{option}</span>
                                          {pendingPeriod === option && <Check size={13} className="shrink-0 text-[#374553]" />}
                                       </button>
                                    ))}
                                 </div>
                              )}
                           </div>
                           {pendingPeriod === '직접설정' && (
                              <div className="flex flex-1 items-center gap-1.5">
                                 <DatePicker
                                    value={pendingStartDate}
                                    onChange={setPendingStartDate}
                                    placeholder="시작일"
                                    className="flex-1"
                                    triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                                 />
                                 <span className="text-[14px] font-medium text-black shrink-0">~</span>
                                 <DatePicker
                                    value={pendingEndDate}
                                    onChange={setPendingEndDate}
                                    placeholder="종료일"
                                    className="flex-1"
                                    triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                                 />
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="text-[14px] font-medium text-[#364153]">종류:</span>
                        <div ref={mobileTypeDropdownRef} className="relative">
                           <button
                              type="button"
                              className="flex items-center justify-between w-full h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24]"
                              onClick={() => {
                                 setShowTypeDropdown((value) => !value);
                                 setShowPeriodDropdown(false);
                              }}
                           >
                              <span className="flex-1">{activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType}</span>
                              <ChevronDown
                                 size={15}
                                 className={`shrink-0 ml-1 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
                              />
                           </button>
                           {showTypeDropdown && (
                              <div className="absolute top-[calc(100%+4px)] left-0 z-[60] bg-white border border-[#d0d6db] rounded-lg p-1 w-full">
                                 {(activeTab === 'purchase' ? PURCHASE_TYPE_OPTIONS : SALE_TYPE_OPTIONS).map((option) => {
                                    const isSelected =
                                       activeTab === 'purchase' ? pendingPurchaseType === option : pendingSaleType === option;
                                    return (
                                       <button
                                          key={option}
                                          type="button"
                                          className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                             isSelected
                                                ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                                : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                          }`}
                                          onClick={() => {
                                             if (activeTab === 'purchase') setPendingPurchaseType(option as PurchaseTypeFilter);
                                             else setPendingSaleType(option as SaleTypeFilter);
                                             setShowTypeDropdown(false);
                                          }}
                                       >
                                          <span>{option}</span>
                                          {isSelected && <Check size={13} className="shrink-0 text-[#374553]" />}
                                       </button>
                                    );
                                 })}
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="text-[14px] font-medium text-[#364153]">검색어:</span>
                        <div className="flex items-center w-full h-9 border border-[#e5e5e5] rounded-[20px] bg-white overflow-hidden">
                           <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => {
                                 setSearchQuery(e.target.value);
                                 setSearchError('');
                              }}
                              onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                    const ok = handleApply();
                                    if (ok) setShowFilterSheet(false);
                                 }
                              }}
                              placeholder="Search"
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
                        {searchError && <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>}
                     </div>
                  </div>

                  <div className="px-5 pb-5">
                     <button
                        type="button"
                        onClick={() => {
                           const ok = handleApply();
                           if (ok) setShowFilterSheet(false);
                        }}
                        className="flex items-center justify-center w-full h-8.25 border border-[#d0d6db] rounded-lg bg-transparent text-[14px] font-medium text-[#374553]"
                     >
                        조회
                     </button>
                  </div>
               </div>
            </>
         )}
      </>
   );
}
