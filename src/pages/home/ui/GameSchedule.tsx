// src/pages/home/ui/GameSchedule.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
   AVAILABLE_YEARS,
   CURRENT_MONTH,
   CURRENT_WEEK,
   CURRENT_YEAR,
   TAB_ALL,
   TAB_TODAY,
   TAB_WEEK,
   scheduleData,
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

   const filteredData = useMemo(
      () =>
         filterScheduleData(scheduleData, {
            activeTab,
            weekYear,
            weekMonth,
            selectedWeek,
            allYear,
            allMonth,
         }),
      [activeTab, weekYear, weekMonth, selectedWeek, allYear, allMonth],
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

            <TeamLogoNav onNavigateTeam={teamId => navigate(`/teams/${teamId}`)} />

            <div className="flex gap-5 border-b border-(--border-normal)">
               {tabs.map((tab, index) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(index)}
                     className={
                        index === activeTab
                           ? 'px-2.5 py-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5] transition-colors text-(--text-primary) border-b-[3px] border-primary -mb-px'
                           : 'px-2.5 py-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5] transition-colors text-(--text-tertiary)'
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

            <ScheduleList activeTab={activeTab} filteredData={filteredData} />
         </div>
      </section>
   );
};

export default GameSchedule;
