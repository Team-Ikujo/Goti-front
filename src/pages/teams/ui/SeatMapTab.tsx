// src/pages/teams/ui/SeatMapTab.tsx
import { useEffect, useState } from 'react';
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from '@/shared/ui/table';
import type { SeatGradeResponse } from '@/shared/types/game';
import { gameApi } from '../api/gameApi';

// ── 팀별 구장 이미지 ──────────────────────────────────────────────
const STADIUM_SEAT_IMAGE: Record<string, string> = {
   kia: '/baseball/seat/kia.png',
   samsung: '/baseball/seat/samsung.png',
};

// ── 팀별 범례 (API 데이터가 없을 때 사용) ────────────────────────
const KIA_FALLBACK_LEGEND = [
   { color: '#d0514f', name: '챔피언석' },
   { color: '#284785', name: '중앙테이블석(2인, 3인)' },
   { color: '#db58af', name: 'K9석' },
   { color: '#efbc2e', name: 'K8석' },
   { color: '#f26d5b', name: '응원특별석' },
   { color: '#93cb3a', name: 'K5석' },
   { color: '#7b3a99', name: '타이거즈가족석(4인, 6인)' },
   { color: '#0a005f', name: '서프라이즈존' },
   { color: '#5f56b3', name: '훼미리석' },
   { color: '#782e8d', name: '파티석(4인)' },
   { color: '#8b6de9', name: '스카이피크닉석(4인)' },
   { color: '#4a68d4', name: '테이블테이블석' },
   { color: '#9574c1', name: 'EV석' },
   { color: '#6cbe88', name: '외야자유석' },
   { color: '#4f9f72', name: '외야가족석(6인)' },
];

const SAMSUNG_FALLBACK_LEGEND = [
   { color: '#0a58bf', name: '1루 내야지정석' },
   { color: '#145eb8', name: '3루 내야지정석' },
   { color: '#0a8ad8', name: '1루 익사이팅석' },
   { color: '#17a2c7', name: '3루 익사이팅석' },
   { color: '#1f4d93', name: '블루존' },
   { color: '#5b6db2', name: '원정 응원석' },
   { color: '#5a7ee0', name: 'SKY 하단 지정석' },
   { color: '#8aa0e8', name: 'SKY 상단 지정석' },
   { color: '#3aa66b', name: '외야 지정석' },
   { color: '#7bbe43', name: '잔디석' },
   { color: '#234785', name: '중앙 테이블석' },
   { color: '#32559a', name: '1루 테이블석' },
   { color: '#4064b0', name: '3루 테이블석' },
   { color: '#6f5bd3', name: 'SKY 요기보 패밀리존' },
   { color: '#7840c9', name: '파티플로어 라이브석' },
   { color: '#9152d9', name: '루프탑 테이블석' },
   { color: '#a64db3', name: '캠핑존' },
   { color: '#6d7c8f', name: '휠체어석' },
];

const FALLBACK_LEGEND_BY_TEAM: Record<string, typeof KIA_FALLBACK_LEGEND> = {
   kia: KIA_FALLBACK_LEGEND,
   samsung: SAMSUNG_FALLBACK_LEGEND,
};

// ── 팀별 가격표 ──────────────────────────────────────────────────
interface PriceRow {
   seat: string;
   weekday: string;
   weekend: string;
}

interface PriceSection {
   category: string;
   rows: PriceRow[];
}

const KIA_PRICE_TABLE: PriceSection[] = [
   {
      category: '일반석',
      rows: [
         { seat: 'K9', weekday: '16,000', weekend: '20,000' },
         { seat: 'K8', weekday: '14,000', weekend: '18,000' },
         { seat: 'K5', weekday: '12,000', weekend: '16,000' },
         { seat: 'EV석', weekday: '10,000', weekend: '13,000' },
         { seat: '외야자유석', weekday: '10,000', weekend: '13,000' },
      ],
   },
   {
      category: '특별석',
      rows: [
         { seat: '챔피언석', weekday: '50,000', weekend: '60,000' },
         { seat: '중앙테이블석', weekday: '45,000', weekend: '55,000' },
         { seat: '응원특별석', weekday: '15,000', weekend: '19,000' },
         { seat: '타이거즈가족석', weekday: '22,000', weekend: '27,000' },
         { seat: '서프라이즈존', weekday: '25,000', weekend: '30,000' },
         { seat: '훼미리석', weekday: '20,000', weekend: '25,000' },
         { seat: '파티석(4인)', weekday: '25,000', weekend: '30,000' },
         { seat: '스카이피크닉석(4인)', weekday: '20,000', weekend: '25,000' },
         { seat: '테이블테이블석', weekday: '30,000', weekend: '35,000' },
         { seat: '외야가족석(6인)', weekday: '20,000', weekend: '25,000' },
      ],
   },
];

const SAMSUNG_PRICE_TABLE: PriceSection[] = [
   {
      category: '일반석',
      rows: [
         { seat: '1루 내야지정석', weekday: '22,000', weekend: '27,000' },
         { seat: '3루 내야지정석', weekday: '22,000', weekend: '27,000' },
         { seat: 'SKY 하단 지정석', weekday: '18,000', weekend: '22,000' },
         { seat: 'SKY 상단 지정석', weekday: '14,000', weekend: '18,000' },
         { seat: '원정 응원석', weekday: '17,000', weekend: '20,000' },
         { seat: '외야 지정석', weekday: '12,000', weekend: '15,000' },
         { seat: '잔디석', weekday: '10,000', weekend: '13,000' },
         { seat: '휠체어석', weekday: '10,000', weekend: '10,000' },
      ],
   },
   {
      category: '특별석',
      rows: [
         { seat: '1루 익사이팅석', weekday: '28,000', weekend: '33,000' },
         { seat: '3루 익사이팅석', weekday: '28,000', weekend: '33,000' },
         { seat: '블루존', weekday: '20,000', weekend: '25,000' },
         { seat: '중앙 테이블석', weekday: '30,000', weekend: '36,000' },
         { seat: '1루 테이블석', weekday: '30,000', weekend: '36,000' },
         { seat: '3루 테이블석', weekday: '30,000', weekend: '36,000' },
         { seat: 'SKY 요기보 패밀리존', weekday: '36,000', weekend: '42,000' },
         { seat: '파티플로어 라이브석', weekday: '42,000', weekend: '48,000' },
         { seat: '루프탑 테이블석', weekday: '45,000', weekend: '52,000' },
         { seat: '캠핑존', weekday: '50,000', weekend: '58,000' },
      ],
   },
];

const PRICE_TABLE_BY_TEAM: Record<string, PriceSection[]> = {
   kia: KIA_PRICE_TABLE,
   samsung: SAMSUNG_PRICE_TABLE,
};

// ── 컴포넌트 ─────────────────────────────────────────────────────
function useSeatGrades(serverStadiumId: string | undefined) {
   const [grades, setGrades] = useState<SeatGradeResponse[]>([]);

   useEffect(() => {
      if (!serverStadiumId) return;

      gameApi
         .getSeatGrades(serverStadiumId)
         .then(setGrades)
         .catch(err => console.error('좌석 등급 조회 실패:', err));
   }, [serverStadiumId]);

   return grades;
}

interface Props {
   serverStadiumId: string | undefined;
   teamId: string;
}

export function SeatMapTab({ serverStadiumId, teamId }: Props) {
   const grades = useSeatGrades(serverStadiumId);

   const stadiumImage = STADIUM_SEAT_IMAGE[teamId] ?? STADIUM_SEAT_IMAGE.kia;
   const fallbackLegend = FALLBACK_LEGEND_BY_TEAM[teamId] ?? KIA_FALLBACK_LEGEND;
   const priceTable = PRICE_TABLE_BY_TEAM[teamId] ?? KIA_PRICE_TABLE;

   // API 데이터가 있으면 사용, 없으면 팀별 폴백 범례 사용
   const legendItems = grades.length > 0
      ? grades.map(g => ({ color: `#${g.displayColorHex.replace('#', '')}`, name: g.name }))
      : fallbackLegend;

   return (
      <div className="flex flex-col gap-[30px] md:gap-[120px] items-start w-full">
         {/* 좌석도 */}
         <div className="flex flex-col gap-[30px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">좌석도</p>

            <div className="flex flex-col gap-[20px] items-center w-full">
               {/* 구장 좌석 이미지 */}
               <div className="flex flex-col items-start max-w-[700px] p-[10px] w-full">
                  <div className="aspect-square w-full">
                     <img src={stadiumImage} alt="좌석도" className="w-full h-full object-contain" />
                  </div>
               </div>

               {/* 범례 */}
               <div className="bg-background border-2 border-[#e9ebee] flex gap-[10px] items-start max-w-[1000px] overflow-hidden p-[30px] rounded-[8px] w-full">
                  <div className="flex flex-1 flex-col gap-[10px] items-start min-w-0">
                     {legendItems.slice(0, Math.ceil(legendItems.length / 2)).map(item => (
                        <div key={item.name} className="flex gap-[11px] items-center w-full">
                           <div
                              className="rounded-[2px] shrink-0 size-[20px]"
                              style={{ backgroundColor: item.color }}
                           />
                           <span className="text-[14px] font-medium text-foreground leading-[1.5]">
                              {item.name}
                           </span>
                        </div>
                     ))}
                  </div>
                  <div className="flex flex-1 flex-col gap-[10px] items-start min-w-0">
                     {legendItems.slice(Math.ceil(legendItems.length / 2)).map(item => (
                        <div key={item.name} className="flex gap-[11px] items-center w-full">
                           <div
                              className="rounded-[2px] shrink-0 size-[20px]"
                              style={{ backgroundColor: item.color }}
                           />
                           <span className="text-[14px] font-medium text-foreground leading-[1.5]">
                              {item.name}
                           </span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* 가격표 */}
         <div className="flex flex-col gap-[30px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">가격</p>

            <Table className="min-w-[400px] border-collapse">
               <TableHeader>
                  <TableRow className="border-[#d0d6db] hover:bg-transparent">
                     <TableHead className="bg-[#f1f2f4] border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center w-[100px]">
                        구분
                     </TableHead>
                     <TableHead className="bg-[#f1f2f4] border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center">
                        좌석명
                     </TableHead>
                     <TableHead className="bg-[#f1f2f4] border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center">
                        주중 가격
                     </TableHead>
                     <TableHead className="bg-[#f1f2f4] border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center">
                        주말 가격
                     </TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {priceTable.map(section =>
                     section.rows.map((row, i) => (
                        <TableRow
                           key={`${section.category}-${row.seat}`}
                           className={`border-0 ${i % 2 === 1 ? 'bg-[#f4f7fe]' : 'bg-background'}`}
                        >
                           {i === 0 && (
                              <TableCell
                                 className="border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center align-middle"
                                 rowSpan={section.rows.length}
                              >
                                 {section.category}
                              </TableCell>
                           )}
                           <TableCell className="border border-[#d0d6db] p-[10px] text-[16px] font-semibold text-foreground text-center">
                              {row.seat}
                           </TableCell>
                           <TableCell className="border border-[#d0d6db] p-[10px] text-[16px] font-medium text-foreground text-center">
                              {row.weekday}
                           </TableCell>
                           <TableCell className="border border-[#d0d6db] p-[10px] text-[16px] font-medium text-foreground text-center">
                              {row.weekend}
                           </TableCell>
                        </TableRow>
                     )),
                  )}
               </TableBody>
            </Table>
         </div>
      </div>
   );
}
