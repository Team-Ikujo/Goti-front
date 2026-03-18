import { useAuthStore } from '@/entities/auth/model/authStore';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { Heart, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTeamStore } from '@/entities/team/model/teamStore';
import SessionTimeoutDialog from './SessionTimeoutDialog';
import SessionStatus from './SessionStatus';
import TeamSelectModal from './TeamSelectModal';

const navTabs = [
   { label: '티켓/리셀', to: '/tickets' },
   { label: '구단', to: '/teams' },
] as const;

const Header = () => {
   const accessToken = useAuthStore(state => state.accessToken);
   const authExpiresAt = useAuthStore(state => state.authExpiresAt);
   const clearAuth = useAuthStore(state => state.clearAuth);
   const isLoggedIn = !!accessToken;
   const navigate = useNavigate();

   const [teamModalOpen, setTeamModalOpen] = useState(false);
   const [isSessionTimeoutDialogOpen, setIsSessionTimeoutDialogOpen] = useState(false);
   const { selectedTeam, setSelectedTeam } = useTeamStore();

   const handleLogout = () => clearAuth();
   const handleSessionTimeout = () => {
      clearAuth();
      setIsSessionTimeoutDialogOpen(true);
   };

   return (
      <>
         <SessionTimeoutDialog open={isSessionTimeoutDialogOpen} onConfirm={() => setIsSessionTimeoutDialogOpen(false)} />
         <header className="flex flex-col w-full">
            {/* State bar */}
            <div className="bg-background w-full px-4 py-1">
               <div className="flex items-center justify-between w-full max-w-300 mx-auto">
                  <div className="flex items-center gap-1.5">
                     <div className="size-2 rounded-full bg-success" />
                     <span className="text-caption-2-medium text-(--text-tertiary)">혼잡도:</span>
                     <span className="text-caption-2-medium text-success">원활</span>
                  </div>
                  {isLoggedIn && (
                     <SessionStatus
                        authExpiresAt={authExpiresAt}
                        onLogout={handleLogout}
                        onTimeout={handleSessionTimeout}
                     />
                  )}
               </div>
            </div>

            {/* Nav bar */}
            <div className="bg-background shadow-[0px_1px_2px_0px_rgba(13,17,23,0.05)] w-full px-4 flex justify-center">
               <div className="flex items-center gap-5 h-12.5 w-full max-w-300">
                  {/* 로고 */}
                  <Link to="/" className="shrink-0 text-[21px] font-bold tracking-[-0.5px] text-foreground">
                     GoTi
                  </Link>

                  {/* 탭 + 데스크톱 검색바 */}
                  <div className="flex items-center gap-5 flex-1 h-full min-w-0">
                     <div className="flex items-center gap-0.5 h-full shrink-0">
                        {navTabs.map(({ label, to }) => (
                           <NavLink
                              key={to}
                              to={to}
                              end
                              className={({ isActive }) =>
                                 cn(
                                    'flex items-center justify-center h-full px-3 transition-colors',
                                    isActive ? 'border-b-2 border-primary' : '',
                                 )
                              }
                           >
                              {({ isActive }) => (
                                 <span
                                    className={cn(
                                       'text-body-1-bold font-bold',
                                       isActive ? 'text-primary' : 'text-(--text-tertiary)',
                                    )}
                                 >
                                    {label}
                                 </span>
                              )}
                           </NavLink>
                        ))}
                     </div>

                     {/* 검색바 — 데스크톱 전용 */}
                     <div className="desktop-only items-center w-62.5 h-9 border border-border rounded-full bg-background shrink-0">
                        <input
                           className="flex-1 px-5 text-body-2-regular text-(--text-tertiary) bg-transparent outline-none truncate"
                           placeholder="Search"
                        />
                        <div className="pr-3">
                           <Search className="size-4 text-(--text-tertiary)" />
                        </div>
                     </div>
                  </div>

                  {/* 로그인 후 아이콘 — 데스크톱 전용 */}
                  {isLoggedIn && (
                     <div className="hidden lg:flex items-center gap-1.5 shrink-0">
                        <button className="flex items-center justify-center size-9.5 rounded-lg hover:bg-(--fill-hover) transition-colors">
                           <img src="/Icon/Line/Bell.svg" alt="알림" className="size-4.5" />
                        </button>
                        <button
                           className="flex items-center justify-center size-9.5 rounded-lg hover:bg-(--fill-hover) transition-colors"
                           // 마이페이지로 연결
                           onClick={handleLogout}
                           title="마이페이지"
                        >
                           <img src="/Icon/Line/Mypage.svg" alt="마이페이지" className="size-4.5" />
                        </button>
                     </div>
                  )}

                  {/* 로그인 전 버튼 — 데스크톱 */}
                  {!isLoggedIn && (
                     <Button
                        asChild
                        variant="secondary"
                        className="hidden lg:flex shrink-0 w-29.5 h-auto px-3.5 py-1.5 rounded-lg text-body-2-medium text-primary"
                     >
                        <Link to="/auth/login">로그인/회원가입</Link>
                     </Button>
                  )}

                  {/* 로그인 전 버튼 — 모바일 전용 */}
                  {!isLoggedIn && (
                     <Button
                        asChild
                        variant="secondary"
                        className="lg:hidden shrink-0 h-auto px-3.5 py-1.5 rounded-lg text-body-2-medium"
                     >
                        <Link to="/auth/login">로그인/회원가입</Link>
                     </Button>
                  )}
               </div>
            </div>

            {/* Info bar — 모바일: 스크롤 / 데스크톱: justify-between */}
            <div className="flex bg-(--fill-hoveraccent) w-full px-4 py-1 justify-center">
               <div className="flex items-center gap-2.5 h-8 w-full max-w-300">
                  {/* 데스크톱: justify-between 레이아웃 */}
                  <div className="desktop-only flex-1 min-w-0">
                     <div className="flex items-center justify-between w-full">
                        <p className="text-label-3-regular text-primary whitespace-nowrap shrink-0">
                           KBO 공식 티켓 플랫폼 Go-Ti에서 안전한 예매와 리셀을 경험하세요.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                           <Heart className="size-4 text-primary" />
                           <span className="text-label-3-regular text-primary whitespace-nowrap">
                              좋아하는 팀을 설정하고 경기 일정을 빠르게 확인하세요
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* 모바일: 자동 흘러가는 마퀴 */}
                  <div className="lg:hidden flex-1 overflow-hidden min-w-0">
                     <div className="flex animate-marquee items-center w-max gap-12.5">
                        <p className="text-label-3-regular text-primary whitespace-nowrap shrink-0">
                           KBO 공식 티켓 플랫폼 Go-Ti에서 안전한 예매와 리셀을 경험하세요.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                           <Heart className="size-4 text-primary" />
                           <span className="text-label-3-regular text-primary whitespace-nowrap">
                              응원팀을 설정하고 경기 일정을 빠르게 확인하세요
                           </span>
                        </div>
                        {/* 루프를 위한 복제 */}
                        <p className="text-label-3-regular text-primary whitespace-nowrap shrink-0">
                           KBO 공식 티켓 플랫폼 Go-Ti에서 안전한 예매와 리셀을 경험하세요.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                           <Heart className="size-4 text-primary" />
                           <span className="text-label-3-regular text-primary whitespace-nowrap">
                              응원팀을 설정하고 경기 일정을 빠르게 확인하세요
                           </span>
                        </div>
                     </div>
                  </div>

                  <button
                     type="button"
                     className="shrink-0 flex items-center gap-1 px-[11px] py-[5px] bg-white border border-[#cbd9fa] rounded-full hover:border-primary transition-colors"
                     onClick={() => (isLoggedIn ? setTeamModalOpen(true) : navigate('/auth/login'))}
                  >
                     <img
                        src="/Icon/Line/Baseball.svg"
                        alt=""
                        className="size-4 [filter:invert(29%)_sepia(89%)_saturate(1651%)_hue-rotate(213deg)_brightness(97%)_contrast(96%)]"
                     />
                     <span className="text-[14px] font-bold text-primary leading-[1.45] whitespace-nowrap">
                        {selectedTeam ? selectedTeam.name.split(' ')[0] : '팀 선택'}
                     </span>
                  </button>
               </div>
            </div>
         </header>

         <TeamSelectModal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} onSelectTeam={setSelectedTeam} />
      </>
   );
};

export default Header;
