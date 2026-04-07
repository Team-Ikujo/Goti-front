import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HistoryCard, { type PurchaseHistoryItem, type SaleHistoryItem } from './HistoryCard';
import { Button } from '@/shared/ui/button';
import { MypageHistoryFilters } from './MypageHistoryFilters';
import {
   calcPeriodDates,
   ITEMS_PER_PAGE,
   PURCHASE_STATUS_CHIPS,
   SALE_STATUS_CHIPS,
   toISODate,
   toInputDate,
   type HistoryTab,
   type PeriodFilter,
   type PurchaseStatusFilter,
   type PurchaseTypeFilter,
   type SaleStatusFilter,
   type SaleTypeFilter,
} from '../model/historyFilters';

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
      return dates[0] || toInputDate(new Date(2025, 0, 1));
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
   const [appliedSaleType, setAppliedSaleType] = useState<SaleTypeFilter>('리셀');
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
      setAppliedSaleType(pendingSaleType);
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
         <div className="bg-background border border-border rounded-[14px] p-6">
            <p className="text-heading-4-bold text-foreground mb-4">구매 / 판매 내역</p>

            <div className="flex flex-col gap-5">
               <div className="bg-fill-disabled rounded-[14px] p-1 flex">
                  {(['purchase', 'sale'] as const).map((tab) => (
                     <Button
                        key={tab}
                        variant="none"
                        onClick={() => handleTabChange(tab)}
                        className={`flex-1 py-2.5 px-2 text-body-2-medium text-foreground transition-all ${
                           activeTab === tab ? 'bg-white rounded-[10px] shadow-sm' : 'rounded-[14px]'
                        }`}
                     >
                        {tab === 'purchase' ? '구매 내역' : '판매 내역'}
                     </Button>
                  ))}
               </div>

               <MypageHistoryFilters
                  activeTab={activeTab}
                  pendingPeriod={pendingPeriod}
                  pendingStartDate={pendingStartDate}
                  pendingEndDate={pendingEndDate}
                  pendingPurchaseType={pendingPurchaseType}
                  pendingSaleType={pendingSaleType}
                  searchQuery={searchQuery}
                  searchError={searchError}
                  showPeriodDropdown={showPeriodDropdown}
                  showTypeDropdown={showTypeDropdown}
                  periodDropdownRef={periodDropdownRef}
                  typeDropdownRef={typeDropdownRef}
                  mobilePeriodDropdownRef={mobilePeriodDropdownRef}
                  mobileTypeDropdownRef={mobileTypeDropdownRef}
                  onTogglePeriodDropdown={() => {
                     setShowPeriodDropdown((value) => !value);
                     setShowTypeDropdown(false);
                  }}
                  onToggleTypeDropdown={() => {
                     setShowTypeDropdown((value) => !value);
                     setShowPeriodDropdown(false);
                  }}
                  onChangePeriod={handlePeriodChange}
                  onChangeStartDate={setPendingStartDate}
                  onChangeEndDate={setPendingEndDate}
                  onChangePurchaseType={(value) => {
                     setPendingPurchaseType(value);
                     setShowTypeDropdown(false);
                  }}
                  onChangeSaleType={(value) => {
                     setPendingSaleType(value);
                     setShowTypeDropdown(false);
                  }}
                  onChangeSearchQuery={(value) => {
                     setSearchQuery(value);
                     setSearchError('');
                  }}
                  onClearSearchQuery={() => {
                     setSearchQuery('');
                     setSearchError('');
                  }}
                  onApply={handleApply}
                  onOpenMobileSheet={() => setShowFilterSheet(true)}
                  showFilterSheet={showFilterSheet}
                  onCloseMobileSheet={() => setShowFilterSheet(false)}
               />

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
                           className={`shrink-0 px-4 py-2 rounded-full text-body-2-bold transition-all ${
                              isActive ? 'bg-foreground text-white' : 'bg-white border border-border text-disabled-foreground'
                           }`}
                        >
                           {chip}
                        </Button>
                     );
                  })}
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

      </>
   );
}
