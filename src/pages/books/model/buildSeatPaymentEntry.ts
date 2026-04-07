import type { BotReport } from '@/shared/lib/botDetector';
import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import type { ResellListingItem } from './resellData';

export const buildResellPaymentEntry = ({
   bookingEntryState,
   botData,
   holdId,
   listing,
}: {
   bookingEntryState: BookingEntryState | null;
   botData?: BotReport;
   holdId: string | null;
   listing: ResellListingItem;
}) => ({
   buyerId: bookingEntryState?.userId,
   listingId: listing.listingId,
   holdId,
   queueTokenJti: bookingEntryState?.queueTokenJti,
   sellerId: listing.sellerId,
   settlementAmount: listing.settlementAmount,
   totalAmount: listing.totalAmount,
   totalBuyerFee: listing.totalBuyerFee,
   totalSellerFee: listing.totalSellerFee,
   seatInfo: listing.seatInfo,
   matchTitle: bookingEntryState?.matchTitle,
   venue: bookingEntryState?.venue,
   dateTime: bookingEntryState?.dateTime,
   turnstileToken: bookingEntryState?.turnstileToken,
   botData,
});
