// src/pages/tickets/ui/constants.ts

import type { GameItem } from './types';

export const MAX_PRICE = 1_000_000;

export const VENUES = [
   '인천 SSG 랜더스필드',
   '광주-기아 챔피언스필드',
   '한화생명 이글스파크',
   '창원 NC파크',
   '잠실 야구장',
];

export const MOCK_GAMES: GameItem[] = [
   {
      id: '1',
      awayTeam: 'SSG 랜더스',
      homeTeam: 'KT 위즈',
      dateTime: '2026.03.20 (금) 18:30',
      venue: '인천 SSG 랜더스필드',
      remainingSeats: 245,
      minPrice: 14_000,
      maxPrice: 35_000,
      bookingStatus: '예매 가능',
      resellStatus: '예매 가능',
   },
   {
      id: '2',
      awayTeam: 'KIA 타이거즈',
      homeTeam: '삼성 라이온즈',
      dateTime: '2026.03.19 (목) 18:00',
      venue: '광주-기아 챔피언스필드',
      remainingSeats: 245,
      minPrice: 16_000,
      maxPrice: 38_000,
      bookingStatus: '예매 가능',
      resellStatus: '예매 가능',
   },
   {
      id: '3',
      awayTeam: '한화 이글스',
      homeTeam: '롯데 자이언츠',
      dateTime: '2026.03.21 (토) 18:00',
      venue: '한화생명 이글스파크',
      remainingSeats: 245,
      minPrice: 10_000,
      maxPrice: 40_000,
      bookingStatus: '예매 가능',
      resellStatus: '예매 가능',
   },
   {
      id: '4',
      awayTeam: 'NC 다이노스',
      homeTeam: '키움 히어로즈',
      dateTime: '2026.03.22 (일) 17:00',
      venue: '창원 NC파크',
      remainingSeats: 245,
      minPrice: 8_000,
      maxPrice: 35_000,
      bookingStatus: '예매 가능',
      resellStatus: '리셀 예정',
   },
   {
      id: '5',
      awayTeam: 'LG 트윈스',
      homeTeam: '두산 베어스',
      dateTime: '2026.03.26 (토) 17:00',
      venue: '잠실 야구장',
      remainingSeats: 245,
      minPrice: 15_000,
      maxPrice: 55_000,
      bookingStatus: '오픈 예정',
      resellStatus: '매진',
   },
   {
      id: '6',
      awayTeam: 'LG 트윈스',
      homeTeam: '두산 베어스',
      dateTime: '2026.03.26 (토) 17:00',
      venue: '잠실 야구장',
      remainingSeats: 245,
      minPrice: 0,
      maxPrice: 0,
      bookingStatus: '매진',
      resellStatus: '매진',
   },
];
