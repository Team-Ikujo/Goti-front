// src/pages/teams/ui/SeatMapTab.tsx
import { useEffect, useState } from 'react';
import seatMapImg from '@/shared/ui/image/스크린샷 2026-02-10 오전 9.34.37 1.png';
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

// stadiumId가 없을 때 보여줄 폴백 범례
const FALLBACK_LEGEND = [
   { color: '#d0514f', name: '챔피언석' },
   { color: '#284785', name: '중앙테이블석(2인, 3인)' },
   { color: '#db58af', name: 'K9석' },
   { color: '#efbc2e', name: 'K8석' },
   { color: '#ea0029', name: '응원특별석' },
   { color: '#93cb3a', name: 'K5석' },
   { color: '#5e9649', name: '타이거즈가족석(4인, 6인)' },
   { color: '#df7242', name: '서프라이즈존' },
   { color: '#8f7256', name: '휠체어석' },
   { color: '#85c1dc', name: '파티석(4인)' },
   { color: '#4e499a', name: '스카이피크닉석(4인)' },
   { color: '#09005d', name: '메디힐테이블석' },
   { color: '#9574c1', name: 'EV석' },
   { color: '#ccac56', name: '외야자유석' },
   { color: '#6cbe88', name: '외야가족석(6인)' },
];

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

interface PriceRow {
   seat: string;
   weekday: string;
   weekend: string;
}

interface PriceSection {
   category: string;
   rows: PriceRow[];
}

const PRICE_TABLE: PriceSection[] = [
   {
      category: '일반석',
      rows: [
         { seat: 'K9', weekday: '16,000', weekend: '20,000' },
         { seat: 'K8', weekday: '14,000', weekend: '18,000' },
         { seat: 'K5', weekday: '12,000', weekend: '16,000' },
         { seat: 'EV석', weekday: '10,000', weekend: '13,000' },
         { seat: '외야', weekday: '10,000', weekend: '13,000' },
      ],
   },
   {
      category: '특별석',
      rows: [
         { seat: '스카이박스', weekday: '75,000', weekend: '85,000' },
         { seat: '챔피언석', weekday: '50,000', weekend: '60,000' },
         { seat: '중앙테이블석', weekday: '45,000', weekend: '55,000' },
         { seat: '메디힐테이블석', weekday: '30,000', weekend: '35,000' },
         { seat: '파티석 (4층)', weekday: '25,000', weekend: '30,000' },
         { seat: '타이거즈가족석', weekday: '22,000', weekend: '27,000' },
         { seat: '스카이피크닉석', weekday: '20,000', weekend: '25,000' },
         { seat: '외야가족석', weekday: '20,000', weekend: '25,000' },
         { seat: '서프라이즈석', weekday: '25,000', weekend: '30,000' },
         { seat: '응원특별석', weekday: '15,000', weekend: '19,000' },
         { seat: '휠체어석', weekday: '4,000', weekend: '5,000' },
         { seat: 'K9 중증장애인석', weekday: '4,000', weekend: '5,000' },
      ],
   },
];

interface Props {
   serverStadiumId: string | undefined;
}

export function SeatMapTab({ serverStadiumId }: Props) {
   const grades = useSeatGrades(serverStadiumId);

   // API 데이터가 있으면 사용, 없으면 폴백 범례 사용
   const legendItems = grades.length > 0
      ? grades.map(g => ({ color: `#${g.displayColorHex.replace('#', '')}`, name: g.name }))
      : FALLBACK_LEGEND;

   return (
      <div className="flex flex-col gap-[30px] md:gap-[120px] items-start w-full">
         {/* 좌석도 */}
         <div className="flex flex-col gap-[30px] items-start w-full">
            <p className="text-[24px] font-bold text-foreground leading-[1.5]">좌석도</p>

            <div className="flex flex-col gap-[20px] items-center w-full">
               {/* 좌석 이미지 */}
               <div className="flex flex-col items-start max-w-[700px] p-[10px] w-full">
                  <div className="aspect-square w-full">
                     <img src={seatMapImg} alt="좌석도" className="w-full h-full object-contain" />
                  </div>
               </div>

               {/* 범례 */}
               <div className="bg-background border-2 border-[#e9ebee] flex gap-[10px] items-start max-w-[1000px] overflow-hidden p-[30px] rounded-[8px] w-full">
                  <div className="flex flex-1 flex-col gap-[10px] items-start min-w-0">
                     {legendItems.slice(0, 8).map(item => (
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
                     {legendItems.slice(8).map(item => (
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
                  {PRICE_TABLE.map(section =>
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
