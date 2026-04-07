export type SeatSelectionStatus = 'available' | 'selected' | 'held' | 'disabled';

export type SeatSelectionItem = {
   id: string;
   apiSeatId: string;
   zoneId: string;
   block: string;
   rowLabel: string;
   seatNumber: number;
   x: number;
   y: number;
   status: SeatSelectionStatus;
};
