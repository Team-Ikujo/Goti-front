import './styles/globals.css';
import { QueryProvider } from '@/app/providers/query';
import { AppRouter } from '@/app/providers/router';
import { useEffect } from 'react';
import { GuardrailTelemetry } from 'util/GuardrailTelemetry';

const App = () => {
   useEffect(() => {
      // 1. 필요한 고유 ID들을 가져오거나 생성합니다.
      const sessionId = localStorage.getItem('session_id') || 'sess_fallback_123';
      const deviceId = localStorage.getItem('device_id') || 'dev_fallback_456';
      const traceId = crypto.randomUUID();

      // 2. SDK 인스턴스 생성
      const telemetry = new GuardrailTelemetry({
         sessionId: sessionId,
         deviceId: deviceId,
         clientTraceId: traceId,
         apiUrlBehavior: 'https://api.yourdomain.com/v1/telemetry/behavior',
         apiUrlRaw: 'https://api.yourdomain.com/v1/telemetry/raw',
      });

      // 3. 백그라운드 수집 시작
      telemetry.start();
      console.log('Telemetry 수집이 시작되었습니다.');

      // 4. 클린업 함수 (컴포넌트가 언마운트될 때 리스너와 인터벌 제거)
      return () => {
         telemetry.stop();
         console.log('Telemetry 수집이 종료되었습니다.');
      };
   }, []); // 빈 배열 []: 앱이 처음 켜질 때 딱 한 번만 실행됨
   return (
      <QueryProvider>
         <AppRouter />
      </QueryProvider>
   );
};

export default App;
