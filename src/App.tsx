import './styles/globals.css';
import { QueryProvider } from '@/app/providers/query';
import { AppRouter } from '@/app/providers/router';
import { useEffect } from 'react';
import { GuardrailTelemetry } from '@/shared/lib/GuardrailTelemetry';

const App = () => {
   useEffect(() => {
      // 1. 필요한 고유 ID들을 가져오거나 생성합니다.
      const sessionId = localStorage.getItem('session_id') || 'sess_fallback_123';
      const deviceId = localStorage.getItem('device_id') || 'dev_fallback_456';
      const traceId = crypto.randomUUID();

      const apiUrlBehavior = import.meta.env.PUBLIC_TELEMETRY_BEHAVIOR_URL;
      const apiUrlRaw = import.meta.env.PUBLIC_TELEMETRY_RAW_URL;

      // 텔레메트리 API URL이 설정되지 않으면 수집 비활성화
      if (!apiUrlBehavior || !apiUrlRaw) return;

      // 2. SDK 인스턴스 생성
      const telemetry = new GuardrailTelemetry({
         sessionId: sessionId,
         deviceId: deviceId,
         clientTraceId: traceId,
         apiUrlBehavior,
         apiUrlRaw,
      });

      // 3. 백그라운드 수집 시작
      telemetry.start();

      // 4. 클린업 함수 (컴포넌트가 언마운트될 때 리스너와 인터벌 제거)
      return () => {
         telemetry.stop();
      };
   }, []); // 빈 배열 []: 앱이 처음 켜질 때 딱 한 번만 실행됨
   return (
      <QueryProvider>
         <AppRouter />
      </QueryProvider>
   );
};

export default App;
