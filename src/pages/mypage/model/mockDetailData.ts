// src/pages/mypage/model/mockDetailData.ts

type PurchaseStatus = '입금 대기' | '예매 완료' | '부분 처리' | '관람 완료' | '취소/환불';
type SaleStatus = '판매 중' | '판매 완료' | '정산 대기' | '판매 취소 대기';

// ─── 구매 상세 타입 ────────────────────────────────────────────

export type PurchaseSeatStatus = '예매완료' | '취소완료';

export interface PurchaseSeatItem {
   orderId: string;
   section: string;
   seatDetail: string;
   status: PurchaseSeatStatus;
   price: number;
}

export interface PaymentEvent {
   type: '결제 완료' | '부분 취소 완료';
   date: string;
   items: Array<{ label: string; amount: number }>;
   totalLabel: string;
   totalAmount: number;
   methodLabel: string;
   method: string;
}

export type DeliveryMethod = '모바일 QR' | '배송' | '현장 수령';

export interface RefundInfo {
   ticketAmount: number;
   cancelFee: number;
   refundTotal: number;
   /** 환불 수단 (카드 / 무통장 계좌 등) */
   method: string;
   date: string;
   /** 무통장 환불 계좌 */
   bankAccount?: string;
}

export interface PurchaseDetailData {
   id: string;
   orderId: string;
   orderDate: string;
   overallStatus: PurchaseStatus;
   game: { teams: string; venue: string; datetime: string };
   orderer: string;
   /** 취소/환불 전: 취소 가능 기한 / 취소 후: undefined */
   cancelDeadline?: string;
   /** 취소/환불 후: 취소 일시 */
   cancelDate?: string;
   seatItems: PurchaseSeatItem[];
   deliveryMethod: DeliveryMethod;
   /** 배송 전용 */
   deliveryAddress?: string;
   deliveryStatus?: string;
   deliveryCarrier?: string;
   deliveryTrackingNumber?: string;
   paymentSummary: {
      ticketCount: number;
      ticketAmount: number;
      fee: number;
      total: number;
      method: string;
      date: string;
      status: string;
      /** 무통장 전용 */
      bankAccount?: string;
      bankDeadline?: string;
   };
   paymentEvents: PaymentEvent[];
   /** 취소/환불 정보 (status가 '취소/환불'인 경우 존재) */
   refundInfo?: RefundInfo;
   canCancel: boolean;
   canSell: boolean;
}

// ─── 판매 상세 타입 ────────────────────────────────────────────

export type SaleSeatStatus = '판매중' | '판매취소' | '판매완료' | '취소대기';

export interface SaleSeatItem {
   orderId: string;
   section: string;
   seatDetail: string;
   status: SaleSeatStatus;
   price: number;
}

export interface SaleDetailData {
   id: string;
   orderId: string;
   /** 판매 등록일 (날짜) */
   orderDate: string;
   overallStatus: SaleStatus;
   game: { teams: string; venue: string; datetime: string };
   seatItems: SaleSeatItem[];
   estimatedTicketAmount: number;
   estimatedFeeRate: number;
   estimatedFee: number;
   estimatedTotal: number;
   canCancel: boolean;
   /** 정산 계좌 (판매 중·정산 대기·판매 완료) */
   settlementAccount?: string;
   /** 예상/실제 정산 완료일 */
   settlementDate?: string;
   /** 정산일시 — 판매 완료 시 표시 */
   settlementCompleteDate?: string;
   /** 취소일시 — 판매 취소 대기 시 표시 */
   cancelDate?: string;
}

// ─── 구매 상세 목 데이터 ────────────────────────────────────────

export const PURCHASE_DETAIL_MAP: Record<string, PurchaseDetailData> = {
   '1': {
      id: '1',
      orderId: 'GT0921983209001',
      orderDate: '2026.03.15',
      overallStatus: '예매 완료',
      game: { teams: '삼성 vs LG', venue: '대구', datetime: '2026.03.21 (토) 18:30' },
      orderer: '홍길동',
      cancelDeadline: '2026.03.21 (토) 14:30 까지',
      seatItems: [
         { orderId: 'ORD2603150001-1', section: '1루 K8석', seatDetail: '109구역 1열 8번', status: '예매완료', price: 15000 },
         { orderId: 'ORD2603150001-2', section: '1루 K8석', seatDetail: '109구역 1열 9번', status: '예매완료', price: 15000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 30000,
         fee: 1200,
         total: 31200,
         method: '네이버페이',
         date: '2026.03.15 (일) 10:22',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.03.15 (일) 10:22',
            items: [
               { label: '티켓 금액 (2매)', amount: 30000 },
               { label: '수수료', amount: 1200 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 31200,
            methodLabel: '결제 수단',
            method: '네이버페이',
         },
      ],
      canCancel: true,
      canSell: true,
   },
   '2': {
      id: '2',
      orderId: 'GT0921983209002',
      orderDate: '2026.03.16',
      overallStatus: '예매 완료',
      game: { teams: '두산 vs 롯데', venue: '잠실', datetime: '2026.03.22 (일) 14:00' },
      orderer: '홍길동',
      cancelDeadline: '2026.03.22 (일) 10:00 까지',
      seatItems: [
         { orderId: 'ORD2603160001-1', section: '외야 응원석', seatDetail: '303구역 5열 12번', status: '예매완료', price: 12000 },
      ],
      deliveryMethod: '배송',
      deliveryAddress: '서울특별시 서초구 반포동',
      deliveryStatus: '배송 중',
      deliveryCarrier: 'CJ대한통운',
      deliveryTrackingNumber: '00000000',
      paymentSummary: {
         ticketCount: 1,
         ticketAmount: 12000,
         fee: 600,
         total: 12600,
         method: '카드 결제 (현대카드 000000000)',
         date: '2026.03.16 (월) 09:11',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.03.16 (월) 09:11',
            items: [
               { label: '티켓 금액 (1매)', amount: 12000 },
               { label: '수수료', amount: 600 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 12600,
            methodLabel: '결제 수단',
            method: '현대카드',
         },
      ],
      canCancel: true,
      canSell: false,
   },
   '3': {
      id: '3',
      orderId: 'GT0921983209003',
      orderDate: '2026.03.01',
      overallStatus: '예매 완료',
      game: { teams: '롯데 vs SSG', venue: '사직', datetime: '2026.03.07 (토) 17:00' },
      orderer: '홍길동',
      cancelDeadline: '2026.03.07 (토) 13:00 까지',
      seatItems: [
         { orderId: 'ORD2603010001-1', section: '내야 지정석 A', seatDetail: '105구역 3열 7번', status: '예매완료', price: 18000 },
         { orderId: 'ORD2603010001-2', section: '내야 지정석 A', seatDetail: '105구역 3열 8번', status: '예매완료', price: 18000 },
         { orderId: 'ORD2603010001-3', section: '내야 지정석 A', seatDetail: '105구역 3열 9번', status: '예매완료', price: 18000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 3,
         ticketAmount: 54000,
         fee: 2160,
         total: 56160,
         method: '토스페이',
         date: '2026.03.01 (일) 11:05',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.03.01 (일) 11:05',
            items: [
               { label: '티켓 금액 (3매)', amount: 54000 },
               { label: '수수료', amount: 2160 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 56160,
            methodLabel: '결제 수단',
            method: '토스페이',
         },
      ],
      canCancel: true,
      canSell: false,
   },
   '4': {
      id: '4',
      orderId: 'GT0921983209004',
      orderDate: '2026.02.25',
      overallStatus: '예매 완료',
      game: { teams: 'NC vs 한화', venue: '창원', datetime: '2026.03.03 (화) 18:30' },
      orderer: '홍길동',
      cancelDeadline: '2026.03.03 (화) 14:30 까지',
      seatItems: [
         { orderId: 'ORD2602250001-1', section: '1루 K8석', seatDetail: '301구역 2열 5번', status: '예매완료', price: 18000 },
         { orderId: 'ORD2602250001-2', section: '1루 K8석', seatDetail: '301구역 2열 6번', status: '예매완료', price: 18000 },
      ],
      deliveryMethod: '현장 수령',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 36000,
         fee: 1800,
         total: 37800,
         method: '신용카드',
         date: '2026.02.25 (수) 15:30',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.02.25 (수) 15:30',
            items: [
               { label: '티켓 금액 (2매)', amount: 36000 },
               { label: '수수료', amount: 1800 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 37800,
            methodLabel: '결제 수단',
            method: '신용카드',
         },
      ],
      canCancel: true,
      canSell: false,
   },
   '5': {
      id: '5',
      orderId: 'GT0921983209005',
      orderDate: '2026.02.18',
      overallStatus: '예매 완료',
      game: { teams: '키움 vs KT', venue: '고척', datetime: '2026.02.25 (수) 18:30' },
      orderer: '홍길동',
      cancelDeadline: '2026.02.25 (수) 14:30 까지',
      seatItems: [
         { orderId: 'ORD2602180001-1', section: '내야 지정석 B', seatDetail: '112구역 8열 15번', status: '예매완료', price: 55000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 1,
         ticketAmount: 55000,
         fee: 2200,
         total: 57200,
         method: '후불결제',
         date: '2026.02.18 (수) 09:45',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.02.18 (수) 09:45',
            items: [
               { label: '티켓 금액 (1매)', amount: 55000 },
               { label: '수수료', amount: 2200 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 57200,
            methodLabel: '결제 수단',
            method: '후불결제',
         },
      ],
      canCancel: true,
      canSell: false,
   },
   '6': {
      id: '6',
      orderId: 'GT0921983209006',
      orderDate: '2026.02.10',
      overallStatus: '취소/환불',
      game: { teams: '두산 vs 삼성', venue: '잠실', datetime: '2026.02.15 (일) 14:00' },
      orderer: '홍길동',
      cancelDate: '2026.02.12 (목) 23:59',
      seatItems: [
         { orderId: 'ORD2602100001-1', section: '3루 K9석', seatDetail: '207구역 1열 3번', status: '취소완료', price: 14000 },
         { orderId: 'ORD2602100001-2', section: '3루 K9석', seatDetail: '207구역 1열 4번', status: '취소완료', price: 14000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 28000,
         fee: 1120,
         total: 29120,
         method: '카드 결제 (네이버페이)',
         date: '2026.02.10 (화) 10:00',
         status: '취소/환불',
      },
      paymentEvents: [],
      refundInfo: {
         ticketAmount: 28000,
         cancelFee: -1000,
         refundTotal: 27000,
         method: '카드 결제 (네이버페이)',
         date: '2026.02.12 (목) 23:59',
      },
      canCancel: false,
      canSell: false,
   },
   '7': {
      id: '7',
      orderId: 'GT0921983209007',
      orderDate: '2026.02.05',
      overallStatus: '취소/환불',
      game: { teams: 'SSG vs KIA', venue: '인천', datetime: '2026.02.12 (목) 17:00' },
      orderer: '홍길동',
      cancelDate: '2026.02.08 (일) 10:30',
      seatItems: [
         { orderId: 'ORD2602050001-1', section: '외야 지정석', seatDetail: '401구역 5열 10번', status: '취소완료', price: 12000 },
      ],
      deliveryMethod: '현장 수령',
      paymentSummary: {
         ticketCount: 1,
         ticketAmount: 12000,
         fee: 600,
         total: 12600,
         method: '무통장 입금',
         date: '2026.02.05 (목) 09:00',
         status: '취소/환불',
         bankAccount: '우리 1000000000000 (고티(주))',
      },
      paymentEvents: [],
      refundInfo: {
         ticketAmount: 12000,
         cancelFee: -1000,
         refundTotal: 11000,
         method: '우리 1000000000000 (고티(주))',
         date: '2026.02.08 (일) 10:30',
         bankAccount: '우리 1000000000000 (고티(주))',
      },
      canCancel: false,
      canSell: false,
   },
   '9': {
      id: '9',
      orderId: 'GT0921983209487',
      orderDate: '2026.01.15',
      overallStatus: '부분 처리',
      game: { teams: 'KT vs NC', venue: '수원', datetime: '2026.01.22 (목) 17:00' },
      orderer: '홍길동',
      cancelDeadline: '2026.01.22 (목) 13:00 까지',
      seatItems: [
         { orderId: 'ORD1710847290001', section: '내야 지정석 A', seatDetail: '108구역 2열 1번', status: '예매완료', price: 16000 },
         { orderId: 'ORD1710847290002', section: '내야 지정석 A', seatDetail: '108구역 2열 2번', status: '취소완료', price: 16000 },
         { orderId: 'ORD1710847290003', section: '내야 지정석 A', seatDetail: '108구역 2열 3번', status: '예매완료', price: 16000 },
         { orderId: 'ORD1710847290004', section: '내야 지정석 A', seatDetail: '108구역 2열 4번', status: '취소완료', price: 16000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 4,
         ticketAmount: 64000,
         fee: 2560,
         total: 66560,
         method: '토스페이',
         date: '2026.01.15 (목) 23:59',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.01.15 (목) 23:59',
            items: [
               { label: '티켓 금액 (4매)', amount: 64000 },
               { label: '수수료', amount: 2560 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 66560,
            methodLabel: '결제 수단',
            method: '토스페이',
         },
         {
            type: '부분 취소 완료',
            date: '2026.01.16 (금) 09:30',
            items: [
               { label: '티켓 금액 (2매)', amount: -32000 },
               { label: '취소 수수료', amount: 1000 },
            ],
            totalLabel: '총 환불 금액',
            totalAmount: -33000,
            methodLabel: '환불 수단',
            method: '토스페이',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '8': {
      id: '8',
      orderId: 'GT0921983209008',
      orderDate: '2026.01.28',
      overallStatus: '예매 완료',
      game: { teams: '한화 vs 롯데', venue: '대전', datetime: '2026.02.03 (화) 18:30' },
      orderer: '홍길동',
      cancelDeadline: '2026.02.03 (화) 14:30 까지',
      seatItems: [
         { orderId: 'ORD2601280001-1', section: '1루 지정석', seatDetail: '102구역 4열 6번', status: '예매완료', price: 24000 },
         { orderId: 'ORD2601280001-2', section: '1루 지정석', seatDetail: '102구역 4열 7번', status: '예매완료', price: 24000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 48000,
         fee: 1920,
         total: 49920,
         method: '신용카드',
         date: '2026.01.28 (수) 20:10',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.01.28 (수) 20:10',
            items: [
               { label: '티켓 금액 (2매)', amount: 48000 },
               { label: '수수료', amount: 1920 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 49920,
            methodLabel: '결제 수단',
            method: '신용카드',
         },
      ],
      canCancel: true,
      canSell: false,
   },
   '10': {
      id: '10',
      orderId: 'GT0921983209010',
      orderDate: '2026.01.10',
      overallStatus: '부분 처리',
      game: { teams: 'NC vs 한화', venue: '창원', datetime: '2026.01.18 (일) 14:00' },
      orderer: '홍길동',
      cancelDeadline: '2026.01.18 (일) 10:00 까지',
      seatItems: [
         { orderId: 'ORD2601100001-1', section: '3루 K9석', seatDetail: '301구역 2열 5번', status: '예매완료', price: 18000 },
         { orderId: 'ORD2601100001-2', section: '3루 K9석', seatDetail: '301구역 2열 6번', status: '취소완료', price: 18000 },
         { orderId: 'ORD2601100001-3', section: '3루 K9석', seatDetail: '301구역 2열 7번', status: '예매완료', price: 18000 },
         { orderId: 'ORD2601100001-4', section: '3루 K9석', seatDetail: '301구역 2열 8번', status: '취소완료', price: 18000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 4,
         ticketAmount: 72000,
         fee: 2880,
         total: 74880,
         method: '신용카드',
         date: '2026.01.10 (토) 08:30',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2026.01.10 (토) 08:30',
            items: [
               { label: '티켓 금액 (4매)', amount: 72000 },
               { label: '수수료', amount: 2880 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 74880,
            methodLabel: '결제 수단',
            method: '신용카드',
         },
         {
            type: '부분 취소 완료',
            date: '2026.01.11 (일) 11:00',
            items: [
               { label: '티켓 금액 (2매)', amount: -36000 },
               { label: '취소 수수료', amount: 1000 },
            ],
            totalLabel: '총 환불 금액',
            totalAmount: -37000,
            methodLabel: '환불 수단',
            method: '신용카드',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '11': {
      id: '11',
      orderId: 'GT0921983209011',
      orderDate: '2025.12.20',
      overallStatus: '관람 완료',
      game: { teams: '삼성 vs KIA', venue: '대구', datetime: '2025.12.27 (토) 14:00' },
      orderer: '홍길동',
      seatItems: [
         { orderId: 'ORD2512200001-1', section: '1루 K8석', seatDetail: '110구역 3열 5번', status: '예매완료', price: 21000 },
         { orderId: 'ORD2512200001-2', section: '1루 K8석', seatDetail: '110구역 3열 6번', status: '예매완료', price: 21000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 42000,
         fee: 1680,
         total: 43680,
         method: '후불결제',
         date: '2025.12.20 (토) 14:22',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2025.12.20 (토) 14:22',
            items: [
               { label: '티켓 금액 (2매)', amount: 42000 },
               { label: '수수료', amount: 1680 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 43680,
            methodLabel: '결제 수단',
            method: '후불결제',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '12': {
      id: '12',
      orderId: 'GT0921983209012',
      orderDate: '2025.11.15',
      overallStatus: '관람 완료',
      game: { teams: '두산 vs 롯데', venue: '잠실', datetime: '2025.11.22 (토) 18:30' },
      orderer: '홍길동',
      seatItems: [
         { orderId: 'ORD2511150001-1', section: '내야 지정석 B', seatDetail: '206구역 5열 8번', status: '예매완료', price: 16000 },
         { orderId: 'ORD2511150001-2', section: '내야 지정석 B', seatDetail: '206구역 5열 9번', status: '예매완료', price: 16000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 32000,
         fee: 1280,
         total: 33280,
         method: '네이버페이',
         date: '2025.11.15 (토) 10:05',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2025.11.15 (토) 10:05',
            items: [
               { label: '티켓 금액 (2매)', amount: 32000 },
               { label: '수수료', amount: 1280 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 33280,
            methodLabel: '결제 수단',
            method: '네이버페이',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '13': {
      id: '13',
      orderId: 'GT0921983209013',
      orderDate: '2025.10.28',
      overallStatus: '관람 완료',
      game: { teams: 'SSG vs KT', venue: '인천', datetime: '2025.11.03 (일) 14:00' },
      orderer: '홍길동',
      seatItems: [
         { orderId: 'ORD2510280001-1', section: '외야 지정석', seatDetail: '402구역 7열 18번', status: '예매완료', price: 14000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 1,
         ticketAmount: 14000,
         fee: 560,
         total: 14560,
         method: '카카오페이',
         date: '2025.10.28 (화) 19:40',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2025.10.28 (화) 19:40',
            items: [
               { label: '티켓 금액 (1매)', amount: 14000 },
               { label: '수수료', amount: 560 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 14560,
            methodLabel: '결제 수단',
            method: '카카오페이',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '14': {
      id: '14',
      orderId: 'GT0921983209014',
      orderDate: '2025.10.20',
      overallStatus: '관람 완료',
      game: { teams: '키움 vs KT', venue: '고척', datetime: '2025.10.26 (일) 17:00' },
      orderer: '홍길동',
      seatItems: [
         { orderId: 'ORD2510200001-1', section: '내야 지정석 B', seatDetail: '112구역 8열 15번', status: '예매완료', price: 27500 },
         { orderId: 'ORD2510200001-2', section: '내야 지정석 B', seatDetail: '112구역 8열 16번', status: '예매완료', price: 27500 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 2,
         ticketAmount: 55000,
         fee: 2200,
         total: 57200,
         method: '후불결제',
         date: '2025.10.20 (일) 09:15',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2025.10.20 (일) 09:15',
            items: [
               { label: '티켓 금액 (2매)', amount: 55000 },
               { label: '수수료', amount: 2200 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 57200,
            methodLabel: '결제 수단',
            method: '후불결제',
         },
      ],
      canCancel: false,
      canSell: false,
   },
   '15': {
      id: '15',
      orderId: 'GT0921983209015',
      orderDate: '2025.10.05',
      overallStatus: '관람 완료',
      game: { teams: 'KIA vs NC', venue: '광주', datetime: '2025.10.11 (토) 18:30' },
      orderer: '홍길동',
      seatItems: [
         { orderId: 'ORD2510050001-1', section: '3루 외야 지정석', seatDetail: '209구역 2열 7번', status: '예매완료', price: 9000 },
         { orderId: 'ORD2510050001-2', section: '3루 외야 지정석', seatDetail: '209구역 2열 8번', status: '예매완료', price: 9000 },
         { orderId: 'ORD2510050001-3', section: '3루 외야 지정석', seatDetail: '209구역 2열 9번', status: '예매완료', price: 9000 },
      ],
      deliveryMethod: '모바일 QR',
      paymentSummary: {
         ticketCount: 3,
         ticketAmount: 27000,
         fee: 1080,
         total: 28080,
         method: '신용카드',
         date: '2025.10.05 (일) 11:30',
         status: '결제 완료',
      },
      paymentEvents: [
         {
            type: '결제 완료',
            date: '2025.10.05 (일) 11:30',
            items: [
               { label: '티켓 금액 (3매)', amount: 27000 },
               { label: '수수료', amount: 1080 },
            ],
            totalLabel: '총 결제 금액',
            totalAmount: 28080,
            methodLabel: '결제 수단',
            method: '신용카드',
         },
      ],
      canCancel: false,
      canSell: false,
   },
};

// ─── 판매 상세 목 데이터 ────────────────────────────────────────

export const SALE_DETAIL_MAP: Record<string, SaleDetailData> = {
   's1': {
      id: 's1',
      orderId: 'RS0921983200001',
      orderDate: '2026.03.18 (수) 14:30',
      overallStatus: '판매 중',
      game: { teams: '삼성 vs LG', venue: '대구', datetime: '2026.03.25 (수) 18:30' },
      seatItems: [
         { orderId: 'ORD2603180001', section: '1루 K8석', seatDetail: '109구역 1열 10번', status: '판매중', price: 40000 },
      ],
      estimatedTicketAmount: 40000,
      estimatedFeeRate: 5,
      estimatedFee: -2000,
      estimatedTotal: 38000,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.03.26 (목) 09:00',
      canCancel: true,
   },
   's2': {
      id: 's2',
      orderId: 'RS0921983200002',
      orderDate: '2026.03.10 (화) 09:20',
      overallStatus: '판매 중',
      game: { teams: '삼성 vs LG', venue: '대구', datetime: '2026.03.21 (토) 18:30' },
      seatItems: [
         { orderId: 'ORD2603100001', section: '1루 K8석', seatDetail: '109구역 1열 8번', status: '판매중', price: 38000 },
         { orderId: 'ORD2603100002', section: '1루 K8석', seatDetail: '109구역 1열 9번', status: '판매취소', price: 38000 },
      ],
      estimatedTicketAmount: 38000,
      estimatedFeeRate: 5,
      estimatedFee: -1900,
      estimatedTotal: 36100,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.03.22 (일) 09:00',
      canCancel: true,
   },
   's3': {
      id: 's3',
      orderId: 'RS0921983200003',
      orderDate: '2026.03.05 (목) 11:00',
      overallStatus: '판매 완료',
      game: { teams: 'KT vs 두산', venue: '수원', datetime: '2026.03.12 (목) 17:00' },
      seatItems: [
         { orderId: 'ORD2603050001', section: '내야 지정석 A', seatDetail: '108구역 3열 11번', status: '판매완료', price: 22000 },
      ],
      estimatedTicketAmount: 22000,
      estimatedFeeRate: 5,
      estimatedFee: -1100,
      estimatedTotal: 20900,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.03.13 (금) 10:00',
      settlementCompleteDate: '2026.03.13 (금) 10:00',
      canCancel: false,
   },
   's4': {
      id: 's4',
      orderId: 'RS0921983200004',
      orderDate: '2026.02.20 (금) 16:45',
      overallStatus: '판매 완료',
      game: { teams: 'NC vs SSG', venue: '창원', datetime: '2026.02.27 (금) 18:30' },
      seatItems: [
         { orderId: 'ORD2602200001', section: '3루 K9석', seatDetail: '302구역 1열 7번', status: '판매완료', price: 25000 },
         { orderId: 'ORD2602200002', section: '3루 K9석', seatDetail: '302구역 1열 8번', status: '판매완료', price: 25000 },
      ],
      estimatedTicketAmount: 50000,
      estimatedFeeRate: 5,
      estimatedFee: -2500,
      estimatedTotal: 47500,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.02.28 (토) 10:00',
      settlementCompleteDate: '2026.02.28 (토) 10:00',
      canCancel: false,
   },
   's5': {
      id: 's5',
      orderId: 'RS0921983200005',
      orderDate: '2026.02.05 (목) 10:10',
      overallStatus: '판매 완료',
      game: { teams: 'KIA vs 두산', venue: '광주', datetime: '2026.02.12 (목) 17:00' },
      seatItems: [
         { orderId: 'ORD2602050001', section: '3루 외야 지정석', seatDetail: '208구역 5열 12번', status: '판매완료', price: 30000 },
      ],
      estimatedTicketAmount: 30000,
      estimatedFeeRate: 5,
      estimatedFee: -1500,
      estimatedTotal: 28500,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.02.13 (금) 10:00',
      settlementCompleteDate: '2026.02.13 (금) 10:00',
      canCancel: false,
   },
   's6': {
      id: 's6',
      orderId: 'RS0921983200006',
      orderDate: '2026.01.25 (일) 13:00',
      overallStatus: '정산 대기',
      game: { teams: '한화 vs 키움', venue: '대전', datetime: '2026.02.01 (일) 14:00' },
      seatItems: [
         { orderId: 'ORD2601250001', section: '1루 지정석', seatDetail: '103구역 5열 2번', status: '판매완료', price: 17000 },
         { orderId: 'ORD2601250002', section: '1루 지정석', seatDetail: '103구역 5열 3번', status: '판매완료', price: 17000 },
      ],
      estimatedTicketAmount: 34000,
      estimatedFeeRate: 5,
      estimatedFee: -1700,
      estimatedTotal: 32300,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.02.03 (화) 10:00',
      canCancel: false,
   },
   's7': {
      id: 's7',
      orderId: 'RS0921983200007',
      orderDate: '2026.01.20 (화) 20:30',
      overallStatus: '정산 대기',
      game: { teams: '롯데 vs SSG', venue: '사직', datetime: '2026.01.28 (수) 18:30' },
      seatItems: [
         { orderId: 'ORD2601200001', section: '내야 지정석 A', seatDetail: '107구역 4열 9번', status: '판매완료', price: 21000 },
         { orderId: 'ORD2601200002', section: '내야 지정석 A', seatDetail: '107구역 4열 10번', status: '판매완료', price: 21000 },
      ],
      estimatedTicketAmount: 42000,
      estimatedFeeRate: 5,
      estimatedFee: -2100,
      estimatedTotal: 39900,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2026.01.30 (금) 10:00',
      canCancel: false,
   },
   's8': {
      id: 's8',
      orderId: 'RS0921983200008',
      orderDate: '2026.01.08 (목) 18:20',
      overallStatus: '판매 취소 대기',
      game: { teams: 'LG vs KIA', venue: '잠실', datetime: '2026.01.15 (목) 17:00' },
      seatItems: [
         { orderId: 'ORD2601080001', section: '외야 지정석', seatDetail: '403구역 9열 5번', status: '취소대기', price: 18000 },
      ],
      estimatedTicketAmount: 18000,
      estimatedFeeRate: 5,
      estimatedFee: -900,
      estimatedTotal: 17100,
      cancelDate: '2026.01.09 (금) 10:30',
      canCancel: false,
   },
   's9': {
      id: 's9',
      orderId: 'RS0921983200009',
      orderDate: '2025.12.10 (수) 09:00',
      overallStatus: '판매 취소 대기',
      game: { teams: 'NC vs 한화', venue: '창원', datetime: '2025.12.18 (목) 14:00' },
      seatItems: [
         { orderId: 'ORD2512100001', section: '1루 K8석', seatDetail: '203구역 1열 3번', status: '취소대기', price: 25000 },
         { orderId: 'ORD2512100002', section: '1루 K8석', seatDetail: '203구역 1열 4번', status: '취소대기', price: 25000 },
      ],
      estimatedTicketAmount: 50000,
      estimatedFeeRate: 5,
      estimatedFee: -2500,
      estimatedTotal: 47500,
      cancelDate: '2025.12.11 (목) 14:00',
      canCancel: false,
   },
   's10': {
      id: 's10',
      orderId: 'RS0921983200010',
      orderDate: '2025.11.20 (목) 22:10',
      overallStatus: '판매 완료',
      game: { teams: '두산 vs 삼성', venue: '잠실', datetime: '2025.11.27 (목) 17:00' },
      seatItems: [
         { orderId: 'ORD2511200001', section: '3루 K9석', seatDetail: '205구역 3열 14번', status: '판매완료', price: 18000 },
         { orderId: 'ORD2511200002', section: '3루 K9석', seatDetail: '205구역 3열 15번', status: '판매완료', price: 18000 },
      ],
      estimatedTicketAmount: 36000,
      estimatedFeeRate: 5,
      estimatedFee: -1800,
      estimatedTotal: 34200,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2025.11.28 (금) 10:00',
      settlementCompleteDate: '2025.11.28 (금) 10:00',
      canCancel: false,
   },
   's11': {
      id: 's11',
      orderId: 'RS0921983200011',
      orderDate: '2025.10.15 (수) 17:55',
      overallStatus: '판매 완료',
      game: { teams: 'KT vs 롯데', venue: '수원', datetime: '2025.10.22 (수) 18:30' },
      seatItems: [
         { orderId: 'ORD2510150001', section: '내야 지정석 B', seatDetail: '110구역 6열 3번', status: '판매완료', price: 28000 },
      ],
      estimatedTicketAmount: 28000,
      estimatedFeeRate: 5,
      estimatedFee: -1400,
      estimatedTotal: 26600,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2025.10.23 (목) 10:00',
      settlementCompleteDate: '2025.10.23 (목) 10:00',
      canCancel: false,
   },
   's12': {
      id: 's12',
      orderId: 'RS0921983200012',
      orderDate: '2025.10.05 (일) 08:40',
      overallStatus: '판매 완료',
      game: { teams: '키움 vs KT', venue: '고척', datetime: '2025.10.12 (일) 17:00' },
      seatItems: [
         { orderId: 'ORD2510050001', section: '외야 지정석', seatDetail: '401구역 7열 22번', status: '판매완료', price: 20000 },
      ],
      estimatedTicketAmount: 20000,
      estimatedFeeRate: 5,
      estimatedFee: -1000,
      estimatedTotal: 19000,
      settlementAccount: '우리 1000000000000 (홍길동)',
      settlementDate: '2025.10.13 (월) 10:00',
      settlementCompleteDate: '2025.10.13 (월) 10:00',
      canCancel: false,
   },
};
