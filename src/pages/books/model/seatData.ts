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
      offsetY: 86,
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
      offsetY: 86,
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
      offsetY: 86,
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
      offsetY: 86,
      activeSeats: [...seatsOf(2, range(0, 3)), ...seatsOf(3, range(0, 3)), ...seatsOf(4, range(0, 3))],
   },
];

const BLOCK_BY_ZONE: Partial<Record<ZoneItem['id'], SeatBlock[]>> = {
   skybox: DEFAULT_BLOCKS,
   champion: DEFAULT_BLOCKS,
   'center-table': DEFAULT_BLOCKS,
   'mediheal-table': DEFAULT_BLOCKS,
   party: DEFAULT_BLOCKS,
   family: DEFAULT_BLOCKS,
   k9: DEFAULT_BLOCKS,
   k8: DEFAULT_BLOCKS,
   k5: DEFAULT_BLOCKS,
   ev: DEFAULT_BLOCKS,
   outfield: DEFAULT_BLOCKS,
};

const buildSeatStatus = (activeSeats: Set<string>, rowIndex: number, colIndex: number): SeatStatus => {
   return activeSeats.has(`${rowIndex}-${colIndex}`) ? 'available' : 'disabled';
};

export const getSeatBlocks = (zoneId: ZoneItem['id']) => BLOCK_BY_ZONE[zoneId] ?? DEFAULT_BLOCKS;

export const createSeatsForZone = (zone: ZoneItem): SeatItem[] => {
   return getSeatBlocks(zone.id).flatMap((block) => {
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
