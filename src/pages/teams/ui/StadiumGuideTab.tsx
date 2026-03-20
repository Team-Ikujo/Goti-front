// src/pages/teams/ui/StadiumGuideTab.tsx
import type { Team } from '@/entities/team/model/types';

interface Props {
   team: Team;
}

function BusBadge({ type }: { type: '간선' | '지선' }) {
   if (type === '간선') {
      return (
         <span className="bg-[#1565c0] flex h-[21px] items-center justify-center overflow-hidden px-[10px] rounded-[15px] shrink-0">
            <span className="text-[13px] font-bold text-white leading-[1.5] whitespace-nowrap">간선</span>
         </span>
      );
   }
   return (
      <span className="border-[1.5px] border-[#2e7d32] flex h-[21px] items-center justify-center overflow-hidden px-[10px] rounded-[15px] shrink-0">
         <span className="text-[13px] font-bold text-[#2e7d32] leading-[1.5] whitespace-nowrap">지선</span>
      </span>
   );
}

export function StadiumGuideTab({ team }: Props) {
   const guide = team.stadiumGuide;

   if (!guide) {
      return (
         <div className="flex items-center justify-center w-full py-20">
            <p className="text-[16px] text-foreground opacity-50">구장 정보가 준비 중입니다.</p>
         </div>
      );
   }

   const stadiumName = guide.info.find(item => item.label === '구장명')?.value ?? '';
   const address = guide.info.find(item => item.label === '주소')?.value ?? '';

   return (
      <div className="flex flex-col gap-[120px] items-start w-full">
         {/* 구장 소개 */}
         <div className="flex flex-col gap-[20px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">구장 소개</p>

            <div className="flex flex-col md:flex-row gap-[20px] md:gap-[50px] items-start w-full">
               {/* 구장 사진 */}
               <div className="bg-background flex flex-1 items-center justify-center max-w-full md:max-w-[700px] overflow-hidden w-full">
                  <div className="aspect-[1090/700] flex-1 relative w-full max-w-[700px] overflow-hidden rounded-[14px]">
                     <img
                        src={guide.stadiumImageSrc}
                        alt={stadiumName}
                        className="absolute inset-0 w-full h-full object-cover"
                     />
                  </div>
               </div>

               {/* 구장 정보 */}
               <div className="flex flex-col gap-[20px] items-start w-full max-w-[700px] md:max-w-none md:w-[300px] md:shrink-0">
                  <div className="h-[6px] bg-foreground w-[150px]" />
                  <p className="text-[22px] font-bold text-foreground leading-[1.55] w-full">{stadiumName}</p>
                  <div className="flex flex-col gap-[10px] items-start w-full">
                     {guide.info.map(({ label, value }) => (
                        <div key={label} className="flex gap-[14px] items-center">
                           <span className="text-[16px] font-medium text-foreground leading-[1.5] w-[50px] shrink-0">
                              {label}
                           </span>
                           <div className="w-[1.5px] h-[14px] bg-black shrink-0" />
                           <span className="text-[16px] font-medium text-foreground leading-[1.5]">{value}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* 구장 위치 안내 */}
         <div className="flex flex-col gap-[20px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">구장 위치 안내</p>

            <div className="flex flex-col md:flex-row gap-[20px] md:gap-[50px] items-start w-full">
               {/* 지도 이미지 */}
               <div className="flex flex-1 flex-col items-center max-w-full md:max-w-[700px] overflow-hidden w-full">
                  <div className="aspect-[960/480] relative w-full max-w-[700px]">
                     <img
                        src={guide.mapImageSrc}
                        alt="구장 위치 지도"
                        className="absolute inset-0 w-full h-full object-cover"
                     />
                  </div>
               </div>

               {/* 오시는 길 */}
               <div className="flex flex-col gap-[20px] items-start w-full max-w-[700px] md:max-w-none md:w-[300px] md:shrink-0">
                  <div className="h-[6px] bg-foreground w-[150px]" />
                  <p className="text-[22px] font-bold text-foreground leading-[1.55]">오시는 길</p>
                  <div className="flex gap-[14px] items-center">
                     <span className="text-[16px] font-medium text-foreground leading-[1.5] whitespace-nowrap">
                        주소
                     </span>
                     <div className="w-px h-[14px] bg-[#d0d6db] shrink-0" />
                     <span className="text-[16px] font-medium text-foreground leading-[1.5]">{address}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* 찾아오시는 길 */}
         <div className="flex flex-col gap-[20px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">찾아오시는 길</p>

            <div className="flex flex-col items-center gap-[20px] w-full md:relative md:block">
               {/* 제목 라벨 */}
               <div className="bg-[#e9ebee] flex flex-col md:flex-row items-center gap-[10px] px-[20px] py-[4px] rounded-[20px] w-full max-w-[460px] md:absolute md:top-0 md:left-[32px] md:z-10 md:max-w-none md:w-auto md:flex-nowrap">
                  <span className="text-[22px] font-medium text-foreground leading-[1.55] text-center">
                     {stadiumName} 방면
                  </span>
                  <span className="text-[22px] font-bold text-foreground leading-[1.55]">시내 버스 정류장</span>
               </div>

               {/* 버스 정류장 카드 그리드 */}
               <div className="border-[3px] border-[#e9ebee] overflow-hidden pb-[30px] pt-[30px] md:mt-[21px] md:pt-[50px] px-[30px] rounded-[20px] w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[30px] gap-y-[20px]">
                     {guide.busStops.map(stop => (
                        <div
                           key={stop.name}
                           className="bg-[#f4f7fe] border-2 border-[#cbd9fa] flex items-start overflow-hidden p-[20px] rounded-[30px]"
                        >
                           <div className="flex flex-col gap-[6px] items-start w-full">
                              <p className="text-[16px] font-semibold text-foreground leading-[1.5] w-full">
                                 {stop.name}
                              </p>
                              <div className="flex flex-col gap-[4px] items-start w-full">
                                 {stop.buses.map((bus, i) => (
                                    <div key={i} className="flex gap-[5px] items-start w-full">
                                       <BusBadge type={bus.type} />
                                       <span className="text-[14px] font-medium text-foreground leading-[1.5]">
                                          {bus.routes}
                                       </span>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
