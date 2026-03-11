// src/pages/tickets/ui/FilterSidebar.tsx

import { useState, useEffect } from 'react';
import { MapPin, Search, Calendar, Eye, Banknote, RotateCcw } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { RangeSlider } from '@/shared/ui/slider';
import { DatePicker } from '@/shared/ui/date-picker';
import { Select } from '@/shared/ui/select';

import { TabToggle } from './TabToggle';

import { MAX_PRICE, VENUES } from './constants';
import type { FilterState, TabType } from './types';

interface FilterSidebarProps {
   /** 마지막으로 적용된 탭 (초기값 및 초기화 기준) */
   activeTab: TabType;
   onApply: (filters: FilterState) => void;
   className?: string;
   /** 바텀시트 모드: 내부 너비 full + 버튼 우측 정렬 */
   sheetMode?: boolean;
}

const formatPrice = (price: number) => price.toLocaleString('ko-KR') + '원';

const venueOptions = VENUES.map(v => ({ value: v, label: v }));

const inputBase =
   'bg-surface border border-border-light rounded-lg px-3 py-2 text-body-2-medium text-neutral-600 outline-none w-full';

export function FilterSidebar({ activeTab, onApply, className, sheetMode = false }: FilterSidebarProps) {
   // 로컬 탭 상태 — 조회하기 클릭 시에만 부모에 전파
   const [localTab, setLocalTab] = useState<TabType>(activeTab);

   // 외부에서 탭이 변경되면 (모바일 탭 클릭 등) 로컬 탭도 sync
   useEffect(() => {
      setLocalTab(activeTab);
   }, [activeTab]);
   const [showUpcoming, setShowUpcoming] = useState(false);
   const [showSoldOut, setShowSoldOut] = useState(false);
   const [dateTime, setDateTime] = useState('');
   const [minPrice, setMinPrice] = useState(0);
   const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
   const [venue, setVenue] = useState('');
   const [searchQuery, setSearchQuery] = useState('');

   const handleReset = () => {
      setLocalTab(activeTab); // 마지막 적용 탭으로 복원
      setShowUpcoming(false);
      setShowSoldOut(false);
      setDateTime('');
      setMinPrice(0);
      setMaxPrice(MAX_PRICE);
      setVenue('');
      setSearchQuery('');
   };

   const handleApply = () => {
      onApply({ tab: localTab, showUpcoming, showSoldOut, dateTime, minPrice, maxPrice, venue, searchQuery });
   };

   return (
      <aside className={cn('bg-background border border-border rounded-[14px] p-6 shrink-0 self-start', className)}>
         <div className={cn('flex flex-col gap-6', sheetMode ? 'w-full' : 'w-67.5')}>
            {/* 예매/리셀 선택 토글 */}
            <section className="flex flex-col gap-3">
               <p className="text-body-1-semibold text-foreground">예매/리셀 선택</p>
               <TabToggle value={localTab} onChange={setLocalTab} />
            </section>

            <hr className="border-border" />

            {/* 보기 옵션 */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <Eye className="size-4 text-foreground shrink-0" />
                  <p className="text-body-2-semibold text-foreground">보기 옵션</p>
               </div>
               <Checkbox
                  size="md"
                  typography="body3Regular"
                  label={localTab === '예매' ? '판매 예정 티켓 포함' : '리셀 예정 티켓 포함'}
                  checked={showUpcoming}
                  onCheckedChange={v => setShowUpcoming(v === true)}
               />
               <Checkbox
                  size="md"
                  typography="body3Regular"
                  label="매진 티켓 포함"
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
               <DatePicker value={dateTime} onChange={setDateTime} placeholder="경기 일시 선택" />
            </section>

            {/* 가격 설정 */}
            <section className="flex flex-col gap-2">
               <div className="flex items-center gap-2">
                  <Banknote className="size-4 text-foreground shrink-0" />
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
               <Select value={venue} onChange={setVenue} options={venueOptions} placeholder="구장 선택" />
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
               <Button variant="tertiary" size="sm" onClick={handleReset} className="w-full gap-2">
                  <RotateCcw className="size-4 shrink-0" />
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
