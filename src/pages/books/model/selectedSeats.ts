import type { SeatSelectionItem } from '@/entities/seat-selection/model/types';
import type { ZoneItem } from './types';

export type ZoneSeatSelectionState = {
   seatMap: Record<string, SeatSelectionItem>;
   selectedSeatIds: string[];
};

export type SeatSelectionZonesState = Record<string, ZoneSeatSelectionState>;

export type SelectedSeatDetail = {
   seat: SeatSelectionItem;
   zoneId: string;
   zoneName: string;
   price: number;
};

export const formatSelectedSeatLabel = (zoneName: string, seat: SeatSelectionItem) =>
   `${zoneName} ${seat.block}구역 ${seat.rowLabel} ${seat.seatNumber}번`;

export const getSelectedSeatDetails = (
   zonesState: SeatSelectionZonesState,
   bookingZones: ZoneItem[],
): SelectedSeatDetail[] =>
   Object.entries(zonesState).flatMap(([zoneId, zoneState]) => {
      const zone = bookingZones.find((item) => item.id === zoneId);

      if (!zone) {
         return [];
      }

      return zoneState.selectedSeatIds
         .map((seatId) => zoneState.seatMap[seatId])
         .filter((seat): seat is SeatSelectionItem => Boolean(seat))
         .map((seat) => ({
            seat,
            zoneId,
            zoneName: zone.name,
            price: zone.price,
         }));
   });
