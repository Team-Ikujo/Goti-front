import { ListCard } from '@/shared/ui/list-card';

type GameCard = {
   rank: number;
   image: string;
   away: string;
   home: string;
   date: string;
   time: string;
   venue: string;
};

const cards: GameCard[] = [
   {
      rank: 1,
      image: 'https://www.figma.com/api/mcp/asset/1a6555e7-4bda-4f96-94cd-9c9c812bf65f',
      away: 'KIA',
      home: '삼성',
      date: '2026.03.15',
      time: '16:30',
      venue: '잠실 야구장',
   },
   {
      rank: 2,
      image: 'https://www.figma.com/api/mcp/asset/0c96e05e-2230-48c5-952b-152472e974c8',
      away: '한화',
      home: '롯데',
      date: '2026.03.25',
      time: '17:30',
      venue: '한화생명 이글스 파크',
   },
   {
      rank: 3,
      image: 'https://www.figma.com/api/mcp/asset/7929e178-d1f6-4c74-b43c-93f42d7850d0',
      away: '한화',
      home: '롯데',
      date: '2026.03.25',
      time: '17:00',
      venue: '한화생명 이글스파크',
   },
   {
      rank: 4,
      image: 'https://www.figma.com/api/mcp/asset/698d5a60-015b-4efa-9b6f-25f8e4d416dc',
      away: '삼성',
      home: 'LG',
      date: '2026.03.02',
      time: '18:00',
      venue: '대구 삼성라이온즈파크',
   },
   {
      rank: 5,
      image: 'https://www.figma.com/api/mcp/asset/119dc022-9c0b-412e-95b4-88c71cf1aa1e',
      away: '한화',
      home: 'KT',
      date: '2026.03.25',
      time: '18:00',
      venue: '수원KT위즈파크',
   },
];

const PopularGames = () => {
   return (
      <section className="flex flex-col gap-5 w-full">
         {/* 헤더 */}
         <h2 className="text-heading-1-bold text-foreground">인기 경기</h2>

         {/* 카드 리스트 (가로 스크롤) */}
         <div className="flex gap-6 overflow-x-auto pb-1">
            {cards.map(card => (
               <ListCard
                  key={card.rank}
                  className="shrink-0"
                  rank={String(card.rank)}
                  team1={card.away}
                  team2={card.home}
                  date={card.date}
                  time={card.time}
                  location={card.venue}
                  imageSrc={card.image}
                  imageAlt={`${card.away} vs ${card.home}`}
               />
            ))}
         </div>
      </section>
   );
};

export default PopularGames;
