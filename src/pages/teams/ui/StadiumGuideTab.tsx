// src/pages/teams/ui/StadiumGuideTab.tsx
import stadiumImg from '@/shared/ui/image/image 195.png';
import mapImg from '@/shared/ui/image/스크린샷 2026-02-10 오전 9.48.52 1.png';

const STADIUM_INFO = [
   { label: '구장명', value: '광주 - 기아 챔피언스 필드' },
   { label: '주소', value: '광주 북구 서림로 10' },
   { label: '좌석수', value: '관람석 20,500석' },
   { label: '총면적', value: '57,646㎡' },
   { label: '규모', value: '지하 2층 지상 5층' },
   { label: '펜스', value: '좌 · 우 99m, 중 121m' },
   { label: '특징', value: '국내 최초 개방형 야구장' },
];

interface BusStop {
   name: string;
   buses: { type: '간선' | '지선'; routes: string }[];
}

const BUS_STOPS: BusStop[] = [
   {
      name: '제2광천교 4509',
      buses: [
         { type: '간선', routes: '상무64, 228' },
         { type: '지선', routes: '매월26, 일곡38, 송암47, 상무64, 228' },
      ],
   },
   {
      name: '무등야구장 4439',
      buses: [
         { type: '간선', routes: '송정98, 228, 임곡89' },
         { type: '지선', routes: '일곡38' },
      ],
   },
   {
      name: '광주기아챔피언스필드 4490, 1780048',
      buses: [
         { type: '간선', routes: '매월16, 운림51, 첨단95' },
         { type: '지선', routes: '일곡38, 녹진100, 마령100, 장성100, 진원100' },
      ],
   },
   {
      name: '광주기아챔피언스필드 정문 4491',
      buses: [{ type: '간선', routes: '매월16' }],
   },
   {
      name: '임동주공아파트 4667',
      buses: [{ type: '간선', routes: '용전84' }],
   },
];

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

export function StadiumGuideTab() {
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
                        src={stadiumImg}
                        alt="광주 기아 챔피언스 필드"
                        className="absolute inset-0 w-full h-full object-cover"
                     />
                  </div>
               </div>

               {/* 구장 정보 */}
               <div className="flex flex-col gap-[20px] items-start w-full max-w-[700px] md:max-w-none md:w-[300px] md:shrink-0">
                  <div className="h-[6px] bg-foreground w-[150px]" />
                  <p className="text-[22px] font-bold text-foreground leading-[1.55] w-full">
                     광주 - 기아 챔피언스 필드
                  </p>
                  <div className="flex flex-col gap-[10px] items-start w-full">
                     {STADIUM_INFO.map(({ label, value }) => (
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
                     <img src={mapImg} alt="구장 위치 지도" className="absolute inset-0 w-full h-full object-cover" />
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
                     <span className="text-[16px] font-medium text-foreground leading-[1.5]">광주 북구 서림로 10</span>
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
                     광주 - 기아 챔피언스 필드 방면
                  </span>
                  <span className="text-[22px] font-bold text-foreground leading-[1.55]">시내 버스 정류장</span>
               </div>

               {/* 버스 정류장 카드 그리드 */}
               <div className="border-[3px] border-[#e9ebee] overflow-hidden pb-[30px] pt-[30px] md:mt-[21px] md:pt-[50px] px-[30px] rounded-[20px] w-full">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-[30px] gap-y-[20px]">
                     {BUS_STOPS.map(stop => (
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
