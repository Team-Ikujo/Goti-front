import type { SeatItem, ZoneItem } from './types';

export type ZoneSeatSelectionState = {
   seatMap: Record<string, SeatItem>;
   selectedSeatIds: string[];
};

export type SeatSelectionZonesState = Record<string, ZoneSeatSelectionState>;

export type SelectedSeatDetail = {
   seat: SeatItem;
   zoneId: string;
   zoneName: string;
   price: number;
};

export const formatSelectedSeatLabel = (zoneName: string, seat: SeatItem) =>
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
         .filter((seat): seat is SeatItem => Boolean(seat))
         .map((seat) => ({
            seat,
            zoneId,
            zoneName: zone.name,
            price: zone.price,
         }));
   });
