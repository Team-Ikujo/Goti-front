import type { RefObject } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { DatePicker } from '@/shared/ui/date-picker';
import type {
   HistoryTab,
   PeriodFilter,
   PurchaseTypeFilter,
   SaleTypeFilter,
} from '../model/historyFilters';
import {
   PERIOD_OPTIONS,
   PURCHASE_TYPE_OPTIONS,
   SALE_TYPE_OPTIONS,
} from '../model/historyFilters';

interface MypageHistoryFiltersProps {
   activeTab: HistoryTab;
   pendingPeriod: PeriodFilter;
   pendingStartDate: string;
   pendingEndDate: string;
   pendingPurchaseType: PurchaseTypeFilter;
   pendingSaleType: SaleTypeFilter;
   searchQuery: string;
   searchError: string;
   showPeriodDropdown: boolean;
   showTypeDropdown: boolean;
   periodDropdownRef: RefObject<HTMLDivElement | null>;
   typeDropdownRef: RefObject<HTMLDivElement | null>;
   mobilePeriodDropdownRef: RefObject<HTMLDivElement | null>;
   mobileTypeDropdownRef: RefObject<HTMLDivElement | null>;
   onTogglePeriodDropdown: () => void;
   onToggleTypeDropdown: () => void;
   onChangePeriod: (period: PeriodFilter) => void;
   onChangeStartDate: (value: string) => void;
   onChangeEndDate: (value: string) => void;
   onChangePurchaseType: (value: PurchaseTypeFilter) => void;
   onChangeSaleType: (value: SaleTypeFilter) => void;
   onChangeSearchQuery: (value: string) => void;
   onClearSearchQuery: () => void;
   onApply: () => boolean;
   onOpenMobileSheet: () => void;
   showFilterSheet: boolean;
   onCloseMobileSheet: () => void;
}

export function MypageHistoryFilters({
   activeTab,
   pendingPeriod,
   pendingStartDate,
   pendingEndDate,
   pendingPurchaseType,
   pendingSaleType,
   searchQuery,
   searchError,
   showPeriodDropdown,
   showTypeDropdown,
   periodDropdownRef,
   typeDropdownRef,
   mobilePeriodDropdownRef,
   mobileTypeDropdownRef,
   onTogglePeriodDropdown,
   onToggleTypeDropdown,
   onChangePeriod,
   onChangeStartDate,
   onChangeEndDate,
   onChangePurchaseType,
   onChangeSaleType,
   onChangeSearchQuery,
   onClearSearchQuery,
   onApply,
   onOpenMobileSheet,
   showFilterSheet,
   onCloseMobileSheet,
}: MypageHistoryFiltersProps) {
   const typeOptions = activeTab === 'purchase' ? PURCHASE_TYPE_OPTIONS : SALE_TYPE_OPTIONS;
   const selectedType = activeTab === 'purchase' ? pendingPurchaseType : pendingSaleType;

   const renderSearchInput = (closeOnEnter = false) => (
      <div className="flex items-center w-full h-9 border border-border rounded-[20px] bg-white overflow-hidden">
         <input
            type="text"
            value={searchQuery}
            onChange={(event) => onChangeSearchQuery(event.target.value)}
            onKeyDown={(event) => {
               if (event.key === 'Enter') {
                  const isApplied = onApply();
                  if (closeOnEnter && isApplied) onCloseMobileSheet();
               }
            }}
            placeholder="Search"
            className="flex-1 h-full pl-3 text-body-2-regular text-foreground placeholder:text-(--text-tertiary) bg-transparent focus:outline-none"
         />
         <div className="flex items-center justify-center shrink-0 w-7 pr-3">
            {searchQuery ? (
               <button type="button" onClick={onClearSearchQuery} aria-label="검색어 초기화">
                  <X size={11} className="text-muted-foreground" />
               </button>
            ) : (
               <Search size={16} className="text-foreground" />
            )}
         </div>
      </div>
   );

   const renderPeriodDropdown = (ref: RefObject<HTMLDivElement | null>, fullWidth = false) => (
      <div ref={ref} className={`relative ${fullWidth ? 'w-full' : pendingPeriod === '직접설정' ? 'shrink-0' : 'flex-1'}`}>
         <button
            type="button"
            className={`flex h-9 items-center justify-between border border-border rounded-lg bg-white px-3 text-body-2-medium text-foreground ${fullWidth ? 'w-full' : 'w-29.75'}`}
            onClick={onTogglePeriodDropdown}
         >
            <span className="flex-1">{pendingPeriod}</span>
            <ChevronDown
               size={15}
               className={`ml-1 shrink-0 transition-transform ${showPeriodDropdown ? 'rotate-180' : ''}`}
            />
         </button>
         {showPeriodDropdown && (
            <div className={`absolute left-0 top-[calc(100%+4px)] z-20 bg-white border border-border rounded-lg p-1 ${fullWidth ? 'w-full z-[60]' : 'w-29.75'}`}>
               {PERIOD_OPTIONS.map((option) => (
                  <button
                     key={option}
                     type="button"
                     className={`w-full flex h-8 items-center justify-between rounded-md px-1.5 text-body-2-regular transition-colors ${
                        pendingPeriod === option
                           ? 'bg-surface text-muted-foreground font-medium'
                           : 'text-(--text-tertiary) font-normal hover:bg-surface'
                     }`}
                     onClick={() => onChangePeriod(option)}
                  >
                     <span>{option}</span>
                     {pendingPeriod === option && <Check size={13} className="shrink-0 text-muted-foreground" />}
                  </button>
               ))}
            </div>
         )}
      </div>
   );

   const renderTypeDropdown = (ref: RefObject<HTMLDivElement | null>, fullWidth = false) => (
      <div ref={ref} className="relative">
         <button
            type="button"
            className={`flex h-9 items-center justify-between border border-border rounded-lg bg-white px-3 text-body-2-medium text-foreground ${fullWidth ? 'w-full' : 'w-29.75 whitespace-nowrap'}`}
            onClick={onToggleTypeDropdown}
         >
            <span className="flex-1">{selectedType}</span>
            <ChevronDown
               size={15}
               className={`ml-1 shrink-0 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`}
            />
         </button>
         {showTypeDropdown && (
            <div className={`absolute left-0 top-[calc(100%+4px)] z-20 bg-white border border-border rounded-lg p-1 ${fullWidth ? 'w-full z-[60]' : 'w-29.75'}`}>
               {typeOptions.map((option) => {
                  const isSelected = selectedType === option;

                  return (
                     <button
                        key={option}
                        type="button"
                        className={`w-full flex h-8 items-center justify-between rounded-md px-1.5 text-body-2-regular transition-colors ${
                           isSelected
                              ? 'bg-surface text-muted-foreground font-medium'
                              : 'text-(--text-tertiary) font-normal hover:bg-surface'
                        }`}
                        onClick={() => {
                           if (activeTab === 'purchase') onChangePurchaseType(option as PurchaseTypeFilter);
                           else onChangeSaleType(option as SaleTypeFilter);
                        }}
                     >
                        <span>{option}</span>
                        {isSelected && <Check size={13} className="shrink-0 text-muted-foreground" />}
                     </button>
                  );
               })}
            </div>
         )}
      </div>
   );

   return (
      <>
         <button
            type="button"
            onClick={onOpenMobileSheet}
            className="flex lg:hidden items-center gap-2 w-full h-8.25 px-3.5 border border-border rounded-lg bg-white text-body-2-medium text-muted-foreground justify-center"
         >
            <img src="/Icon/Line/Filter.svg" alt="" className="size-4 shrink-0" />
            필터
         </button>

         <div className="hidden lg:flex flex-col gap-2.5 p-4 bg-white rounded-[14px] border border-border">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <span className="text-body-2-medium text-muted-foreground whitespace-nowrap">조회기간:</span>
                  {renderPeriodDropdown(periodDropdownRef)}
                  {pendingPeriod === '직접설정' && (
                     <div className="flex items-center gap-2 shrink-0">
                        <DatePicker
                           value={pendingStartDate}
                           onChange={onChangeStartDate}
                           placeholder="시작일"
                           className="w-35"
                           triggerClassName="border-border bg-transparent text-body-2-medium text-foreground"
                        />
                        <span className="text-body-2-medium text-black shrink-0">~</span>
                        <DatePicker
                           value={pendingEndDate}
                           onChange={onChangeEndDate}
                           placeholder="종료일"
                           className="w-35"
                           triggerClassName="border-border bg-transparent text-body-2-medium text-foreground"
                        />
                     </div>
                  )}
               </div>

               <div className="flex items-center gap-5">
                  <div className="flex items-center w-57.5 h-9">{renderSearchInput()}</div>

                  <div className="flex items-center gap-2 shrink-0">
                     <span className="text-body-2-medium text-muted-foreground whitespace-nowrap">종류:</span>
                     {renderTypeDropdown(typeDropdownRef)}
                  </div>

                  <button
                     type="button"
                     onClick={onApply}
                     className="flex items-center gap-2 h-8.25 px-3.5 border border-border rounded-lg bg-transparent text-body-2-medium text-muted-foreground whitespace-nowrap"
                  >
                     조회
                  </button>
               </div>
            </div>

            {searchError && <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>}
         </div>

         {showFilterSheet && (
            <>
               <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onCloseMobileSheet} aria-hidden="true" />
               <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-[20px] lg:hidden">
                  <div className="flex justify-center pt-[10px] pb-[6px]">
                     <div className="w-9 h-1 bg-border rounded-full" />
                  </div>

                  <div className="flex items-center px-5 py-4">
                     <h2 className="text-heading-3-bold text-foreground">구매/판매 내역</h2>
                  </div>

                  <div className="px-5 pt-5 pb-5 flex flex-col gap-4">
                     <div className="flex flex-col gap-2">
                        <span className="text-body-2-medium text-muted-foreground">조회기간:</span>
                        <div className="flex items-center gap-2">
                           {renderPeriodDropdown(mobilePeriodDropdownRef, true)}
                           {pendingPeriod === '직접설정' && (
                              <div className="flex flex-1 items-center gap-1.5">
                                 <DatePicker
                                    value={pendingStartDate}
                                    onChange={onChangeStartDate}
                                    placeholder="시작일"
                                    className="flex-1"
                                    triggerClassName="border-border bg-transparent text-body-2-medium text-foreground"
                                 />
                                 <span className="text-body-2-medium text-black shrink-0">~</span>
                                 <DatePicker
                                    value={pendingEndDate}
                                    onChange={onChangeEndDate}
                                    placeholder="종료일"
                                    className="flex-1"
                                    triggerClassName="border-border bg-transparent text-body-2-medium text-foreground"
                                 />
                              </div>
                           )}
                        </div>
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="text-body-2-medium text-muted-foreground">종류:</span>
                        {renderTypeDropdown(mobileTypeDropdownRef, true)}
                     </div>

                     <div className="flex flex-col gap-2">
                        <span className="text-body-2-medium text-muted-foreground">검색어:</span>
                        {renderSearchInput(true)}
                        {searchError && <p className="text-caption-1-regular text-destructive pl-1">{searchError}</p>}
                     </div>
                  </div>

                  <div className="px-5 pb-5">
                     <button
                        type="button"
                        onClick={() => {
                           const isApplied = onApply();
                           if (isApplied) onCloseMobileSheet();
                        }}
                        className="flex items-center justify-center w-full h-8.25 border border-border rounded-lg bg-transparent text-body-2-medium text-muted-foreground"
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
