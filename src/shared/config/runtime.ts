const mswFlag = (import.meta.env.PUBLIC_ENABLE_MSW ?? '').trim().toLowerCase();
const resaleDemoFlag = (import.meta.env.PUBLIC_ENABLE_RESALE_DEMO ?? '').trim().toLowerCase();

const isLocalHostname = (hostname: string) => {
   return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost')
   );
};

const isPrivateNetworkHostname = (hostname: string) => {
   return (
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
   );
};

const canUseMswInBrowser = () => {
   if (typeof window === 'undefined') {
      return import.meta.env.DEV;
   }

   return import.meta.env.DEV || isLocalHostname(window.location.hostname) || isPrivateNetworkHostname(window.location.hostname);
};

// MSW는 로컬 개발 환경에서만 허용한다.
// 배포/프리뷰 환경에서는 .env 플래그가 true여도 실제 API를 사용해야 한다.
export const isMswEnabled = mswFlag === 'true' && canUseMswInBrowser();

const RESALE_DEMO_QUERY_KEY = 'resaleDemo';
const RESALE_DEMO_STORAGE_KEY = '__resale_demo_enabled__';

const readResaleDemoQuery = () => {
   if (typeof window === 'undefined') {
      return false;
   }

   const value = new URLSearchParams(window.location.search).get(RESALE_DEMO_QUERY_KEY)?.trim().toLowerCase();

   if (value === '1' || value === 'true') {
      window.sessionStorage.setItem(RESALE_DEMO_STORAGE_KEY, 'true');
      return true;
   }

   return false;
};

const readStoredResaleDemoFlag = () => {
   if (typeof window === 'undefined') {
      return false;
   }

   return window.sessionStorage.getItem(RESALE_DEMO_STORAGE_KEY) === 'true';
};

export const isResaleDemoEnabled = resaleDemoFlag === 'true' || readResaleDemoQuery() || readStoredResaleDemoFlag();

// 리셀 예매는 현재 API 연동 없이 mock 기반으로만 동작시킨다.
export const isResaleBookingMockEnabled = true;
