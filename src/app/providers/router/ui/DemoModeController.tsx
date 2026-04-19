import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 영상 촬영용 임시 데모 모드 전역 토글.
// 어느 페이지에서든 ?demo=1 로 진입하면 같은 탭 내내 대기열이 가짜 카운트다운으로 동작한다.
// ?demo=0 으로 진입하면 해제. 탭 닫으면 자동 초기화.
// TODO(ress): 영상 촬영 후 revert.
const DEMO_MODE_STORAGE_KEY = 'queue-demo-mode';

const DemoModeController = () => {
   const location = useLocation();

   useEffect(() => {
      if (typeof window === 'undefined') {
         return;
      }

      const params = new URLSearchParams(location.search);
      const queryValue = params.get('demo');

      if (queryValue !== '1' && queryValue !== '0') {
         return;
      }

      if (queryValue === '1') {
         window.sessionStorage.setItem(DEMO_MODE_STORAGE_KEY, '1');
      } else {
         window.sessionStorage.removeItem(DEMO_MODE_STORAGE_KEY);
      }

      // 주소창에서 demo 쿼리를 제거해 영상에 노출되지 않게 하고, 이후 네비게이션에도 잔류하지 않도록 정리한다.
      params.delete('demo');
      const nextSearch = params.toString();
      const nextUrl = `${location.pathname}${nextSearch ? `?${nextSearch}` : ''}${location.hash}`;
      window.history.replaceState(null, '', nextUrl);
   }, [location.hash, location.pathname, location.search]);

   return null;
};

export default DemoModeController;
