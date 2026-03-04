import { cn } from "@/shared/lib/utils";
import { useState } from "react";

// 팀 로고 이미지 (Figma asset)
const teamLogos: Record<string, string> = {
  LG: "https://www.figma.com/api/mcp/asset/582a2d54-fd43-40e6-93e1-3b9fce4ff60a",
  한화: "https://www.figma.com/api/mcp/asset/47f5bd30-49d8-4c59-a27c-994dcd47e340",
  SSG: "https://www.figma.com/api/mcp/asset/3b1b56ed-e5d1-45b0-8f0d-b20133972ae6",
  삼성: "https://www.figma.com/api/mcp/asset/5d35f11e-ce38-4cf1-8e26-8d0d7c5fb1a1",
  NC: "https://www.figma.com/api/mcp/asset/03b1926b-814c-445f-a610-a7b81503a39f",
  KT: "https://www.figma.com/api/mcp/asset/1f8cb5ef-61b0-44b3-b257-e0e6e9e2dcbd",
  롯데: "https://www.figma.com/api/mcp/asset/f0a9f5b3-51c2-449e-a810-d2dd37d504eb",
  두산: "https://www.figma.com/api/mcp/asset/856b26eb-af24-4c17-bdbd-61a6eaba81d5",
  키움: "https://www.figma.com/api/mcp/asset/b34ed677-0179-46d0-ac99-87d24fa0ad33",
  KIA: "https://www.figma.com/api/mcp/asset/1c3d5fcc-c8b2-48f3-8848-0af218712eab",
};

const teamOrder = ["LG", "한화", "SSG", "삼성", "NC", "KT", "롯데", "두산", "키움", "KIA"];

type GameStatus = "경기중" | "예정" | "종료";
type TicketStatus = "예매하기" | "매진";
type ReselStatus = "리셀예매" | "리셀매진";

type GameRow = {
  time: string;
  venue: string;
  away: string;
  home: string;
  score: string | null; // null이면 "VS"
  status: GameStatus;
  ticket: TicketStatus;
  resell: ReselStatus;
};

type DaySchedule = {
  date: string;
  games: GameRow[];
};

const scheduleData: DaySchedule[] = [
  {
    date: "7월 1일 (수)",
    games: [
      { time: "14:00", venue: "잠실", away: "KIA", home: "LG", score: "5:3", status: "경기중", ticket: "예매하기", resell: "리셀매진" },
      { time: "14:00", venue: "수원", away: "롯데", home: "KT", score: "3:5", status: "경기중", ticket: "매진", resell: "리셀예매" },
      { time: "16:00", venue: "대구", away: "두산", home: "삼성", score: null, status: "예정", ticket: "매진", resell: "리셀예매" },
      { time: "16:00", venue: "대전", away: "SSG", home: "한화", score: null, status: "예정", ticket: "예매하기", resell: "리셀예매" },
      { time: "14:00", venue: "창원", away: "키움", home: "NC", score: "3:5", status: "종료", ticket: "매진", resell: "리셀매진" },
    ],
  },
];

const statusColor: Record<GameStatus, string> = {
  경기중: "text-[#38c976]",
  예정: "text-primary",
  종료: "text-[#ef4444]",
};

const tabs = ["오늘 일정", "주간 일정", "전체 일정"];

// 종료 경기 스코어: 패한 팀 점수는 회색, 이긴 팀 점수는 빨강
function ScoreDisplay({ game }: { game: GameRow }) {
  const scoreStr = game.score ?? "VS";

  if (game.status === "종료" && game.score) {
    const [awayScore, homeScore] = game.score.split(":").map(Number);
    const awayLost = awayScore < homeScore;
    return (
      <span className="text-[24px] font-bold text-center leading-[1.5] whitespace-nowrap text-[#ef4444]">
        <span className={awayLost ? "text-[#acb4bb]" : ""}>{awayScore}:</span>
        <span className={!awayLost ? "text-[#acb4bb]" : ""}>{homeScore}</span>
      </span>
    );
  }

  return (
    <span className="text-[24px] font-bold text-(--text-primary) text-center leading-[1.5] whitespace-nowrap">
      {scoreStr}
    </span>
  );
}

const GameSchedule = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  return (
    <section className="flex flex-col gap-5 w-full">
      {/* 헤더 */}
      <h2 className="text-[length:var(--typo---heading\/h3,24px)] font-bold text-(--text-primary) leading-[1.5]">
        경기 일정
      </h2>

      <div className="flex flex-col gap-5">
        {/* 안내 문구 */}
        <p className="text-[length:var(--typo---heading\/h5,16px)] font-medium text-(--text-secondary)">
          각 구단을 선택하시면{" "}
          <span className="text-red-500">구단별 경기일정</span>을 확인할 수 있습니다.
        </p>

        {/* 팀 로고 필터 */}
        <div className="flex items-center justify-between">
          {teamOrder.map((team) => (
            <button
              key={team}
              onClick={() => setSelectedTeam(selectedTeam === team ? null : team)}
              className={cn(
                "flex items-center justify-center size-[80px] p-[10px] rounded-xl transition-colors overflow-hidden",
                selectedTeam === team && "bg-(--fill-hoveraccent) ring-2 ring-primary"
              )}
            >
              <img
                src={teamLogos[team]}
                alt={team}
                className="w-full h-full object-contain"
              />
            </button>
          ))}
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-5 border-b border-(--border-normal)">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={cn(
                "px-2.5 py-[10px] text-[length:var(--typo---heading\/h4,20px)] font-semibold leading-[1.5] transition-colors",
                i === activeTab
                  ? "text-(--text-primary) border-b-[3px] border-primary -mb-px"
                  : "text-(--text-tertiary)"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 경기 일정 테이블 */}
        <div className="flex flex-col">
          {scheduleData.map((day) => (
            <div key={day.date}>
              {/* 날짜 헤더 */}
              <div className="bg-[#f1f2f4] border border-(--border-normal) px-[30px] py-[10px] rounded-tl-[20px] rounded-tr-[20px]">
                <span className="text-[length:var(--typo---heading\/h4,20px)] font-semibold text-(--text-primary) leading-[1.5]">
                  {day.date}
                </span>
              </div>

              {/* 경기 행 */}
              {day.games.map((game, idx) => {
                const isLast = idx === day.games.length - 1;
                const isEnded = game.status === "종료";
                const textDisabled = isLast ? "text-[#acb4bb]" : "text-(--text-primary)";

                // 승/패 계산
                let awayResult = "";
                let homeResult = "";
                if (isEnded && game.score) {
                  const [awayScore, homeScore] = game.score.split(":").map(Number);
                  awayResult = awayScore < homeScore ? "패" : "승";
                  homeResult = homeScore > awayScore ? "승" : "패";
                }

                return (
                  <div
                    key={idx}
                    className={cn(
                      "border border-t-0 border-(--border-normal) px-[20px] py-[6px] flex items-center justify-between",
                      isLast
                        ? "bg-[#f7f8f9] rounded-bl-[20px] rounded-br-[20px]"
                        : "bg-background"
                    )}
                  >
                    {/* 시간 + 장소 */}
                    <div className="flex gap-[30px] items-center shrink-0">
                      <div className="flex items-center justify-center w-[60px]">
                        <span className={cn("text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap", textDisabled)}>
                          {game.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-center w-[40px]">
                        <span className={cn("text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap", textDisabled)}>
                          {game.venue}
                        </span>
                      </div>
                    </div>

                    {/* 경기 매치업 */}
                    <div className="flex gap-[50px] items-center shrink-0">
                      {/* 원정팀 (150px) */}
                      <div className="flex items-center justify-center w-[150px]">
                        {/* 이름 컬럼 (70px) */}
                        <div className="flex h-[75px] items-center justify-end w-[70px] shrink-0">
                          <div className="w-[30px] h-[75px] shrink-0" />
                          <div className="flex flex-col h-full items-center justify-between shrink-0">
                            <div className="h-[18px] w-full shrink-0" />
                            <span className={cn("text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap", textDisabled)}>
                              {game.away}
                            </span>
                            <div className="flex items-center justify-center w-full">
                              {isEnded && (
                                <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">
                                  {awayResult}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* 로고 (75px) */}
                        <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                          <img
                            src={teamLogos[game.away]}
                            alt={game.away}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      {/* 스코어 / VS (40px) */}
                      <div className="flex flex-col items-center w-[40px] shrink-0">
                        <div className="h-[18px] w-full shrink-0" />
                        <ScoreDisplay game={game} />
                        <span className={cn("text-[12px] font-medium text-center leading-[1.5]", statusColor[game.status])}>
                          {game.status}
                        </span>
                      </div>

                      {/* 홈팀 (150px) */}
                      <div className="flex items-center justify-center w-[150px]">
                        {/* 로고 (75px) */}
                        <div className="flex flex-col items-center justify-center overflow-hidden px-[15px] py-[10px] size-[75px] shrink-0">
                          <img
                            src={teamLogos[game.home]}
                            alt={game.home}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {/* 이름 컬럼 (70px) */}
                        <div className="flex h-[75px] items-center w-[70px] shrink-0">
                          <div className="flex flex-col h-full items-center justify-between shrink-0">
                            <div className="h-[18px] w-full shrink-0" />
                            <span className={cn("text-[20px] font-semibold text-center leading-[1.5] whitespace-nowrap", textDisabled)}>
                              {game.home}
                            </span>
                            <div className="flex items-center justify-center w-full">
                              {isEnded && (
                                <span className="text-[12px] font-medium text-(--text-tertiary) leading-[1.5]">
                                  {homeResult}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* 홈 뱃지 컨테이너 (30px) */}
                          <div className="flex h-[75px] items-center justify-end w-[30px] shrink-0">
                            <div className="bg-[#acb4bb] flex flex-col items-center justify-center px-[4px] rounded-[2px] w-[22px]">
                              <span className="text-white text-[16px] font-medium text-center leading-[1.5]">홈</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className={cn("flex gap-[10px] h-[66px] items-center shrink-0", isLast && "opacity-0")}>
                      <button
                        className={cn(
                          "h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] text-white",
                          game.ticket === "예매하기" ? "bg-primary" : "bg-[#acb4bb] w-[88px]"
                        )}
                      >
                        {game.ticket}
                      </button>
                      <button
                        className={cn(
                          "h-full px-[16px] py-[8px] rounded-[6px] text-[16px] font-medium leading-[1.5] border",
                          game.resell === "리셀예매"
                            ? "bg-background border-primary text-primary"
                            : "bg-background border-[#acb4bb] text-[#acb4bb] w-[88px] whitespace-nowrap"
                        )}
                      >
                        {game.resell}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GameSchedule;
