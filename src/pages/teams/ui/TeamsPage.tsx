import { useNavigate } from 'react-router-dom';
import { teams } from '@/entities/team/model/teams';

const TeamsPage = () => {
   const navigate = useNavigate();

   const handleTeamClick = (teamId: string) => {
      navigate(`/teams/${teamId}`);
   };

   return (
      <section className="flex-1 bg-background">
         <div className="mx-auto flex w-full max-w-300 flex-col items-center px-4 pt-12.5 pb-30">
            <div className="flex w-full max-w-250 flex-col items-center gap-10">
               <header className="flex w-full flex-col items-center gap-5">
                  <h1 className="text-heading-3-bold text-foreground">구단</h1>
                  <p className="text-body-1-medium text-center text-foreground">
                     각 구단을 선택하시면 <span className="text-destructive">구단별 경기일정</span>을 확인할 수
                     있습니다.
                  </p>
               </header>

               <div className="grid w-full max-w-250 grid-cols-2 gap-3 min-[768px]:grid-cols-5 min-[768px]:gap-x-7.5 min-[768px]:gap-y-7.5 min-[768px]:px-3.75">
                  {teams.map(team => (
                     <button
                        key={team.id}
                        type="button"
                        onClick={() => handleTeamClick(team.id)}
                        disabled={!team.isEnabled}
                        aria-label={`${team.name}${team.isEnabled ? ' 상세 보기' : ' 준비 중'}`}
                        className="relative flex h-51.5 w-full flex-col items-center justify-center overflow-hidden rounded-[10px] border-2 border-solid border-[#e5e7eb] bg-[#f9fafb] p-5 disabled:cursor-not-allowed disabled:opacity-40"
                     >
                        <div className="flex w-32.5 max-w-32.5 flex-col items-start">
                           <div className="relative flex aspect-150/150 w-full flex-col items-center justify-center overflow-hidden px-3.75 py-2.5">
                              <div className={`relative w-full shrink-0 ${team.logoAspectClassName}`}>
                                 <img
                                    src={team.logoSrc}
                                    alt=""
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 size-full max-w-none object-cover"
                                 />
                              </div>
                           </div>
                           <div className="relative flex w-full shrink-0 items-center justify-center overflow-hidden rounded-xs px-13.25 py-1">
                              <span className="text-heading-4-semibold whitespace-nowrap text-foreground">
                                 {team.name}
                              </span>
                           </div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
};

export default TeamsPage;
