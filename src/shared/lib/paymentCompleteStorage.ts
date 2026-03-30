export type StoredPaymentCompleteItem = {
   orderType?: 'ticket' | 'resale';
   orderId?: string;
   orderNumber: string;
   gameTitle: string;
   gameDate: string;
   gameVenue: string;
   quantity: number;
   seats: string[];
   paymentMethod: string;
   orderedAt: string;
   amount: number;
   orderStatus?: string;
   paymentStatus?: string;
   paidAt?: string;
   resaleListingId?: string;
};

const PAYMENT_COMPLETE_STORAGE_KEY = 'ticket-payment-complete';

export const readStoredPaymentCompleteItems = (): StoredPaymentCompleteItem[] => {
   if (typeof window === 'undefined') {
      return [];
   }

   return Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(`${PAYMENT_COMPLETE_STORAGE_KEY}:`))
      .flatMap((key) => {
         const rawValue = window.sessionStorage.getItem(key);

         if (!rawValue) {
            return [];
         }

         try {
            return [JSON.parse(rawValue) as StoredPaymentCompleteItem];
         } catch {
            return [];
         }
      });
};

export const getCompletedResalePurchaseLookup = () => {
   const completedResalePurchases = readStoredPaymentCompleteItems().filter((item) => item.orderType === 'resale');

   return {
      listingIds: new Set(
         completedResalePurchases
            .map((item) => item.resaleListingId)
            .filter((value): value is string => typeof value === 'string' && value.length > 0),
      ),
      seatInfos: new Set(
         completedResalePurchases.flatMap((item) =>
            item.seats.filter((value): value is string => typeof value === 'string' && value.length > 0),
         ),
      ),
   };
};
