// src/pages/tickets/ui/FilterSidebar.tsx

import { useState } from 'react';
import { MapPin, Search, RotateCcw, SlidersHorizontal, Calendar } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { RangeSlider } from '@/shared/ui/slider';
import { DatePicker } from '@/shared/ui/date-picker';
import { Select } from '@/shared/ui/select';

import { MAX_PRICE, VENUES } from './constants';
import type { FilterState, TabType } from './types';

interface FilterSidebarProps {
   activeTab: TabType;
   onTabChange: (tab: TabType) => void;
   onApply: (filters: FilterState) => void;
}

const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

const venueOptions = VENUES.map(v => ({ value: v, label: v }));

const inputBase =
   'bg-surface border border-border-light rounded-lg px-3 py-2 text-body-2-medium text-muted-foreground outline-none w-full';

export function FilterSidebar({ activeTab, onTabChange, onApply }: FilterSidebarProps) {
   const [showUpcoming, setShowUpcoming] = useState(true);
   const [showSoldOut, setShowSoldOut] = useState(true);
   const [dateTime, setDateTime] = useState('');
   const [minPrice, setMinPrice] = useState(0);
   const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
   const [venue, setVenue] = useState('');
   const [searchQuery, setSearchQuery] = useState('');

   const handleReset = () => {
      setShowUpcoming(true);
      setShowSoldOut(true);
      setDateTime('');
      setMinPrice(0);
      setMaxPrice(MAX_PRICE);
      setVenue('');
      setSearchQuery('');
   };

   const handleApply = () => {
      onApply({ showUpcoming, showSoldOut, dateTime, minPrice, maxPrice, venue, searchQuery });
   };

   return (
      <aside className="bg-background border border-border rounded-[14px] p-6 shrink-0 self-start">
         <div className="flex flex-col gap-6 w-67.5">
            {/* 예매/리셀 선택 */}
            <section className="flex flex-col gap-3">
               <p className="text-body-1-semibold text-foreground">예매/리셀 선택</p>
               <div className="flex gap-2">
                  {(['예매', '리셀'] as TabType[]).map(tab => (
                     <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                           'flex-1 py-1.5 px-4 rounded-lg text-body-2-semibold transition-colors border',
                           activeTab === tab
                              ? 'bg-primary-light border-border-accent text-primary'
                              : 'bg-background border-border text-muted-foreground font-medium',
                        )}
                     >
                        {tab}
                     </button>
                  ))}
               </div>
            </section>

            <hr className="border-border" />

            {/* 보기 옵션 */}
            <section className="flex flex-col gap-2">
               <p className="text-body-2-semibold text-foreground">보기 옵션</p>
               <Checkbox
                  size="md"
                  typography="body3Regular"
                  label="오픈 예정 티켓 보기"
                  checked={showUpcoming}
                  onCheckedChange={v => setShowUpcoming(v === true)}
               />
               <Checkbox
                  size="md"
                  typography="body3Regular"
                  label="매진 티켓 보기"
                  checked={showSoldOut}
                  onCheckedChange={v => setShowSoldOut(v === true)}
               />
            </section>

            {/* 경기 일시 */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-foreground shrink-0" />
                  <p className="text-body-2-semibold text-foreground">경기 일시</p>
               </div>
               <DatePicker
                  value={dateTime}
                  onChange={setDateTime}
                  placeholder="경기 일시 선택"
               />
            </section>

            {/* 가격 설정 */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-foreground shrink-0" />
                  <p className="text-body-2-semibold text-foreground">가격 설정</p>
               </div>
               <div className="flex flex-col gap-1">
                  <RangeSlider
                     min={0}
                     max={MAX_PRICE}
                     step={10_000}
                     minValue={minPrice}
                     maxValue={maxPrice}
                     onChange={(min, max) => {
                        setMinPrice(min);
                        setMaxPrice(max);
                     }}
                  />
                  <div className="flex items-center justify-between text-body-2-regular text-muted-foreground">
                     <span>{formatPrice(minPrice)}</span>
                     <span>~</span>
                     <span>{formatPrice(maxPrice)}</span>
                  </div>
               </div>
            </section>

            {/* 위치(구장) */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-foreground shrink-0" />
                  <p className="text-body-2-semibold text-foreground">위치 (구장)</p>
               </div>
               <Select
                  value={venue}
                  onChange={setVenue}
                  options={venueOptions}
                  placeholder="구장 선택"
               />
            </section>

            {/* 검색어 */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <Search className="size-4 text-foreground shrink-0" />
                  <p className="text-body-2-semibold text-foreground">검색어</p>
               </div>
               <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="팀명, 경기명 검색"
                  className={inputBase}
               />
            </section>

            <hr className="border-border" />

            {/* 버튼 */}
            <div className="flex flex-col gap-2">
               <Button variant="outline" size="sm" onClick={handleReset} className="w-full gap-2">
                  <RotateCcw className="size-4" />
                  초기화
               </Button>
               <Button variant="primary" size="sm" onClick={handleApply} className="w-full">
                  조회하기
               </Button>
            </div>
         </div>
      </aside>
   );
}
