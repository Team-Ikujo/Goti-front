/**
 * 마우스 이벤트를 10초 단위로 수집하여 매크로 탐지 ML 서버(/predict)로 주기적으로 전송하는 훅.
 *
 * event_type 매핑:
 *   1 = mouseup (release)
 *   2 = mousemove (move)
 *   3 = wheel
 *   4 = mousemove (drag — 버튼 누른 채 이동)
 *   5 = click
 */

import { useEffect, useRef } from 'react';

export interface MacroPredictResult {
   session_id: string;
   is_macro: boolean;
   probability: number;
   confidence: number;
   event_count: number;
}

const ML_SERVER_URL = (import.meta.env.PUBLIC_MOUSE_ML_URL ?? '').trim() || 'http://localhost:8000';
const SEND_INTERVAL_MS = 10_000;
const isDev = import.meta.env.DEV;

interface TrackedMouseEvent {
   timestamp: number;
   event_type: number;
   screen_x: number;
   screen_y: number;
}

interface PredictRequest {
   session_id: string;
   user_id?: string;
   events: TrackedMouseEvent[];
}

function generateSessionId(): string {
   return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

async function postPredict(body: PredictRequest): Promise<MacroPredictResult | null> {
   try {
      if (isDev) {
         console.log(`[MouseTracker] POST ${ML_SERVER_URL}/predict | events: ${body.events.length} | session: ${body.session_id}`);
      }

      const response = await fetch(`${ML_SERVER_URL}/predict`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(body),
      });

      if (!response.ok) {
         if (isDev) console.warn('[MouseTracker] 응답 오류:', response.status);
         return null;
      }

      const result = (await response.json()) as MacroPredictResult;
      if (isDev) console.log('[MouseTracker] 결과:', result);
      return result;
   } catch (err) {
      if (isDev) console.warn('[MouseTracker] 전송 실패 (서버 미실행?):', err);
      return null;
   }
}

type UseMouseEventTrackerOptions = {
   userId?: string;
   onMacroDetected?: (result: MacroPredictResult) => void;
};

export function useMouseEventTracker({ userId, onMacroDetected }: UseMouseEventTrackerOptions = {}) {
   const eventsRef = useRef<TrackedMouseEvent[]>([]);
   const sessionIdRef = useRef<string>(generateSessionId());
   const isDraggingRef = useRef(false);
   const userIdRef = useRef(userId);
   userIdRef.current = userId;
   const onMacroDetectedRef = useRef(onMacroDetected);
   onMacroDetectedRef.current = onMacroDetected;

   useEffect(() => {
      if (isDev) console.log('[MouseTracker] 수집 시작 | session:', sessionIdRef.current);

      const push = (evt: TrackedMouseEvent) => {
         eventsRef.current.push(evt);
      };

      const onMouseMove = (e: MouseEvent) => {
         push({ timestamp: Date.now(), event_type: isDraggingRef.current ? 4 : 2, screen_x: e.screenX, screen_y: e.screenY });
      };
      const onMouseDown = () => { isDraggingRef.current = true; };
      const onMouseUp = (e: MouseEvent) => {
         isDraggingRef.current = false;
         push({ timestamp: Date.now(), event_type: 1, screen_x: e.screenX, screen_y: e.screenY });
      };
      const onWheel = (e: WheelEvent) => {
         push({ timestamp: Date.now(), event_type: 3, screen_x: e.screenX, screen_y: e.screenY });
      };
      const onClick = (e: MouseEvent) => {
         push({ timestamp: Date.now(), event_type: 5, screen_x: e.screenX, screen_y: e.screenY });
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('wheel', onWheel, { passive: true });
      window.addEventListener('click', onClick);

      const timer = setInterval(async () => {
         const events = eventsRef.current.splice(0);

         if (isDev) console.log('[MouseTracker] 10초 경과 | 수집된 이벤트:', events.length);

         if (events.length < 10) {
            if (isDev) console.warn('[MouseTracker] 이벤트 부족 (최소 10개) — 전송 생략');
            return;
         }

         const result = await postPredict({
            session_id: sessionIdRef.current,
            user_id: userIdRef.current,
            events,
         });

         if (result?.is_macro) {
            onMacroDetectedRef.current?.(result);
         }
      }, SEND_INTERVAL_MS);

      return () => {
         if (isDev) console.log('[MouseTracker] 수집 종료');
         window.removeEventListener('mousemove', onMouseMove);
         window.removeEventListener('mousedown', onMouseDown);
         window.removeEventListener('mouseup', onMouseUp);
         window.removeEventListener('wheel', onWheel);
         window.removeEventListener('click', onClick);
         clearInterval(timer);
      };
   }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
