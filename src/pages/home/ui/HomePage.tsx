import HeroBanner from './HeroBanner';
import PopularGames from './PopularGames';
import GameSchedule from './GameSchedule';

const HomePage = () => {
   return (
      <div className="bg-background">
         <HeroBanner />
         <div className="flex flex-col items-center px-4 pt-[30px] pb-[120px]">
            <div className="w-full max-w-[1200px] flex flex-col gap-[100px]">
               <PopularGames />
               <GameSchedule />
            </div>
         </div>
      </div>
   );
};

export default HomePage;
