import { useNavigate } from 'react-router-dom';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const teamLogos: Record<string, string> = {
   KIA: 'https://www.figma.com/api/mcp/asset/fa8d05f9-44d4-4387-85e8-579f17a5b557',
   LG: 'https://www.figma.com/api/mcp/asset/14a46d68-59b0-44c5-9699-00fa15b20f16',
   롯데: 'https://www.figma.com/api/mcp/asset/31c006de-c028-4d8e-960a-c6c40246aa38',
   KT: 'https://www.figma.com/api/mcp/asset/55c4544b-d5f9-434b-9e04-edfc59f8d499',
   두산: 'https://www.figma.com/api/mcp/asset/04dc4340-5afe-43b4-a3d9-cac4b8f96dcb',
   삼성: 'https://www.figma.com/api/mcp/asset/a5da3ee6-ae89-482d-8fec-89ab37f112db',
   SSG: 'https://www.figma.com/api/mcp/asset/5887e3df-622b-42ee-8c3a-5fd077026191',
   한화: 'https://www.figma.com/api/mcp/asset/3690cad7-a304-4708-bf19-52207dd74ad9',
   키움: 'https://www.figma.com/api/mcp/asset/274d2c90-3a68-45c9-bc8e-2e1df76310ec',
   NC: 'https://www.figma.com/api/mcp/asset/76518e98-759b-4e31-9013-e59d6e518643',
};

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

type GameStatus = '경기중' | '예정' | '종료' | '취소';
type GameRow = {
   time: string;
   venue: string;
   away: string;
   home: string;
   score: string | null;
   status: GameStatus;
   ticket: '매진' | '판매예정' | '예매하기';
   resell: '리셀매진' | '리셀예매' | '리셀예정';
   ticketInfo?: string;
   reselInfo?: string;
};
type DaySchedule = { date: string; isToday?: boolean; games: GameRow[] };

// ── Mock Data ──
const mockWeekly: DaySchedule[] = [
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
   경기중: 'text-success',
   예정: 'text-primary',
   종료: 'text-destructive',
   취소: 'text-disabled-foreground',
};

// ── Sub-components ──

function ScoreDisplay({ game }: { game: GameRow }) {
   if (game.status === '종료' && game.score) {
      const [awayScore, homeScore] = game.score.split(':').map(Number);
      const awayLost = awayScore < homeScore;
      return (
         <span className="text-heading-1-bold text-center whitespace-nowrap text-destructive">
            <span className={awayLost ? 'text-disabled-foreground' : ''}>{awayScore}:</span>
            <span className={!awayLost ? 'text-disabled-foreground' : ''}>{homeScore}</span>
         </span>
      );
   }
   return (
      <span className="text-heading-1-bold text-foreground text-center whitespace-nowrap">{game.score ?? 'VS'}</span>
   );
}

function DaySection({ day }: { day: DaySchedule }) {
   return (
      <div className="flex flex-col overflow-hidden rounded-[20px] border border-border">
         {/* 날짜 헤더 */}
         <div className="bg-[#f1f2f4] border-b border-border px-7.5 py-2.5 flex items-center gap-2">
            <span className="text-heading-3-semibold text-foreground">{day.date}</span>
            {day.isToday && <Badge variant="chipDestructive">오늘</Badge>}
         </div>

         {/* 경기 행 */}
         <div className="flex flex-col divide-y divide-border">
            {day.games.map((game, idx) => {
               const isEnded = game.status === '종료' || game.status === '취소';
               const textClass = isEnded ? 'text-disabled-foreground' : 'text-foreground';
               const isPendingTicket = game.ticket === '판매예정';
               const isPendingResell = game.resell === '리셀예정';

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
                        'px-5 py-1.5 flex items-center justify-between',
                        isEnded ? 'bg-[#f7f8f9]' : 'bg-background',
                     )}
                  >
                     {/* 시간 & 장소 */}
                     <div className="flex gap-7.5 items-center shrink-0 text-heading-3-semibold">
                        <span className={cn('text-heading-3-semibold w-15 text-center', textClass)}>{game.time}</span>
                        <span className={cn('text-heading-3-semibold w-10 text-center', textClass)}>{game.venue}</span>
                     </div>

                     {/* 대진 */}
                     <div className="flex items-center gap-12.5 shrink-0">
                        {/* 원정팀: [left-spacer + name/result] + logo */}
                        <div className="flex items-center w-37.5">
                           <div className="flex h-18.75 items-center justify-end w-17.5 shrink-0">
                              <div className="w-7.5 h-18.75 shrink-0" />
                              <div className="flex flex-col h-full justify-between items-center shrink-0 text-heading-3-semibold">
                                 <div className="h-4.5 shrink-0" />
                                 <span
                                    className={cn('text-heading-3-semibold text-center whitespace-nowrap', textClass)}
                                 >
                                    {game.away}
                                 </span>
                                 <span className="text-caption-1-medium text-muted-foreground h-4.5 flex items-center justify-center">
                                    {awayResult}
                                 </span>
                              </div>
                           </div>
                           <div className="flex flex-col items-center justify-center overflow-hidden px-3.75 py-2.5 size-18.75 shrink-0">
                              <img
                                 src={teamLogos[game.away]}
                                 alt={game.away}
                                 className="w-full h-full object-contain"
                              />
                           </div>
                        </div>

                        {/* 스코어 */}
                        <div className="flex flex-col items-center w-10 h-18.75 shrink-0">
                           <div className="h-4.5 shrink-0" />
                           <ScoreDisplay game={game} />
                           <span className={cn('text-caption-1-medium text-center', statusColor[game.status])}>
                              {game.status}
                           </span>
                        </div>

                        {/* 홈팀: logo + [name/result + 홈 badge] */}
                        <div className="flex items-center w-37.5">
                           <div className="flex flex-col items-center justify-center overflow-hidden px-3.75 py-2.5 size-18.75 shrink-0">
                              <img
                                 src={teamLogos[game.home]}
                                 alt={game.home}
                                 className="w-full h-full object-contain"
                              />
                           </div>
                           <div className="flex h-18.75 items-center w-17.5 shrink-0">
                              <div className="flex flex-col h-full justify-between items-center shrink-0 text-heading-3-semibold">
                                 <div className="h-4.5 shrink-0" />
                                 <span className={cn('text-center whitespace-nowrap', textClass)}>{game.home}</span>
                                 <span className="text-caption-1-medium text-muted-foreground h-4.5 flex items-center justify-center">
                                    {homeResult}
                                 </span>
                              </div>
                              <div className="flex h-18.75 items-center justify-end w-7.5 shrink-0">
                                 <div className="bg-disabled-foreground flex flex-col items-center justify-center px-1 rounded-xs w-5.5">
                                    <span className="text-white text-body-1-medium text-center">홈</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* 액션 버튼 */}
                     <div className={cn('flex gap-2.5 items-center shrink-0 h-16.5', isEnded && 'opacity-0')}>
                        {isPendingTicket ? (
                           <button className="flex flex-col items-center justify-center px-4 py-2 h-full rounded-md bg-disabled-foreground text-white">
                              <span className="text-body-1-medium">판매예정</span>
                              {game.ticketInfo && (
                                 <span className="text-[11px] leading-tight text-center whitespace-pre-line">
                                    {game.ticketInfo}
                                 </span>
                              )}
                           </button>
                        ) : (
                           <Button
                              variant="primary"
                              size="sm"
                              disabled={game.ticket !== '예매하기'}
                              className={cn(
                                 'h-full rounded-md text-body-1-medium text-white',
                                 game.ticket === '매진' && 'w-22 disabled:bg-disabled-foreground disabled:text-white',
                              )}
                           >
                              {game.ticket}
                           </Button>
                        )}
                        {isPendingResell ? (
                           <button className="flex flex-col items-center justify-center px-3 py-2 h-full rounded-md bg-background border border-disabled-foreground text-disabled-foreground">
                              <span className="text-body-1-medium">리셀예정</span>
                              {game.reselInfo && (
                                 <span className="text-[11px] leading-tight text-center whitespace-pre-line">
                                    {game.reselInfo}
                                 </span>
                              )}
                           </button>
                        ) : (
                           <Button
                              variant="primaryline"
                              size="sm"
                              disabled={game.resell !== '리셀예매'}
                              className={cn(
                                 'h-full rounded-md text-body-1-medium whitespace-nowrap text-primary',
                                 game.resell !== '리셀예매' && 'w-22',
                              )}
                           >
                              {game.resell}
                           </Button>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

// ── Main Component ──

const GameSchedule = () => {
   const navigate = useNavigate();
   const [activeTab, setActiveTab] = useState(0);
   const [weeklyMonth, setWeeklyMonth] = useState(7);
   const [weeklyYear, setWeeklyYear] = useState(2025);
   const [selectedWeek, setSelectedWeek] = useState(1);
   const [fullYear, setFullYear] = useState(2025);
   const [fullMonth, setFullMonth] = useState(7);

   const tabs = ['오늘 일정', '주간 일정', '전체 일정'];
   const WEEK_LABELS = ['1주차', '2주차', '3주차', '4주차', '5주차'];
   const MONTH_TABS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2] as const;

   const handleTeamClick = (teamName: string) => {
      const teamId = teamIds[teamName];
      if (teamId) navigate(`/teams/${teamId}`);
   };

   const visibleData = activeTab === 0 ? mockWeekly.filter(d => d.isToday) : mockWeekly;

   return (
      <section className="flex flex-col gap-5 w-full max-w-300 mx-auto px-4">
         <h2 className="text-heading-1-bold text-foreground">경기 일정</h2>
         <div className="flex flex-col gap-5">
            <p className="text-body-1-medium text-muted-foreground">
               각 구단을 선택하시면 <span className="text-destructive">구단별 경기일정</span>을 확인할 수 있습니다.
            </p>

            {/* 구단 로고 필터 */}
            <div className="flex items-center justify-between pb-2">
               {teamOrder.map(team => (
                  <button
                     key={team}
                     onClick={() => handleTeamClick(team)}
                     className="flex items-center justify-center size-20 p-2.5 rounded-xl transition-colors hover:bg-(--neutral-100)"
                  >
                     <img src={teamLogos[team]} alt={team} className="w-full h-full object-contain" />
                  </button>
               ))}
            </div>

            {/* 탭 네비게이션 */}
            <div className="flex gap-5 border-b border-border text-heading-3-semibold">
               {tabs.map((tab, i) => (
                  <button
                     key={tab}
                     onClick={() => setActiveTab(i)}
                     className={cn(
                        'px-2.5 py-2.5 transition-colors relative',
                        i === activeTab
                           ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.75 after:bg-primary'
                           : 'text-muted-foreground',
                     )}
                  >
                     {tab}
                  </button>
               ))}
            </div>

            {/* 주간 일정 네비게이터 */}
            {activeTab === 1 && (
               <div className="flex flex-col gap-3 items-center">
                  <div className="flex items-center gap-3.5">
                     <Badge variant="chipDestructive" asChild className="cursor-pointer">
                        <button
                           onClick={() => {
                              setWeeklyMonth(7);
                              setWeeklyYear(2025);
                              setSelectedWeek(1);
                           }}
                        >
                           최근
                        </button>
                     </Badge>
                     <div className="flex items-center gap-2.5">
                        <button onClick={() => setWeeklyMonth(m => (m === 1 ? 12 : m - 1))}>
                           <ChevronLeft className="size-6 text-foreground" />
                        </button>
                        <span className="text-heading-1-bold text-foreground">
                           {weeklyYear}-{String(weeklyMonth).padStart(2, '0')}
                        </span>
                        <button onClick={() => setWeeklyMonth(m => (m === 12 ? 1 : m + 1))}>
                           <ChevronRight className="size-6 text-foreground" />
                        </button>
                     </div>
                     <div className="w-13 shrink-0" />
                  </div>
                  <div className="flex gap-7.5">
                     {WEEK_LABELS.map((label, i) => (
                        <button
                           key={label}
                           onClick={() => setSelectedWeek(i + 1)}
                           className={cn(
                              'text-heading-3-semibold px-5.5 py-2.25 rounded-[10px] border transition-colors',
                              selectedWeek === i + 1
                                 ? 'border-primary text-primary'
                                 : 'border-foreground text-foreground',
                           )}
                        >
                           {label}
                        </button>
                     ))}
                  </div>
               </div>
            )}

            {/* 전체 일정 네비게이터 */}
            {activeTab === 2 && (
               <div className="flex flex-col gap-1 items-center">
                  <div className="flex items-center gap-3.5 px-5.5 py-2.25">
                     <Badge variant="chipDestructive" asChild className="cursor-pointer">
                        <button
                           onClick={() => {
                              setFullMonth(7);
                              setFullYear(2025);
                           }}
                        >
                           최근
                        </button>
                     </Badge>
                     <div className="flex items-center gap-2.5">
                        <button onClick={() => setFullYear(y => y - 1)}>
                           <ChevronLeft className="size-6 text-foreground" />
                        </button>
                        <span className="text-heading-1-bold text-foreground">{fullYear}</span>
                        <button onClick={() => setFullYear(y => y + 1)}>
                           <ChevronRight className="size-6 text-foreground" />
                        </button>
                     </div>
                     <div className="w-13 shrink-0" />
                  </div>
                  <div className="flex w-full">
                     {MONTH_TABS.map((m, idx) => {
                        const isDisabled = m >= 10 || m <= 2;
                        const isActive = fullMonth === m && !isDisabled;
                        return (
                           <button
                              key={m}
                              onClick={() => !isDisabled && setFullMonth(m)}
                              disabled={isDisabled}
                              className={cn(
                                 'flex-1 h-12 flex items-end justify-center gap-0.5 pb-2 shrink-0',
                                 'rounded-tl-[10px] rounded-tr-[10px]',
                                 idx !== 0 && '-ml-px',
                                 isActive
                                    ? 'border-l border-r border-t border-primary text-primary'
                                    : isDisabled
                                      ? 'border border-disabled-foreground text-disabled-foreground'
                                      : 'border border-foreground text-foreground',
                              )}
                           >
                              <span className="text-heading-1-bold">{m}</span>
                              <span className="text-body-2-medium">월</span>
                           </button>
                        );
                     })}
                     <button
                        disabled
                        className="w-30 h-12 flex items-end justify-center pb-2 shrink-0 rounded-tl-[10px] rounded-tr-[10px] -ml-px border border-disabled-foreground text-disabled-foreground text-heading-3-semibold"
                     >
                        포스트시즌
                     </button>
                  </div>
               </div>
            )}

            {/* 경기 목록 */}
            <div className="flex flex-col gap-3">
               {visibleData.map(day => (
                  <DaySection key={day.date} day={day} />
               ))}
            </div>
         </div>
      </section>
   );
};

export default GameSchedule;
