import type { ResaleListingItem, ResaleListingOrderStatus, ResaleListingOrderSummary } from '@/entities/resale/api/resaleApi';

const RESALE_LISTING_STORAGE_KEY = 'ballx.resale-listings';

export interface StoredResaleListingItem extends ResaleListingItem {
   orderId: string;
   orderNumber: string;
   orderStatus: ResaleListingOrderStatus;
   orderCreatedAt: string;
}

interface StoredResaleListingStore {
   version: 1;
   users: Record<string, StoredResaleListingItem[]>;
}

const getStorage = () => {
   if (typeof window === 'undefined') {
      return null;
   }

   return window.localStorage;
};

const normalizeUserKey = (userId?: string | null) => userId?.trim() || 'anonymous';

const readStore = (): StoredResaleListingStore => {
   const storage = getStorage();

   if (!storage) {
      return { version: 1, users: {} };
   }

   const rawValue = storage.getItem(RESALE_LISTING_STORAGE_KEY);

   if (!rawValue) {
      return { version: 1, users: {} };
   }

   try {
      const parsed = JSON.parse(rawValue) as Partial<StoredResaleListingStore>;

      return {
         version: 1,
         users: typeof parsed.users === 'object' && parsed.users !== null ? parsed.users : {},
      };
   } catch {
      return { version: 1, users: {} };
   }
};

const writeStore = (store: StoredResaleListingStore) => {
   const storage = getStorage();

   if (!storage) {
      return;
   }

   storage.setItem(RESALE_LISTING_STORAGE_KEY, JSON.stringify(store));
};

export const readStoredResaleListings = (userId?: string | null): StoredResaleListingItem[] => {
   const store = readStore();
   const userKey = normalizeUserKey(userId);
   const listings = store.users[userKey];

   return Array.isArray(listings) ? listings : [];
};

export const saveStoredResaleListings = (
   userId: string | null | undefined,
   listings: StoredResaleListingItem[],
) => {
   const store = readStore();
   const userKey = normalizeUserKey(userId);
   const merged = new Map<string, StoredResaleListingItem>();

   for (const listing of readStoredResaleListings(userId)) {
      merged.set(listing.listingId, listing);
   }

   for (const listing of listings) {
      merged.set(listing.listingId, listing);
   }

   store.users[userKey] = Array.from(merged.values()).sort((left, right) =>
      (right.orderCreatedAt || right.listedAt).localeCompare(left.orderCreatedAt || left.listedAt),
   );

   writeStore(store);
};

export const markStoredResaleListingCanceled = (userId: string | null | undefined, listingId: string) => {
   const store = readStore();
   const userKey = normalizeUserKey(userId);
   const listings = store.users[userKey];

   if (!Array.isArray(listings)) {
      return;
   }

   store.users[userKey] = listings.map((listing) =>
      listing.listingId === listingId
         ? {
              ...listing,
              listingStatus: 'CANCELED',
              canceledAt: new Date().toISOString(),
              isCancelable: false,
              isPurchasable: false,
           }
         : listing,
   );

   writeStore(store);
};

export const createStoredResaleListings = ({
   currentUserId,
   orders,
   listings,
   fallbackOrderCreatedAt,
   fallbackGameTitle,
   fallbackGameDate,
   fallbackStadiumName,
}: {
   currentUserId?: string | null;
   orders: ResaleListingOrderSummary[];
   listings: ResaleListingItem[];
   fallbackOrderCreatedAt: string;
   fallbackGameTitle: string;
   fallbackGameDate: string;
   fallbackStadiumName: string;
}) => {
   const orderById = new Map(orders.map((order) => [order.orderId, order]));

   const storedListings = listings.map<StoredResaleListingItem>((listing, index) => {
      const matchedOrder = listing.orderId ? orderById.get(listing.orderId) : undefined;
      const fallbackOrderId = matchedOrder?.orderId ?? listing.orderId ?? `local-order-${listing.listingId}-${index}`;

      return {
         ...listing,
         orderId: fallbackOrderId,
         orderNumber: matchedOrder?.orderNumber ?? `LOCAL-${listing.listingId.slice(0, 8).toUpperCase()}`,
         orderStatus: 'LISTING',
         orderCreatedAt: listing.listedAt ?? fallbackOrderCreatedAt,
         gameTitle: listing.gameTitle || fallbackGameTitle,
         gameDate: listing.gameDate || fallbackGameDate,
         stadiumName: listing.stadiumName || fallbackStadiumName,
      };
   });

   saveStoredResaleListings(currentUserId, storedListings);

   return storedListings;
};
