import type { ZoneItem } from './types';

export const BOOKING_ZONES: ZoneItem[] = [
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

const DEFAULT_ZONE_OVERVIEW_IMAGE = '/baseball/seat/kia.png';

// 선택 구역별 하이라이트 이미지 매핑. 추후 애셋이 추가되면 여기만 확장하면 된다.
const ZONE_OVERVIEW_IMAGE_BY_ID: Partial<Record<ZoneItem['id'], string>> = {
   k8: '/baseball/seat/kia/KIA_K8_1.png',
};

export const getZoneOverviewImage = (zoneId: ZoneItem['id']) => ZONE_OVERVIEW_IMAGE_BY_ID[zoneId] ?? DEFAULT_ZONE_OVERVIEW_IMAGE;

export const formatPrice = (value: number) => `${value.toLocaleString('ko-KR')}원`;
