import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, TicketX } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { teams } from '@/entities/team/model/teams';

import {
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   DISABLED_MONTHS,
   SEASON_MONTHS,
   TAB_ALL,
   TAB_TODAY,
   TAB_WEEK,
   TODAY,
   WEEK_OPTIONS,
   AVAILABLE_YEARS,
   scheduleData,
   statusColor,
   tabs,
   teamLogos,
   teamOrder,
} from './game-schedule/constants';
import type { GameRow } from './game-schedule/types';
import { filterScheduleData, getGameResultTexts } from './game-schedule/utils';
import YearMonthPicker from './game-schedule/YearMonthPicker';

// 종료 경기 스코어: 패한 팀 점수는 회색, 이긴 팀 점수는 빨강
function ScoreDisplay({ game }: { game: GameRow }) {
   const scoreText = game.score ?? 'VS';

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
         {scoreText}
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

function TeamName({
   name,
   isEnded,
   result,
   textDisabled,
}: {
   name: string;
   isEnded: boolean;
   result: string;
   textDisabled: string;
}) {
   if (isEnded) {
      return (
         <div className="flex flex-col items-center shrink-0">
            <span
               className={cn(
                  'text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap',
                  textDisabled,
               )}
            >
               {name}
            </span>
            <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">{result}</span>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full items-center justify-between shrink-0">
         <div className="h-[18px] w-full shrink-0" />
         <span className="text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap text-(--text-primary)">
            {name}
         </span>
         <div />
      </div>
   );
}

function ActionButtons({ game, isEnded }: { game: GameRow; isEnded: boolean }) {
   return (
      <div className={cn('flex gap-[10px] h-[66px] items-center shrink-0', isEnded && 'opacity-0')}>
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
   );
}

const GameSchedule = () => {
   const [activeTab, setActiveTab] = useState(TAB_TODAY);
   const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

   // 주간 일정 state
   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
   const [showWeekPicker, setShowWeekPicker] = useState(false);

   // 전체 일정 state
   const [allYear, setAllYear] = useState(CURRENT_YEAR);
   const [allMonth, setAllMonth] = useState(CURRENT_MONTH);
   const [showAllPicker, setShowAllPicker] = useState(false);

   const filteredData = useMemo(
      () =>
         filterScheduleData(scheduleData, {
            activeTab,
            weekMonth,
            selectedWeek,
            allMonth,
            selectedTeam,
         }),
      [activeTab, weekMonth, selectedWeek, allMonth, selectedTeam],
   );

   const prevWeekMonth = () => {
      if (weekMonth === 1) {
         setWeekMonth(12);
         setWeekYear(year => year - 1);
      } else {
         setWeekMonth(month => month - 1);
      }
      setSelectedWeek(1);
   };

   const nextWeekMonth = () => {
      if (weekMonth === 12) {
         setWeekMonth(1);
         setWeekYear(year => year + 1);
      } else {
         setWeekMonth(month => month + 1);
      }
      setSelectedWeek(1);
   };

   return (
      <section className="flex flex-col gap-5 w-full">
         <h2 className="text-[length:var(--typo---heading\/h3,24px)] font-bold text-(--text-primary) leading-[1.5]">
            경기 일정
         </h2>

         <div className="flex flex-col gap-5">
            <p className="text-[length:var(--typo---heading\/h5,16px)] font-medium text-(--text-secondary)">
               각 구단을 선택하시면 <span className="text-red-500">구단별 경기일정</span>을 확인할 수 있습니다.
            </p>

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

            <div className="flex gap-5 border-b border-(--border-normal)">
               {tabs.map((tab, index) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(index)}
                     className={cn(
                        'px-2.5 py-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5] transition-colors',
                        index === activeTab
                           ? 'text-(--text-primary) border-b-[3px] border-primary -mb-px'
                           : 'text-(--text-tertiary)',
                     )}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {activeTab === TAB_WEEK && (
               <div className="flex flex-col gap-3">
                  <div className="relative flex items-center gap-3.5 justify-center">
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

                     <div className="w-[56px]" />

                     {showWeekPicker && (
                        <YearMonthPicker
                           year={weekYear}
                           month={weekMonth}
                           onConfirm={(year, month) => {
                              setWeekYear(year);
                              setWeekMonth(month);
                              setSelectedWeek(1);
                              setShowWeekPicker(false);
                           }}
                           onClose={() => setShowWeekPicker(false)}
                        />
                     )}
                  </div>

                  <div className="flex gap-[30px] justify-center">
                     {WEEK_OPTIONS.map(week => (
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

            {activeTab === TAB_ALL && (
               <div className="flex flex-col gap-3">
                  <div className="relative flex items-center gap-3.5 justify-center">
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

                     <div className="flex items-center gap-2">
                        <button
                           onClick={() => setAllYear(year => Math.max(year - 1, AVAILABLE_YEARS[0]))}
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
                           onClick={() =>
                              setAllYear(year => Math.min(year + 1, AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]))
                           }
                           className="flex items-center justify-center size-8 rounded-full hover:bg-gray-100 text-(--text-tertiary)"
                        >
                           <ChevronRight className="size-5" />
                        </button>
                     </div>

                     <div className="w-[56px]" />

                     {showAllPicker && (
                        <YearMonthPicker
                           year={allYear}
                           month={allMonth}
                           onConfirm={(year, month) => {
                              setAllYear(year);
                              setAllMonth(month);
                              setShowAllPicker(false);
                           }}
                           onClose={() => setShowAllPicker(false)}
                        />
                     )}
                  </div>

                  <div className="flex w-full">
                     {SEASON_MONTHS.map(month => {
                        const isDisabled = DISABLED_MONTHS.includes(month);
                        const isSelected = month === allMonth;

                        return (
                           <Button
                              key={month}
                              onClick={() => !isDisabled && setAllMonth(month)}
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
                                    {month}
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

            {filteredData.length === 0 ? (
               <EmptyState />
            ) : (
               <div className={cn('flex flex-col', activeTab !== TAB_TODAY && 'gap-[25px]')}>
                  {filteredData.map(day => {
                     const isToday = day.isToday ?? day.date === TODAY;

                     return (
                        <div key={day.date}>
                           <div className="bg-[#f1f2f4] border border-(--border-normal) px-[30px] py-[10px] rounded-tl-[20px] rounded-tr-[20px] flex items-center gap-2">
                              <span className="text-[length:var(--typo---heading\/h4,20px)] font-semibold text-(--text-primary) leading-[1.5]">
                                 {day.date}
                              </span>
                              {isToday && <Badge variant="chipDestructive">오늘</Badge>}
                           </div>

                           {day.games.map((game, index) => {
                              const isLast = index === day.games.length - 1;
                              const isEnded = game.status === '종료';
                              const textDisabled = isEnded ? 'text-[#acb4bb]' : 'text-(--text-primary)';
                              const resultText = getGameResultTexts(game.score, isEnded);

                              return (
                                 <div
                                    key={`${day.date}-${game.time}-${game.away}-${game.home}-${index}`}
                                    className={cn(
                                       'border border-t-0 border-(--border-normal) px-[20px] py-[6px] flex items-center justify-between',
                                       isLast && 'rounded-bl-[20px] rounded-br-[20px]',
                                       isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
                                    )}
                                 >
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

                                    <div className="flex gap-[50px] items-center shrink-0">
                                       <div className="flex items-center justify-center w-[150px]">
                                          <div className="flex h-[75px] items-center justify-end w-[70px] shrink-0">
                                             <div className="w-[30px] h-[75px] shrink-0" />
                                             <TeamName
                                                name={game.away}
                                                isEnded={isEnded}
                                                result={resultText.away}
                                                textDisabled={textDisabled}
                                             />
                                          </div>
                                          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                                             <img
                                                src={teamLogos[game.away]}
                                                alt={game.away}
                                                className="w-full h-full object-contain"
                                             />
                                          </div>
                                       </div>

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

                                       <div className="flex items-center justify-center w-[150px]">
                                          <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                                             <img
                                                src={teamLogos[game.home]}
                                                alt={game.home}
                                                className="w-full h-full object-contain"
                                             />
                                          </div>
                                          <div className="flex h-[75px] items-center justify-between w-[70px] shrink-0">
                                             <TeamName
                                                name={game.home}
                                                isEnded={isEnded}
                                                result={resultText.home}
                                                textDisabled={textDisabled}
                                             />
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

                                    <ActionButtons game={game} isEnded={isEnded} />
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
