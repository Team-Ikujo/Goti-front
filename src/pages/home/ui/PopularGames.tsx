import { Calendar, MapPin } from 'lucide-react';

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
      date: '2026.03.15 16:30',
      time: '18:30',
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
         <div className="flex items-center justify-between">
            <h2 className="text-[length:var(--typo---heading\/h3,24px)] font-bold text-(--text-primary) leading-[1.5]">
               인기 경기
            </h2>
         </div>

         {/* 카드 리스트 (가로 스크롤) */}
         <div className="flex gap-6 overflow-x-auto pb-1 scrollbar-hide">
            {cards.map(card => (
               <div
                  key={card.rank}
                  className="flex-shrink-0 w-[300px] border border-(--border-normal) rounded-[14px] overflow-hidden bg-background"
               >
                  {/* 이미지 영역 */}
                  <div className="relative h-[200px] border-b border-(--border-normal) overflow-hidden">
                     <img
                        src={card.image}
                        alt={`${card.away} vs ${card.home}`}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                     />
                     <div className="absolute inset-0 bg-black/20" />
                     {/* 순위 번호 */}
                     <span className="absolute left-[11px] bottom-0 text-[48px] font-bold leading-[1.33] tracking-[-0.05px] text-white">
                        {card.rank}
                     </span>
                  </div>

                  {/* 정보 영역 */}
                  <div className="flex flex-col gap-4 p-6">
                     {/* 팀 매치업 */}
                     <div className="flex items-center justify-between h-7">
                        <span className="w-[70px] text-[18px] font-bold leading-[1.55] text-(--text-primary)">
                           {card.away}
                        </span>
                        <span className="text-[14px] font-bold text-(--text-tertiary)">vs</span>
                        <span className="w-[70px] text-[18px] font-bold leading-[1.55] text-(--text-primary) text-right">
                           {card.home}
                        </span>
                     </div>

                     {/* 날짜/시간 + 장소 */}
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 h-5">
                           <Calendar className="size-4 text-(--text-tertiary) shrink-0" />
                           <div className="flex items-center gap-2.5 text-label-2-medium text-(--text-tertiary)">
                              <span>{card.date}</span>
                              <span className="w-px h-3 bg-(--border-normal)" />
                              <span>{card.time}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 h-5">
                           <MapPin className="size-4 text-(--text-tertiary) shrink-0" />
                           <span className="text-label-2-medium text-(--text-tertiary)">{card.venue}</span>
                        </div>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>
   );
};

export default PopularGames;
