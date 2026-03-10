export type ZoneHotspot = {
   x: number;
   y: number;
};

export type ZoneItem = {
   id: string;
   name: string;
   price: number;
   remaining: number;
   color: string;
   hotspot: ZoneHotspot[];
   sectionCode: string;
};

export type SeatStatus = 'available' | 'selected' | 'held' | 'disabled';

export type SeatItem = {
   id: string;
   zoneId: string;
   block: string;
   rowLabel: string;
   seatNumber: number;
   x: number;
   y: number;
   status: SeatStatus;
};

export type SeatBlock = {
   id: string;
   label: string;
   rows: number;
   cols: number;
   offsetX: number;
   offsetY: number;
   activeSeats?: string[];
   hiddenSeats?: string[];
};
