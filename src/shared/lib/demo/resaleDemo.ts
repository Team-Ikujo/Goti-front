import type { ZoneItem, SeatItem } from '@/pages/books/model/types';

type DemoListingStatus = 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCELED';
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
const STORAGE_VERSION = '4';
const DEMO_RESALE_MIN_PRICE = 35_000;
const DEMO_RESALE_MAX_PRICE = 60_000;
const DEMO_ZONE_TARGET_COUNTS: Record<string, number> = {
   k9: 3,
   k8: 2,
   'cheering-special': 3,
   k5: 2,
   'surprise-zone': 2,
   'family-seat': 1,
   party: 1,
   'sky-picnic': 1,
   'table-table': 2,
   'outfield-free': 2,
   'samsung-first-base-infield': 3,
   'samsung-third-base-infield': 3,
   'samsung-blue-zone': 2,
   'samsung-away-zone': 1,
   'samsung-sky-lower': 2,
   'samsung-outfield': 2,
   'samsung-grass': 1,
   'samsung-center-table': 1,
   'samsung-first-base-table': 1,
   'samsung-third-base-table': 1,
};
const DEFAULT_GAME_COUNT = Object.values(DEMO_ZONE_TARGET_COUNTS).reduce((sum, count) => sum + count, 0);
const DEMO_TOTAL_LISTINGS_PER_GAME = DEFAULT_GAME_COUNT;

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const clampDemoResalePrice = (value: number) => Math.min(DEMO_RESALE_MAX_PRICE, Math.max(DEMO_RESALE_MIN_PRICE, value));

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

export const getDemoResaleTargetCountForZone = (zoneId: string) => {
   return DEMO_ZONE_TARGET_COUNTS[zoneId] ?? 0;
};

const compareSeatRow = (left: string, right: string) => {
   return left.localeCompare(right, 'en', { numeric: true });
};

const pickDemoSeatsForZone = (seats: SeatItem[], existingSeatIds: Set<string>, limit: number) => {
   if (limit <= 0) {
      return [] as SeatItem[];
   }

   const seatsByBlock = seats.reduce<Record<string, SeatItem[]>>((groups, seat) => {
      if (existingSeatIds.has(seat.id)) {
         return groups;
      }

      const currentSeats = groups[seat.block];

      if (currentSeats) {
         currentSeats.push(seat);
      } else {
         groups[seat.block] = [seat];
      }

      return groups;
   }, {});

   const orderedBlockSeats = Object.entries(seatsByBlock)
      .sort(([left], [right]) => left.localeCompare(right, 'en', { numeric: true }))
      .map(([, blockSeats]) =>
         [...blockSeats].sort((left, right) => {
            const rowCompare = compareSeatRow(left.rowLabel, right.rowLabel);

            if (rowCompare !== 0) {
               return rowCompare;
            }

            const leftSeatScore = Math.abs(left.seatNumber - 4);
            const rightSeatScore = Math.abs(right.seatNumber - 4);

            if (leftSeatScore !== rightSeatScore) {
               return leftSeatScore - rightSeatScore;
            }

            return left.seatNumber - right.seatNumber;
         }),
      );

   const selectedSeats: SeatItem[] = [];
   let seatCursor = 0;

   while (selectedSeats.length < limit) {
      let addedInRound = false;

      for (const blockSeats of orderedBlockSeats) {
         const candidate = blockSeats[seatCursor];

         if (!candidate) {
            continue;
         }

         selectedSeats.push(candidate);
         addedInRound = true;

         if (selectedSeats.length >= limit) {
            break;
         }
      }

      if (!addedInRound) {
         break;
      }

      seatCursor += 1;
   }

   return selectedSeats;
};

export const ensureDemoListingsForZone = ({
   gameId,
   zone,
   seats,
   gameTitle,
   gameDate,
   stadiumName,
}: EnsureZoneListingsParams) => {
   return updateState((state) => {
      if (getDemoResaleTargetCountForZone(zone.id) === 0) {
         return Object.values(state.listings).filter((listing) => listing.gameId === gameId);
      }

      const seatById = new Map(seats.map((seat) => [seat.id, seat]));
      const defaultGradeId = zone.gradeIds?.[0] ?? `demo-grade-${zone.id}`;

      Object.values(state.listings).forEach((listing) => {
         if (listing.gameId !== gameId) {
            return;
         }

         const matchedSeat = seatById.get(listing.seatId);

         if (!matchedSeat) {
            return;
         }

         state.listings[listing.listingId] = {
            ...listing,
            gradeId: defaultGradeId,
            seatInfo: buildSeatInfo(zone, matchedSeat),
            gameTitle: gameTitle ?? listing.gameTitle,
            gameDate: gameDate ?? listing.gameDate,
            stadiumName: stadiumName ?? listing.stadiumName,
         };
      });

      const existingSeats = new Set(
         Object.values(state.listings)
            .filter((listing) => listing.gameId === gameId)
            .map((listing) => listing.seatId),
      );
      const activeGameListings = getActiveListings(state, gameId);
      const activeZoneListings = activeGameListings.filter((listing) => seatById.has(listing.seatId));
      const remainingGameSlots = Math.max(0, DEMO_TOTAL_LISTINGS_PER_GAME - activeGameListings.length);
      const remainingZoneSlots = Math.max(0, getDemoResaleTargetCountForZone(zone.id) - activeZoneListings.length);
      const seatsToCreate = pickDemoSeatsForZone(
         seats,
         existingSeats,
         Math.min(remainingGameSlots, remainingZoneSlots),
      );

      seatsToCreate.forEach((seat, index) => {
         const listedPrice = clampDemoResalePrice(zone.price + (index % 2 === 0 ? 2000 : -1000));
         const listingId = createId('demo-listing');

         state.listings[listingId] = {
            listingId,
            ticketId: `demo-ticket-${seat.id}`,
            sellerId: `demo-seller-${zone.id}`,
            gameId,
            seatId: seat.id,
            gradeId: defaultGradeId,
            seatInfo: buildSeatInfo(zone, seat),
            dailyBasePrice: clampDemoResalePrice(zone.price),
            listingPrice: listedPrice,
            listingStatus: 'LISTING',
            availableStatus: 'ENABLED',
            listedAt: new Date(Date.now() - index * 60_000).toISOString(),
            isCancelable: true,
            isPurchasable: true,
            minPrice: DEMO_RESALE_MIN_PRICE,
            maxPrice: DEMO_RESALE_MAX_PRICE,
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

const roundToNearestThousand = (value: number) => Math.max(1000, Math.round(value / 1000) * 1000);

const hashValue = (value: string) => {
   let hash = 0;

   for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
   }

   return hash;
};

const createSeededUnitValue = (seed: number, index: number) => {
   const value = Math.sin(seed * 0.0001 + index * 12.9898) * 43758.5453;
   return value - Math.floor(value);
};

const createHistoryPrice = ({
   basePrice,
   spread,
   seed,
   index,
   pointCount,
   range,
}: {
   basePrice: number;
   spread: number;
   seed: number;
   index: number;
   pointCount: number;
   range: 'HOUR' | 'DAY' | 'WEEK';
}) => {
   const progress = pointCount === 1 ? 1 : index / (pointCount - 1);
   const centeredProgress = progress - 0.5;
   const primaryWave = Math.sin(progress * Math.PI * 2.35 + (seed % 13) * 0.21) * spread * 0.34;
   const secondaryWave = Math.cos(progress * Math.PI * 5.1 + (seed % 7) * 0.43) * spread * 0.16;
   const drift = centeredProgress * spread * (range === 'HOUR' ? 0.28 : range === 'DAY' ? 0.4 : 0.48);
   const shock =
      (createSeededUnitValue(seed, index) - 0.5) * spread * (range === 'HOUR' ? 0.52 : 0.36) +
      (createSeededUnitValue(seed ^ 0x9e3779b9, index + 29) - 0.5) * 2600;
   const swing =
      index > 0 && index < pointCount - 1 && createSeededUnitValue(seed ^ 0x85ebca6b, index) > 0.74
         ? (createSeededUnitValue(seed ^ 0xc2b2ae35, index) > 0.5 ? 1 : -1) * spread * 0.22
         : 0;

   return clampDemoResalePrice(roundToNearestThousand(basePrice + primaryWave + secondaryWave + drift + shock + swing));
};

export const getDemoResaleHistory = (gameId: string, gradeId: string, range: 'HOUR' | 'DAY' | 'WEEK') => {
   const activeListings = getActiveListings(readState(), gameId);
   const gradeListings = activeListings.filter((listing) => listing.gradeId === gradeId);
   const sourceListings = gradeListings.length > 0 ? gradeListings : activeListings;
   const fallbackBasePrice = 20000 + (hashValue(gradeId || gameId) % 5) * 3000;
   const priceCandidates = sourceListings.flatMap((listing) => [
      clampDemoResalePrice(listing.dailyBasePrice),
      clampDemoResalePrice(listing.listingPrice),
   ]);
   const basePrice =
      priceCandidates.length > 0
         ? roundToNearestThousand(priceCandidates.reduce((sum, price) => sum + price, 0) / priceCandidates.length)
         : clampDemoResalePrice(fallbackBasePrice);
   const recentPrice = clampDemoResalePrice(sourceListings[0]?.listingPrice ?? basePrice);
   const minPrice = priceCandidates.length > 0 ? Math.min(...priceCandidates) : Math.max(DEMO_RESALE_MIN_PRICE, basePrice - 7000);
   const maxPrice = priceCandidates.length > 0 ? Math.max(...priceCandidates) : Math.min(DEMO_RESALE_MAX_PRICE, basePrice + 7000);
   const spread = Math.max(
      6000,
      roundToNearestThousand(
         Math.max(maxPrice - minPrice, range === 'HOUR' ? basePrice * 0.16 : range === 'DAY' ? basePrice * 0.22 : basePrice * 0.28),
      ),
   );
   const pointCount = range === 'HOUR' ? 16 : range === 'DAY' ? 10 : 8;
   const stepMs = range === 'HOUR' ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
   const seed = hashValue(`${gameId}:${gradeId}:${range}`);

   return Array.from({ length: pointCount }, (_, index) => {
      const isLast = index === pointCount - 1;
      const syntheticPrice = createHistoryPrice({
         basePrice,
         spread,
         seed,
         index,
         pointCount,
         range,
      });

      return {
         transactionPrice: isLast ? roundToNearestThousand(recentPrice) : syntheticPrice,
         confirmedAt: new Date(Date.now() - (pointCount - 1 - index) * stepMs).toISOString(),
      };
   });
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
            ticketId: listing.ticketId,
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
