import { useAuthStore } from "@/entities/auth/model/authStore";
import { Button } from "@/shared/ui/button";
import { Clock, Heart, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const SESSION_DURATION = 60 * 60; // 1시간 (초)

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};

const Header = () => {
  const { accessToken, setAccessToken, clearAuth } = useAuthStore();
  const isLoggedIn = !!accessToken;

  const [remaining, setRemaining] = useState(SESSION_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoggedIn) {
      setRemaining(SESSION_DURATION);
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            clearAuth();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoggedIn, clearAuth]);

  // TODO: 로그인 API 연동 후 제거 — 로컬 테스트용 토글
  const handleLoginToggle = () => setAccessToken("mock-token");
  const handleLogout = () => clearAuth();

  return (
    <header className="flex flex-col w-full">
      {/* State bar: 트래픽 상태 + (로그인 시) 세션 타이머 */}
      <div className="bg-background w-full overflow-hidden px-4 py-1">
        <div className="flex items-center justify-between w-full max-w-[1200px] mx-auto">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-success" />
            <span className="text-caption-2-medium text-(--text-tertiary)">
              혼잡도:
            </span>
            <span className="text-caption-2-medium text-success">원활</span>
          </div>

          {isLoggedIn && (
            <div className="flex items-center gap-1.5 px-1.5">
              <Clock className="size-4 text-(--primary-normal)" />
              <span className="text-caption-2-medium text-(--primary-normal)">
                {formatTime(remaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nav bar: 로고 / 메뉴 / 검색 / 로그인 or 유저 */}
      <div className="bg-background shadow-[0px_1px_2px_0px_rgba(13,17,23,0.05)] w-full px-4">
        <div className="flex items-center gap-5 h-[50px] w-full max-w-[1200px] mx-auto">
          <Link
            to="/"
            className="shrink-0 text-[21px] font-bold tracking-[-0.5px] text-foreground"
          >
            GoTi
          </Link>

          <div className="flex items-center gap-5 flex-1 h-full min-w-0">
            <div className="flex items-center gap-0.5 h-full shrink-0">
              <button className="flex items-center justify-center h-full px-3 border-b-2 border-primary">
                <span className="text-label-2-bold text-primary">티켓/리셀</span>
              </button>
              <button className="flex items-center justify-center h-full px-3">
                <span className="text-label-2-bold text-(--text-tertiary)">
                  구단
                </span>
              </button>
            </div>

            <div className="flex items-center w-[250px] h-9 border border-(--border-normal) rounded-full bg-background shrink-0">
              <input
                className="flex-1 px-5 text-body-2-regular text-(--text-tertiary) bg-transparent outline-none truncate"
                placeholder="Search"
              />
              <div className="pr-3">
                <Search className="size-4 text-(--text-tertiary)" />
              </div>
            </div>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <button className="flex items-center justify-center size-[38px] rounded-lg hover:bg-(--fill-hover) transition-colors">
                <img src="/Icon/Line/Bell.svg" alt="알림" className="size-[18px]" />
              </button>
              {/* TODO: 로그인 API 연동 후 프로필 페이지로 이동하도록 변경 */}
              <button
                className="flex items-center justify-center size-[38px] rounded-lg hover:bg-(--fill-hover) transition-colors"
                onClick={handleLogout}
                title="로그아웃 (테스트용 — 클릭 시 로그아웃)"
              >
                <img src="/Icon/Line/Mypage.svg" alt="마이페이지" className="size-[18px]" />
              </button>
            </div>
          ) : (
            /* TODO: 로그인 API 연동 후 asChild + Link to="/auth/login" 으로 교체 */
            <Button
              variant="primaryline"
              className="shrink-0 h-[38px] px-3.5 text-body-2-medium rounded-lg"
              onClick={handleLoginToggle}
            >
              로그인/회원가입
            </Button>
          )}
        </div>
      </div>

      {/* Info bar: 안내 배너 */}
      <div className="bg-(--fill-hoveraccent) w-full px-4 py-1">
        <div className="flex items-center justify-between h-8 w-full max-w-[1200px] mx-auto">
          <p className="text-label-3-regular text-(--primary-normal)">
            KBO 공식 티켓 플랫폼 Go-Ti에서 안전한 예매와 리셀을 경험하세요.
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <Heart className="size-4 fill-(--primary-normal) text-(--primary-normal)" />
              <span className="text-label-3-regular text-(--primary-normal)">
                좋아하는 팀을 설정하고 경기 일정을 빠르게 확인하세요
              </span>
            </div>
            <Button
              variant="outline"
              className="h-auto px-3 py-1 text-label-2-medium text-(--text-secondary) rounded-lg"
            >
              팀 선택
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
