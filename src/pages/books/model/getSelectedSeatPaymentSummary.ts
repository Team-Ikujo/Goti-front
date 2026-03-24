import { formatSelectedSeatLabel, getSelectedSeatDetails, type SeatSelectionZonesState } from './selectedSeats';
import type { ZoneItem } from './types';

export type SelectedSeatPaymentSummary = {
   quantity: number;
   seatLabels: string[];
   totalPrice: number;
};

export const getSelectedSeatPaymentSummary = (
   zonesState: SeatSelectionZonesState,
   bookingZones: ZoneItem[],
): SelectedSeatPaymentSummary => {
   const selectedSeats = getSelectedSeatDetails(zonesState, bookingZones).map((item) => ({
      label: formatSelectedSeatLabel(item.zoneName, item.seat),
      price: item.price,
   }));

   return {
      quantity: selectedSeats.length,
      seatLabels: selectedSeats.map((seat) => seat.label),
      totalPrice: selectedSeats.reduce((total, seat) => total + seat.price, 0),
   };
};
