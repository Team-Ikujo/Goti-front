import { http, HttpResponse } from 'msw';
import { mockGameSchedules } from './game';

type SeatGrade = {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
   availableSeatCount: number;
};

type SeatSection = {
   sectionId: string;
   gradeId: string;
   stadiumId: string;
   sectionCode: string;
   capacity: number;
};

type SeatReservationHold = {
   holdId: string;
   seatId: string;
   gameId: string;
   queueTokenJti: string;
};

type TicketOrder = {
   orderId: string;
   orderNumber: string;
   gameId: string;
   stadiumId: string;
   orderStatus: 'PENDING' | 'CONFIRMED';
   totalQuantity: number;
   totalAmount: number;
   holdIds: string[];
   orderedAt: string;
};

type TicketPayment = {
   paymentId: string;
   orderId: string;
   paymentMethod: string;
   paymentAmount: number;
   pgTid: string;
   paymentStatus: 'SUCCESS';
   paidAt: string;
};

type ResaleHold = {
   holdId: string;
   listingId: string;
   queueTokenJti: string;
};

type ResaleOrder = {
   orderId: string;
   orderNumber: string;
   orderStatus: 'PENDING' | 'COMPLETED';
   totalQuantity: number;
   totalAmount: number;
   holdIds: string[];
   transactionIds: string[];
};

type ResalePayment = {
   paymentId: string;
   orderId: string;
   paymentMethod: string;
   paymentAmount: number;
   pgTid: string;
   paymentStatus: 'SUCCESS';
   paidAt: string;
};

type TicketRecord = {
   ticketId: string;
   orderId: string;
   gameId: string;
   seatId: string;
   qrToken: string;
};

type TicketPricingPolicy = {
   policyId: string;
   teamId: string;
   policyStartAt: string;
   policyEndAt: string;
   isActive: boolean;
   prices: Array<{
      priceId: string;
      gradeId: string;
      ticketType: 'ADULT';
      dayType: 'WEEKDAY' | 'WEEKEND';
      leagueType: 'PRE_SEASON' | 'REGULAR' | 'POSTSEASON';
      price: number;
   }>;
};

type ResaleLedger = {
   id: string;
   orderId: string;
   paymentId: string;
   totalAmount: number;
   buyerFee: number;
   sellerFee: number;
   vat: number;
   netProfit: number;
   settlementAmount: number;
   createdAt: string;
};

const createSections = ({
   stadiumId,
   gradeId,
   codes,
   capacity = 500,
}: {
   stadiumId: string;
   gradeId: string;
   codes: string[];
   capacity?: number;
}) => {
   return codes.map((sectionCode) => ({
      sectionId: `section-${stadiumId}-${sectionCode.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`,
      gradeId,
      stadiumId,
      sectionCode,
      capacity,
   }));
};

const seatGradesByStadium: Record<string, SeatGrade[]> = {
   'stadium-kia-champions-field': [
      {
         seatGradeId: 'grade-kia-champion',
         stadiumId: 'stadium-kia-champions-field',
         name: '챔피언석',
         displayColorHex: '#D05150',
         availableSeatCount: 87,
      },
      {
         seatGradeId: 'grade-kia-center-table',
         stadiumId: 'stadium-kia-champions-field',
         name: '중앙테이블석',
         displayColorHex: '#284785',
         availableSeatCount: 66,
      },
      {
         seatGradeId: 'grade-kia-k8',
         stadiumId: 'stadium-kia-champions-field',
         name: 'K8석',
         displayColorHex: '#EFBC2E',
         availableSeatCount: 154,
      },
      {
         seatGradeId: 'grade-kia-k9',
         stadiumId: 'stadium-kia-champions-field',
         name: 'K9석',
         displayColorHex: '#DB58AF',
         availableSeatCount: 93,
      },
      {
         seatGradeId: 'grade-kia-cheering-special',
         stadiumId: 'stadium-kia-champions-field',
         name: '응원특별석',
         displayColorHex: '#F26D5B',
         availableSeatCount: 212,
      },
      {
         seatGradeId: 'grade-kia-k5',
         stadiumId: 'stadium-kia-champions-field',
         name: 'K5석',
         displayColorHex: '#93CB3A',
         availableSeatCount: 305,
      },
      {
         seatGradeId: 'grade-kia-family',
         stadiumId: 'stadium-kia-champions-field',
         name: '훼미리석',
         displayColorHex: '#5F56B3',
         availableSeatCount: 24,
      },
      {
         seatGradeId: 'grade-kia-party',
         stadiumId: 'stadium-kia-champions-field',
         name: '파티석',
         displayColorHex: '#782E8D',
         availableSeatCount: 18,
      },
      {
         seatGradeId: 'grade-kia-sky-picnic',
         stadiumId: 'stadium-kia-champions-field',
         name: '스카이피크닉석',
         displayColorHex: '#8B6DE9',
         availableSeatCount: 29,
      },
      {
         seatGradeId: 'grade-kia-table-table',
         stadiumId: 'stadium-kia-champions-field',
         name: '테이블테이블석',
         displayColorHex: '#4A68D4',
         availableSeatCount: 47,
      },
   ],
   'stadium-samsung-lions-park': [
      {
         seatGradeId: 'grade-samsung-first-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         name: '1루 내야지정석',
         displayColorHex: '#0A58BF',
         availableSeatCount: 341,
      },
      {
         seatGradeId: 'grade-samsung-blue-zone',
         stadiumId: 'stadium-samsung-lions-park',
         name: '블루존',
         displayColorHex: '#1F4D93',
         availableSeatCount: 127,
      },
   ],
};

const pricingPoliciesByTeamId: Record<string, TicketPricingPolicy> = {
   'e5f58f8c-fcde-4017-8033-d8deb34fd4a2': {
      policyId: 'policy-kia-2026',
      teamId: 'e5f58f8c-fcde-4017-8033-d8deb34fd4a2',
      policyStartAt: '2026-03-01',
      policyEndAt: '2026-10-31',
      isActive: true,
      prices: [
         { priceId: 'price-kia-champion-weekday', gradeId: 'grade-kia-champion', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-center-table-weekday', gradeId: 'grade-kia-center-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-k8-weekday', gradeId: 'grade-kia-k8', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 14000 },
         { priceId: 'price-kia-k9-weekday', gradeId: 'grade-kia-k9', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 16000 },
         { priceId: 'price-kia-special-weekday', gradeId: 'grade-kia-cheering-special', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 18000 },
         { priceId: 'price-kia-k5-weekday', gradeId: 'grade-kia-k5', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 12000 },
         { priceId: 'price-kia-family-weekday', gradeId: 'grade-kia-family', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 25000 },
         { priceId: 'price-kia-party-weekday', gradeId: 'grade-kia-party', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-sky-weekday', gradeId: 'grade-kia-sky-picnic', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 45000 },
         { priceId: 'price-kia-table-weekday', gradeId: 'grade-kia-table-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 40000 },
         { priceId: 'price-kia-champion-weekend', gradeId: 'grade-kia-champion', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 60000 },
         { priceId: 'price-kia-k8-weekend', gradeId: 'grade-kia-k8', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 16000 },
      ],
   },
   '412cfc77-2c5d-4583-8e79-968339223864': {
      policyId: 'policy-samsung-2026',
      teamId: '412cfc77-2c5d-4583-8e79-968339223864',
      policyStartAt: '2026-03-01',
      policyEndAt: '2026-10-31',
      isActive: true,
      prices: [
         { priceId: 'price-samsung-first-base-weekday', gradeId: 'grade-samsung-first-base-infield', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 22000 },
         { priceId: 'price-samsung-blue-weekday', gradeId: 'grade-samsung-blue-zone', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 20000 },
         { priceId: 'price-samsung-first-base-weekend', gradeId: 'grade-samsung-first-base-infield', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 24000 },
         { priceId: 'price-samsung-blue-weekend', gradeId: 'grade-samsung-blue-zone', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 22000 },
      ],
   },
};

const seatSectionsByStadium: Record<string, SeatSection[]> = {
   'stadium-kia-champions-field': [
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-champion',
         codes: ['A-1', 'A-2', 'A-3'],
         capacity: 120,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-center-table',
         codes: ['B-1', 'B-2', 'B-3'],
         capacity: 80,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-k5',
         codes: ['104', '105', '106', '124', '125', '126'],
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-k8',
         codes: ['108', '109', '110', '111'],
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-k9',
         codes: ['112', '113', '116', '117'],
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-cheering-special',
         codes: ['118', '119', '120', '121', '122', '123'],
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-family',
         codes: ['504', '505', '506', '507', '508'],
         capacity: 60,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-sky-picnic',
         codes: ['519', '520', '521', '522', '523'],
         capacity: 48,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-table-table',
         codes: ['530', '531', '532', '533', '534', '535'],
         capacity: 64,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-party',
         codes: ['J-1', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6'],
         capacity: 32,
      }),
   ],
   'stadium-samsung-lions-park': [
      {
         sectionId: 'section-samsung-1-6',
         gradeId: 'grade-samsung-first-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         sectionCode: '1-6',
         capacity: 500,
      },
      {
         sectionId: 'section-samsung-1-7',
         gradeId: 'grade-samsung-first-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         sectionCode: '1-7',
         capacity: 490,
      },
      {
         sectionId: 'section-samsung-3-1',
         gradeId: 'grade-samsung-blue-zone',
         stadiumId: 'stadium-samsung-lions-park',
         sectionCode: '3-1',
         capacity: 300,
      },
   ],
};

const seatReservationHolds = new Map<string, SeatReservationHold>();
const ticketOrders = new Map<string, TicketOrder>();
const ticketPayments = new Map<string, TicketPayment>();
const ticketRecords = new Map<string, TicketRecord>();
const resaleHolds = new Map<string, ResaleHold>();
const resaleOrders = new Map<string, ResaleOrder>();
const resalePayments = new Map<string, ResalePayment>();
const resaleLedgers = new Map<string, ResaleLedger>();

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}`;
};

const buildSectionSeats = (sectionId: string) => {
   return ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((rowName) =>
      Array.from({ length: 12 }, (_, index) => ({
         seatId: `${sectionId}-${rowName}-${index + 1}`,
         sectionId,
         rowName,
         seatNum: index + 1,
         available: (index + rowName.charCodeAt(0)) % 9 !== 0,
      })),
   );
};

const buildErrorResponse = (message: string, status = 400) => {
   return HttpResponse.json({ message }, { status });
};

const parseJsonBody = async <T>(request: Request): Promise<T | null> => {
   try {
      return (await request.json()) as T;
   } catch {
      return null;
   }
};

const isTicketPaymentMethod = (paymentMethod: unknown) => {
   return (
      paymentMethod === 'CARD' ||
      paymentMethod === 'KAKAO_PAY' ||
      paymentMethod === 'NAVER_PAY' ||
      paymentMethod === 'TOSS_PAY' ||
      paymentMethod === 'ACCOUNT_TRANSFER'
   );
};

const buildPageResponse = <T>(content: T[], page = 0, size = content.length || 10) => {
   const pageSize = size > 0 ? size : content.length || 10;
   const offset = page * pageSize;
   const pagedContent = content.slice(offset, offset + pageSize);
   const totalElements = content.length;
   const totalPages = totalElements === 0 ? 1 : Math.ceil(totalElements / pageSize);

   return {
      totalElements,
      totalPages,
      pageable: {
         pageNumber: page,
         paged: true,
         unpaged: false,
         pageSize,
         offset,
         sort: {
            sorted: true,
            unsorted: false,
            empty: false,
         },
      },
      numberOfElements: pagedContent.length,
      first: page === 0,
      last: page >= totalPages - 1,
      size: pageSize,
      content: pagedContent,
      number: page,
      sort: {
         sorted: true,
         unsorted: false,
         empty: false,
      },
      empty: pagedContent.length === 0,
   };
};

export const paymentHandlers = [
   http.get('/api/v1/stadium-seats/stadiums/:stadiumId/games/:gameId/seat-grades', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: seatGradesByStadium[String(params.stadiumId)] ?? [],
      });
   }),

   http.get('/api/v1/stadium-seats/stadiums/:stadiumId/seat-sections', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: seatSectionsByStadium[String(params.stadiumId)] ?? [],
      });
   }),

   http.get('/api/v1/seats/seat-sections/:sectionId/seats', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: buildSectionSeats(String(params.sectionId)),
      });
   }),

   http.get('/api/v1/game-seats/:gameId/sections/:sectionId/seat-statuses', async ({ params }) => {
      const sectionSeats = buildSectionSeats(String(params.sectionId));

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: sectionSeats.map((seat, index) => ({
            seatId: seat.seatId,
            status: !seat.available ? 'SOLD' : index % 7 === 0 ? 'HELD' : 'AVAILABLE',
         })),
      });
   }),

   http.get('/api/v1/teams/:teamId/ticket-pricing-policies', async ({ params }) => {
      const policy = pricingPoliciesByTeamId[String(params.teamId)];

      if (!policy) {
         return HttpResponse.json(
            {
               code: 'NOT_FOUND',
               message: 'pricing policy not found',
               data: null,
            },
            { status: 404 },
         );
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: policy,
      });
   }),

   http.post('/api/v1/seat-reservations/seats/:seatId', async ({ params, request }) => {
      const body = await parseJsonBody<{
         gameId?: string;
         queueTokenJti?: string;
      }>(request);
      const seatId = decodeURIComponent(String(params.seatId));
      const gameId = body?.gameId?.trim() || 'mock-game-id';
      const queueTokenJti = body?.queueTokenJti?.trim() || `mock-queue-token-${seatId}`;

      const holdId = createId('hold');
      seatReservationHolds.set(holdId, {
         holdId,
         seatId,
         gameId,
         queueTokenJti,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { holdId },
      });
   }),

   http.post('/api/v1/seat-reservations/:holdId', async ({ params }) => {
      const holdId = String(params.holdId);

      if (!seatReservationHolds.has(holdId)) {
         return buildErrorResponse('Seat hold not found.', 404);
      }

      seatReservationHolds.delete(holdId);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { holdId },
      });
   }),

   http.get('/api/v1/orders', async () => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: Array.from(ticketOrders.values()).map((order) => ({
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalQuantity: order.totalQuantity,
            totalAmount: order.totalAmount,
            orderedAt: order.orderedAt,
            gameId: order.gameId,
            stadiumId: order.stadiumId,
         })),
      });
   }),

   http.post('/api/v1/orders', async ({ request }) => {
      const body = (await request.json()) as {
         gameId?: string;
         holdIds?: string[];
         ordererName?: string;
         ordererPhone?: string;
         ordererEmail?: string;
      };

      if (!body?.gameId || !body?.holdIds?.length || !body?.ordererName || !body?.ordererPhone || !body?.ordererEmail) {
         return buildErrorResponse('Missing order fields.');
      }

      const missingHold = body.holdIds.find((holdId) => !seatReservationHolds.has(holdId));

      if (missingHold) {
         return buildErrorResponse(`Seat hold not found: ${missingHold}`, 404);
      }

      const orderId = createId('order');
      const orderedAt = new Date().toISOString();
      const matchedGame = mockGameSchedules.find((game) => game.gameId === body.gameId);
      const order: TicketOrder = {
         orderId,
         orderNumber: `ORD-${Date.now()}`,
         gameId: body.gameId,
         stadiumId: matchedGame?.stadiumId ?? 'stadium-kia-champions-field',
         orderStatus: 'PENDING',
         totalQuantity: body.holdIds.length,
         totalAmount: body.holdIds.length * 12000,
         holdIds: body.holdIds,
         orderedAt,
      };

      ticketOrders.set(orderId, order);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            gameId: order.gameId,
            orderStatus: order.orderStatus,
            totalQuantity: order.totalQuantity,
            totalAmount: order.totalAmount,
         },
      });
   }),

   http.post('/api/v1/payments/orders/:orderId', async ({ params, request }) => {
      const body = (await request.json()) as {
         paymentMethod?: string;
         idempotencyKey?: string;
      };

      const order = ticketOrders.get(String(params.orderId));

      if (!order) {
         return buildErrorResponse('Order not found.', 404);
      }

      if (!isTicketPaymentMethod(body?.paymentMethod) || !body?.idempotencyKey) {
         return buildErrorResponse('Missing payment fields.');
      }

      const paymentId = createId('payment');
      const payment: TicketPayment = {
         paymentId,
         orderId: order.orderId,
         paymentMethod: body.paymentMethod,
         paymentAmount: order.totalAmount,
         pgTid: createId('mock-pg-tid'),
         paymentStatus: 'SUCCESS',
         paidAt: new Date().toISOString(),
      };

      ticketPayments.set(paymentId, payment);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            paymentType: 'PAYMENT',
            paymentMethod: payment.paymentMethod,
            paymentAmount: payment.paymentAmount,
            pgProvider: 'MOCK',
            pgTid: payment.pgTid,
            paymentStatus: payment.paymentStatus,
            paidAt: payment.paidAt,
            failedReason: null,
         },
      });
   }),

   http.post('/api/v1/resales/holds', async ({ request }) => {
      const body = (await request.json()) as {
         listingId?: string;
         queueTokenJti?: string;
      };

      if (!body?.listingId || !body?.queueTokenJti) {
         return buildErrorResponse('Missing resale hold fields.');
      }

      const holdId = createId('resale-hold');
      resaleHolds.set(holdId, {
         holdId,
         listingId: body.listingId,
         queueTokenJti: body.queueTokenJti,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { holdId },
      });
   }),

   http.post('/api/v1/resales/orders', async ({ request }) => {
      const body = (await request.json()) as {
         holdIds?: string[];
      };

      if (!body?.holdIds?.length) {
         return buildErrorResponse('Missing resale order fields.');
      }

      const missingHold = body.holdIds.find((holdId) => !resaleHolds.has(holdId));

      if (missingHold) {
         return buildErrorResponse(`Resale hold not found: ${missingHold}`, 404);
      }

      const orderId = createId('resale-order');
      const order: ResaleOrder = {
         orderId,
         orderNumber: `RESALE-ORD-${Date.now()}`,
         orderStatus: 'PENDING',
         totalQuantity: body.holdIds.length,
         totalAmount: 54000 * body.holdIds.length,
         holdIds: body.holdIds,
         transactionIds: body.holdIds.map(() => createId('transaction')),
      };

      resaleOrders.set(orderId, order);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalQuantity: order.totalQuantity,
            totalAmount: order.totalAmount,
         },
      });
   }),

   http.get('/api/v1/resales/orders/:orderId/transactions', async ({ params }) => {
      const order = resaleOrders.get(String(params.orderId));

      if (!order) {
         return buildErrorResponse('Resale order not found.', 404);
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: order.transactionIds,
      });
   }),

   http.post('/api/v1/resales/payments', async ({ request }) => {
      const body = (await request.json()) as {
         orderId?: string;
         buyerId?: string;
         totalAmount?: number;
         totalBuyerFee?: number;
         totalSellerFee?: number;
         items?: Array<{
            transactionId?: string;
            sellerId?: string;
            settlementAmount?: number;
         }>;
         paymentMethod?: string;
         idempotencyKey?: string;
      };

      const order = body?.orderId ? resaleOrders.get(body.orderId) : undefined;

      if (
         !order ||
         !body?.buyerId ||
         typeof body.totalAmount !== 'number' ||
         typeof body.totalBuyerFee !== 'number' ||
         typeof body.totalSellerFee !== 'number' ||
         !body.items?.length ||
         !body.paymentMethod ||
         !body.idempotencyKey
      ) {
         return buildErrorResponse('Missing resale payment fields.');
      }

      if (!isTicketPaymentMethod(body.paymentMethod)) {
         return buildErrorResponse('Invalid resale payment method.');
      }

      const invalidItem = body.items.find(
         (item) => !item.transactionId || !item.sellerId || typeof item.settlementAmount !== 'number',
      );

      if (invalidItem) {
         return buildErrorResponse('Invalid resale payment item.');
      }

      const paymentId = createId('resale-payment');
      const payment: ResalePayment = {
         paymentId,
         orderId: order.orderId,
         paymentMethod: body.paymentMethod,
         paymentAmount: body.totalAmount,
         pgTid: createId('mock-resale-pg-tid'),
         paymentStatus: 'SUCCESS',
         paidAt: new Date().toISOString(),
      };

      resalePayments.set(paymentId, payment);
      resaleLedgers.set(order.orderId, {
         id: createId('ledger'),
         orderId: order.orderId,
         paymentId,
         totalAmount: body.totalAmount,
         buyerFee: body.totalBuyerFee,
         sellerFee: body.totalSellerFee,
         vat: Math.round(body.totalSellerFee / 11),
         netProfit: body.totalBuyerFee + body.totalSellerFee,
         settlementAmount: body.items.reduce((sum, item) => sum + (item.settlementAmount ?? 0), 0),
         createdAt: payment.paidAt,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            paymentId: payment.paymentId,
            orderId: payment.orderId,
            paymentType: 'PAYMENT',
            paymentMethod: payment.paymentMethod,
            paymentAmount: payment.paymentAmount,
            pgProvider: 'MOCK',
            pgTid: payment.pgTid,
            paymentStatus: payment.paymentStatus,
            paidAt: payment.paidAt,
            failedReason: null,
         },
      });
   }),

   http.get('/api/v1/resales/payments/ledgers', async ({ request }) => {
      const searchParams = new URL(request.url).searchParams;
      const page = Number(searchParams.get('page') ?? 0);
      const size = Number(searchParams.get('size') ?? 10);
      const ledgers = Array.from(resaleLedgers.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: buildPageResponse(ledgers, page, size),
      });
   }),

   http.get('/api/v1/resales/payments/ledgers/orders/:orderId', async ({ params }) => {
      const ledger = resaleLedgers.get(String(params.orderId));

      if (!ledger) {
         return buildErrorResponse('Ledger not found.', 404);
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: ledger,
      });
   }),

   http.get('/api/v1/tickets/:ticketId', async ({ params }) => {
      const ticket = ticketRecords.get(String(params.ticketId));

      if (!ticket) {
         return buildErrorResponse('Ticket not found.', 404);
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ticketId: ticket.ticketId,
            orderId: ticket.orderId,
            gameId: ticket.gameId,
            seatId: ticket.seatId,
            ticketStatus: 'ISSUED',
         },
      });
   }),

   http.get('/api/v1/tickets/:ticketId/qr', async ({ params }) => {
      const ticket = ticketRecords.get(String(params.ticketId));

      if (!ticket) {
         return buildErrorResponse('Ticket not found.', 404);
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ticketId: ticket.ticketId,
            qrToken: ticket.qrToken,
         },
      });
   }),
];
