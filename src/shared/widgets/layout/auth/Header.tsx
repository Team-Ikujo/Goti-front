import { Button } from "@/shared/ui/button";
import { Heart, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="flex flex-col w-full">
      {/* 상단바: 트래픽 상태 / 검색 / 언어 */}
      <div className="bg-background shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] w-full overflow-hidden px-30 py-2.5">
        <div className="flex items-center justify-between w-full max-w-300 mx-auto">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-success" />
            <span className="text-caption-2-medium text-(--text-tertiary)">
              TRAFFIC:
            </span>
            <span className="text-caption-2-medium text-success">원활</span>
          </div>

          <div className="flex items-center gap-7.5">
            <div className="flex items-center w-57.5 h-9 border border-border rounded-full bg-background">
              <input
                className="flex-1 px-3 text-body-2-regular text-(--text-tertiary) truncate"
                placeholder="Search"
              />
              <div className="pr-3">
                <Search className="size-4 text-(--text-tertiary)" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 네비게이션: 로고 / 메뉴 / 로그인 */}
      <div className="bg-background shadow-[0px_1px_2px_0px_rgba(13,17,23,0.05)] w-full h-12.5 px-30">
        <div className="flex items-center gap-7 h-full w-full max-w-300 mx-auto">
          <Link
            to="/"
            className="shrink-0 text-[21px] font-bold tracking-[-0.5px] text-foreground"
          >
            GoTi
          </Link>

          <div className="flex items-center gap-0.5 flex-1 h-full">
            <button className="flex items-center justify-center h-full px-3 border-b-2 border-primary">
              <span className="text-label-2-bold text-primary">티켓/리셀</span>
            </button>
            <button className="flex items-center justify-center h-full px-3">
              <span className="text-label-2-bold text-(--text-tertiary)">
                구단
              </span>
            </button>
          </div>

          <Button
            variant={"primaryline"}
            className="shrink-0 flex items-center justify-center h-9.5 px-4 border-[1.4px] border-primary rounded-lg text-primary text-body-1-medium"
            asChild
          >
            <Link to="/auth/login">로그인/회원가입</Link>
          </Button>
        </div>
      </div>

      {/* 안내 배너 */}
      <div className="bg-(--fill-hoveraccent) w-full px-30 py-1">
        <div className="flex items-center justify-between h-8 w-full max-w-300 mx-auto">
          <p className="text-label-3-regular text-primary">
            GoTi는 국내 최대 티켓중개거래 플랫폼입니다. 구매자 수수료는 없으며,
            티켓가격은 액면가보다 낮거나 높을 수 있습니다.
          </p>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Heart className="size-4 fill-primary text-primary" />
              <span className="text-label-3-regular text-primary">
                좋아하는 팀을 설정하고 경기 일정을 빠르게 확인하세요
              </span>
            </div>
            <Button
              variant={"outline"}
              className="bg-background border border-(--border-light) rounded-lg px-3 py-1 text-label-2-medium text-muted-foreground"
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
