const mswFlag = (import.meta.env.PUBLIC_ENABLE_MSW ?? '').trim().toLowerCase();

const isLocalHostname = (hostname: string) => {
   return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
};

const canUseMswInBrowser = () => {
   if (typeof window === 'undefined') {
      return import.meta.env.DEV;
   }

   return import.meta.env.DEV && isLocalHostname(window.location.hostname);
};

// MSW는 로컬 개발 환경에서만 허용한다.
// 배포/프리뷰 환경에서는 .env 플래그가 true여도 실제 API를 사용해야 한다.
export const isMswEnabled = mswFlag === 'true' && canUseMswInBrowser();
