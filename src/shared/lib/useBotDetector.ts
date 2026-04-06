import { useEffect, useRef } from 'react';
import { BotDetector } from './botDetector';
import type { BotReport } from './botDetector';

export const useBotDetector = () => {
   // useRef에 BotDetector 인스턴스 또는 null이 들어갈 수 있음을 명시
   const detectorRef = useRef<BotDetector | null>(null);

   useEffect(() => {
      detectorRef.current = new BotDetector();

      return () => {
         if (detectorRef.current) {
            detectorRef.current.cleanup();
         }
      };
   }, []);

   // 리포트 반환 함수 (아직 초기화 전이면 null 반환)
   const getBotReport = (): BotReport | null => {
      return detectorRef.current ? detectorRef.current.generateReport() : null;
   };

   return { getBotReport };
};
