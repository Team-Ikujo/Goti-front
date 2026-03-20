import { useNavigate } from 'react-router-dom';
import { teams } from '@/entities/team/model/teams';

const TeamsPage = () => {
   const navigate = useNavigate();

   // isEnabled: true인 팀만 표시 (현재 삼성, KIA)
   const enabledTeams = teams.filter(team => team.isEnabled);

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

               <div className="flex w-full flex-wrap justify-start gap-3">
                  {enabledTeams.map(team => (
                     <button
                        key={team.id}
                        type="button"
                        onClick={() => navigate(`/teams/${team.id}`)}
                        className="flex flex-col items-center justify-center rounded-[10px] border-2 border-[#e5e7eb] bg-[#f9fafb] p-5 w-32.5 hover:border-primary transition-colors"
                     >
                        <div className="flex items-center justify-center w-25 h-25 px-3.75 py-2.5">
                           <img
                              src={team.logoSrc}
                              alt={team.name}
                              className={`w-full h-full object-contain ${team.logoAspectClassName}`}
                           />
                        </div>
                        <span className="text-[18px] font-semibold leading-[1.55] text-[#161d24] text-center whitespace-nowrap mt-1">
                           {team.name}
                        </span>
                     </button>
                  ))}
               </div>
            </div>
         </div>
      </section>
   );
};

export default TeamsPage;
