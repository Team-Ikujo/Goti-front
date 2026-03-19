// src/pages/home/ui/GameSchedule.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameSchedules, mapGamesToDaySchedules } from '@/entities/game/model/schedule';

import {
   AVAILABLE_YEARS,
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   TAB_ALL,
   TAB_TODAY,
   TAB_WEEK,
   tabs,
} from './game-schedule/constants';
import AllNavigator from './game-schedule/AllNavigator';
import ScheduleList from './game-schedule/ScheduleList';
import TeamLogoNav from './game-schedule/TeamLogoNav';
import WeekNavigator from './game-schedule/WeekNavigator';
import { filterScheduleData } from './game-schedule/utils';

const GameSchedule = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState(TAB_TODAY);

   const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
   const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
   const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);

   const [allYear, setAllYear] = useState(CURRENT_YEAR);
   const [allMonth, setAllMonth] = useState(CURRENT_MONTH);

   const scheduleQuery = useGameSchedules(
      activeTab === TAB_TODAY
         ? { today: true }
         : {
              year: activeTab === TAB_WEEK ? weekYear : allYear,
              month: activeTab === TAB_WEEK ? weekMonth : allMonth,
           },
   );

   const scheduleData = useMemo(
      () => mapGamesToDaySchedules(scheduleQuery.data ?? []),
      [scheduleQuery.data],
   );

   const filteredData = useMemo(
      () =>
         activeTab === TAB_TODAY
            ? scheduleData.filter(day => day.games.length > 0)
            : filterScheduleData(scheduleData, {
                 activeTab,
                 weekYear,
                 weekMonth,
                 selectedWeek,
                 allYear,
                 allMonth,
              }),
      [activeTab, weekYear, weekMonth, selectedWeek, allYear, allMonth, scheduleData],
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
         <h2 className="text-heading-1-bold text-foreground leading-normal">경기 일정</h2>

         <div className="flex flex-col gap-5">
            <p className="text-body-1-medium text-muted-foreground">
               각 구단을 선택하시면 <span className="text-destructive">구단별 경기일정</span>을 확인할 수 있습니다.
            </p>

            <TeamLogoNav onNavigateTeam={teamId => navigate(`/teams/${teamId}`)} />

            <div className="flex gap-5 border-b border-border">
               {tabs.map((tab, index) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(index)}
                     className={
                        index === activeTab
                           ? 'px-2.5 py-2.5 text-heading-3-semibold leading-normal transition-colors text-foreground border-b-[3px] border-primary -mb-px'
                           : 'px-2.5 py-2.5 text-heading-3-semibold leading-normal transition-colors text-(--text-tertiary)'
                     }
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {activeTab === TAB_WEEK && (
               <WeekNavigator
                  weekYear={weekYear}
                  weekMonth={weekMonth}
                  selectedWeek={selectedWeek}
                  onReset={() => {
                     setWeekYear(CURRENT_YEAR);
                     setWeekMonth(CURRENT_MONTH);
                     setSelectedWeek(CURRENT_WEEK);
                  }}
                  onPrevMonth={prevWeekMonth}
                  onNextMonth={nextWeekMonth}
                  onSelectYear={year => {
                     setWeekYear(year);
                     setSelectedWeek(1);
                  }}
                  onSelectMonth={month => {
                     setWeekMonth(month);
                     setSelectedWeek(1);
                  }}
                  onSelectWeek={setSelectedWeek}
               />
            )}

            {activeTab === TAB_ALL && (
               <AllNavigator
                  allYear={allYear}
                  allMonth={allMonth}
                  onReset={() => {
                     setAllYear(CURRENT_YEAR);
                     setAllMonth(CURRENT_MONTH);
                  }}
                  onPrevYear={() => setAllYear(year => Math.max(year - 1, AVAILABLE_YEARS[0]))}
                  onNextYear={() => setAllYear(year => Math.min(year + 1, AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]))}
                  onSelectYear={setAllYear}
                  onSelectMonth={setAllMonth}
               />
            )}

            {scheduleQuery.isPending ? (
               <div className="rounded-[10px] border border-border bg-surface px-5 py-10 text-center text-body-1-medium text-muted-foreground">
                  경기 일정을 불러오는 중입니다.
               </div>
            ) : scheduleQuery.isError ? (
               <div className="rounded-[10px] border border-border bg-surface px-5 py-10 text-center text-body-1-medium text-muted-foreground">
                  경기 일정을 불러오지 못했습니다.
               </div>
            ) : (
               <ScheduleList activeTab={activeTab} filteredData={filteredData} />
            )}
         </div>
      </section>
   );
};

export default GameSchedule;
