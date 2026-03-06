import { cn } from '@/shared/lib/utils';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, TicketX } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { teams } from '@/entities/team/model/teams';

const teamIds: Record<string, string> = {
   LG: 'lg',
   한화: 'hanwha',
   SSG: 'ssg',
   삼성: 'samsung',
   NC: 'nc',
   KT: 'kt',
   롯데: 'lotte',
   두산: 'doosan',
   키움: 'kiwoom',
   KIA: 'kia',
};

// 팀 로고 이미지 (Figma asset)
const teamLogos: Record<string, string> = {
   LG: '/baseball/logos/lg.png',
   한화: '/baseball/logos/hanwha.png',
   SSG: '/baseball/logos/ssg.png',
   삼성: '/baseball/logos/samsung.png',
   NC: '/baseball/logos/nc.png',
   KT: '/baseball/logos/kt.png',
   롯데: '/baseball/logos/lotte.png',
   두산: '/baseball/logos/doosan.png',
   키움: '/baseball/logos/kiwoom.png',
   KIA: '/baseball/logos/kia.png',
};

const teamOrder = ['LG', '한화', 'SSG', '삼성', 'NC', 'KT', '롯데', '두산', '키움', 'KIA'];

type GameStatus = '경기중' | '예정' | '종료' | '취소';
type TicketStatus = '예매하기' | '매진' | '판매예정';
type ReselStatus = '리셀예매' | '리셀매진' | '리셀예정';

type GameRow = {
   time: string;
   venue: string;
   away: string;
   home: string;
   score: string | null;
   status: GameStatus;
   ticket: TicketStatus;
   resell: ReselStatus;
   ticketInfo?: string;
   reselInfo?: string;
};
type DaySchedule = { date: string; isToday?: boolean; games: GameRow[] };

const scheduleData: DaySchedule[] = [
   {
      date: '7월 1일 (수)',
      games: [
         {
            time: '18:30',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: '5:3',
            status: '종료',
            ticket: '매진',
            resell: '리셀매진',
         },
      ],
   },
   {
      date: '7월 3일 (금)',
      isToday: true,
      games: [
         {
            time: '18:30',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: '2:1',
            status: '경기중',
            ticket: '예매하기',
            resell: '리셀매진',
         },
         {
            time: '18:30',
            venue: '대구',
            away: '두산',
            home: '삼성',
            score: null,
            status: '예정',
            ticket: '예매하기',
            resell: '리셀예매',
         },
      ],
   },
   {
      date: '7월 5일 (일)',
      games: [
         {
            time: '17:00',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: null,
            status: '예정',
            ticket: '판매예정',
            resell: '리셀예정',
            ticketInfo: '6월 25일\n오전 11시 오픈',
            reselInfo: '정식 예매 오픈\n2시간 후',
         },
      ],
   },
];

const statusColor: Record<GameStatus, string> = {
   경기중: 'text-[#38c976]',
   예정: 'text-primary',
   종료: 'text-[#ef4444]',
   취소: 'text-[#acb4bb]',
};

const TODAY = '7월 3일 (금)';
const CURRENT_YEAR = 2025;
const CURRENT_MONTH = 7;
const CURRENT_WEEK = 1;

// 시즌 월 순서: 3월~12월, 1월, 2월
const SEASON_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
const DISABLED_MONTHS = [10, 11, 12, 1, 2];
const AVAILABLE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

const tabs = ['오늘 일정', '주간 일정', '전체 일정'];

function parseDate(dateStr: string): { month: number; day: number } {
   const match = dateStr.match(/(\d+)월 (\d+)일/);
   if (!match) return { month: 0, day: 0 };
   return { month: parseInt(match[1]), day: parseInt(match[2]) };
}

function getWeekOfMonth(day: number): number {
   return Math.ceil(day / 7);
}

function ScoreDisplay({ game }: { game: GameRow }) {
   const scoreStr = game.score ?? 'VS';

   if (game.status === '종료' && game.score) {
      const [awayScore, homeScore] = game.score.split(':').map(Number);
      const awayLost = awayScore < homeScore;
      return (
         <span className="text-[24px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
            <span className={awayLost ? 'text-[#acb4bb]' : ''}>{awayScore}:</span>
            <span className={!awayLost ? 'text-[#acb4bb]' : ''}>{homeScore}</span>
         </span>
      );
   }

   return (
      <span className="text-[24px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">
         {scoreStr}
      </span>
   );
}

function EmptyState() {
   return (
      <div className="bg-[#f7f8f9] flex h-[400px] items-center justify-center overflow-hidden px-5 py-[100px] rounded-[10px] w-full">
         <div className="flex flex-col gap-[10px] items-center justify-center">
            <TicketX className="size-[75px] text-[#acb4bb]" strokeWidth={1.2} />
            <p className="text-[22px] font-semibold text-[#646f7c] text-center leading-[1.55]">
               현재 예매 가능한 경기가 없습니다.
            </p>
         </div>
      </div>
   );
}

// Year-Month 피커 드롭다운
function YearMonthPicker({
   year,
   month,
   onConfirm,
   onClose,
}: {
   year: number;
   month: number;
   onConfirm: (year: number, month: number) => void;
   onClose: () => void;
}) {
   const [localYear, setLocalYear] = useState(year);
   const [localMonth, setLocalMonth] = useState(month);
   const pickerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      function handleClickOutside(e: MouseEvent) {
         if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
            onClose();
         }
      }
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [onClose]);

   const yearIdx = AVAILABLE_YEARS.indexOf(localYear);
   const canPrevYear = yearIdx > 0;
   const canNextYear = yearIdx < AVAILABLE_YEARS.length - 1;

   return (
      <div
         ref={pickerRef}
         className="absolute top-10 left-1/2 -translate-x-1/2 z-50 bg-white rounded-[12px] shadow-xl border border-(--border-normal) overflow-hidden"
      >
         <div className="flex">
            {/* 연도 컬럼 */}
            <div className="flex flex-col items-center w-[100px] border-r border-(--border-normal)">
               <button
                  onClick={() => canPrevYear && setLocalYear(AVAILABLE_YEARS[yearIdx - 1])}
                  disabled={!canPrevYear}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50 disabled:opacity-30"
               >
                  <ChevronUp className="size-5" />
               </button>
               <div className="flex flex-col items-center w-full py-[6px]">
                  {AVAILABLE_YEARS.map(y => (
                     <button
                        key={y}
                        onClick={() => setLocalYear(y)}
                        className={cn(
                           'w-full py-[8px] text-center text-[16px] leading-[1.5] transition-colors',
                           y === localYear
                              ? 'font-bold text-(--text-primary)'
                              : 'font-medium text-[#acb4bb] hover:text-(--text-primary)',
                        )}
                     >
                        {y}
                     </button>
                  ))}
               </div>
               <button
                  onClick={() => canNextYear && setLocalYear(AVAILABLE_YEARS[yearIdx + 1])}
                  disabled={!canNextYear}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50 disabled:opacity-30"
               >
                  <ChevronDown className="size-5" />
               </button>
            </div>

            {/* 월 컬럼 */}
            <div className="flex flex-col items-center w-[80px]">
               <button
                  onClick={() => setLocalMonth(m => (m === 1 ? 12 : m - 1))}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50"
               >
                  <ChevronUp className="size-5" />
               </button>
               <div className="flex flex-col items-center w-full py-[6px]">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                     <button
                        key={m}
                        onClick={() => setLocalMonth(m)}
                        className={cn(
                           'w-full py-[8px] text-center text-[16px] leading-[1.5] transition-colors',
                           m === localMonth
                              ? 'font-bold text-(--text-primary)'
                              : 'font-medium text-[#acb4bb] hover:text-(--text-primary)',
                        )}
                     >
                        {String(m).padStart(2, '0')}
                     </button>
                  ))}
               </div>
               <button
                  onClick={() => setLocalMonth(m => (m === 12 ? 1 : m + 1))}
                  className="flex items-center justify-center w-full py-[10px] text-[#646f7c] hover:bg-gray-50"
               >
                  <ChevronDown className="size-5" />
               </button>
            </div>
         </div>

         <div className="flex border-t border-(--border-normal)">
            <button
               onClick={onClose}
               className="flex-1 py-[12px] text-[14px] font-medium text-[#646f7c] hover:bg-gray-50"
            >
               취소
            </button>
            <button
               onClick={() => onConfirm(localYear, localMonth)}
               className="flex-1 py-[12px] text-[14px] font-semibold text-primary border-l border-(--border-normal) hover:bg-blue-50"
            >
               확인
            </button>
         </div>
      </div>
   );
}

const GameSchedule = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState(0);

   // 주간 일정 state
   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
   const [showWeekPicker, setShowWeekPicker] = useState(false);

   // 전체 일정 state
   const [allYear, setAllYear] = useState(CURRENT_YEAR);
   const [allMonth, setAllMonth] = useState(CURRENT_MONTH);
   const [showAllPicker, setShowAllPicker] = useState(false);

   const filteredData = scheduleData
      .filter(day => {
         if (activeTab === 0) return day.date === TODAY;
         if (activeTab === 1) {
            const { month, day: dayNum } = parseDate(day.date);
            const week = getWeekOfMonth(dayNum);
            return month === weekMonth && week === selectedWeek;
         }
         if (activeTab === 2) {
            const { month } = parseDate(day.date);
            return month === allMonth;
         }
         return true;
      })
      .filter(day => day.games.length > 0);

   const prevWeekMonth = () => {
      if (weekMonth === 1) {
         setWeekMonth(12);
         setWeekYear(y => y - 1);
      } else {
         setWeekMonth(m => m - 1);
      }
      setSelectedWeek(1);
   };

   const nextWeekMonth = () => {
      if (weekMonth === 12) {
         setWeekMonth(1);
         setWeekYear(y => y + 1);
      } else {
         setWeekMonth(m => m + 1);
      }
      setSelectedWeek(1);
   };

   return (
      <section className="flex flex-col gap-5 w-full">
         {/* 헤더 */}
         <h2 className="text-[length:var(--typo---heading\/h3,24px)] font-bold text-(--text-primary) leading-[1.5]">
            경기 일정
         </h2>

         <div className="flex flex-col gap-5">
            {/* 안내 문구 */}
            <p className="text-[length:var(--typo---heading\/h5,16px)] font-medium text-(--text-secondary)">
               각 구단을 선택하시면 <span className="text-red-500">구단별 경기일정</span>을 확인할 수 있습니다.
            </p>

            {/* 팀 로고 */}
            <div className="flex items-center justify-between">
               {teamOrder.map(team => {
                  const teamId = teamIds[team];
                  const isEnabled = teams.find(t => t.id === teamId)?.isEnabled ?? false;
                  return (
                     <button
                        key={team}
                        onClick={() => isEnabled && navigate(`/teams/${teamId}`)}
                        disabled={!isEnabled}
                        className={cn(
                           'flex items-center justify-center size-20 p-2.5 rounded-xl transition-colors overflow-hidden',
                           isEnabled ? 'hover:bg-fill-hoveraccent cursor-pointer' : 'opacity-30 cursor-not-allowed',
                        )}
                     >
                        <img src={teamLogos[team]} alt={team} className="w-full h-full object-contain" />
                     </button>
                  );
               })}
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex gap-5 border-b border-(--border-normal)">
               {tabs.map((tab, i) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(i)}
                     className={cn(
                        'px-2.5 py-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5] transition-colors',
                        i === activeTab
                           ? 'text-(--text-primary) border-b-[3px] border-primary -mb-px'
                           : 'text-(--text-tertiary)',
                     )}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {/* 주간 일정 네비게이터 */}
            {activeTab === 1 && (
               <div className="flex flex-col gap-3">
                  <div className="relative flex items-center gap-3.5 justify-center">
                     {/* 최근 버튼 */}
                     <Badge asChild variant="chipDestructive" className="opacity-50">
                        <button
                           onClick={() => {
                              setWeekYear(CURRENT_YEAR);
                              setWeekMonth(CURRENT_MONTH);
                              setSelectedWeek(CURRENT_WEEK);
                           }}
                        >
                           최근
                        </button>
                     </Badge>

                     {/* Year-Month 네비게이션 */}
                     <div className="flex items-center gap-2">
                        <button
                           onClick={prevWeekMonth}
                           className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                        >
                           <ChevronLeft className="size-5" />
                        </button>
                        <button
                           onClick={() => {
                              setShowWeekPicker(true);
                              setShowAllPicker(false);
                           }}
                           className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[110px] text-center"
                        >
                           {weekYear}-{String(weekMonth).padStart(2, '0')}
                        </button>
                        <button
                           onClick={nextWeekMonth}
                           className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                        >
                           <ChevronRight className="size-5" />
                        </button>
                     </div>

                     {/* 빈 공간 (최근 버튼 균형) */}
                     <div className="w-[56px]" />

                     {/* 피커 드롭다운 */}
                     {showWeekPicker && (
                        <YearMonthPicker
                           year={weekYear}
                           month={weekMonth}
                           onConfirm={(y, m) => {
                              setWeekYear(y);
                              setWeekMonth(m);
                              setSelectedWeek(1);
                              setShowWeekPicker(false);
                           }}
                           onClose={() => setShowWeekPicker(false)}
                        />
                     )}
                  </div>

                  {/* 주차 선택 버튼 */}
                  <div className="flex gap-[30px] justify-center">
                     {[1, 2, 3, 4, 5].map(week => (
                        <Button
                           key={week}
                           onClick={() => setSelectedWeek(week)}
                           variant={week === selectedWeek ? 'primaryline' : 'outline'}
                           className={cn(
                              'px-[22px] py-[9px] rounded-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5]',
                              week !== selectedWeek && 'shadow-[inset_0_0_0_1px_#161d24] text-[#161d24]',
                           )}
                        >
                           {week}주차
                        </Button>
                     ))}
                  </div>
               </div>
            )}

            {/* 전체 일정 네비게이터 */}
            {activeTab === 2 && (
               <div className="flex flex-col gap-3">
                  <div className="relative flex items-center gap-3.5 justify-center">
                     {/* 최근 버튼 */}
                     <Badge asChild variant="chipDestructive" className="opacity-50">
                        <button
                           onClick={() => {
                              setAllYear(CURRENT_YEAR);
                              setAllMonth(CURRENT_MONTH);
                           }}
                        >
                           최근
                        </button>
                     </Badge>

                     {/* 연도 네비게이션 */}
                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setAllYear(y => Math.max(y - 1, AVAILABLE_YEARS[0]))}
                           className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                        >
                           <ChevronLeft className="size-5" />
                        </button>
                        <button
                           onClick={() => {
                              setShowAllPicker(true);
                              setShowWeekPicker(false);
                           }}
                           className="text-[18px] font-bold text-(--text-primary) leading-[1.5] min-w-[60px] text-center"
                        >
                           {allYear}
                        </button>
                        <button
                           onClick={() => setAllYear(y => Math.min(y + 1, AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]))}
                           className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                        >
                           <ChevronRight className="size-5" />
                        </button>
                     </div>

                     {/* 빈 공간 */}
                     <div className="w-[56px]" />

                     {/* 피커 드롭다운 */}
                     {showAllPicker && (
                        <YearMonthPicker
                           year={allYear}
                           month={allMonth}
                           onConfirm={(y, m) => {
                              setAllYear(y);
                              setAllMonth(m);
                              setShowAllPicker(false);
                           }}
                           onClose={() => setShowAllPicker(false)}
                        />
                     )}
                  </div>

                  {/* 월 탭 (시즌 순서: 3월~12월, 1월, 2월, 포스트시즌) */}
                  <div className="flex w-full">
                     {SEASON_MONTHS.map(m => {
                        const isDisabled = DISABLED_MONTHS.includes(m);
                        const isSelected = m === allMonth;
                        return (
                           <Button
                              key={m}
                              onClick={() => !isDisabled && setAllMonth(m)}
                              disabled={isDisabled}
                              variant={isSelected ? 'primaryline' : 'outline'}
                              className={cn(
                                 'flex-1 h-[48px] px-[22px] py-[9px] rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none',
                                 !isSelected && !isDisabled && 'shadow-[inset_0_0_0_1px_#161d24] text-[#161d24]',
                                 isDisabled && 'shadow-[inset_0_0_0_1px_#acb4bb] text-[#acb4bb]',
                              )}
                           >
                              <span className="flex items-end">
                                 <span className="text-[length:var(--typo---heading\/h3,24px)] font-bold leading-[1.5]">
                                    {m}
                                 </span>
                                 <span className="text-[length:var(--typo---paragraph\/p1,14px)] font-medium leading-[1.5]">
                                    월
                                 </span>
                              </span>
                           </Button>
                        );
                     })}
                     <Button
                        disabled
                        variant="outline"
                        className="h-[48px] px-[22px] py-[9px] rounded-tl-[10px] rounded-tr-[10px] rounded-bl-none rounded-br-none w-[120px] shrink-0 shadow-[inset_0_0_0_1px_#acb4bb] text-[#acb4bb] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5]"
                     >
                        포스트 시즌
                     </Button>
                  </div>
               </div>
            )}

            {/* 경기 일정 테이블 또는 빈 상태 */}
            {filteredData.length === 0 ? (
               <EmptyState />
            ) : (
               <div className={cn('flex flex-col', activeTab !== 0 && 'gap-[25px]')}>
                  {filteredData.map(day => {
                     const isToday = day.isToday ?? day.date === TODAY;
                     return (
                        <div key={day.date}>
                           {/* 날짜 헤더 */}
                           <div className="bg-[#f1f2f4] border border-(--border-normal) px-[30px] py-[10px] rounded-tl-[20px] rounded-tr-[20px] flex items-center gap-2">
                              <span className="text-[length:var(--typo---heading\/h4,20px)] font-semibold text-(--text-primary) leading-[1.5]">
                                 {day.date}
                              </span>
                              {isToday && <Badge variant="chipDestructive">오늘</Badge>}
                           </div>

                           {/* 경기 행 */}
                           {day.games.map((game, idx) => {
                              const isLast = idx === day.games.length - 1;
                              const isEnded = game.status === '종료';
                              const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';

                              let awayResult = '';
                              let homeResult = '';
                              if (isEnded && game.score) {
                                 const [awayScore, homeScore] = game.score.split(':').map(Number);
                                 awayResult = awayScore < homeScore ? '패' : '승';
                                 homeResult = homeScore > awayScore ? '승' : '패';
                              }

                              return (
                                 <div
                                    key={idx}
                                    className={cn(
                                       'border border-t-0 border-(--border-normal) px-[20px] py-[6px] flex items-center justify-between',
                                       isLast && 'rounded-bl-[20px] rounded-br-[20px]',
                                       isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
                                    )}
                                 >
                                    {/* 시간 + 장소 */}
                                    <div className="flex gap-[30px] items-center shrink-0">
                                       <div className="flex items-center justify-center w-[60px]">
                                          <span
                                             className={cn(
                                                'text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap',
                                                textDisabled,
                                             )}
                                          >
                                             {game.time}
                                          </span>
                                       </div>
                                       <div className="flex items-center justify-center w-[40px]">
                                          <span
                                             className={cn(
                                                'text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap',
                                                textDisabled,
                                             )}
                                          >
                                             {game.venue}
                                          </span>
                                       </div>
                                    </div>

                                    {/* 경기 매치업 */}
                                    <div className="flex gap-[50px] items-center shrink-0">
                                       {/* 원정팀 */}
                                       <div className="flex items-center justify-center w-[150px]">
                                          <div className="flex h-[75px] items-center justify-end w-[70px] shrink-0">
                                             <div className="w-[30px] h-[75px] shrink-0" />
                                             {isEnded ? (
                                                <div className="flex flex-col items-center shrink-0">
                                                   <span
                                                      className={cn(
                                                         'text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap',
                                                         textDisabled,
                                                      )}
                                                   >
                                                      {game.away}
                                                   </span>
                                                   <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">
                                                      {awayResult}
                                                   </span>
                                                </div>
                                             ) : (
                                                <div className="flex flex-col h-full items-center justify-between shrink-0">
                                                   <div className="h-[18px] w-full shrink-0" />
                                                   <span className="text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap text-(--text-primary)">
                                                      {game.away}
                                                   </span>
                                                   <div />
                                                </div>
                                             )}
                                          </div>
                                          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                                             <img
                                                src={teamLogos[game.away]}
                                                alt={game.away}
                                                className="w-full h-full object-contain"
                                             />
                                          </div>
                                       </div>

                                       {/* 스코어 / VS */}
                                       <div className="flex flex-col items-center justify-center w-[40px] shrink-0">
                                          <ScoreDisplay game={game} />
                                          <span
                                             className={cn(
                                                'text-[12px] font-medium text-center leading-[1.5]',
                                                statusColor[game.status],
                                             )}
                                          >
                                             {game.status}
                                          </span>
                                       </div>

                                       {/* 홈팀 */}
                                       <div className="flex items-center justify-center w-[150px]">
                                          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                                             <img
                                                src={teamLogos[game.home]}
                                                alt={game.home}
                                                className="w-full h-full object-contain"
                                             />
                                          </div>
                                          <div className="flex h-[75px] items-center justify-between w-[70px] shrink-0">
                                             {isEnded ? (
                                                <div className="flex flex-col items-center shrink-0">
                                                   <span
                                                      className={cn(
                                                         'text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap',
                                                         textDisabled,
                                                      )}
                                                   >
                                                      {game.home}
                                                   </span>
                                                   <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">
                                                      {homeResult}
                                                   </span>
                                                </div>
                                             ) : (
                                                <div className="flex flex-col h-full items-center justify-between shrink-0">
                                                   <div className="h-[18px] w-full shrink-0" />
                                                   <span className="text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap text-(--text-primary)">
                                                      {game.home}
                                                   </span>
                                                   <div />
                                                </div>
                                             )}
                                             <div className="flex h-[75px] items-center justify-end w-[30px] shrink-0">
                                                <div className="bg-[#acb4bb] flex flex-col items-center justify-center px-[4px] rounded-[2px] w-[22px]">
                                                   <span className="text-white text-[16px] font-medium text-center leading-[1.5]">
                                                      홈
                                                   </span>
                                                </div>
                                             </div>
                                          </div>
                                       </div>
                                    </div>

                                    {/* 액션 버튼 */}
                                    <div
                                       className={cn(
                                          'flex gap-[10px] h-[66px] items-center shrink-0',
                                          isEnded && 'opacity-0',
                                       )}
                                    >
                                       <button
                                          className={cn(
                                             'h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] text-white',
                                             game.ticket === '예매하기' ? 'bg-primary' : 'bg-[#acb4bb] w-[88px]',
                                          )}
                                       >
                                          {game.ticket}
                                       </button>
                                       <button
                                          className={cn(
                                             'h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] border',
                                             game.resell === '리셀예매'
                                                ? 'bg-background border-primary text-primary'
                                                : 'bg-background border-[#acb4bb] text-[#acb4bb] w-[88px] whitespace-nowrap',
                                          )}
                                       >
                                          {game.resell}
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </section>
   );
};

export default GameSchedule;
