import type { GameStatus } from './types';

export const teamOrder = ['삼성', 'KIA', 'LG', '한화', 'SSG', 'NC', 'KT', '롯데', '두산', '키움'];
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

export const statusColor: Record<GameStatus, string> = {
   경기중: 'text-[#38c976]',
   예정: 'text-primary',
   종료: 'text-[#ef4444]',
   취소: 'text-[#acb4bb]',
};

const now = new Date();

export const CURRENT_YEAR = now.getFullYear();
export const CURRENT_MONTH = now.getMonth() + 1;
export const CURRENT_WEEK = Math.ceil(now.getDate() / 7);

// 시즌 월 순서: 3월~12월, 1월, 2월
export const SEASON_MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2];
export const DISABLED_MONTHS = [10, 11, 12, 1, 2];
export const AVAILABLE_YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 2 + index);

export const tabs = ['오늘 일정', '주간 일정', '전체 일정'];
export const TAB_TODAY = 0;
export const TAB_WEEK = 1;
export const TAB_ALL = 2;
export const WEEK_OPTIONS = [1, 2, 3, 4, 5];
