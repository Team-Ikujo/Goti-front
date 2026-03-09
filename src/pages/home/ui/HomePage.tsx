import HeroBanner from './HeroBanner';
import PopularGames from './PopularGames';
import GameSchedule from './GameSchedule';
import FavoriteTeamMatchCard from './FavoriteTeamMatchCard';
import { useTeamStore } from '@/entities/team/model/teamStore';

const HomePage = () => {
   const selectedTeam = useTeamStore(s => s.selectedTeam);

   return (
      <div className="bg-background">
         <HeroBanner />

         <div className="flex flex-col items-center px-4 pt-7.5 pb-30">
            <div className="w-full max-w-300 flex flex-col gap-7.5">
               {selectedTeam && (
                  <div className="relative z-10 -mt-[52px]">
                     <FavoriteTeamMatchCard team={selectedTeam} />
                  </div>
               )}
               <div className="flex flex-col gap-25">
                  <PopularGames />
                  <GameSchedule />
               </div>
            </div>
         </div>
      </div>
   );
};

export default HomePage;
