import type { SeatBlock, SeatItem, SeatStatus, ZoneItem } from './types';

// 블록을 수평으로 자동 배치 (좌석 간격 20px, 블록 간 30px 여백)
const makeBlocks = (configs: Array<{ rows: number; cols: number }>): SeatBlock[] => {
   let offsetX = 0;
   return configs.map(({ rows, cols }, i) => {
      const block: SeatBlock = {
         id: `block-${i}`,
         label: `block-${i}`,
         rows,
         cols,
         offsetX,
         offsetY: 0,
      };
      offsetX += cols * 20 + 30;
      return block;
   });
};

// KIA 챔피언스필드 구역별 블록 (rows × cols 는 제공된 좌석 데이터 기준)
const KIA_ZONE_BLOCKS: Record<string, SeatBlock[]> = {
   champion: makeBlocks([
      { rows: 20, cols: 20 }, // A-1: 400
      { rows: 20, cols: 20 }, // A-2: 400
      { rows: 20, cols: 20 }, // A-3: 400
   ]),
   'center-table': makeBlocks([
      { rows: 13, cols: 50 }, // B-1: 650
      { rows: 14, cols: 50 }, // B-2: 700
      { rows: 13, cols: 50 }, // B-3: 650
   ]),
   k9: makeBlocks([
      { rows: 20, cols: 45 }, // 112: 900
      { rows: 20, cols: 45 }, // 117: 900
   ]),
   k8: makeBlocks([
      { rows: 20, cols: 25 }, // 108: 500
      { rows: 20, cols: 25 }, // 109: 500
      { rows: 20, cols: 25 }, // 110: 500
      { rows: 20, cols: 25 }, // 111: 500
   ]),
   'cheering-special': makeBlocks([
      { rows: 20, cols: 25 }, // 118: 500
      { rows: 20, cols: 25 }, // 119: 500
      { rows: 20, cols: 25 }, // 120: 500
      { rows: 20, cols: 25 }, // 121: 500
      { rows: 20, cols: 25 }, // 122: 500
      { rows: 20, cols: 25 }, // 123: 500
   ]),
   k5: makeBlocks([
      { rows: 20, cols: 21 }, // 104: 420
      { rows: 20, cols: 21 }, // 105: 420
      { rows: 20, cols: 21 }, // 106: 420
      { rows: 20, cols: 21 }, // 124: 420
      { rows: 20, cols: 21 }, // 125: 410 (≈21열)
      { rows: 20, cols: 21 }, // 126: 410 (≈21열)
   ]),
   'tigers-family': makeBlocks([
      { rows: 15, cols: 50 }, // H-1: 750
      { rows: 15, cols: 50 }, // H-2: 750
   ]),
   'surprise-zone': makeBlocks([
      { rows: 20, cols: 30 }, // G-1: 600
      { rows: 20, cols: 30 }, // G-2: 600
   ]),
   'family-seat': makeBlocks([
      { rows: 18, cols: 20 }, // 504: 360
      { rows: 18, cols: 20 }, // 505: 360
      { rows: 18, cols: 20 }, // 506: 360
      { rows: 18, cols: 20 }, // 507: 360
      { rows: 18, cols: 20 }, // 508: 360
   ]),
   party: makeBlocks([
      { rows: 10, cols: 20 }, // J-1: 200
      { rows: 10, cols: 20 }, // J-2: 200
      { rows: 10, cols: 20 }, // J-3: 200
      { rows: 10, cols: 20 }, // J-4: 200
      { rows: 10, cols: 20 }, // J-5: 200
      { rows: 10, cols: 20 }, // J-6: 200
   ]),
   'sky-picnic': makeBlocks([
      { rows: 10, cols: 20 }, // 519: 200
      { rows: 10, cols: 20 }, // 520: 200
      { rows: 10, cols: 20 }, // 521: 200
      { rows: 10, cols: 20 }, // 522: 200
      { rows: 10, cols: 20 }, // 523: 200
   ]),
   'table-table': makeBlocks([
      { rows: 10, cols: 25 }, // 530: 250
      { rows: 10, cols: 25 }, // 531: 250
      { rows: 10, cols: 25 }, // 532: 250
      { rows: 10, cols: 25 }, // 533: 250
      { rows: 10, cols: 25 }, // 534: 250
      { rows: 10, cols: 25 }, // 535: 250
   ]),
   ev: makeBlocks([
      { rows: 10, cols: 25 }, // 509: 250
      { rows: 10, cols: 25 }, // 510: 250
      { rows: 10, cols: 25 }, // 527: 250
      { rows: 10, cols: 25 }, // 528: 250
   ]),
   'outfield-free': makeBlocks([
      { rows: 20, cols: 25 }, // O-1: 500
      { rows: 20, cols: 25 }, // O-2: 500
      { rows: 20, cols: 25 }, // O-3: 500
      { rows: 20, cols: 25 }, // O-4: 500
   ]),
   'outfield-family': makeBlocks([
      { rows: 13, cols: 50 }, // P-1: 650
      { rows: 13, cols: 50 }, // P-2: 650
   ]),
};

// 삼성 라이온즈파크 구역별 블록
const SAMSUNG_ZONE_BLOCKS: Record<string, SeatBlock[]> = {
   'samsung-first-base-infield': makeBlocks([
      { rows: 20, cols: 25 }, // 1-6: 500
      { rows: 20, cols: 25 }, // 1-7: 490 (≈25열)
      { rows: 20, cols: 24 }, // 1-8: 470 (≈24열)
      { rows: 20, cols: 23 }, // 1-9: 460
      { rows: 18, cols: 25 }, // 1-10: 450
      { rows: 18, cols: 24 }, // 1-11: 430 (≈24열)
   ]),
   'samsung-third-base-infield': makeBlocks([
      { rows: 20, cols: 23 }, // 3-6: 460
      { rows: 18, cols: 25 }, // 3-7: 450
      { rows: 20, cols: 22 }, // 3-8: 440
      { rows: 18, cols: 24 }, // 3-9: 430 (≈24열)
      { rows: 20, cols: 21 }, // 3-10: 420
      { rows: 20, cols: 20 }, // 3-11: 400
   ]),
   'samsung-first-base-exciting': makeBlocks([
      { rows: 10, cols: 25 }, // 1-1: 250
      { rows: 14, cols: 20 }, // 1-2: 280
      { rows: 16, cols: 20 }, // 1-3: 320
      { rows: 17, cols: 20 }, // 1-4: 340
      { rows: 16, cols: 20 }, // 1-5: 310 (≈16열)
   ]),
   'samsung-third-base-exciting': makeBlocks([
      { rows: 20, cols: 21 }, // 3E-1: 420
      { rows: 18, cols: 25 }, // 3E-2: 450
      { rows: 18, cols: 24 }, // 3E-3: 430 (≈24열)
   ]),
   'samsung-blue-zone': makeBlocks([
      { rows: 10, cols: 25 }, // 3-1: 250
      { rows: 14, cols: 20 }, // 3-2: 280
      { rows: 20, cols: 22 }, // 3-3: 440
      { rows: 14, cols: 20 }, // 3-4: 280
      { rows: 10, cols: 25 }, // 3-5: 250
   ]),
   'samsung-away-zone': makeBlocks([
      { rows: 10, cols: 18 }, // S1: 180
      { rows: 10, cols: 19 }, // S2: 190
      { rows: 10, cols: 20 }, // S3: 200
      { rows: 10, cols: 21 }, // S4: 210
      { rows: 10, cols: 21 }, // S5: 210
      { rows: 10, cols: 21 }, // S6: 210
   ]),
   // SKY 하단: S7~S10(8×20=160), S11~S22(8×20=160, ≈155)
   'samsung-sky-lower': makeBlocks(Array.from({ length: 16 }, () => ({ rows: 8, cols: 20 }))),
   // SKY 상단: U1~U24 각 5×25=125
   'samsung-sky-upper': makeBlocks(Array.from({ length: 24 }, () => ({ rows: 5, cols: 25 }))),
   // 외야 지정석: LF-1~LF-10, RF-1~RF-10 각 7×25=175
   'samsung-outfield': makeBlocks(Array.from({ length: 20 }, () => ({ rows: 7, cols: 25 }))),
   'samsung-grass': makeBlocks([
      { rows: 20, cols: 22 }, // GR-1: 440
      { rows: 20, cols: 22 }, // GR-2: 430 (≈22열)
      { rows: 20, cols: 22 }, // GR-3: 430 (≈22열)
   ]),
   'samsung-center-table': makeBlocks([
      { rows: 10, cols: 34 }, // CT-1: 340
      { rows: 10, cols: 33 }, // CT-2: 330
      { rows: 10, cols: 33 }, // CT-3: 330
   ]),
   'samsung-first-base-table': makeBlocks([
      { rows: 10, cols: 35 }, // 1T-1: 350
      { rows: 10, cols: 35 }, // 1T-2: 350
   ]),
   'samsung-third-base-table': makeBlocks([
      { rows: 10, cols: 35 }, // 3T-1: 350
      { rows: 10, cols: 35 }, // 3T-2: 350
   ]),
   'samsung-yogibo-family': makeBlocks([
      { rows: 5, cols: 30 }, // YG-1: 150
      { rows: 5, cols: 30 }, // YG-2: 150
   ]),
   'samsung-party-floor': makeBlocks([
      { rows: 5, cols: 30 }, // PF-1: 150
      { rows: 5, cols: 30 }, // PF-2: 150
   ]),
   'samsung-rooftop-table': makeBlocks([
      { rows: 5, cols: 40 }, // RT-1: 200
   ]),
   'samsung-camping-zone': makeBlocks([
      { rows: 5, cols: 40 }, // CP-1: 200
   ]),
   'samsung-wheelchair': makeBlocks([
      { rows: 10, cols: 20 }, // WC-1: 200
      { rows: 10, cols: 20 }, // WC-2: 200
   ]),
};

const BLOCK_BY_ZONE: Partial<Record<ZoneItem['id'], SeatBlock[]>> = {
   ...KIA_ZONE_BLOCKS,
   ...SAMSUNG_ZONE_BLOCKS,
};

// activeSeats가 null이면 전체 좌석 available, Set이면 해당 좌석만 available
const buildSeatStatus = (activeSeats: Set<string> | null, rowIndex: number, colIndex: number): SeatStatus => {
   if (activeSeats === null) return 'available';
   return activeSeats.has(`${rowIndex}-${colIndex}`) ? 'available' : 'disabled';
};

const expandSectionCodes = (sectionCode: string) => {
   return sectionCode
      .split(',')
      .flatMap((token) => {
         const trimmedToken = token.trim();

         if (!trimmedToken) {
            return [];
         }

         if (!trimmedToken.includes('~')) {
            return [trimmedToken];
         }

         const [start, end] = trimmedToken.split('~');

         if (!start || !end) {
            return [trimmedToken];
         }

         const startMatch = start.match(/^(.*?)(\d+)$/);
         const endMatch = end.match(/^(.*?)(\d+)$/);

         if (!startMatch || !endMatch || startMatch[1] !== endMatch[1]) {
            return [trimmedToken];
         }

         const prefix = startMatch[1];
         const startNumber = Number(startMatch[2]);
         const endNumber = Number(endMatch[2]);

         if (Number.isNaN(startNumber) || Number.isNaN(endNumber) || startNumber > endNumber) {
            return [trimmedToken];
         }

         const width = startMatch[2].length;

         return Array.from({ length: endNumber - startNumber + 1 }, (_, index) => {
            return `${prefix}${String(startNumber + index).padStart(width, '0')}`;
         });
      })
      .filter(Boolean);
};

const applySectionLabelsToBlocks = (blocks: SeatBlock[], sectionCode: string) => {
   const labels = expandSectionCodes(sectionCode);

   if (labels.length === 0) {
      return blocks;
   }

   return blocks.slice(0, labels.length).map((block, index) => {
      const label = labels[index];

      return {
         ...block,
         id: label,
         label,
      };
   });
};

export const getSeatBlocks = (zone: ZoneItem) => {
   const baseBlocks = BLOCK_BY_ZONE[zone.id] ?? makeBlocks([{ rows: 20, cols: 25 }]);

   return applySectionLabelsToBlocks(baseBlocks, zone.sectionCode);
};

export const createSeatsForZone = (zone: ZoneItem): SeatItem[] => {
   return getSeatBlocks(zone).flatMap((block) => {
      const hiddenSeats = new Set(block.hiddenSeats ?? []);
      // activeSeats 미정의 시 전체 좌석 available 처리
      const activeSeats = block.activeSeats !== undefined ? new Set(block.activeSeats) : null;

      return Array.from({ length: block.rows * block.cols }, (_, index) => {
         const rowIndex = Math.floor(index / block.cols);
         const colIndex = index % block.cols;
         const seatKey = `${rowIndex}-${colIndex}`;

         if (hiddenSeats.has(seatKey)) {
            return null;
         }

         return {
            id: `${zone.id}-${block.id}-${rowIndex + 1}-${colIndex + 1}`,
            apiSeatId: `${zone.id}-${block.id}-${rowIndex + 1}-${colIndex + 1}`,
            zoneId: zone.id,
            block: block.id,
            rowLabel: `${rowIndex + 1}열`,
            seatNumber: colIndex + 1,
            x: block.offsetX + colIndex * 20,
            y: block.offsetY + rowIndex * 20,
            status: buildSeatStatus(activeSeats, rowIndex, colIndex),
         } satisfies SeatItem;
      }).filter((seat): seat is SeatItem => seat !== null);
   });
};
