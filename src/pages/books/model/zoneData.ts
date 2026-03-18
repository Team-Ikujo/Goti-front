import type { ZoneItem } from './types';

export type BookingTeamId = 'kia' | 'samsung';

type BookingTeamConfig = {
   displayName: string;
   stadiumImage: string;
   stadiumImageAlt: string;
   zoneDisplayOrder: string[];
   zones: ZoneItem[];
   zoneOverviewImageById?: Partial<Record<string, string>>;
};

const KIA_BOOKING_ZONES: ZoneItem[] = [
   { id: 'skybox', name: '스카이박스', price: 75000, remaining: 0, color: '#0A58BF', hotspot: [{ x: 43, y: 8 }], sectionCode: 'S1' },
   { id: 'champion', name: '챔피언석', price: 55000, remaining: 2, color: '#D05150', hotspot: [{ x: 45, y: 72 }], sectionCode: 'C2' },
   { id: 'center-table', name: '중앙 테이블석', price: 55000, remaining: 2, color: '#284785', hotspot: [{ x: 38, y: 79 }], sectionCode: 'CT' },
   { id: 'mediheal-table', name: '메디힐 테이블석', price: 55000, remaining: 2, color: '#0A005F', hotspot: [{ x: 51, y: 79 }], sectionCode: 'MT' },
   { id: 'party', name: '파티석', price: 55000, remaining: 2, color: '#782E8D', hotspot: [{ x: 71, y: 55 }], sectionCode: 'P3' },
   { id: 'family', name: '타이거즈 가족석', price: 55000, remaining: 0, color: '#7B3A99', hotspot: [{ x: 18, y: 55 }], sectionCode: 'F4' },
   { id: 'k9', name: 'K9석', price: 16000, remaining: 0, color: '#DB58AF', hotspot: [{ x: 66, y: 70 }], sectionCode: 'K9' },
   { id: 'k8', name: 'K8석', price: 14000, remaining: 0, color: '#EFBC2E', hotspot: [{ x: 61, y: 63 }], sectionCode: 'K8' },
   { id: 'k5', name: 'K5석', price: 12000, remaining: 0, color: '#93CB3A', hotspot: [{ x: 56, y: 56 }], sectionCode: 'K5' },
   { id: 'ev', name: 'EV석', price: 10000, remaining: 0, color: '#9574C1', hotspot: [{ x: 26, y: 69 }], sectionCode: 'EV' },
   { id: 'outfield', name: '외야석', price: 10000, remaining: 0, color: '#6CBE88', hotspot: [{ x: 43, y: 23 }], sectionCode: 'OF' },
];

// 삼성 좌석 가격/잔여석은 실데이터가 아직 없어, 전달받은 좌석 수를 임시 잔여석으로 사용한다.
const SAMSUNG_BOOKING_ZONES: ZoneItem[] = [
   { id: 'samsung-first-base-infield', name: '1루 내야지정석', price: 22000, remaining: 2800, color: '#0A58BF', hotspot: [], sectionCode: '1-6~1-11' },
   { id: 'samsung-third-base-infield', name: '3루 내야지정석', price: 22000, remaining: 2600, color: '#145EB8', hotspot: [], sectionCode: '3B' },
   { id: 'samsung-first-base-exciting', name: '1루 익사이팅석', price: 28000, remaining: 1500, color: '#0A8AD8', hotspot: [], sectionCode: '1-1~1-5' },
   { id: 'samsung-third-base-exciting', name: '3루 익사이팅석', price: 28000, remaining: 1300, color: '#17A2C7', hotspot: [], sectionCode: '3E-1~3E-3' },
   { id: 'samsung-blue-zone', name: '블루존', price: 20000, remaining: 1500, color: '#1F4D93', hotspot: [], sectionCode: '3-1~3-5' },
   { id: 'samsung-away-zone', name: '원정 응원석', price: 17000, remaining: 1200, color: '#5B6DB2', hotspot: [], sectionCode: 'S1~S6' },
   { id: 'samsung-sky-lower', name: 'SKY 하단 지정석', price: 18000, remaining: 2500, color: '#5A7EE0', hotspot: [], sectionCode: 'S7~S22' },
   { id: 'samsung-sky-upper', name: 'SKY 상단 지정석', price: 14000, remaining: 3000, color: '#8AA0E8', hotspot: [], sectionCode: 'U1~U24' },
   { id: 'samsung-outfield', name: '외야 지정석', price: 12000, remaining: 3500, color: '#3AA66B', hotspot: [], sectionCode: 'LF/RF' },
   { id: 'samsung-grass', name: '잔디석', price: 10000, remaining: 1300, color: '#7BBE43', hotspot: [], sectionCode: 'GRASS' },
   { id: 'samsung-center-table', name: '중앙 테이블석', price: 30000, remaining: 1000, color: '#234785', hotspot: [], sectionCode: 'CT' },
   { id: 'samsung-first-base-table', name: '1루 테이블석', price: 30000, remaining: 700, color: '#32559A', hotspot: [], sectionCode: '1T' },
   { id: 'samsung-third-base-table', name: '3루 테이블석', price: 30000, remaining: 700, color: '#4064B0', hotspot: [], sectionCode: '3T' },
   { id: 'samsung-yogibo-family', name: 'SKY 요기보 패밀리존', price: 36000, remaining: 300, color: '#6F5BD3', hotspot: [], sectionCode: 'YF' },
   { id: 'samsung-party-floor', name: '파티플로어 라이브석', price: 42000, remaining: 300, color: '#7840C9', hotspot: [], sectionCode: 'PF' },
   { id: 'samsung-rooftop-table', name: '루프탑 테이블석', price: 45000, remaining: 200, color: '#9152D9', hotspot: [], sectionCode: 'RT' },
   { id: 'samsung-camping-zone', name: '캠핑존', price: 50000, remaining: 200, color: '#A64DB3', hotspot: [], sectionCode: 'CAMP' },
   { id: 'samsung-wheelchair', name: '휠체어석', price: 10000, remaining: 400, color: '#6D7C8F', hotspot: [], sectionCode: 'WC' },
];

const BOOKING_TEAM_CONFIGS: Record<BookingTeamId, BookingTeamConfig> = {
   kia: {
      displayName: 'KIA 타이거즈',
      stadiumImage: '/baseball/seat/kia.png',
      stadiumImageAlt: '기아 챔피언스필드 구역도',
      zoneDisplayOrder: ['k9', 'k8', 'k5', 'ev', 'outfield', 'skybox', 'champion', 'center-table', 'mediheal-table', 'party', 'family'],
      zones: KIA_BOOKING_ZONES,
      zoneOverviewImageById: {
         k8: '/baseball/seat/kia/KIA_K8_1.png',
      },
   },
   samsung: {
      displayName: '삼성 라이온즈',
      stadiumImage: '/baseball/seat/samsung.png',
      stadiumImageAlt: '대구 삼성라이온즈파크 구역도',
      zoneDisplayOrder: [
         'samsung-first-base-exciting',
         'samsung-third-base-exciting',
         'samsung-blue-zone',
         'samsung-away-zone',
         'samsung-first-base-infield',
         'samsung-third-base-infield',
         'samsung-center-table',
         'samsung-first-base-table',
         'samsung-third-base-table',
         'samsung-sky-lower',
         'samsung-sky-upper',
         'samsung-outfield',
         'samsung-grass',
         'samsung-yogibo-family',
         'samsung-party-floor',
         'samsung-rooftop-table',
         'samsung-camping-zone',
         'samsung-wheelchair',
      ],
      zones: SAMSUNG_BOOKING_ZONES,
   },
};

export const DEFAULT_BOOKING_TEAM_ID: BookingTeamId = 'kia';

export const getBookingTeamId = (teamId?: string): BookingTeamId => {
   switch (teamId) {
      case 'samsung':
         return 'samsung';
      case 'kia':
      default:
         return DEFAULT_BOOKING_TEAM_ID;
   }
};

export const getBookingTeamConfig = (teamId?: string): BookingTeamConfig => {
   return BOOKING_TEAM_CONFIGS[getBookingTeamId(teamId)];
};

export const getBookingZones = (teamId?: string) => getBookingTeamConfig(teamId).zones;

export const getZoneDisplayOrder = (teamId?: string) => getBookingTeamConfig(teamId).zoneDisplayOrder;

export const getStadiumImage = (teamId?: string) => getBookingTeamConfig(teamId).stadiumImage;

export const getStadiumImageAlt = (teamId?: string) => getBookingTeamConfig(teamId).stadiumImageAlt;

export const getZoneOverviewImage = (teamId: string | undefined, zoneId: ZoneItem['id']) => {
   const teamConfig = getBookingTeamConfig(teamId);

   return teamConfig.zoneOverviewImageById?.[zoneId] ?? teamConfig.stadiumImage;
};

export const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;
