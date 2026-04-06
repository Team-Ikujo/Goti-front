import type { RefObject } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { DatePicker } from '@/shared/ui/date-picker';
import {
   PERIOD_OPTIONS,
   PURCHASE_TYPE_OPTIONS,
   SALE_TYPE_OPTIONS,
   type HistoryTab,
   type PeriodFilter,
   type PurchaseTypeFilter,
   type SaleTypeFilter,
} from '../model/historyFilters';

type SharedFilterProps = {
   activeTab: HistoryTab;
   pendingPeriod: PeriodFilter;
   pendingStartDate: string;
   pendingEndDate: string;
   pendingPurchaseType: PurchaseTypeFilter;
   pendingSaleType: SaleTypeFilter;
   showPeriodDropdown: boolean;
   showTypeDropdown: boolean;
   searchQuery: string;
   searchError: string;
   onTogglePeriodDropdown: () => void;
   onToggleTypeDropdown: () => void;
   onPeriodChange: (period: PeriodFilter) => void;
   onPendingStartDateChange: (value: string) => void;
   onPendingEndDateChange: (value: string) => void;
   onPendingPurchaseTypeChange: (value: PurchaseTypeFilter) => void;
   onPendingSaleTypeChange: (value: SaleTypeFilter) => void;
   onSearchQueryChange: (value: string) => void;
   onClearSearch: () => void;
   onApply: () => boolean;
};

type DesktopHistoryFiltersProps = SharedFilterProps & {
   periodDropdownRef: RefObject<HTMLDivElement | null>;
   typeDropdownRef: RefObject<HTMLDivElement | null>;
};

type MobileHistoryFilterSheetProps = SharedFilterProps & {
   open: boolean;
   onClose: () => void;
   mobilePeriodDropdownRef: RefObject<HTMLDivElement | null>;
   mobileTypeDropdownRef: RefObject<HTMLDivElement | null>;
};

function TypeOptions({
   activeTab,
   pendingPurchaseType,
   pendingSaleType,
}: {
   activeTab: HistoryTab;
   pendingPurchaseType: PurchaseTypeFilter;
   pendingSaleType: SaleTypeFilter;
}) {
   return (activeTab === 'purchase' ? PURCHASE_TYPE_OPTIONS : SALE_TYPE_OPTIONS).map(option => {
      const isSelected = activeTab === 'purchase' ? pendingPurchaseType === option : pendingSaleType === option;
      return { option, isSelected };
   });
}

export function DesktopHistoryFilters({
   activeTab,
   pendingPeriod,
   pendingStartDate,
   pendingEndDate,
   pendingPurchaseType,
   pendingSaleType,
   showPeriodDropdown,
   showTypeDropdown,
   searchQuery,
   searchError,
   periodDropdownRef,
   typeDropdownRef,
   onTogglePeriodDropdown,
   onToggleTypeDropdown,
   onPeriodChange,
   onPendingStartDateChange,
   onPendingEndDateChange,
   onPendingPurchaseTypeChange,
   onPendingSaleTypeChange,
   onSearchQueryChange,
   onClearSearch,
   onApply,
}: DesktopHistoryFiltersProps) {
   return (
      <div className="hidden lg:flex flex-col gap-2.5 p-4 bg-white rounded-[14px] border border-[#d0d6db]">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="text-[14px] font-medium text-[#364153] whitespace-nowrap">조회기간:</span>
               <div ref={periodDropdownRef} className="relative shrink-0">
                  <button
                     type="button"
                     className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] whitespace-nowrap w-29.75"
                     onClick={onTogglePeriodDropdown}
                  >
                     <span className="flex-1">{pendingPeriod}</span>
                     <ChevronDown
                        size={15}
                        className={`shrink-0 ml-1 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                     />
                  </button>
                  {showPeriodDropdown && (
                     <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                        {PERIOD_OPTIONS.map(option => (
                           <button
                              key={option}
                              type="button"
                              className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                 pendingPeriod === option
                                    ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                    : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                              }`}
                              onClick={() => onPeriodChange(option)}
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
                        onChange={onPendingStartDateChange}
                        placeholder="시작일"
                        className="w-35"
                        triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                     />
                     <span className="text-[14px] font-medium text-black shrink-0">~</span>
                     <DatePicker
                        value={pendingEndDate}
                        onChange={onPendingEndDateChange}
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
                     onChange={event => onSearchQueryChange(event.target.value)}
                     onKeyDown={event => {
                        if (event.key === 'Enter') {
                           onApply();
                        }
                     }}
                     placeholder="Search"
                     className="flex-1 h-full pl-3 text-[14px] text-[#161d24] placeholder:text-[#646f7c] bg-transparent focus:outline-none"
                  />
                  <div className="flex items-center justify-center shrink-0 w-7 pr-3">
                     {searchQuery ? (
                        <button type="button" onClick={onClearSearch} aria-label="검색어 초기화">
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
                        onClick={onToggleTypeDropdown}
                     >
                        <span className="flex-1">{activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType}</span>
                        <ChevronDown
                           size={15}
                           className={`shrink-0 ml-1 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
                        />
                     </button>
                     {showTypeDropdown && (
                        <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                           {TypeOptions({ activeTab, pendingPurchaseType, pendingSaleType }).map(({ option, isSelected }) => (
                              <button
                                 key={option}
                                 type="button"
                                 className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                    isSelected
                                       ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                       : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                 }`}
                                 onClick={() => {
                                    if (activeTab === 'purchase') {
                                       onPendingPurchaseTypeChange(option as PurchaseTypeFilter);
                                    } else {
                                       onPendingSaleTypeChange(option as SaleTypeFilter);
                                    }
                                 }}
                              >
                                 <span>{option}</span>
                                 {isSelected && <Check size={13} className="shrink-0 text-[#374553]" />}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>
               </div>

               <button
                  type="button"
                  onClick={() => {
                     onApply();
                  }}
                  className="flex items-center gap-2 h-8.25 px-3.5 border border-[#d0d6db] rounded-lg bg-transparent text-[14px] font-medium text-[#374553] whitespace-nowrap"
               >
                  조회
               </button>
            </div>
         </div>

         {searchError && <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>}
      </div>
   );
}

export function MobileHistoryFilterSheet({
   open,
   onClose,
   activeTab,
   pendingPeriod,
   pendingStartDate,
   pendingEndDate,
   pendingPurchaseType,
   pendingSaleType,
   showPeriodDropdown,
   showTypeDropdown,
   searchQuery,
   searchError,
   mobilePeriodDropdownRef,
   mobileTypeDropdownRef,
   onTogglePeriodDropdown,
   onToggleTypeDropdown,
   onPeriodChange,
   onPendingStartDateChange,
   onPendingEndDateChange,
   onPendingPurchaseTypeChange,
   onPendingSaleTypeChange,
   onSearchQueryChange,
   onClearSearch,
   onApply,
}: MobileHistoryFilterSheetProps) {
   if (!open) {
      return null;
   }

   return (
      <>
         <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} aria-hidden="true" />
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
                     <div ref={mobilePeriodDropdownRef} className={`relative ${pendingPeriod === '직접설정' ? 'shrink-0' : 'flex-1'}`}>
                        <button
                           type="button"
                           className="flex items-center justify-between h-9 px-3 border border-[#d0d6db] rounded-lg bg-white text-[14px] font-medium text-[#161d24] w-full"
                           onClick={onTogglePeriodDropdown}
                        >
                           <span className="flex-1">{pendingPeriod}</span>
                           <ChevronDown
                              size={15}
                              className={`shrink-0 ml-1 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
                           />
                        </button>
                        {showPeriodDropdown && (
                           <div className="absolute top-[calc(100%+4px)] left-0 z-60 bg-white border border-[#d0d6db] rounded-lg p-1 w-29.75">
                              {PERIOD_OPTIONS.map(option => (
                                 <button
                                    key={option}
                                    type="button"
                                    className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                       pendingPeriod === option
                                          ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                          : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                    }`}
                                    onClick={() => onPeriodChange(option)}
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
                              onChange={onPendingStartDateChange}
                              placeholder="시작일"
                              className="flex-1"
                              triggerClassName="border-[#d0d6db] bg-transparent text-[14px] font-medium text-[#161d24]"
                           />
                           <span className="text-[14px] font-medium text-black shrink-0">~</span>
                           <DatePicker
                              value={pendingEndDate}
                              onChange={onPendingEndDateChange}
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
                        onClick={onToggleTypeDropdown}
                     >
                        <span className="flex-1">{activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType}</span>
                        <ChevronDown
                           size={15}
                           className={`shrink-0 ml-1 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
                        />
                     </button>
                     {showTypeDropdown && (
                        <div className="absolute top-[calc(100%+4px)] left-0 z-[60] bg-white border border-[#d0d6db] rounded-lg p-1 w-full">
                           {TypeOptions({ activeTab, pendingPurchaseType, pendingSaleType }).map(({ option, isSelected }) => (
                              <button
                                 key={option}
                                 type="button"
                                 className={`w-full flex items-center justify-between h-8 px-1.5 rounded-md text-[14px] transition-colors ${
                                    isSelected
                                       ? 'bg-[#f7f8f9] text-[#374553] font-medium'
                                       : 'text-[#646f7c] font-normal hover:bg-[#f7f8f9]'
                                 }`}
                                 onClick={() => {
                                    if (activeTab === 'purchase') {
                                       onPendingPurchaseTypeChange(option as PurchaseTypeFilter);
                                    } else {
                                       onPendingSaleTypeChange(option as SaleTypeFilter);
                                    }
                                 }}
                              >
                                 <span>{option}</span>
                                 {isSelected && <Check size={13} className="shrink-0 text-[#374553]" />}
                              </button>
                           ))}
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
                        onChange={event => onSearchQueryChange(event.target.value)}
                        onKeyDown={event => {
                           if (event.key === 'Enter') {
                              const ok = onApply();
                              if (ok) {
                                 onClose();
                              }
                           }
                        }}
                        placeholder="Search"
                        className="flex-1 h-full pl-3 text-[14px] text-foreground placeholder:text-[#646f7c] bg-transparent focus:outline-none"
                     />
                     <div className="flex items-center justify-center shrink-0 w-7 pr-3">
                        {searchQuery ? (
                           <button type="button" onClick={onClearSearch} aria-label="검색어 초기화">
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
                     const ok = onApply();
                     if (ok) {
                        onClose();
                     }
                  }}
                  className="flex items-center justify-center w-full h-8.25 border border-[#d0d6db] rounded-lg bg-transparent text-[14px] font-medium text-[#374553]"
               >
                  조회
               </button>
            </div>
         </div>
      </>
   );
}

export function HistoryPagination({
   totalPages,
   currentPage,
   onChange,
}: {
   totalPages: number;
   currentPage: number;
   onChange: (page: number) => void;
}) {
   if (totalPages <= 1) {
      return null;
   }

   return (
      <div className="flex items-center justify-center gap-1">
         <Button
            variant="none"
            onClick={() => onChange(Math.max(1, currentPage - 1))}
            className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
         >
            <ChevronLeft size={16} />
         </Button>
         {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
            <Button
               key={page}
               variant="none"
               onClick={() => onChange(page)}
               className={`size-6 p-0 flex items-center justify-center text-body-2-regular rounded-xs transition-all ${
                  currentPage === page
                     ? 'bg-primary text-white'
                     : 'border border-border text-muted-foreground hover:bg-[#f1f2f4]'
               }`}
            >
               {page}
            </Button>
         ))}
         <Button
            variant="none"
            onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
            className="size-6 p-0 flex items-center justify-center border border-border rounded-xs text-muted-foreground hover:bg-[#f1f2f4] transition-colors [&_svg]:size-4"
         >
            <ChevronRight size={16} />
         </Button>
      </div>
   );
}
