import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, TicketX } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { teams } from '@/entities/team/model/teams';
import { MOCK_TODAY } from '@/entities/team/model/schedule';

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
const teamOrder = ['LG', '한화', 'SSG', '삼성', 'NC', 'KT', '롯데', '두산', '키움', 'KIA'];

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

const _mockDate = new Date(MOCK_TODAY + 'T00:00:00');
const CURRENT_YEAR = _mockDate.getFullYear();
const CURRENT_MONTH = _mockDate.getMonth() + 1;
const CURRENT_WEEK = 1;
const _days = ['일', '월', '화', '수', '목', '금', '토'];
const TODAY = `${CURRENT_MONTH}월 ${_mockDate.getDate()}일 (${_days[_mockDate.getDay()]})`;

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

const GameSchedule = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TAB_TODAY);

  const [weekYear, setWeekYear] = useState(CURRENT_YEAR);
  const [weekMonth, setWeekMonth] = useState(CURRENT_MONTH);
  const [selectedWeek, setSelectedWeek] = useState(CURRENT_WEEK);
  const [showWeekPicker, setShowWeekPicker] = useState(false);

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
      }),
    [activeTab, weekMonth, selectedWeek, allMonth],
  );

  const prevWeekMonth = () => {
    if (weekMonth === 1) {
      setWeekMonth(12);
      setWeekYear((year) => year - 1);
    } else {
      setWeekMonth((month) => month - 1);
    }
    setSelectedWeek(1);
  };

  const nextWeekMonth = () => {
    if (weekMonth === 12) {
      setWeekMonth(1);
      setWeekYear((year) => year + 1);
    } else {
      setWeekMonth((month) => month + 1);
    }
    setSelectedWeek(1);
  };

  return (
    <section className="flex flex-col gap-5 w-full">
      <h2 className="text-[length:var(--typo---heading\/h3,24px)] font-bold text-(--text-primary) leading-[1.5]">경기 일정</h2>

      <div className="flex flex-col gap-5">
        <p className="text-[length:var(--typo---heading\/h5,16px)] font-medium text-(--text-secondary)">
          각 구단을 선택하시면 <span className="text-red-500">구단별 경기일정</span>을 확인할 수 있습니다.
        </p>

        <TeamLogoNav onNavigateTeam={(teamId) => navigate(`/teams/${teamId}`)} />

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
            showWeekPicker={showWeekPicker}
            onReset={() => {
              setWeekYear(CURRENT_YEAR);
              setWeekMonth(CURRENT_MONTH);
              setSelectedWeek(CURRENT_WEEK);
            }}
            onPrevMonth={prevWeekMonth}
            onNextMonth={nextWeekMonth}
            onOpenPicker={() => {
              setShowWeekPicker(true);
              setShowAllPicker(false);
            }}
            onClosePicker={() => setShowWeekPicker(false)}
            onConfirmPicker={(year, month) => {
              setWeekYear(year);
              setWeekMonth(month);
              setSelectedWeek(1);
              setShowWeekPicker(false);
            }}
            onSelectWeek={setSelectedWeek}
          />
        )}

        {activeTab === TAB_ALL && (
          <AllNavigator
            allYear={allYear}
            allMonth={allMonth}
            showAllPicker={showAllPicker}
            onReset={() => {
              setAllYear(CURRENT_YEAR);
              setAllMonth(CURRENT_MONTH);
            }}
            onPrevYear={() => setAllYear((year) => Math.max(year - 1, AVAILABLE_YEARS[0]))}
            onNextYear={() =>
              setAllYear((year) => Math.min(year + 1, AVAILABLE_YEARS[AVAILABLE_YEARS.length - 1]))
            }
            onOpenPicker={() => {
              setShowAllPicker(true);
              setShowWeekPicker(false);
            }}
            onClosePicker={() => setShowAllPicker(false)}
            onConfirmPicker={(year, month) => {
              setAllYear(year);
              setAllMonth(month);
              setShowAllPicker(false);
            }}
            onSelectMonth={setAllMonth}
          />
        )}

        <ScheduleList activeTab={activeTab} filteredData={filteredData} />
      </div>
    </section>
  );
};

export default GameSchedule;
