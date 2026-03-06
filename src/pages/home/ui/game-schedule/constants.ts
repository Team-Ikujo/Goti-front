import type { DaySchedule, GameStatus } from './types';

export const teamOrder = ['LG', '한화', 'SSG', '삼성', 'NC', 'KT', '롯데', '두산', '키움', 'KIA'];
export const TEAM_IDS: Record<string, string> = {
   LG: 'lg',
   한화: 'hanwha',
   SSG: 'ssg',
   삼성: 'samsung',
   NC: 'nc',
   KT: 'kt',
   롯데: 'lotte',
   두산: 'doosan',
   키움: 'kiwoom',
   KIA: 'kia',
};

// 팀 로고 이미지 (Figma asset)
export const teamLogos: Record<string, string> = {
   LG: '/baseball/logos/lg.png',
   한화: '/baseball/logos/hanwha.png',
   SSG: '/baseball/logos/ssg.png',
   삼성: '/baseball/logos/samsung.png',
   NC: '/baseball/logos/nc.png',
   KT: '/baseball/logos/kt.png',
   롯데: '/baseball/logos/lotte.png',
   두산: '/baseball/logos/doosan.png',
   키움: '/baseball/logos/kiwoom.png',
   KIA: '/baseball/logos/kia.png',
};

export const scheduleData: DaySchedule[] = [
   {
      date: '7월 1일 (수)',
      games: [
         {
            time: '18:30',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: '5:3',
            status: '종료',
            ticket: '매진',
            resell: '리셀매진',
         },
      ],
   },
   {
      date: '7월 3일 (금)',
      isToday: true,
      games: [
         {
            time: '18:30',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: '2:1',
            status: '경기중',
            ticket: '예매하기',
            resell: '리셀매진',
         },
         {
            time: '18:30',
            venue: '대구',
            away: '두산',
            home: '삼성',
            score: null,
            status: '예정',
            ticket: '예매하기',
            resell: '리셀예매',
         },
      ],
   },
   {
      date: '7월 5일 (일)',
      games: [
         {
            time: '17:00',
            venue: '잠실',
            away: 'KIA',
            home: 'LG',
            score: null,
            status: '예정',
            ticket: '판매예정',
            resell: '리셀예정',
            ticketInfo: '6월 25일\n오전 11시 오픈',
            reselInfo: '정식 예매 오픈\n2시간 후',
         },
      ],
   },
];

export const statusColor: Record<GameStatus, string> = {
   경기중: 'text-[#38c976]',
   예정: 'text-primary',
   종료: 'text-[#ef4444]',
   취소: 'text-[#acb4bb]',
};

export const TODAY = '7월 3일 (금)';
export const CURRENT_YEAR = 2025;
export const CURRENT_MONTH = 7;
export const CURRENT_WEEK = 1;

// 시즌 월 순서: 3월~12월, 1월, 2월
export const SEASON_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
export const DISABLED_MONTHS = [10, 11, 12, 1, 2];
export const AVAILABLE_YEARS = [2021, 2022, 2023, 2024, 2025, 2026];

export const tabs = ['오늘 일정', '주간 일정', '전체 일정'];
export const TAB_TODAY = 0;
export const TAB_WEEK = 1;
export const TAB_ALL = 2;
export const WEEK_OPTIONS = [1, 2, 3, 4, 5];
