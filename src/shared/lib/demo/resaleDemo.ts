import type { ZoneItem, SeatItem } from '@/pages/books/model/types';

type DemoListingStatus = 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCEL_REQUESTED' | 'CANCELED';
type DemoAvailableStatus = 'ENABLED' | 'DISABLED';
type DemoOrderStatus = 'PENDING' | 'COMPLETED';
type DemoPaymentMethod = 'CARD' | 'ACCOUNT_TRANSFER';

type DemoListing = {
   listingId: string;
   ticketId: string;
   sellerId: string;
   gameId: string;
   seatId: string;
   gradeId: string;
   seatInfo: string;
   dailyBasePrice: number;
   listingPrice: number;
   listingStatus: DemoListingStatus;
   availableStatus: DemoAvailableStatus;
   listedAt: string;
   isCancelable: boolean;
   isPurchasable: boolean;
   minPrice: number;
   maxPrice: number;
   gameTitle?: string;
   gameDate?: string;
   stadiumName?: string;
};

type DemoHold = {
   holdId: string;
   listingId: string;
   queueTokenJti: string;
   createdAt: string;
};

type DemoOrder = {
   orderId: string;
   orderNumber: string;
   orderStatus: DemoOrderStatus;
   holdIds: string[];
   transactionIds: string[];
   totalQuantity: number;
   totalAmount: number;
   buyerId: string;
};

type DemoPayment = {
   paymentId: string;
   orderId: string;
   paymentType: 'PAYMENT';
   paymentMethod: DemoPaymentMethod;
   paymentAmount: number;
   pgProvider: string;
   pgTid: string;
   paymentStatus: 'SUCCESS';
   paidAt: string;
};

type DemoState = {
   version: string;
   listings: Record<string, DemoListing>;
   holds: Record<string, DemoHold>;
   orders: Record<string, DemoOrder>;
   payments: Record<string, DemoPayment>;
};

type EnsureZoneListingsParams = {
   gameId: string;
   zone: ZoneItem;
   seats: SeatItem[];
   gameTitle?: string;
   gameDate?: string;
   stadiumName?: string;
};

type CreateResaleOrderParams = {
   holdIds: string[];
   buyerId: string;
};

type CreateResalePaymentParams = {
   orderId: string;
   paymentMethod: DemoPaymentMethod;
};

const STORAGE_KEY = '__ballx_resale_demo_state__';
const STORAGE_VERSION = '1';
const DEFAULT_GAME_COUNT = 6;

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const createInitialState = (): DemoState => ({
   version: STORAGE_VERSION,
   listings: {},
   holds: {},
   orders: {},
   payments: {},
});

const readState = (): DemoState => {
   if (typeof window === 'undefined') {
      return createInitialState();
   }

   try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
         return createInitialState();
      }

      const parsed = JSON.parse(raw) as Partial<DemoState>;

      if (parsed.version !== STORAGE_VERSION) {
         return createInitialState();
      }

      return {
         version: STORAGE_VERSION,
         listings: parsed.listings ?? {},
         holds: parsed.holds ?? {},
         orders: parsed.orders ?? {},
         payments: parsed.payments ?? {},
      };
   } catch {
      return createInitialState();
   }
};

const writeState = (state: DemoState) => {
   if (typeof window === 'undefined') {
      return;
   }

   window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const updateState = <T>(updater: (state: DemoState) => T): T => {
   const state = readState();
   const result = updater(state);
   writeState(state);
   return result;
};

const buildSeatInfo = (zone: ZoneItem, seat: SeatItem) => `${zone.name} ${seat.block}구역 ${seat.rowLabel} ${seat.seatNumber}번`;

const getActiveListings = (state: DemoState, gameId: string) =>
   Object.values(state.listings).filter(
      (listing) =>
         listing.gameId === gameId &&
         listing.listingStatus === 'LISTING' &&
         listing.availableStatus === 'ENABLED' &&
         listing.isPurchasable,
   );

export const ensureDemoListingsForZone = ({
   gameId,
   zone,
   seats,
   gameTitle,
   gameDate,
   stadiumName,
}: EnsureZoneListingsParams) => {
   return updateState((state) => {
      const existingSeats = new Set(
         Object.values(state.listings)
            .filter((listing) => listing.gameId === gameId)
            .map((listing) => listing.seatId),
      );

      const candidateSeats = seats
         .filter((seat) => !existingSeats.has(seat.id))
         .slice(0, Math.min(6, seats.length));

      candidateSeats.forEach((seat, index) => {
         const listedPrice = Math.max(1000, zone.price + (index % 2 === 0 ? 2000 : -1000));
         const listingId = createId('demo-listing');

         state.listings[listingId] = {
            listingId,
            ticketId: `demo-ticket-${seat.id}`,
            sellerId: `demo-seller-${zone.id}`,
            gameId,
            seatId: seat.id,
            gradeId: zone.gradeIds?.[0] ?? `demo-grade-${zone.id}`,
            seatInfo: buildSeatInfo(zone, seat),
            dailyBasePrice: zone.price,
            listingPrice: listedPrice,
            listingStatus: 'LISTING',
            availableStatus: 'ENABLED',
            listedAt: new Date(Date.now() - index * 60_000).toISOString(),
            isCancelable: true,
            isPurchasable: true,
            minPrice: Math.max(1000, zone.price - 3000),
            maxPrice: zone.price + 10000,
            gameTitle,
            gameDate,
            stadiumName,
         };
      });

      return Object.values(state.listings).filter((listing) => listing.gameId === gameId);
   });
};

export const getDemoResaleListings = () => {
   return Object.values(readState().listings);
};

export const getDemoResaleCountByGame = (gameId: string) => {
   const count = getActiveListings(readState(), gameId).length;
   return count > 0 ? count : DEFAULT_GAME_COUNT;
};

export const getDemoResaleCountsByGrades = (gameId: string, gradeIds: string[]) => {
   const state = readState();
   const activeListings = getActiveListings(state, gameId);

   return new Map(
      gradeIds.map((gradeId, index) => {
         const count = activeListings.filter((listing) => listing.gradeId === gradeId).length;
         return [gradeId, count > 0 ? count : Math.max(1, 3 - (index % 3))] as const;
      }),
   );
};

export const getDemoResaleStatusByGame = (gameId: string) => {
   return getDemoResaleCountByGame(gameId) > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
};

export const getDemoResaleHistory = (range: 'HOUR' | 'DAY' | 'WEEK') => {
   const pointCount = range === 'HOUR' ? 8 : range === 'DAY' ? 7 : 6;
   const stepMs = range === 'HOUR' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
   const basePrice = range === 'HOUR' ? 25000 : range === 'DAY' ? 23000 : 21000;

   return Array.from({ length: pointCount }, (_, index) => ({
      transactionPrice: basePrice + ((index % 3) - 1) * 2000 + index * 300,
      confirmedAt: new Date(Date.now() - (pointCount - index) * stepMs).toISOString(),
   }));
};

export const createDemoResaleHold = (listingId: string, queueTokenJti: string) => {
   return updateState((state) => {
      const listing = state.listings[listingId];

      if (!listing || listing.listingStatus !== 'LISTING' || !listing.isPurchasable) {
         throw new Error('리셀 좌석을 점유할 수 없습니다.');
      }

      const holdId = createId('demo-hold');
      state.holds[holdId] = {
         holdId,
         listingId,
         queueTokenJti,
         createdAt: new Date().toISOString(),
      };
      state.listings[listingId] = {
         ...listing,
         listingStatus: 'HOLD',
      };

      return { holdId };
   });
};

const releaseDemoResaleHoldInternal = (holdId: string) => {
   return updateState((state) => {
      const hold = state.holds[holdId];

      if (!hold) {
         return { holdId };
      }

      const listing = state.listings[hold.listingId];

      if (listing && listing.listingStatus === 'HOLD') {
         state.listings[hold.listingId] = {
            ...listing,
            listingStatus: 'LISTING',
         };
      }

      delete state.holds[holdId];

      return { holdId };
   });
};

export const releaseDemoResaleHold = (holdId: string) => releaseDemoResaleHoldInternal(holdId);

export const releaseDemoResaleHoldSync = (holdId: string) => {
   releaseDemoResaleHoldInternal(holdId);
};

export const createDemoResaleOrder = ({ holdIds, buyerId }: CreateResaleOrderParams) => {
   return updateState((state) => {
      const holds = holdIds.map((holdId) => state.holds[holdId]).filter(Boolean);

      if (holds.length !== holdIds.length || holds.length === 0) {
         throw new Error('리셀 주문을 생성할 점유 정보가 없습니다.');
      }

      const listings = holds.map((hold) => state.listings[hold.listingId]).filter(Boolean);
      const orderId = createId('demo-resale-order');
      const transactionIds = listings.map(() => createId('demo-transaction'));

      state.orders[orderId] = {
         orderId,
         orderNumber: `RSL-${orderId.replace(/^demo-resale-order-/i, '').slice(0, 8).toUpperCase()}`,
         orderStatus: 'PENDING',
         holdIds,
         transactionIds,
         totalQuantity: listings.length,
         totalAmount: listings.reduce((sum, listing) => sum + listing.listingPrice, 0),
         buyerId,
      };

      return state.orders[orderId];
   });
};

export const getDemoResaleTransactions = (orderId: string) => {
   const order = readState().orders[orderId];
   return order?.transactionIds ?? [];
};

export const createDemoResalePayment = ({ orderId, paymentMethod }: CreateResalePaymentParams) => {
   return updateState((state) => {
      const order = state.orders[orderId];

      if (!order) {
         throw new Error('리셀 주문 정보를 찾을 수 없습니다.');
      }

      const paymentId = createId('demo-resale-payment');
      state.payments[paymentId] = {
         paymentId,
         orderId,
         paymentType: 'PAYMENT',
         paymentMethod,
         paymentAmount: order.totalAmount,
         pgProvider: 'DEMO',
         pgTid: createId('demo-pg'),
         paymentStatus: 'SUCCESS',
         paidAt: new Date().toISOString(),
      };

      return state.payments[paymentId];
   });
};

export const completeDemoResaleOrder = (orderId: string) => {
   return updateState((state) => {
      const order = state.orders[orderId];

      if (!order) {
         throw new Error('완료 처리할 리셀 주문이 없습니다.');
      }

      const items = order.holdIds.map((holdId, index) => {
         const hold = state.holds[holdId];
         const listing = hold ? state.listings[hold.listingId] : undefined;

         if (!hold || !listing) {
            throw new Error('리셀 주문 완료 처리 중 좌석 정보를 찾을 수 없습니다.');
         }

         state.listings[listing.listingId] = {
            ...listing,
            listingStatus: 'SOLD',
            availableStatus: 'DISABLED',
            isPurchasable: false,
            isCancelable: false,
         };
         delete state.holds[holdId];

         return {
            transactionId: order.transactionIds[index] ?? createId('demo-transaction'),
            listingId: listing.listingId,
            seatInfo: listing.seatInfo,
            price: listing.listingPrice,
         };
      });

      state.orders[orderId] = {
         ...order,
         orderStatus: 'COMPLETED',
      };

      return {
         orderId: order.orderId,
         orderNumber: order.orderNumber,
         buyerId: order.buyerId,
         totalAmount: order.totalAmount,
         orderStatus: 'COMPLETED' as const,
         items,
      };
   });
};
