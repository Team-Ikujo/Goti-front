// src/shared/ui/date-picker.tsx

import { useState, useRef, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface DatePickerProps {
   value: string; // 'YYYY-MM-DD' or ''
   onChange: (value: string) => void;
   placeholder?: string;
   className?: string;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABELS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

const BASE_YEAR = new Date().getFullYear();
/** 연도 목록 — 최신 순(내림차순) */
const YEAR_LIST = Array.from({ length: 8 }, (_, i) => BASE_YEAR - i);
/** 월 목록 — 최신 순(내림차순) */
const MONTH_LIST = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const VISIBLE_COUNT = 4;

/** 'YYYY-MM-DD' → '2026.07.03 (금)' */
function formatDisplay(dateStr: string): string {
   const d = new Date(dateStr + 'T00:00:00');
   const dayLabel = DAY_LABELS[d.getDay()];
   const yyyy = d.getFullYear();
   const mm = String(d.getMonth() + 1).padStart(2, '0');
   const dd = String(d.getDate()).padStart(2, '0');
   return `${yyyy}.${mm}.${dd} (${dayLabel})`;
}

/** 달력 행 배열 — 각 행은 7칸 (빈 칸은 null) */
function buildCalendarRows(year: number, month: number): (number | null)[][] {
   const firstWeekday = new Date(year, month - 1, 1).getDay();
   const daysInMonth = new Date(year, month, 0).getDate();

   const flat: (number | null)[] = Array(firstWeekday).fill(null);
   for (let d = 1; d <= daysInMonth; d++) flat.push(d);
   while (flat.length % 7 !== 0) flat.push(null);

   const rows: (number | null)[][] = [];
   for (let i = 0; i < flat.length; i += 7) rows.push(flat.slice(i, i + 7));
   return rows;
}

/** 'YYYY-MM-DD' 생성 */
function toDateStr(year: number, month: number, day: number): string {
   return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── 화살표 버튼으로 탐색하는 드롭다운 ────────────────────────────
interface NavDropdownProps {
   items: number[]; // 내림차순 정렬된 목록
   selected: number;
   onSelect: (v: number) => void;
   labelOf: (v: number) => string;
   className?: string;
}

/** 항목 1개의 렌더링 높이: py-1.5(12px) + body-2 line-height(21px) */
const ITEM_HEIGHT = 33;
/** 컨테이너 p-1 상단 패딩 */
const CONTAINER_PADDING_TOP = 4;

function NavDropdown({ items, selected, onSelect, labelOf, className }: NavDropdownProps) {
   const selectedIdx = items.indexOf(selected);
   const initOffset = Math.max(0, Math.min(selectedIdx < 0 ? 0 : selectedIdx, items.length - VISIBLE_COUNT));
   const [offset, setOffset] = useState(initOffset);

   const visible = items.slice(offset, offset + VISIBLE_COUNT);
   const canUp = offset > 0;
   const canDown = offset + VISIBLE_COUNT < items.length;

   /** visible 배열 내 선택 항목 index */
   const selectedVisibleIdx = visible.indexOf(selected);
   /**
    * 선택된 항목이 트리거 버튼 위에 겹쳐 보이도록 top을 동적 계산.
    * className에 top 클래스가 없어야 인라인 스타일이 우선 적용됨.
    */
   const dynamicTop = selectedVisibleIdx >= 0 ? -(selectedVisibleIdx * ITEM_HEIGHT + CONTAINER_PADDING_TOP) : 0;

   return (
      <div
         role="listbox"
         style={{ top: dynamicTop }}
         className={cn(
            'bg-background border border-[var(--neutral-200)] rounded-lg shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_2px_4px_rgba(0,0,0,0.1)] p-1',
            className,
         )}
      >
         {/* 위 화살표 — offset === 0(최신)이면 미표시 */}
         {canUp && (
            <button
               type="button"
               onClick={() => setOffset(o => o - 1)}
               className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
               aria-label="이전 항목"
            >
               <ChevronUp className="size-3 text-[var(--neutral-600)]" />
            </button>
         )}

         {/* 보여지는 항목 */}
         {visible.map(item => (
            <button
               key={item}
               type="button"
               role="option"
               aria-selected={item === selected}
               onClick={() => onSelect(item)}
               className={cn(
                  'w-full flex items-center justify-between px-1 py-1.5 rounded-sm text-body-2-regular transition-colors',
                  item === selected
                     ? 'bg-surface text-muted-foreground font-medium'
                     : 'text-[var(--neutral-600)] hover:bg-surface',
               )}
            >
               <span>{labelOf(item)}</span>
               {item === selected && <Check className="size-2.5 shrink-0 text-muted-foreground" />}
            </button>
         ))}

         {/* 아래 화살표 */}
         {canDown && (
            <button
               type="button"
               onClick={() => setOffset(o => o + 1)}
               className="w-full flex items-center justify-center py-0.5 rounded hover:bg-surface transition-colors"
               aria-label="다음 항목"
            >
               <ChevronDown className="size-3 text-[var(--neutral-600)]" />
            </button>
         )}
      </div>
   );
}

// ── DatePicker 본체 ───────────────────────────────────────────────
export function DatePicker({ value, onChange, placeholder = '경기 일시 선택', className }: DatePickerProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [showYearDrop, setShowYearDrop] = useState(false);
   const [showMonthDrop, setShowMonthDrop] = useState(false);

   const initDate = value ? new Date(value + 'T00:00:00') : new Date();
   const [viewYear, setViewYear] = useState(initDate.getFullYear());
   const [viewMonth, setViewMonth] = useState(initDate.getMonth() + 1);

   const containerRef = useRef<HTMLDivElement>(null);

   /** 외부 클릭 시 닫기 */
   useEffect(() => {
      if (!isOpen) return;
      const handler = (e: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
            setShowYearDrop(false);
            setShowMonthDrop(false);
         }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
   }, [isOpen]);

   const calendarRows = buildCalendarRows(viewYear, viewMonth);

   const prevMonth = () => {
      if (viewMonth === 1) {
         setViewYear(y => y - 1);
         setViewMonth(12);
      } else setViewMonth(m => m - 1);
   };
   const nextMonth = () => {
      if (viewMonth === 12) {
         setViewYear(y => y + 1);
         setViewMonth(1);
      } else setViewMonth(m => m + 1);
   };

   const handleDayClick = (day: number) => {
      onChange(toDateStr(viewYear, viewMonth, day));
      setIsOpen(false);
      setShowYearDrop(false);
      setShowMonthDrop(false);
   };

   const toggleYearDrop = () => {
      setShowYearDrop(v => !v);
      setShowMonthDrop(false);
   };
   const toggleMonthDrop = () => {
      setShowMonthDrop(v => !v);
      setShowYearDrop(false);
   };

   const selectedParts = value
      ? { year: Number(value.slice(0, 4)), month: Number(value.slice(5, 7)), day: Number(value.slice(8, 10)) }
      : null;

   return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
         {/* 트리거 */}
         <button
            type="button"
            onClick={() => setIsOpen(v => !v)}
            className="bg-surface border border-border-light rounded-lg px-3 h-9 flex items-center justify-between w-full"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
         >
            <span className={cn('text-body-2-medium', value ? 'text-foreground' : 'text-[var(--neutral-600)]')}>
               {value ? formatDisplay(value) : placeholder}
            </span>
            <CalendarDays className="size-4 text-[var(--neutral-600)] shrink-0" />
         </button>

         {/* 달력 팝업 */}
         {isOpen && (
            <div
               role="dialog"
               aria-label="날짜 선택"
               className="absolute z-50 top-[calc(100%+4px)] left-0 right-0 bg-background border border-border rounded-[10px] p-3 shadow-[0px_1px_3px_rgba(0,0,0,0.1)] flex flex-col gap-4"
            >
               {/* ── 헤더 ── */}
               <div className="flex items-center justify-between">
                  {/* 이전 달 */}
                  <button
                     type="button"
                     onClick={prevMonth}
                     className="flex items-center justify-center size-8 rounded-md hover:bg-surface transition-colors"
                     aria-label="이전 달"
                  >
                     <ChevronLeft className="size-4 text-foreground" />
                  </button>

                  {/* 연도 / 월 드롭다운 트리거 */}
                  <div className="flex items-center gap-1.5">
                     {/* 연도 드롭다운 */}
                     <div className="relative">
                        <button
                           type="button"
                           onClick={toggleYearDrop}
                           className="bg-background border border-[var(--neutral-200)] h-8 rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.1)] flex items-center gap-1 pl-2 pr-1"
                        >
                           <span className="text-body-2-medium text-foreground">{viewYear}</span>
                           <ChevronDown className="size-3 text-foreground" />
                        </button>

                        {showYearDrop && (
                           <NavDropdown
                              items={YEAR_LIST}
                              selected={viewYear}
                              onSelect={y => {
                                 setViewYear(y);
                                 setShowYearDrop(false);
                              }}
                              labelOf={y => `${y}`}
                              className="absolute z-20 left-0 w-[66px]"
                           />
                        )}
                     </div>

                     {/* 월 드롭다운 */}
                     <div className="relative">
                        <button
                           type="button"
                           onClick={toggleMonthDrop}
                           className="bg-background border border-(--neutral-200) h-8 rounded-lg shadow-[0px_1px_2px_rgba(0,0,0,0.1)] flex items-center justify-between gap-1 pl-2 pr-1 w-[53px]"
                        >
                           <span className="text-body-2-medium text-foreground">
                              {String(viewMonth).padStart(2, '0')}
                           </span>
                           <ChevronDown className="size-3 text-foreground" />
                        </button>

                        {showMonthDrop && (
                           <NavDropdown
                              items={MONTH_LIST}
                              selected={viewMonth}
                              onSelect={m => {
                                 setViewMonth(m);
                                 setShowMonthDrop(false);
                              }}
                              labelOf={m => MONTH_LABELS[m - 1]}
                              className="absolute z-20 left-1/2 -translate-x-1/2 w-14"
                           />
                        )}
                     </div>
                  </div>

                  {/* 다음 달 */}
                  <button
                     type="button"
                     onClick={nextMonth}
                     className="flex items-center justify-center size-8 rounded-md hover:bg-surface transition-colors"
                     aria-label="다음 달"
                  >
                     <ChevronRight className="size-4 text-foreground" />
                  </button>
               </div>

               {/* ── 달력 그리드 ── */}
               <div>
                  {/* 요일 헤더 */}
                  <div className="flex items-center">
                     {DAY_LABELS.map(d => (
                        <div key={d} className="flex flex-1 h-[21px] items-center justify-center">
                           <span className="text-caption-1-regular text-muted-foreground">{d}</span>
                        </div>
                     ))}
                  </div>

                  {/* 날짜 행 */}
                  {calendarRows.map((row, rowIdx) => (
                     <div key={rowIdx} className="flex items-start pt-2">
                        {row.map((day, colIdx) => {
                           if (day === null) return <div key={`e-${colIdx}`} className="flex-1 h-8" />;

                           const isSelected =
                              selectedParts !== null &&
                              selectedParts.year === viewYear &&
                              selectedParts.month === viewMonth &&
                              selectedParts.day === day;

                           return (
                              <button
                                 key={day}
                                 type="button"
                                 onClick={() => handleDayClick(day)}
                                 className={cn(
                                    'flex flex-1 items-center justify-center h-8 rounded-lg text-body-2-regular transition-colors',
                                    isSelected ? 'bg-primary text-white' : 'text-foreground hover:bg-surface',
                                 )}
                              >
                                 {day}
                              </button>
                           );
                        })}
                     </div>
                  ))}
               </div>

               {/* 선택 해제 */}
               {value && (
                  <button
                     type="button"
                     onClick={() => {
                        onChange('');
                        setIsOpen(false);
                     }}
                     className="w-full text-caption-1-regular text-muted-foreground hover:text-foreground transition-colors py-1 border-t border-border"
                  >
                     선택 해제
                  </button>
               )}
            </div>
         )}
      </div>
   );
}
