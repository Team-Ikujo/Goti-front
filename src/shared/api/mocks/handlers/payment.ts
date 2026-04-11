import { http, HttpResponse } from 'msw';
import { teams } from '@/entities/team/model/teams';
import { MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO } from '@/shared/api/mockScenarios';
import { mockGameSchedules } from './game';

// serverTeamId → 팀 단축명 조회 맵
const teamNameByServerId = Object.fromEntries(
   teams.filter(t => t.serverTeamId).map(t => [t.serverTeamId, t.name]),
);

const parseMockTokenPayload = (token: string) => {
   if (!token) {
      return null;
   }

   try {
      const payloadB64 = token.split('.')[1] ?? '';
      return JSON.parse(
         decodeURIComponent(
            atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
               .split('')
               .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
               .join(''),
         ),
      ) as Record<string, string>;
   } catch {
      return null;
   }
};

const getMockMemberKey = (request: Request) => {
   const authHeader = request.headers.get('Authorization') ?? '';
   const token = authHeader.replace(/^Bearer\s+/i, '');
   const decoded = parseMockTokenPayload(token);

   return decoded?.userId || decoded?.sub || decoded?.email || 'guest';
};

const getRequiredUserId = (request: Request) => {
   const userId = new URL(request.url).searchParams.get('userId')?.trim();

   if (!userId) {
      return null;
   }

   return userId;
};

type SeatGrade = {
   seatGradeId: string;
   stadiumId: string;
   name: string;
   displayColorHex: string;
   availableSeatCount: number;
};

type SeatGradeSearchResult = {
   sessionId: string;
   sessionExpiresAt: string;
   seatGrades: SeatGrade[];
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
   orderStatus: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'PARTIALLY_CANCELED';
   totalQuantity: number;
   totalAmount: number;
   holdIds: string[];
   orderedAt: string;
   // 게임/좌석 확장 정보
   homeTeamName?: string;
   awayTeamName?: string;
   stadiumName?: string;
   gameStartAt?: string;
   seatGradeName?: string;
   ticketIds?: string[];
   seatInfos?: string[];
   ordererName?: string;
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
   // hold 생성 시점의 listing 스냅샷 (listing이 없는 경우 fallback용)
   seatInfo?: string;
   listingPrice?: number;
   gameTitle?: string;
   gameDate?: string;
   stadiumName?: string;
};

type ResaleOrder = {
   orderId: string;
   orderNumber: string;
   orderStatus: 'PENDING' | 'COMPLETED';
   totalQuantity: number;
   totalAmount: number;
   holdIds: string[];
   transactionIds: string[];
   buyerNickname?: string;
   buyerEmail?: string;
   buyerPhone?: string;
};

type ResalePayment = {
   paymentId: string;
   orderId: string;
   buyerId: string;
   paymentMethod: string;
   paymentAmount: number;
   pgTid: string;
   paymentStatus: 'SUCCESS';
   paidAt: string;
};

type TicketRecord = {
   ticketId: string;
   ticketNumber: string;
   orderItemId: string;
   orderId: string;
   gameId: string;
   seatId: string;
   qrToken: string;
   // TicketDetail 전체 필드
   gameTitle: string;
   gameDate: string;
   stadiumName?: string;
   seatInfo: string;
   ticketPrice: number;
   serviceFee: number;
   paymentMethod?: string;
   paymentMethodDisplay?: string;
   ticketStatus: 'ISSUED' | 'USED' | 'INVALID' | 'RESALE_ISSUED';
   resaleEnabledStatus: 'ENABLED' | 'DISABLED';
   frozen?: boolean;
   frozenUntil?: string;
   issuedAt: string;
   orderedAt: string;
   cancelableUntil?: string;
   ordererName?: string;
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
      leagueType: 'EXHIBITION' | 'REGULAR' | 'POST_SEASON';
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
         seatGradeId: 'grade-kia-tigers-family',
         stadiumId: 'stadium-kia-champions-field',
         name: '타이거즈가족석',
         displayColorHex: '#7B3A99',
         availableSeatCount: 34,
      },
      {
         seatGradeId: 'grade-kia-surprise-zone',
         stadiumId: 'stadium-kia-champions-field',
         name: '서프라이즈존',
         displayColorHex: '#0A005F',
         availableSeatCount: 41,
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
      {
         seatGradeId: 'grade-kia-ev',
         stadiumId: 'stadium-kia-champions-field',
         name: 'EV석',
         displayColorHex: '#9574C1',
         availableSeatCount: 52,
      },
      {
         seatGradeId: 'grade-kia-outfield-free',
         stadiumId: 'stadium-kia-champions-field',
         name: '외야자유석',
         displayColorHex: '#6CBE88',
         availableSeatCount: 88,
      },
      {
         seatGradeId: 'grade-kia-outfield-family',
         stadiumId: 'stadium-kia-champions-field',
         name: '외야가족석',
         displayColorHex: '#4F9F72',
         availableSeatCount: 20,
      },
      {
         seatGradeId: 'grade-kia-wheelchair',
         stadiumId: 'stadium-kia-champions-field',
         name: '휠체어석',
         displayColorHex: '#2FA84F',
         availableSeatCount: 16,
      },
   ],
   'stadium-samsung-lions-park': [
      {
         seatGradeId: 'grade-samsung-first-base-exciting',
         stadiumId: 'stadium-samsung-lions-park',
         name: '1루 익사이팅석',
         displayColorHex: '#0A8AD8',
         availableSeatCount: 186,
      },
      {
         seatGradeId: 'grade-samsung-third-base-exciting',
         stadiumId: 'stadium-samsung-lions-park',
         name: '3루 익사이팅석',
         displayColorHex: '#17A2C7',
         availableSeatCount: 174,
      },
      {
         seatGradeId: 'grade-samsung-first-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         name: '1루 내야지정석',
         displayColorHex: '#0A58BF',
         availableSeatCount: 341,
      },
      {
         seatGradeId: 'grade-samsung-third-base-infield',
         stadiumId: 'stadium-samsung-lions-park',
         name: '3루 내야지정석',
         displayColorHex: '#145EB8',
         availableSeatCount: 324,
      },
      {
         seatGradeId: 'grade-samsung-blue-zone',
         stadiumId: 'stadium-samsung-lions-park',
         name: '블루존',
         displayColorHex: '#1F4D93',
         availableSeatCount: 127,
      },
      {
         seatGradeId: 'grade-samsung-away-zone',
         stadiumId: 'stadium-samsung-lions-park',
         name: '원정 응원석',
         displayColorHex: '#5B6DB2',
         availableSeatCount: 96,
      },
      {
         seatGradeId: 'grade-samsung-sky-lower',
         stadiumId: 'stadium-samsung-lions-park',
         name: 'SKY 하단 지정석',
         displayColorHex: '#5A7EE0',
         availableSeatCount: 288,
      },
      {
         seatGradeId: 'grade-samsung-sky-upper',
         stadiumId: 'stadium-samsung-lions-park',
         name: 'SKY 상단 지정석',
         displayColorHex: '#8AA0E8',
         availableSeatCount: 412,
      },
      {
         seatGradeId: 'grade-samsung-wheelchair',
         stadiumId: 'stadium-samsung-lions-park',
         name: '휠체어석',
         displayColorHex: '#2FA84F',
         availableSeatCount: 20,
      },
      {
         seatGradeId: 'grade-samsung-outfield',
         stadiumId: 'stadium-samsung-lions-park',
         name: '외야 지정석',
         displayColorHex: '#3AA66B',
         availableSeatCount: 218,
      },
      {
         seatGradeId: 'grade-samsung-grass',
         stadiumId: 'stadium-samsung-lions-park',
         name: '잔디석',
         displayColorHex: '#7BBE43',
         availableSeatCount: 73,
      },
      {
         seatGradeId: 'grade-samsung-center-table',
         stadiumId: 'stadium-samsung-lions-park',
         name: '중앙 테이블석',
         displayColorHex: '#234785',
         availableSeatCount: 54,
      },
      {
         seatGradeId: 'grade-samsung-first-base-table',
         stadiumId: 'stadium-samsung-lions-park',
         name: '1루 테이블석',
         displayColorHex: '#32559A',
         availableSeatCount: 38,
      },
      {
         seatGradeId: 'grade-samsung-third-base-table',
         stadiumId: 'stadium-samsung-lions-park',
         name: '3루 테이블석',
         displayColorHex: '#4064B0',
         availableSeatCount: 36,
      },
      {
         seatGradeId: 'grade-samsung-yogibo-family',
         stadiumId: 'stadium-samsung-lions-park',
         name: 'SKY 요기보 패밀리존',
         displayColorHex: '#6F5BD3',
         availableSeatCount: 12,
      },
      {
         seatGradeId: 'grade-samsung-party-floor',
         stadiumId: 'stadium-samsung-lions-park',
         name: '파티플로어 라이브석',
         displayColorHex: '#7840C9',
         availableSeatCount: 10,
      },
      {
         seatGradeId: 'grade-samsung-rooftop-table',
         stadiumId: 'stadium-samsung-lions-park',
         name: '루프탑 테이블석',
         displayColorHex: '#9152D9',
         availableSeatCount: 8,
      },
      {
         seatGradeId: 'grade-samsung-camping-zone',
         stadiumId: 'stadium-samsung-lions-park',
         name: '캠핑존',
         displayColorHex: '#A64DB3',
         availableSeatCount: 6,
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
         { priceId: 'price-kia-tigers-family-weekday', gradeId: 'grade-kia-tigers-family', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-surprise-zone-weekday', gradeId: 'grade-kia-surprise-zone', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-kia-party-weekday', gradeId: 'grade-kia-party', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-sky-weekday', gradeId: 'grade-kia-sky-picnic', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 45000 },
         { priceId: 'price-kia-table-weekday', gradeId: 'grade-kia-table-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 40000 },
         { priceId: 'price-kia-ev-weekday', gradeId: 'grade-kia-ev', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-kia-outfield-free-weekday', gradeId: 'grade-kia-outfield-free', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-kia-outfield-family-weekday', gradeId: 'grade-kia-outfield-family', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 35000 },
         { priceId: 'price-kia-wheelchair-weekday', gradeId: 'grade-kia-wheelchair', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-kia-champion-weekend', gradeId: 'grade-kia-champion', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 60000 },
         { priceId: 'price-kia-k8-weekend', gradeId: 'grade-kia-k8', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 16000 },
         { priceId: 'price-kia-tigers-family-weekend', gradeId: 'grade-kia-tigers-family', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 55000 },
         { priceId: 'price-kia-surprise-zone-weekend', gradeId: 'grade-kia-surprise-zone', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-kia-ev-weekend', gradeId: 'grade-kia-ev', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-kia-outfield-free-weekend', gradeId: 'grade-kia-outfield-free', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-kia-outfield-family-weekend', gradeId: 'grade-kia-outfield-family', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 35000 },
         { priceId: 'price-kia-wheelchair-weekend', gradeId: 'grade-kia-wheelchair', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 10000 },
      ],
   },
   '412cfc77-2c5d-4583-8e79-968339223864': {
      policyId: 'policy-samsung-2026',
      teamId: '412cfc77-2c5d-4583-8e79-968339223864',
      policyStartAt: '2026-03-01',
      policyEndAt: '2026-10-31',
      isActive: true,
      prices: [
         { priceId: 'price-samsung-first-base-exciting-weekday', gradeId: 'grade-samsung-first-base-exciting', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 28000 },
         { priceId: 'price-samsung-third-base-exciting-weekday', gradeId: 'grade-samsung-third-base-exciting', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 28000 },
         { priceId: 'price-samsung-first-base-weekday', gradeId: 'grade-samsung-first-base-infield', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 22000 },
         { priceId: 'price-samsung-third-base-weekday', gradeId: 'grade-samsung-third-base-infield', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 22000 },
         { priceId: 'price-samsung-blue-weekday', gradeId: 'grade-samsung-blue-zone', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 20000 },
         { priceId: 'price-samsung-away-weekday', gradeId: 'grade-samsung-away-zone', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 17000 },
         { priceId: 'price-samsung-sky-lower-weekday', gradeId: 'grade-samsung-sky-lower', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 18000 },
         { priceId: 'price-samsung-sky-upper-weekday', gradeId: 'grade-samsung-sky-upper', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 14000 },
         { priceId: 'price-samsung-wheelchair-weekday', gradeId: 'grade-samsung-wheelchair', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-samsung-outfield-weekday', gradeId: 'grade-samsung-outfield', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 12000 },
         { priceId: 'price-samsung-grass-weekday', gradeId: 'grade-samsung-grass', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-samsung-center-table-weekday', gradeId: 'grade-samsung-center-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-samsung-first-base-table-weekday', gradeId: 'grade-samsung-first-base-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-samsung-third-base-table-weekday', gradeId: 'grade-samsung-third-base-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-samsung-yogibo-family-weekday', gradeId: 'grade-samsung-yogibo-family', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 36000 },
         { priceId: 'price-samsung-party-floor-weekday', gradeId: 'grade-samsung-party-floor', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 42000 },
         { priceId: 'price-samsung-rooftop-table-weekday', gradeId: 'grade-samsung-rooftop-table', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 45000 },
         { priceId: 'price-samsung-camping-zone-weekday', gradeId: 'grade-samsung-camping-zone', ticketType: 'ADULT', dayType: 'WEEKDAY', leagueType: 'REGULAR', price: 50000 },
         { priceId: 'price-samsung-first-base-exciting-weekend', gradeId: 'grade-samsung-first-base-exciting', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-samsung-third-base-exciting-weekend', gradeId: 'grade-samsung-third-base-exciting', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 30000 },
         { priceId: 'price-samsung-first-base-weekend', gradeId: 'grade-samsung-first-base-infield', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 24000 },
         { priceId: 'price-samsung-third-base-weekend', gradeId: 'grade-samsung-third-base-infield', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 24000 },
         { priceId: 'price-samsung-blue-weekend', gradeId: 'grade-samsung-blue-zone', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 22000 },
         { priceId: 'price-samsung-away-weekend', gradeId: 'grade-samsung-away-zone', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 19000 },
         { priceId: 'price-samsung-sky-lower-weekend', gradeId: 'grade-samsung-sky-lower', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 20000 },
         { priceId: 'price-samsung-sky-upper-weekend', gradeId: 'grade-samsung-sky-upper', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 16000 },
         { priceId: 'price-samsung-wheelchair-weekend', gradeId: 'grade-samsung-wheelchair', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 10000 },
         { priceId: 'price-samsung-outfield-weekend', gradeId: 'grade-samsung-outfield', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 14000 },
         { priceId: 'price-samsung-grass-weekend', gradeId: 'grade-samsung-grass', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 12000 },
         { priceId: 'price-samsung-center-table-weekend', gradeId: 'grade-samsung-center-table', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 32000 },
         { priceId: 'price-samsung-first-base-table-weekend', gradeId: 'grade-samsung-first-base-table', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 32000 },
         { priceId: 'price-samsung-third-base-table-weekend', gradeId: 'grade-samsung-third-base-table', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 32000 },
         { priceId: 'price-samsung-yogibo-family-weekend', gradeId: 'grade-samsung-yogibo-family', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 38000 },
         { priceId: 'price-samsung-party-floor-weekend', gradeId: 'grade-samsung-party-floor', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 44000 },
         { priceId: 'price-samsung-rooftop-table-weekend', gradeId: 'grade-samsung-rooftop-table', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 47000 },
         { priceId: 'price-samsung-camping-zone-weekend', gradeId: 'grade-samsung-camping-zone', ticketType: 'ADULT', dayType: 'WEEKEND', leagueType: 'REGULAR', price: 52000 },
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
         gradeId: 'grade-kia-tigers-family',
         codes: ['H-1', 'H-2'],
         capacity: 96,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-surprise-zone',
         codes: ['G-1', 'G-2'],
         capacity: 84,
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
         gradeId: 'grade-kia-ev',
         codes: ['509', '510', '527', '528'],
         capacity: 72,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-outfield-free',
         codes: ['O-1', 'O-2', 'O-3', 'O-4'],
         capacity: 120,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-outfield-family',
         codes: ['P-1', 'P-2'],
         capacity: 84,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-party',
         codes: ['J-1', 'J-2', 'J-3', 'J-4', 'J-5', 'J-6'],
         capacity: 32,
      }),
      ...createSections({
         stadiumId: 'stadium-kia-champions-field',
         gradeId: 'grade-kia-wheelchair',
         codes: ['100', '101'],
         capacity: 12,
      }),
   ],
   'stadium-samsung-lions-park': [
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-first-base-exciting',
         codes: ['1-1', '1-2', '1-3', '1-4', '1-5'],
         capacity: 120,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-first-base-infield',
         codes: ['1-6', '1-7', '1-8', '1-9', '1-10', '1-11'],
         capacity: 180,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-third-base-exciting',
         codes: ['3E-1', '3E-2', '3E-3'],
         capacity: 150,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-third-base-infield',
         codes: ['3-6', '3-7', '3-8', '3-9', '3-10', '3-11'],
         capacity: 180,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-blue-zone',
         codes: ['3-1', '3-2', '3-3', '3-4', '3-5'],
         capacity: 140,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-away-zone',
         codes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
         capacity: 100,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-sky-lower',
         codes: ['S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22'],
         capacity: 110,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-sky-upper',
         codes: ['U1', 'U2', 'U3', 'U4', 'U5', 'U6', 'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'U22', 'U23', 'U24'],
         capacity: 90,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-wheelchair',
         codes: ['WC-1', 'WC-2'],
         capacity: 12,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-outfield',
         codes: ['LF-1', 'LF-2', 'LF-3', 'LF-4', 'LF-5', 'LF-6', 'LF-7', 'LF-8', 'LF-9', 'LF-10', 'RF-1', 'RF-2', 'RF-3', 'RF-4', 'RF-5', 'RF-6', 'RF-7', 'RF-8', 'RF-9', 'RF-10'],
         capacity: 90,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-grass',
         codes: ['GR-1', 'GR-2', 'GR-3'],
         capacity: 80,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-center-table',
         codes: ['CT-1', 'CT-2', 'CT-3'],
         capacity: 72,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-first-base-table',
         codes: ['1T-1', '1T-2'],
         capacity: 56,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-third-base-table',
         codes: ['3T-1', '3T-2'],
         capacity: 56,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-yogibo-family',
         codes: ['YG-1', 'YG-2'],
         capacity: 24,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-party-floor',
         codes: ['PF-1', 'PF-2'],
         capacity: 24,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-rooftop-table',
         codes: ['RT-1'],
         capacity: 20,
      }),
      ...createSections({
         stadiumId: 'stadium-samsung-lions-park',
         gradeId: 'grade-samsung-camping-zone',
         codes: ['CP-1'],
         capacity: 20,
      }),
   ],
};

// ── MSW localStorage 영속화 ────────────────────────────────────────

const MSW_STORAGE_VERSION = '8';
const MSW_VERSION_KEY = '__msw_storage_version__';
const MSW_STORAGE_KEYS = [
   '__msw_ticket_orders__',
   '__msw_ticket_records__',
   '__msw_seat_holds__',
   '__msw_resale_listings__',
   '__msw_resale_orders__',
];

(function migrateStorage() {
   try {
      if (typeof localStorage !== 'undefined' && localStorage.getItem(MSW_VERSION_KEY) !== MSW_STORAGE_VERSION) {
         MSW_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
         localStorage.setItem(MSW_VERSION_KEY, MSW_STORAGE_VERSION);
      }
   } catch {}
})();

function createPersistedMap<V>(storageKey: string): Map<string, V> {
   const map = new Map<string, V>();
   try {
      if (typeof localStorage !== 'undefined') {
         const raw = localStorage.getItem(storageKey);
         if (raw) {
            const entries = JSON.parse(raw) as Array<[string, V]>;
            entries.forEach(([k, v]) => map.set(k, v));
         }
      }
   } catch {}

   return new Proxy(map, {
      get(target, prop) {
         const value = Reflect.get(target, prop);
         if (typeof value === 'function') {
            return (...args: unknown[]) => {
               const result = (value as (...a: unknown[]) => unknown).apply(target, args);
               if (prop === 'set' || prop === 'delete' || prop === 'clear') {
                  try {
                     if (typeof localStorage !== 'undefined') {
                        localStorage.setItem(storageKey, JSON.stringify(Array.from(target.entries())));
                     }
                  } catch {}
               }
               return result;
            };
         }
         return value;
      },
   }) as Map<string, V>;
}

// ── 영속 Map ──────────────────────────────────────────────────────

const seatReservationHolds = createPersistedMap<SeatReservationHold>('__msw_seat_holds__');
const ticketOrders = createPersistedMap<TicketOrder>('__msw_ticket_orders__');
const ticketPayments = new Map<string, TicketPayment>();
const ticketRecords = createPersistedMap<TicketRecord>('__msw_ticket_records__');
const resaleHolds = new Map<string, ResaleHold>();
const resaleOrders = createPersistedMap<ResaleOrder>('__msw_resale_orders__');
const resalePayments = new Map<string, ResalePayment>();
const resaleLedgers = new Map<string, ResaleLedger>();

type ResaleListing = {
   listingId: string;
   orderId?: string;
   ticketId: string;
   ticketNumber?: string;
   sellerId: string;
   seatInfo: string;
   listingPrice: number;
   listingStatus: 'LISTING' | 'HOLD' | 'SOLD' | 'SETTLED' | 'CANCEL_REQUESTED' | 'CANCELED';
   listedAt: string;
   canceledAt?: string;
   // 경기 정보 (티켓에서 복사)
   gameTitle?: string;
   gameDate?: string;
   stadiumName?: string;
};
const resaleListings = createPersistedMap<ResaleListing>('__msw_resale_listings__');

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}`;
};

/** 게임 시작일 → WEEKDAY | WEEKEND */
const getDayType = (startAt: string): 'WEEKDAY' | 'WEEKEND' => {
   const d = new Date(startAt);
   const day = d.getDay(); // 0=일, 6=토
   return day === 0 || day === 6 ? 'WEEKEND' : 'WEEKDAY';
};

/** seatId → 해당 좌석의 단가 (pricing policy 기준) */
const resolveSeatPrice = (homeTeamId: string, seatId: string, startAt: string): number => {
   const sectionId = seatId.replace(/-[A-F]-\d+$/, '');
   const section = Object.values(seatSectionsByStadium).flat().find(s => s.sectionId === sectionId);
   if (!section) return 12000;
   const policy = pricingPoliciesByTeamId[homeTeamId];
   if (!policy) return 12000;
   const dayType = getDayType(startAt);
   const entry = policy.prices.find(
      p => p.gradeId === section.gradeId && p.dayType === dayType && p.leagueType === 'REGULAR',
   );
   return entry?.price ?? 12000;
};

/** seatId에서 구역 ID 추출: ${sectionId}-${rowName(1자)}-${seatNum} 형식 */
const extractSectionId = (seatId: string): string => {
   return seatId.replace(/-[A-F]-\d+$/, '');
};

/** seatId → 등급명 조회 */
const resolveSeatGradeName = (seatId: string): string | undefined => {
   const sectionId = extractSectionId(seatId);
   const allSections = Object.values(seatSectionsByStadium).flat();
   const section = allSections.find((s) => s.sectionId === sectionId);
   if (!section) return undefined;
   const allGrades = Object.values(seatGradesByStadium).flat();
   return allGrades.find((g) => g.seatGradeId === section.gradeId)?.name;
};

/** seatId → "등급명 구역코드구역 X열 N번" 형식의 좌석 정보 문자열 */
const buildSeatInfoStr = (seatId: string): string => {
   const sectionId = extractSectionId(seatId);
   const allSections = Object.values(seatSectionsByStadium).flat();
   const section = allSections.find((s) => s.sectionId === sectionId);
   const allGrades = Object.values(seatGradesByStadium).flat();
   const gradeName = section ? (allGrades.find((g) => g.seatGradeId === section.gradeId)?.name ?? '좌석') : '좌석';
   const sectionCode = section?.sectionCode ?? sectionId.split('-').slice(-1)[0];
   const match = seatId.match(/-([A-F])-(\d+)$/);
   const rowName = match?.[1];
   const seatNum = match?.[2];
   return [gradeName, `${sectionCode}구역`, rowName ? `${rowName}열` : null, seatNum ? `${seatNum}번` : null]
      .filter(Boolean)
      .join(' ');
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

const createMockResaleListings = ({
   gameId,
   seatIds,
   sellerId,
   listedAtSeed,
}: {
   gameId: string;
   seatIds: string[];
   sellerId: string;
   listedAtSeed: string;
}) => {
   const matchedGame = mockGameSchedules.find((game) => game.gameId === gameId);

   if (!matchedGame) {
      return [];
   }

   return seatIds.map((seatId, index) => {
      const sectionId = extractSectionId(seatId);
      const section = Object.values(seatSectionsByStadium).flat().find((item) => item.sectionId === sectionId);
      const seatPrice = resolveSeatPrice(matchedGame.homeTeamId, seatId, matchedGame.startAt);
      const listingPrice = seatPrice + (index % 4) * 1000 + 2000;
      const minPrice = Math.max(1000, listingPrice - 4000);
      const maxPrice = listingPrice + 6000;

      return {
         listingId: `listing-${gameId}-${index + 1}`,
         ticketId: `ticket-${gameId}-${index + 1}`,
         sellerId,
         gameId,
         seatId,
         gradeId: section?.gradeId ?? 'grade-unknown',
         seatInfo: buildSeatInfoStr(seatId),
         dailyBasePrice: seatPrice,
         listingPrice,
         listingStatus: 'LISTING',
         availableStatus: 'ENABLED',
         lastTransactionPrice: Math.max(seatPrice, listingPrice - 2000),
         listedAt: new Date(new Date(listedAtSeed).getTime() + index * 15 * 60 * 1000).toISOString(),
         soldAt: undefined,
         canceledAt: undefined,
         isCancelable: true,
         isPurchasable: true,
         minPrice,
         maxPrice,
      };
   });
};

const mockResaleListings = [
   ...createMockResaleListings({
      gameId: 'game-samsung-home-today',
      sellerId: 'seller-samsung-001',
      listedAtSeed: '2026-03-27T04:00:00.000Z',
      seatIds: [
         'section-samsung-1-6-A-3',
         'section-samsung-1-7-B-4',
         'section-samsung-1-8-A-5',
         'section-samsung-3-1-A-3',
         'section-samsung-3-2-B-4',
      ],
   }),
   ...createMockResaleListings({
      gameId: 'game-kia-home-tomorrow',
      sellerId: 'seller-kia-001',
      listedAtSeed: '2026-03-28T02:00:00.000Z',
      seatIds: [
         'section-stadium-kia-champions-field-104-A-3',
         'section-stadium-kia-champions-field-105-B-4',
         'section-stadium-kia-champions-field-108-A-5',
         'section-stadium-kia-champions-field-118-B-3',
         'section-stadium-kia-champions-field-119-A-4',
      ],
   }),
   ...createMockResaleListings({
      gameId: 'game-samsung-home-this-weekend',
      sellerId: 'seller-samsung-002',
      listedAtSeed: '2026-03-30T03:00:00.000Z',
      seatIds: [
         'section-samsung-1-6-C-3',
         'section-samsung-1-7-C-4',
         'section-samsung-3-1-B-3',
         'section-samsung-3-2-C-4',
         'section-samsung-S7-A-3',
      ],
   }),
   ...createMockResaleListings({
      gameId: 'game-kia-home-two-weeks',
      sellerId: 'seller-kia-002',
      listedAtSeed: '2026-04-10T03:30:00.000Z',
      seatIds: [
         'section-stadium-kia-champions-field-519-A-3',
         'section-stadium-kia-champions-field-520-B-4',
         'section-stadium-kia-champions-field-521-C-3',
         'section-stadium-kia-champions-field-J-1-A-4',
         'section-stadium-kia-champions-field-J-2-B-3',
      ],
   }),
];

const mockResaleHistoryGraphByKey: Record<string, Array<{ transactionPrice: number; confirmedAt: string }>> = {
   'game-samsung-home-today:grade-samsung-first-base-infield:HOUR': [
      { transactionPrice: 22000, confirmedAt: '2026-03-27T05:00:00.000Z' },
      { transactionPrice: 23000, confirmedAt: '2026-03-27T05:40:00.000Z' },
      { transactionPrice: 24000, confirmedAt: '2026-03-27T06:20:00.000Z' },
      { transactionPrice: 25000, confirmedAt: '2026-03-27T07:00:00.000Z' },
   ],
   'game-samsung-home-today:grade-samsung-first-base-infield:DAY': [
      { transactionPrice: 21000, confirmedAt: '2026-03-23T09:00:00.000Z' },
      { transactionPrice: 22000, confirmedAt: '2026-03-24T09:00:00.000Z' },
      { transactionPrice: 23000, confirmedAt: '2026-03-25T09:00:00.000Z' },
      { transactionPrice: 24000, confirmedAt: '2026-03-26T09:00:00.000Z' },
      { transactionPrice: 25000, confirmedAt: '2026-03-27T09:00:00.000Z' },
   ],
   'game-kia-home-tomorrow:grade-kia-k5:HOUR': [
      { transactionPrice: 13000, confirmedAt: '2026-03-28T04:00:00.000Z' },
      { transactionPrice: 14000, confirmedAt: '2026-03-28T05:10:00.000Z' },
      { transactionPrice: 15000, confirmedAt: '2026-03-28T06:20:00.000Z' },
   ],
   'game-kia-home-tomorrow:grade-kia-k5:DAY': [
      { transactionPrice: 12000, confirmedAt: '2026-03-24T09:00:00.000Z' },
      { transactionPrice: 13000, confirmedAt: '2026-03-25T09:00:00.000Z' },
      { transactionPrice: 14000, confirmedAt: '2026-03-26T09:00:00.000Z' },
      { transactionPrice: 15000, confirmedAt: '2026-03-27T09:00:00.000Z' },
   ],
};

const buildMockGameTitle = (gameId: string) => {
   const matchedGame = mockGameSchedules.find((game) => game.gameId === gameId);

   if (!matchedGame) {
      return 'KBO 리그 경기';
   }

   return `${matchedGame.awayTeamDisplayName} vs ${matchedGame.homeTeamDisplayName}`;
};

const buildMockStadiumName = (gameId: string) => {
   const matchedGame = mockGameSchedules.find((game) => game.gameId === gameId);

   if (!matchedGame) {
      return '';
   }

   return `${matchedGame.stadiumLocation} ${matchedGame.homeTeamDisplayName} 홈구장`;
};

const getResaleListingFromSeed = (listingId: string): ResaleListing | null => {
   const seedListing = mockResaleListings.find((listing) => listing.listingId === listingId);

   if (!seedListing) {
      return null;
   }

   return {
      listingId: seedListing.listingId,
      ticketId: seedListing.ticketId,
      sellerId: seedListing.sellerId,
      seatInfo: seedListing.seatInfo,
      listingPrice: seedListing.listingPrice,
      listingStatus: seedListing.listingStatus as ResaleListing['listingStatus'],
      listedAt: seedListing.listedAt,
      canceledAt: seedListing.canceledAt,
      gameTitle: buildMockGameTitle(seedListing.gameId),
      gameDate: mockGameSchedules.find((game) => game.gameId === seedListing.gameId)?.startAt ?? '',
      stadiumName: buildMockStadiumName(seedListing.gameId),
   };
};

const ensureMockResaleListingsSeed = () => {
   mockResaleListings.forEach((listing) => {
      if (resaleListings.has(listing.listingId)) {
         return;
      }

      const seededListing = getResaleListingFromSeed(listing.listingId);

      if (!seededListing) {
         return;
      }

      resaleListings.set(listing.listingId, seededListing);
   });
};

ensureMockResaleListingsSeed();

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

const buildPaymentMethodDisplay = (paymentMethod: string): string => {
   switch (paymentMethod) {
      case 'CARD': return '카드 결제(신한카드 1234)';
      case 'ACCOUNT_TRANSFER': return '무통장 입금';
      default: return paymentMethod;
   }
};

const MYPAGE_MOCK_PROFILE_STORAGE_KEY = 'mypage-mock-profile';
const DEFAULT_MOCK_ORDERER_NAME = '테스트 유저';

const getMockOrdererName = () => {
   if (typeof window === 'undefined') {
      return DEFAULT_MOCK_ORDERER_NAME;
   }

   try {
      const storedValue = window.localStorage.getItem(MYPAGE_MOCK_PROFILE_STORAGE_KEY);
      if (!storedValue) {
         return DEFAULT_MOCK_ORDERER_NAME;
      }

      const parsed = JSON.parse(storedValue) as { name?: string };
      return parsed.name?.trim() || DEFAULT_MOCK_ORDERER_NAME;
   } catch {
      return DEFAULT_MOCK_ORDERER_NAME;
   }
};

const isTicketPaymentMethod = (paymentMethod: unknown) => {
   return (
      paymentMethod === 'CARD' ||
      paymentMethod === 'ACCOUNT_TRANSFER'
   );
};

const ensureMockPurchaseHistorySeed = () => {
   const seedOrderId = 'mock-order-mypage-actions';
   if (ticketOrders.has(seedOrderId)) {
      return;
   }

   const seedGame = mockGameSchedules.find((game) => game.gameId === 'game-kia-home-tomorrow');
   if (!seedGame) {
      return;
   }

   const seedSeatIds = [
      'section-stadium-kia-champions-field-104-A-9',
      'section-stadium-kia-champions-field-104-A-10',
   ];
   const seedTicketIds = seedSeatIds.map((_, index) => `mock-ticket-mypage-actions-${index + 1}`);
   const orderedAt = new Date(new Date(seedGame.startAt.replace(' ', 'T')).getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
   const serviceFee = 1000;

   const seatInfos = seedSeatIds.map((seatId) => buildSeatInfoStr(seatId));
   const ticketPrices = seedSeatIds.map((seatId) => resolveSeatPrice(seedGame.homeTeamId, seatId, seedGame.startAt));
   const totalAmount = ticketPrices.reduce((sum, price) => sum + price + serviceFee, 0);
   const ordererName = getMockOrdererName();

   ticketOrders.set(seedOrderId, {
      orderId: seedOrderId,
      orderNumber: 'T241231ABC123',
      gameId: seedGame.gameId,
      stadiumId: seedGame.stadiumId,
      orderStatus: 'CONFIRMED',
      totalQuantity: seedSeatIds.length,
      totalAmount,
      holdIds: [],
      orderedAt,
      homeTeamName: seedGame.homeTeamDisplayName,
      awayTeamName: seedGame.awayTeamDisplayName,
      stadiumName: `${seedGame.stadiumLocation} ${seedGame.homeTeamDisplayName} 홈구장`,
      gameStartAt: seedGame.startAt,
      seatGradeName: resolveSeatGradeName(seedSeatIds[0]) ?? '좌석 정보',
      ticketIds: seedTicketIds,
      seatInfos,
      ordererName,
   });

    ticketPayments.set(`mock-payment-${seedOrderId}`, {
      paymentId: `mock-payment-${seedOrderId}`,
      orderId: seedOrderId,
      paymentMethod: 'CARD',
      paymentAmount: totalAmount,
      pgTid: `pg-${seedOrderId}`,
      paymentStatus: 'SUCCESS',
      paidAt: orderedAt,
   });

   seedTicketIds.forEach((ticketId, index) => {
      ticketRecords.set(ticketId, {
         ticketId,
         ticketNumber: `TKT-MOCK-${index + 1}`,
         orderItemId: `mock-order-item-mypage-actions-${index + 1}`,
         orderId: seedOrderId,
         gameId: seedGame.gameId,
         seatId: seedSeatIds[index],
         qrToken: `mock-qr-mypage-actions-${index + 1}`,
         gameTitle: `${seedGame.awayTeamDisplayName} vs ${seedGame.homeTeamDisplayName}`,
         gameDate: seedGame.startAt,
         stadiumName: `${seedGame.stadiumLocation} ${seedGame.homeTeamDisplayName} 홈구장`,
         seatInfo: seatInfos[index],
         ticketPrice: ticketPrices[index],
         serviceFee,
         paymentMethod: 'CARD',
         paymentMethodDisplay: buildPaymentMethodDisplay('CARD'),
         ticketStatus: 'ISSUED',
         resaleEnabledStatus: 'ENABLED',
         issuedAt: orderedAt,
         orderedAt,
         cancelableUntil: new Date(new Date(seedGame.startAt.replace(' ', 'T')).getTime() - 4 * 60 * 60 * 1000).toISOString(),
         ordererName,
      });
   });
};

ensureMockPurchaseHistorySeed();

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

const getPurchaseSeatInfos = (order: TicketOrder) => {
   if (Array.isArray(order.seatInfos) && order.seatInfos.length > 0) {
      return order.seatInfos;
   }

   if (Array.isArray(order.ticketIds) && order.ticketIds.length > 0) {
      return order.ticketIds
         .map((ticketId) => ticketRecords.get(ticketId)?.seatInfo)
         .filter((seatInfo): seatInfo is string => typeof seatInfo === 'string' && seatInfo.length > 0);
   }

   return [];
};

const getOwnedTicketCountForGame = (gameId: string) => {
   return Array.from(ticketOrders.values()).reduce((count, order) => {
      if (order.gameId !== gameId) {
         return count;
      }

      if (order.orderStatus !== 'CONFIRMED' && order.orderStatus !== 'PARTIALLY_CANCELED') {
         return count;
      }

      return count + order.totalQuantity;
   }, 0);
};

export const paymentHandlers = [
   http.get('/api/v1/tickets/myinfo', async ({ request }) => {
      const currentUserId = getMockMemberKey(request);
      const userListings = Array.from(resaleListings.values()).filter((listing) => listing.sellerId === currentUserId);
      const ownedTicketCount = Array.from(ticketRecords.values()).filter((ticket) => {
         if (ticket.ticketStatus === 'INVALID') {
            return false;
         }

         return true;
      }).length;

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ownedTicketCount,
            listingCount: userListings.filter((listing) => listing.listingStatus === 'LISTING' || listing.listingStatus === 'HOLD').length,
            soldCount: userListings.filter((listing) => listing.listingStatus === 'SOLD' || listing.listingStatus === 'SETTLED').length,
            unsettledAmount: userListings
               .filter((listing) => listing.listingStatus === 'SOLD')
               .reduce((sum, listing) => sum + listing.listingPrice, 0),
         },
      });
   }),

   http.get('/api/v1/tickets/resales/count', async ({ request }) => {
      const url = new URL(request.url);
      const gameId = (url.searchParams.get('gameId') ?? '').trim();

      if (!gameId) {
         return buildErrorResponse('Missing gameId.');
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ownedTicketCount: getOwnedTicketCountForGame(gameId),
         },
      });
   }),

   http.get('/api/v1/payments/purchases', async ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? '0');
      const size = Number(url.searchParams.get('size') ?? '20');
      const keyword = (url.searchParams.get('keyword') ?? '').trim().toLowerCase();

      const ticketPurchases = Array.from(ticketOrders.values()).map((order) => {
         const matchedGame = mockGameSchedules.find((game) => game.gameId === order.gameId);
         const seatInfos = getPurchaseSeatInfos(order);

         return {
            purchaseType: 'TICKET',
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalQuantity: order.totalQuantity,
            totalAmount: order.totalAmount,
            orderedAt: order.orderedAt,
            gameId: order.gameId,
            stadiumId: order.stadiumId,
            gameTitle:
               order.homeTeamName && order.awayTeamName
                  ? `${order.awayTeamName} vs ${order.homeTeamName}`
                  : matchedGame
                     ? `${matchedGame.awayTeamDisplayName} vs ${matchedGame.homeTeamDisplayName}`
                     : 'KBO 리그 경기',
            gameDate: order.gameStartAt ?? matchedGame?.startAt ?? order.orderedAt,
            seatInfos,
         };
      });

      const resalePurchases = Array.from(resaleOrders.values())
         .map((order) => {
            const issuedTickets = Array.from(ticketRecords.values()).filter(
               (ticket) => ticket.orderId === order.orderId && ticket.ticketStatus === 'RESALE_ISSUED',
            );
            const primaryTicket = issuedTickets[0];

            if (!primaryTicket) {
               return null;
            }

            return {
               purchaseType: 'RESALE',
               orderId: order.orderId,
               orderNumber: order.orderNumber,
               orderStatus: order.orderStatus,
               totalQuantity: issuedTickets.length,
               totalAmount: order.totalAmount,
               orderedAt: primaryTicket.orderedAt,
               gameId: primaryTicket.gameId,
               stadiumId: '',
               gameTitle: primaryTicket.gameTitle,
               gameDate: primaryTicket.gameDate,
               seatInfos: issuedTickets.map((ticket) => ticket.seatInfo),
            };
         })
         .filter((purchase): purchase is NonNullable<typeof purchase> => purchase !== null);

      const purchases = [...ticketPurchases, ...resalePurchases]
         .sort((left, right) => right.orderedAt.localeCompare(left.orderedAt))
         .filter((purchase) => {
            if (!keyword) {
               return true;
            }

            return (
               purchase.orderNumber.toLowerCase().includes(keyword) ||
               purchase.gameTitle.toLowerCase().includes(keyword) ||
               purchase.seatInfos.some((seatInfo) => seatInfo.toLowerCase().includes(keyword))
            );
         });
      const pagedPurchases = buildPageResponse(purchases, page, size);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            list: pagedPurchases.content,
            totalCount: purchases.length,
            totalPages: pagedPurchases.totalPages,
         },
      });
   }),

   http.get('/api/v1/resales/games/:gameId/count', async ({ params }) => {
      const gameId = String(params.gameId);
      const gameExists = mockGameSchedules.some((game) => game.gameId === gameId);

      if (!gameExists) {
         return HttpResponse.json(
            {
               code: 'NOT_FOUND',
               message: 'game not found',
               data: null,
            },
            { status: 404 },
         );
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            count: mockResaleListings.filter((listing) => listing.gameId === gameId && listing.isPurchasable).length,
         },
      });
   }),

   http.get('/api/v1/resales/games/:gameId/status', async ({ params }) => {
      const gameId = String(params.gameId);
      const matchedGame = mockGameSchedules.find((game) => game.gameId === gameId);

      if (!matchedGame) {
         return HttpResponse.json(
            {
               code: 'NOT_FOUND',
               message: 'game not found',
               data: null,
            },
            { status: 404 },
         );
      }

      let status: 'SCHEDULED' | 'AVAILABLE' | 'UNAVAILABLE' = 'AVAILABLE';

      if (matchedGame.ticketingStatus === 'SCHEDULED') {
         status = 'SCHEDULED';
      } else if (
         matchedGame.ticketingStatus === 'TERMINATED' ||
         matchedGame.gameStatus === 'FINISHED' ||
         matchedGame.gameStatus !== 'SCHEDULED'
      ) {
         status = 'UNAVAILABLE';
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { status },
      });
   }),

   http.get('/api/v1/resales/games/:gameId/grade/:gradeId/count', async ({ params }) => {
      const gameId = String(params.gameId);
      const gradeId = String(params.gradeId);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            count: mockResaleListings.filter(
               (listing) => listing.gameId === gameId && listing.isPurchasable && listing.gradeId === gradeId,
            ).length,
         },
      });
   }),

   http.get('/api/v1/resales/listings/count', async ({ request }) => {
      const userId = getRequiredUserId(request);

      if (!userId) {
         return buildErrorResponse('Missing userId.', 400);
      }

      const myListings = Array.from(resaleListings.values()).filter((listing) => listing.sellerId === userId);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            listingCount: myListings.filter((listing) => listing.listingStatus === 'LISTING' || listing.listingStatus === 'HOLD').length,
            soldCount: myListings.filter((listing) => listing.listingStatus === 'SOLD' || listing.listingStatus === 'SETTLED').length,
         },
      });
   }),

   // 내 판매 그룹 목록 조회
   http.get('/api/v1/resales/listings/orders', async () => {
      const orders = Array.from(resaleOrders.values())
         .sort((left, right) => right.orderId.localeCompare(left.orderId))
         .map((order) => ({
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalQuantity: order.totalQuantity,
            totalAmount: order.totalAmount,
            createdAt: order.transactionIds[0] ? new Date().toISOString() : new Date().toISOString(),
         }));

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            list: orders,
            totalCount: orders.length,
            totalPages: orders.length > 0 ? 1 : 0,
         },
      });
   }),

   http.get('/api/v1/resales/listings/orders/:orderId', async ({ params }) => {
      const orderId = String(params.orderId);
      const order = resaleOrders.get(orderId);

      if (!order) {
         return buildErrorResponse('Resale listing order not found.', 404);
      }

      const listings = Array.from(resaleListings.values())
         .filter((listing) => listing.orderId === orderId)
         .map((listing) => ({
            listingId: listing.listingId,
            ticketId: listing.ticketId,
            ticketNumber: listing.ticketNumber,
            sellerId: listing.sellerId,
            gameId: '',
            seatId: '',
            gradeId: '',
            seatInfo: listing.seatInfo,
            dailyBasePrice: listing.listingPrice,
            listingPrice: listing.listingPrice,
            listingStatus: listing.listingStatus,
            availableStatus: 'ENABLED',
            listedAt: listing.listedAt,
            canceledAt: listing.canceledAt,
            isCancelable: listing.listingStatus === 'LISTING' || listing.listingStatus === 'CANCEL_REQUESTED',
            maxPrice: 999999,
            gameTitle: listing.gameTitle ?? '',
            gameDate: listing.gameDate ?? '',
            stadiumName: listing.stadiumName ?? '',
            isPurchasable: listing.listingStatus === 'LISTING',
         }));

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: listings,
      });
   }),

   http.get('/api/v1/resales/histories/games/:gameId/grade/:gradeId/ranges/:range/graph', async ({ params }) => {
      const gameId = String(params.gameId);
      const gradeId = String(params.gradeId);
      const range = String(params.range).toUpperCase();
      const key = `${gameId}:${gradeId}:${range}`;

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: mockResaleHistoryGraphByKey[key] ?? [],
      });
   }),

   http.get('/api/v1/stadium-seats/games/:gameId/seat-grades', async ({ params, request }) => {
      const requestUrl = new URL(request.url);
      const forceNewSession = requestUrl.searchParams.get('forceNewSession');
      const gameId = String(params.gameId);
      const stadiumId = mockGameSchedules.find((game) => game.gameId === gameId)?.stadiumId;
      const seatGrades = stadiumId ? seatGradesByStadium[stadiumId] ?? [] : [];
      const seatGradeResult: SeatGradeSearchResult = {
         sessionId: forceNewSession === 'true' ? `seat-session-new-${gameId}` : `seat-session-${gameId}`,
         sessionExpiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
         seatGrades,
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: seatGradeResult,
      });
   }),

   http.get('/api/v1/stadium-seats/stadiums/:stadiumId/seat-sections', async ({ params }) => {
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: seatSectionsByStadium[String(params.stadiumId)] ?? [],
      });
   }),

   http.get('/api/v1/seats/seat-sections/:sectionId/seats', async ({ params, request }) => {
      const requestUrl = new URL(request.url);
      const gameId = requestUrl.searchParams.get('gameId');

      if (!gameId) {
         return HttpResponse.json(
            {
               code: 'VALIDATION_ERROR',
               message: 'gameId query parameter is required',
               data: null,
            },
            { status: 400 },
         );
      }

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
            rowName: seat.rowName,
            seatNum: seat.seatNum,
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
      const activeListingTicketIds = new Set(
         Array.from(resaleListings.values())
            .filter(l => l.listingStatus === 'LISTING' || l.listingStatus === 'HOLD')
            .map(l => l.ticketId),
      );

      const data = Array.from(ticketOrders.values()).map((order) => {
         // 리셀 등록 중인 티켓 제외한 남은 티켓 목록
         const remainingTicketIds = (order.ticketIds ?? []).filter(tid => !activeListingTicketIds.has(tid));
         const remainingCount = remainingTicketIds.length;
         const remainingSeatInfos = (order.seatInfos ?? []).filter((_, i) =>
            !activeListingTicketIds.has((order.ticketIds ?? [])[i] ?? ''),
         );
         const remainingOrderItemIds = remainingTicketIds
            .map((ticketId) => ticketRecords.get(ticketId)?.orderItemId)
            .filter((orderItemId): orderItemId is string => Boolean(orderItemId));

         // 남은 티켓이 없으면 주문 자체를 숨김
         if (remainingCount === 0) return null;

         return {
            orderId: order.orderId,
            orderNumber: order.orderNumber,
            orderStatus: order.orderStatus,
            totalQuantity: remainingCount,
            totalAmount: Math.round(order.totalAmount * remainingCount / (order.totalQuantity || 1)),
            orderedAt: order.orderedAt,
            gameId: order.gameId,
            stadiumId: order.stadiumId,
            homeTeamName: order.homeTeamName,
            awayTeamName: order.awayTeamName,
            stadiumName: order.stadiumName,
            gameStartAt: order.gameStartAt,
            seatGradeName: order.seatGradeName,
            seatInfos: remainingSeatInfos,
            ticketId: remainingTicketIds[0],
            ticketIds: remainingTicketIds,
            orderItemIds: remainingOrderItemIds,
         };
      }).filter(Boolean);

      return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data });
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

      const ownedTicketCount = getOwnedTicketCountForGame(body.gameId);
      const requestedTicketCount = body.holdIds.length;

      if (ownedTicketCount + requestedTicketCount > 4) {
         return buildErrorResponse('티켓 보유 수량 초과로 구매가 불가능합니다.', 409);
      }

      const orderId = createId('order');
      const orderedAt = new Date().toISOString();
      const matchedGame = mockGameSchedules.find((game) => game.gameId === body.gameId);

      // 첫 번째 hold의 seatId로 좌석 등급명 및 단가 조회
      const firstSeatId = seatReservationHolds.get(body.holdIds[0])?.seatId;
      const seatGradeName = firstSeatId ? resolveSeatGradeName(firstSeatId) : undefined;
      const pricePerSeat =
         firstSeatId && matchedGame
            ? resolveSeatPrice(matchedGame.homeTeamId, firstSeatId, matchedGame.startAt)
            : 12000;

      const STADIUM_NAME_MAP: Record<string, string> = {
         'stadium-kia-champions-field': '기아 챔피언스필드',
         'stadium-samsung-lions-park': '대구 삼성 라이온즈 파크',
      };

      const order: TicketOrder = {
         orderId,
         orderNumber: `ORD${Date.now()}`,
         gameId: body.gameId,
         stadiumId: matchedGame?.stadiumId ?? 'stadium-kia-champions-field',
         orderStatus: 'PENDING',
         totalQuantity: body.holdIds.length,
         totalAmount: body.holdIds.length * pricePerSeat,
         holdIds: body.holdIds,
         orderedAt,
         homeTeamName: matchedGame ? teamNameByServerId[matchedGame.homeTeamId] : undefined,
         awayTeamName: matchedGame ? teamNameByServerId[matchedGame.awayTeamId] : undefined,
         stadiumName: matchedGame?.stadiumId ? (STADIUM_NAME_MAP[matchedGame.stadiumId] ?? matchedGame.stadiumId) : undefined,
         gameStartAt: matchedGame?.startAt,
         seatGradeName,
         ordererName: body.ordererName,
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

      const paidAt = new Date().toISOString();
      const paymentId = createId('payment');
      const payment: TicketPayment = {
         paymentId,
         orderId: order.orderId,
         paymentMethod: body.paymentMethod,
         paymentAmount: order.totalAmount,
         pgTid: createId('mock-pg-tid'),
         paymentStatus: 'SUCCESS',
         paidAt,
      };

      ticketPayments.set(paymentId, payment);

      // 결제 완료 시 티켓 발행 + 주문 상태 CONFIRMED 갱신
      const SERVICE_FEE = 1000;
      const pricePerTicket = order.totalQuantity > 0 ? Math.round(order.totalAmount / order.totalQuantity) : order.totalAmount;
      const gameTitle = order.homeTeamName && order.awayTeamName
         ? `${order.awayTeamName} vs ${order.homeTeamName}`
         : order.homeTeamName
            ? `${order.homeTeamName} 홈경기`
            : 'KBO 리그 경기';
      // 취소 가능 기한: 예매 당일 23:59
      const orderedDate = new Date(order.orderedAt);
      const cancelableUntil = new Date(
         orderedDate.getFullYear(), orderedDate.getMonth(), orderedDate.getDate(), 23, 59, 0,
      ).toISOString();

      const ticketIds: string[] = [];
      const seatInfos: string[] = [];

      order.holdIds.forEach((holdId, idx) => {
         const ticketId = createId('ticket');
         const seatId = seatReservationHolds.get(holdId)?.seatId ?? `unknown-seat-${idx}`;
         const seatInfo = buildSeatInfoStr(seatId);
         seatInfos.push(seatInfo);

         ticketRecords.set(ticketId, {
            ticketId,
            ticketNumber: `TKT-${Date.now()}-${idx}`,
            orderItemId: createId('order-item'),
            orderId: order.orderId,
            gameId: order.gameId,
            seatId,
            qrToken: createId('qr'),
            gameTitle,
            gameDate: order.gameStartAt ?? order.orderedAt,
            stadiumName: order.stadiumName,
            seatInfo,
            ticketPrice: pricePerTicket,
            serviceFee: SERVICE_FEE,
            paymentMethod: body.paymentMethod,
            paymentMethodDisplay: body.paymentMethod ? buildPaymentMethodDisplay(body.paymentMethod) : undefined,
            ticketStatus: 'ISSUED',
            resaleEnabledStatus: 'ENABLED',
            issuedAt: paidAt,
            orderedAt: order.orderedAt,
            cancelableUntil,
            ordererName: order.ordererName,
         });
         ticketIds.push(ticketId);
      });

      // 주문 상태 업데이트 (ticketIds + seatInfos 저장)
      ticketOrders.set(order.orderId, { ...order, orderStatus: 'CONFIRMED', ticketIds, seatInfos });

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

   http.get('/api/v1/payments/orders/:orderId', async ({ params }) => {
      const orderId = String(params.orderId);
      const payment = Array.from(ticketPayments.values()).find((item) => item.orderId === orderId);

      if (!payment) {
         return buildErrorResponse('Payment not found.', 404);
      }

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
      const holdListing = resaleListings.get(body.listingId);
      resaleHolds.set(holdId, {
         holdId,
         listingId: body.listingId,
         queueTokenJti: body.queueTokenJti,
         seatInfo: holdListing?.seatInfo,
         listingPrice: holdListing?.listingPrice,
         gameTitle: holdListing?.gameTitle,
         gameDate: holdListing?.gameDate,
         stadiumName: holdListing?.stadiumName,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { holdId },
      });
   }),

   http.patch('/api/v1/resales/holds/:holdId/release', async ({ params }) => {
      const holdId = String(params.holdId);

      if (!resaleHolds.has(holdId)) {
         return buildErrorResponse(`Resale hold not found: ${holdId}`, 404);
      }

      resaleHolds.delete(holdId);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: { holdId },
      });
   }),

   http.post('/api/v1/resales/orders', async ({ request }) => {
      const body = (await request.json()) as {
         holdIds?: string[];
         buyerNickname?: string;
         buyerEmail?: string;
         buyerPhone?: string;
      };

      if (!body?.holdIds?.length || !body.buyerNickname || !body.buyerEmail || !body.buyerPhone) {
         return buildErrorResponse('Missing resale order fields.');
      }

      const missingHold = body.holdIds.find((holdId) => !resaleHolds.has(holdId));

      if (missingHold) {
         return buildErrorResponse(`Resale hold not found: ${missingHold}`, 404);
      }

      const heldListings = body.holdIds
         .map((holdId) => resaleHolds.get(holdId))
         .filter((hold): hold is ResaleHold => Boolean(hold))
         .map((hold) => resaleListings.get(hold.listingId))
         .filter((listing): listing is ResaleListing => Boolean(listing));
      const orderId = createId('resale-order');
      const order: ResaleOrder = {
         orderId,
         orderNumber: `RESALE${Date.now()}`,
         orderStatus: 'PENDING',
         totalQuantity: body.holdIds.length,
         totalAmount: heldListings.reduce((sum, listing) => sum + listing.listingPrice, 0),
         holdIds: body.holdIds,
         transactionIds: body.holdIds.map(() => createId('transaction')),
         buyerNickname: body.buyerNickname,
         buyerEmail: body.buyerEmail,
         buyerPhone: body.buyerPhone,
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
         data: {
            transactionIds: order.transactionIds,
         },
      });
   }),

   http.post('/api/v1/payments/resales', async ({ request }) => {
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
         buyerId: body.buyerId,
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

   http.get('/api/v1/payments/resales/ledgers', async ({ request }) => {
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

   http.get('/api/v1/payments/resales/unsettled', async ({ request }) => {
      const userId = getRequiredUserId(request);

      if (!userId) {
         return buildErrorResponse('Missing userId.', 400);
      }

      const unsettledAmount = Array.from(resaleListings.values())
         .filter((listing) => listing.sellerId === userId && listing.listingStatus === 'SOLD')
         .reduce((sum, listing) => sum + listing.listingPrice, 0);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            unsettledAmount,
         },
      });
   }),

   http.get('/api/v1/payments/resales/ledgers/orders/:orderId', async ({ params }) => {
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

   // 리셀 주문 완료: 구매자에게 RESALE_ISSUED 티켓 발급
   http.patch('/api/v1/resales/orders/:orderId/complete', async ({ params, request }) => {
      const orderId = String(params.orderId);
      const order = resaleOrders.get(orderId);
      const paymentId = new URL(request.url).searchParams.get('paymentId');

      if (!order) {
         return buildErrorResponse('Resale order not found.', 404);
      }

      if (!paymentId) {
         return buildErrorResponse('Missing paymentId.', 400);
      }

      const payment = resalePayments.get(paymentId);

      if (!payment || payment.orderId !== orderId) {
         return buildErrorResponse('Resale payment not found.', 404);
      }

      const paidAt = new Date().toISOString();
      const newOrderNumber = `RESALE${Date.now()}`;

      const items = order.holdIds.flatMap((holdId, idx) => {
         const hold = resaleHolds.get(holdId);
         if (!hold) return [];

         // listing이 없으면 hold에 저장된 스냅샷 또는 fallback 데이터 사용
         const listing = resaleListings.get(hold.listingId);
         const seatInfo = listing?.seatInfo ?? hold.seatInfo ?? '리셀 티켓';
         const listingPrice = listing?.listingPrice ?? hold.listingPrice ?? order.totalAmount;
         const gameTitle = listing?.gameTitle ?? hold.gameTitle ?? 'KBO 리그 경기';
         const gameDate = listing?.gameDate ?? hold.gameDate ?? paidAt;
         const stadiumName = listing?.stadiumName ?? hold.stadiumName;

         const newTicketId = createId('resale-ticket');
         ticketRecords.set(newTicketId, {
            ticketId: newTicketId,
            ticketNumber: `RSL-TKT-${Date.now()}-${idx}`,
            orderItemId: createId('resale-order-item'),
            orderId,
            gameId: '',
            seatId: '',
            qrToken: createId('qr'),
            gameTitle,
            gameDate,
            stadiumName,
            seatInfo,
            ticketPrice: listingPrice,
            serviceFee: 1000,
            ticketStatus: 'RESALE_ISSUED',
            resaleEnabledStatus: 'DISABLED',
            issuedAt: paidAt,
            orderedAt: paidAt,
            cancelableUntil: undefined,
            ordererName: undefined,
         });

         if (listing) {
            resaleListings.set(hold.listingId, { ...listing, listingStatus: 'SOLD' });
         }
         resaleHolds.delete(holdId);

         return [
            {
               transactionId: order.transactionIds[idx] ?? createId('transaction'),
               listingId: hold.listingId,
               seatInfo,
               price: listingPrice,
            },
         ];
      });

      // 주문 상태 COMPLETED로 변경
      resaleOrders.set(orderId, { ...order, orderStatus: 'COMPLETED', orderNumber: newOrderNumber });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orderId,
            orderNumber: newOrderNumber,
            buyerId: payment.buyerId,
            totalAmount: order.totalAmount,
            orderStatus: 'COMPLETED',
            items,
         },
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
            ticketNumber: ticket.ticketNumber,
            orderItemId: ticket.orderItemId,
            orderId: ticket.orderId,
            gameId: ticket.gameId,
            gameTitle: ticket.gameTitle,
            gameDate: ticket.gameDate,
            stadiumName: ticket.stadiumName,
            seatInfo: ticket.seatInfo,
            ticketPrice: ticket.ticketPrice,
            serviceFee: ticket.serviceFee ?? 1000,
            ticketStatus: ticket.ticketStatus,
            resaleEnabledStatus: ticket.resaleEnabledStatus,
            frozen: ticket.frozen ?? false,
            frozenUntil: ticket.frozenUntil,
            issuedAt: ticket.issuedAt,
            orderedAt: ticket.orderedAt,
            cancelableUntil: ticket.cancelableUntil,
            ordererName: ticket.ordererName,
            paymentMethod: ticket.paymentMethod,
            paymentMethodDisplay: ticket.paymentMethodDisplay,
         },
      });
   }),

   http.get('/api/v1/orders/:orderId/tickets', async ({ params, request }) => {
      const requestUrl = new URL(request.url);
      if (requestUrl.searchParams.get('mockScenario') === MYPAGE_ACTION_TICKET_INFO_ERROR_SCENARIO) {
         return buildErrorResponse('Mock ticket info error.', 500);
      }

      const orderId = String(params.orderId);
      const tickets = Array.from(ticketRecords.values()).filter((t) => t.orderId === orderId);
      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: tickets.map((t) => ({
            ticketId: t.ticketId,
            ticketNumber: t.ticketNumber,
            orderItemId: t.orderItemId,
            seatInfo: t.seatInfo,
            ticketPrice: t.ticketPrice,
            serviceFee: t.serviceFee ?? 1000,
            ticketStatus: t.ticketStatus,
         })),
      });
   }),

   http.get('/api/v1/tickets/:ticketId/qr', async ({ params }) => {
      const ticket = ticketRecords.get(String(params.ticketId));

      if (!ticket) {
         return buildErrorResponse('Ticket not found.', 404);
      }

      const refreshedQrToken = createId('qr');
      ticketRecords.set(ticket.ticketId, {
         ...ticket,
         qrToken: refreshedQrToken,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ticketId: ticket.ticketId,
            qrToken: refreshedQrToken,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
         },
      });
   }),

   // 주문 취소
   http.post('/api/v1/orders/:orderId/cancellations', async ({ params, request }) => {
      const orderId = String(params.orderId);
      const order = ticketOrders.get(orderId);
      const body = await parseJsonBody<{
         requestType?: 'ORDER_PARTIAL' | 'ORDER_FULL' | 'GAME_CANCELED' | 'SCHEDULE_CHANGED';
         orderItemIds?: string[];
         idempotencyKey?: string;
      }>(request);

      if (!order) {
         return buildErrorResponse('Order not found.', 404);
      }

      if (!body?.requestType || !body?.idempotencyKey) {
         return buildErrorResponse('Missing cancellation fields.');
      }

      const orderTickets = Array.from(ticketRecords.values()).filter((ticket) => ticket.orderId === orderId);
      const activeTickets = orderTickets.filter((ticket) => ticket.ticketStatus !== 'INVALID');

      if (activeTickets.length === 0) {
         return buildErrorResponse('No cancellable tickets found.', 400);
      }

      const targetTickets =
         body.requestType === 'ORDER_FULL'
            ? activeTickets
            : activeTickets.filter((ticket) => body.orderItemIds?.includes(ticket.orderItemId));

      if (targetTickets.length === 0) {
         return buildErrorResponse('No cancellation targets found.', 400);
      }

      targetTickets.forEach((ticket) => {
         ticketRecords.set(ticket.ticketId, {
            ...ticket,
            ticketStatus: 'INVALID',
            resaleEnabledStatus: 'DISABLED',
         });
      });

      const remainingActiveTickets = activeTickets.filter(
         (ticket) => !targetTickets.some((target) => target.ticketId === ticket.ticketId),
      );
      const nextOrderStatus = remainingActiveTickets.length === 0 ? 'CANCELED' : 'PARTIALLY_CANCELED';
      const canceledTicketAmount = targetTickets.reduce((sum, ticket) => sum + ticket.ticketPrice, 0);
      const bookingFeeAmount = targetTickets.reduce((sum, ticket) => sum + (ticket.serviceFee ?? 0), 0);

      ticketOrders.set(orderId, {
         ...order,
         orderStatus: nextOrderStatus,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            cancellationId: createId('cancellation'),
            orderId,
            requestType: body.requestType,
            orderStatus: nextOrderStatus,
            refundAmount: canceledTicketAmount,
            cancellationFeeAmount: 0,
            bookingFeeAmount,
            paymentStatus: 'CANCELED',
            paymentMethod: 'CARD',
            paymentType: 'REFUND',
            refundAt: new Date().toISOString(),
            canceledItemCount: targetTickets.length,
         },
      });
   }),

   // 리셀 등록
   http.post('/api/v1/resales/listings', async ({ request }) => {
      const sellerId = getMockMemberKey(request);
      type ListingItem = { ticketId?: string; listingPrice?: number };
      const body = (await request.json()) as
         | ListingItem
         | { listings?: Array<ListingItem> }
         | null;

      const listings: ListingItem[] = 'listings' in (body ?? {}) ? (body as { listings?: ListingItem[] })?.listings ?? [] : body ? [body as ListingItem] : [];

      if (listings.length === 0 || listings.some((item) => !item?.ticketId || !item?.listingPrice)) {
         return buildErrorResponse('Missing ticketId or listingPrice.');
      }

      const createdListings: Array<{
         listingId: string;
         orderId: string;
         ticketId: string;
         sellerId: string;
         gameId: string;
         seatId: string;
         gradeId: string;
         seatInfo: string;
         dailyBasePrice: number;
         listingPrice: number;
         listingStatus: 'LISTING';
         availableStatus: 'ENABLED';
         lastTransactionPrice: number;
         listedAt: string;
         soldAt?: string;
         canceledAt?: string;
         isCancelable: boolean;
         isPurchasable: boolean;
         minPrice: number;
         maxPrice: number;
      }> = [];
      const createdOrders: Array<{ orderId: string; orderNumber: string }> = [];

      for (const item of listings) {
         const ticket = ticketRecords.get(item.ticketId!);
         if (!ticket) {
            return buildErrorResponse('Ticket not found.', 404);
         }

         const listingId = createId('listing');
         const orderId = createId('resale-order');
         const listing: ResaleListing = {
            listingId,
            orderId,
            ticketId: ticket.ticketId,
            ticketNumber: ticket.ticketNumber,
            sellerId,
            seatInfo: ticket.seatInfo,
            listingPrice: item.listingPrice!,
            listingStatus: 'LISTING',
            listedAt: new Date().toISOString(),
            gameTitle: ticket.gameTitle,
            gameDate: ticket.gameDate,
            stadiumName: ticket.stadiumName,
         };
         resaleListings.set(listingId, listing);
         const createdOrder = {
            orderId,
            orderNumber: `RSL-${orderId.replace(/^resale-order-/i, '').slice(0, 8).toUpperCase()}`,
         };
         createdOrders.push(createdOrder);
         resaleOrders.set(orderId, {
            orderId,
            orderNumber: createdOrder.orderNumber,
            orderStatus: 'PENDING',
            totalQuantity: 1,
            totalAmount: item.listingPrice!,
            holdIds: [],
            transactionIds: [],
         });
         createdListings.push({
            listingId,
            orderId,
            ticketId: ticket.ticketId,
            sellerId,
            gameId: '',
            seatId: '',
            gradeId: '',
            seatInfo: ticket.seatInfo,
            dailyBasePrice: item.listingPrice!,
            listingPrice: item.listingPrice!,
            listingStatus: 'LISTING',
            availableStatus: 'ENABLED',
            lastTransactionPrice: 0,
            listedAt: listing.listedAt,
            soldAt: undefined,
            canceledAt: undefined,
            isCancelable: true,
            isPurchasable: true,
            minPrice: 0,
            maxPrice: 999999,
         });

         ticketRecords.set(ticket.ticketId, {
            ...ticket,
            ticketStatus: 'ISSUED',
            resaleEnabledStatus: 'DISABLED',
         });
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            orders: createdOrders,
            listings: createdListings,
         },
      });
   }),

   // 내 리셀 목록 조회
   http.get('/api/v1/resales/listings', async () => {
      const persistedListingIds = new Set(Array.from(resaleListings.keys()));
      const listings = [
         ...mockResaleListings
            .filter((listing) => !persistedListingIds.has(listing.listingId))
            .map((listing) => {
               const seededListing = getResaleListingFromSeed(listing.listingId)!;

               return {
                  listingId: seededListing.listingId,
                  ticketId: seededListing.ticketId,
                  ticketNumber: undefined,
                  sellerId: seededListing.sellerId,
                  gameId: listing.gameId,
                  seatId: listing.seatId,
                  gradeId: listing.gradeId,
                  seatInfo: seededListing.seatInfo,
                  dailyBasePrice: listing.dailyBasePrice,
                  listingPrice: seededListing.listingPrice,
                  listingStatus: seededListing.listingStatus,
                  availableStatus: listing.availableStatus,
                  listedAt: seededListing.listedAt,
                  isCancelable: seededListing.listingStatus === 'LISTING' || seededListing.listingStatus === 'CANCEL_REQUESTED',
                  isPurchasable: listing.isPurchasable,
                  minPrice: listing.minPrice,
                  maxPrice: listing.maxPrice,
                  gameTitle: seededListing.gameTitle ?? '',
                  gameDate: seededListing.gameDate ?? '',
                  stadiumName: seededListing.stadiumName ?? '',
               };
            }),
         ...Array.from(resaleListings.values()).map((l) => ({
            listingId: l.listingId,
            ticketId: l.ticketId,
            ticketNumber: l.ticketNumber,
         sellerId: l.sellerId,
         gameId: '',
         seatId: '',
         gradeId: '',
         seatInfo: l.seatInfo,
         dailyBasePrice: l.listingPrice,
         listingPrice: l.listingPrice,
         listingStatus: l.listingStatus,
         availableStatus: 'ENABLED',
         listedAt: l.listedAt,
         isCancelable: l.listingStatus === 'LISTING' || l.listingStatus === 'CANCEL_REQUESTED',
         isPurchasable: l.listingStatus === 'LISTING',
         minPrice: 0,
         maxPrice: 999999,
         gameTitle: l.gameTitle ?? '',
         gameDate: l.gameDate ?? '',
            stadiumName: l.stadiumName ?? '',
         })),
      ];

      return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: listings });
   }),

   // 리셀 상세 조회
   http.get('/api/v1/resales/listings/:listingId', async ({ params }) => {
      const listingId = String(params.listingId);
      const listing = resaleListings.get(listingId) ?? getResaleListingFromSeed(listingId);

      if (!listing) {
         return buildErrorResponse('Listing not found.', 404);
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            listingId: listing.listingId,
            ticketId: listing.ticketId,
            ticketNumber: listing.ticketNumber,
            seatInfo: listing.seatInfo,
            listingPrice: listing.listingPrice,
            listingStatus: listing.listingStatus,
            listedAt: listing.listedAt,
            canceledAt: listing.canceledAt,
            gameTitle: listing.gameTitle ?? '',
            gameDate: listing.gameDate ?? '',
            stadiumName: listing.stadiumName ?? '',
            isCancelable: listing.listingStatus === 'LISTING',
         },
      });
   }),

   // 리셀 취소
   http.patch('/api/v1/resales/listings/cancel', async ({ request }) => {
      const body = await parseJsonBody<{ listingId?: string }>(request);
      const listing = body?.listingId ? resaleListings.get(body.listingId) : undefined;

      if (!listing) {
         return buildErrorResponse('Listing not found.', 404);
      }

      if (listing.listingStatus !== 'LISTING' && listing.listingStatus !== 'CANCEL_REQUESTED') {
         return buildErrorResponse('Cannot cancel this listing.', 400);
      }

      resaleListings.set(listing.listingId, {
         ...listing,
         listingStatus: 'CANCELED',
         canceledAt: new Date().toISOString(),
      });

      // 원래 티켓 canSell 복원
      const ticket = ticketRecords.get(listing.ticketId);
      if (ticket) {
         ticketRecords.set(ticket.ticketId, { ...ticket, resaleEnabledStatus: 'ENABLED' });
      }

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            ...listing,
            listingStatus: 'CANCELED',
            canceledAt: new Date().toISOString(),
            availableStatus: 'DISABLED',
         },
      });
   }),
];
