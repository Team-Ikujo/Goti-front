import type { SeatItem, ZoneItem } from './types';

type ZoneSeatState = {
   seatMap: Record<string, SeatItem>;
   selectedSeatIds: string[];
};

type SeatSelectionZonesState = Record<string, ZoneSeatState>;

export type SelectedSeatPaymentSummary = {
   quantity: number;
   seatLabels: string[];
   totalPrice: number;
};

const formatSeatLabel = (zoneName: string, seat: SeatItem) => `${zoneName} ${seat.block}구역 ${seat.rowLabel} ${seat.seatNumber}번`;

export const getSelectedSeatPaymentSummary = (
   zonesState: SeatSelectionZonesState,
   bookingZones: ZoneItem[],
): SelectedSeatPaymentSummary => {
   const selectedSeats = Object.entries(zonesState).flatMap(([zoneId, zoneState]) => {
      const zone = bookingZones.find((item) => item.id === zoneId);

      if (!zone) {
         return [];
      }

      return zoneState.selectedSeatIds
         .map((seatId) => zoneState.seatMap[seatId])
         .filter((seat): seat is SeatItem => Boolean(seat))
         .map((seat) => ({
            label: formatSeatLabel(zone.name, seat),
            price: zone.price,
         }));
   });

   return {
      quantity: selectedSeats.length,
      seatLabels: selectedSeats.map((seat) => seat.label),
      totalPrice: selectedSeats.reduce((total, seat) => total + seat.price, 0),
   };
};
