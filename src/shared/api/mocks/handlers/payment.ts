import { http, HttpResponse } from 'msw';

const seatGradesByStadium: Record<
   string,
   Array<{
      seatGradeId: string;
      stadiumId: string;
      name: string;
      displayColorHex: string;
   }>
> = {
   'stadium-kia-champions-field': [
      {
         seatGradeId: 'grade-kia-k8',
         stadiumId: 'stadium-kia-champions-field',
         name: 'K8석',
         displayColorHex: '#EFBC2E',
      },
      {
         seatGradeId: 'grade-kia-k9',
         stadiumId: 'stadium-kia-champions-field',
         name: 'K9석',
         displayColorHex: '#DB58AF',
      },
   ],
   'stadium-samsung-lions-park': [
      {
         seatGradeId: 'grade-samsung-first-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         name: '1루 내야지정석',
         displayColorHex: '#0A58BF',
      },
      {
         seatGradeId: 'grade-samsung-blue-zone',
         stadiumId: 'stadium-samsung-lions-park',
         name: '블루존',
         displayColorHex: '#1F4D93',
      },
   ],
};

const seatSectionsByStadium: Record<
   string,
   Array<{
      sectionId: string;
      gradeId: string;
      stadiumId: string;
      sectionCode: string;
      capacity: number;
   }>
> = {
   'stadium-kia-champions-field': [
      {
         sectionId: 'section-kia-108',
         gradeId: 'grade-kia-k8',
         stadiumId: 'stadium-kia-champions-field',
         sectionCode: '108',
         capacity: 500,
      },
      {
         sectionId: 'section-kia-109',
         gradeId: 'grade-kia-k8',
         stadiumId: 'stadium-kia-champions-field',
         sectionCode: '109',
         capacity: 500,
      },
      {
         sectionId: 'section-kia-112',
         gradeId: 'grade-kia-k9',
         stadiumId: 'stadium-kia-champions-field',
         sectionCode: '112',
         capacity: 900,
      },
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

export const paymentHandlers = [
   http.get('/api/v1/stadiums/:stadiumId/seat-grades', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: seatGradesByStadium[String(params.stadiumId)] ?? [],
      });
   }),

   http.get('/api/v1/stadiums/:stadiumId/seat-sections', async ({ params }) => {
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

   http.get('/api/v1/games/:gameId/sections/:sectionId/seat-statuses', async ({ params }) => {
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

   http.post('/api/v1/seat-reservations/seats/:seatId', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            holdId: `hold-${params.seatId}-${Date.now()}`,
         },
      });
   }),

   http.post('/api/v1/orders', async ({ request }) => {
      const body = (await request.json()) as {
         holdIds: string[];
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: `order-${Date.now()}`,
            orderNumber: `ORD-${Date.now()}`,
            gameId: 'mock-game-id',
            orderStatus: 'PENDING',
            totalQuantity: body.holdIds.length,
            totalAmount: body.holdIds.length * 10000,
         },
      });
   }),

   http.post('/api/v1/orders/:orderId/payments', async ({ params, request }) => {
      const body = (await request.json()) as {
         paymentMethod: string;
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            paymentId: `payment-${Date.now()}`,
            orderId: params.orderId,
            paymentType: 'PAYMENT',
            paymentMethod: body.paymentMethod,
            paymentAmount: 24000,
            pgProvider: 'MOCK',
            pgTid: `mock-pg-tid-${Date.now()}`,
            paymentStatus: 'SUCCESS',
            paidAt: new Date().toISOString(),
            failedReason: null,
         },
      });
   }),

   http.post('/api/v1/orders/:orderId/payment-confirmations', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: params.orderId,
            orderStatus: 'CONFIRMED',
            issuedTicketCount: 2,
         },
      });
   }),

   http.post('/api/v1/resales/holds', async () => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            holdId: crypto.randomUUID(),
         },
      });
   }),

   http.post('/api/v1/resales/orders', async ({ request }) => {
      const body = (await request.json()) as {
         holdIds: string[];
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: crypto.randomUUID(),
            orderNumber: `RESALE-ORD-${Date.now()}`,
            orderStatus: 'PENDING',
            totalQuantity: body.holdIds.length,
            totalAmount: 54000,
         },
      });
   }),

   http.get('/api/v1/resales/orders/:orderId/transactions', async () => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: [crypto.randomUUID()],
      });
   }),

   http.post('/api/v1/resales/payments', async ({ request }) => {
      const body = (await request.json()) as {
         orderId: string;
         paymentMethod: string;
         totalAmount: number;
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            paymentId: crypto.randomUUID(),
            orderId: body.orderId,
            paymentType: 'PAYMENT',
            paymentMethod: body.paymentMethod,
            paymentAmount: body.totalAmount,
            pgProvider: 'MOCK',
            pgTid: `mock-resale-pg-tid-${Date.now()}`,
            paymentStatus: 'SUCCESS',
            paidAt: new Date().toISOString(),
            failedReason: null,
         },
      });
   }),

   http.patch('/api/v1/resales/orders/:orderId/complete', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId: params.orderId,
            orderNumber: `RESALE-ORD-${Date.now()}`,
            buyerId: crypto.randomUUID(),
            totalAmount: 54000,
            orderStatus: 'COMPLETED',
            items: [
               {
                  transactionId: crypto.randomUUID(),
                  listingId: crypto.randomUUID(),
                  seatInfo: '1루 지정석 1열 12번',
                  price: 54000,
               },
            ],
         },
      });
   }),
];
