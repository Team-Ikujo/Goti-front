import type { SeatBlock, SeatItem, SeatStatus, ZoneItem } from './types';

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

const seatsOf = (row: number, seats: number[]) => seats.map((seat) => `${row}-${seat}`);

const DEFAULT_BLOCKS: SeatBlock[] = [
   {
      id: '110',
      label: '110',
      rows: 20,
      cols: 14,
      offsetX: 86,
      offsetY: 200,
      activeSeats: [
         ...seatsOf(2, range(0, 13)),
         ...seatsOf(3, range(0, 13)),
         ...seatsOf(4, range(0, 13)),
         ...seatsOf(5, range(6, 9)),
         ...seatsOf(6, [2]),
      ],
   },
   {
      id: '109',
      label: '109',
      rows: 20,
      cols: 14,
      offsetX: 372,
      offsetY: 200,
      activeSeats: [
         ...seatsOf(0, [6, 7]),
         ...seatsOf(1, [3]),
         ...seatsOf(2, [7, 8, 9, 10]),
         ...seatsOf(4, range(0, 13)),
         ...seatsOf(5, range(0, 13)),
         ...seatsOf(6, range(0, 13)),
         ...seatsOf(7, range(0, 13)),
         ...seatsOf(8, range(0, 13)),
         ...seatsOf(9, range(0, 13)),
         ...seatsOf(10, range(0, 13)),
         ...seatsOf(11, range(0, 13)),
         ...seatsOf(12, range(0, 13)),
         ...seatsOf(13, range(0, 13)),
      ],
   },
   {
      id: '108',
      label: '108',
      rows: 20,
      cols: 14,
      offsetX: 658,
      offsetY: 200,
      activeSeats: [
         ...seatsOf(2, range(0, 13)),
         ...seatsOf(3, range(0, 13)),
         ...seatsOf(4, range(0, 13)),
         ...seatsOf(5, range(6, 9)),
         ...seatsOf(6, [2]),
      ],
   },
   {
      id: '107',
      label: '107',
      rows: 20,
      cols: 4,
      offsetX: 944,
      offsetY: 200,
      activeSeats: [...seatsOf(2, range(0, 3)), ...seatsOf(3, range(0, 3)), ...seatsOf(4, range(0, 3))],
   },
];

const BLOCK_BY_ZONE: Partial<Record<ZoneItem['id'], SeatBlock[]>> = {
   champion: DEFAULT_BLOCKS,
   'center-table': DEFAULT_BLOCKS,
   'cheering-special': DEFAULT_BLOCKS,
   party: DEFAULT_BLOCKS,
   'tigers-family': DEFAULT_BLOCKS,
   'surprise-zone': DEFAULT_BLOCKS,
   'family-seat': DEFAULT_BLOCKS,
   k9: DEFAULT_BLOCKS,
   k8: DEFAULT_BLOCKS,
   k5: DEFAULT_BLOCKS,
   'sky-picnic': DEFAULT_BLOCKS,
   'table-table': DEFAULT_BLOCKS,
   ev: DEFAULT_BLOCKS,
   'outfield-free': DEFAULT_BLOCKS,
   'outfield-family': DEFAULT_BLOCKS,
};

const buildSeatStatus = (activeSeats: Set<string>, rowIndex: number, colIndex: number): SeatStatus => {
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
   const baseBlocks = BLOCK_BY_ZONE[zone.id] ?? DEFAULT_BLOCKS;

   return applySectionLabelsToBlocks(baseBlocks, zone.sectionCode);
};

export const createSeatsForZone = (zone: ZoneItem): SeatItem[] => {
   return getSeatBlocks(zone).flatMap((block) => {
      const hiddenSeats = new Set(block.hiddenSeats ?? []);
      const activeSeats = new Set(block.activeSeats ?? []);

      return Array.from({ length: block.rows * block.cols }, (_, index) => {
         const rowIndex = Math.floor(index / block.cols);
         const colIndex = index % block.cols;
         const seatKey = `${rowIndex}-${colIndex}`;

         if (hiddenSeats.has(seatKey)) {
            return null;
         }

         return {
            id: `${zone.id}-${block.id}-${rowIndex + 1}-${colIndex + 1}`,
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
