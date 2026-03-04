import HeroBanner from './HeroBanner';
import PopularGames from './PopularGames';
import GameSchedule from './GameSchedule';

const HomePage = () => {
   return (
      <div className="bg-background">
         <HeroBanner />
         <div className="flex flex-col items-center px-4 pt-7.5 pb-30">
            <div className="w-full max-w-300 flex flex-col gap-25">
               <PopularGames />
               <GameSchedule />
            </div>
         </div>
      </div>
   );
};

export default HomePage;
