// ============================================================================
// 1. 타입(Type) 정의
// ============================================================================

export interface TelemetryConfig {
   sessionId: string;
   deviceId: string;
   clientTraceId: string;
   apiUrlBehavior: string;
   apiUrlRaw: string;
}

export type EventType = 'pm' | 'pd' | 'pu' | 'cl' | 'sc' | 'vc' | 'fb';

export interface RawEvent {
   t: number; // timestamp (performance.now)
   type: EventType;
   x?: number;
   y?: number;
   b?: number; // button
   dx?: number; // scroll delta x
   dy?: number; // scroll delta y
   v?: number; // visibility/focus (0 or 1)
}

export interface BehaviorResponse {
   request_id: string;
   server_ts_ms: number;
   accepted: boolean;
   risk_feedback?: {
      risk_score: number;
      action: string;
      raw_capture?: {
         enabled: boolean;
         duration_sec: number;
         downsample_hz: number;
         include_prev_sec: number;
         include_next_sec: number;
      };
   };
}

// ============================================================================
// 2. 유틸리티 (수학, 통계, 스로틀 등)
// ============================================================================

const Utils = {
   avg: (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0),
   std: (arr: number[], mean?: number) => {
      if (arr.length < 2) return 0;
      const m = mean ?? Utils.avg(arr);
      const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / (arr.length - 1);
      return Math.sqrt(variance);
   },
   p95: (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const idx = Math.floor(sorted.length * 0.95);
      return sorted[idx];
   },
   max: (arr: number[]) => (arr.length ? Math.max(...arr) : 0),
   distance: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2),
};

// ============================================================================
// 3. 링버퍼 (최근 20초 이벤트 보관)
// ============================================================================

class RingBuffer {
   private buffer: RawEvent[] = [];
   private readonly retentionMs = 20000; // 20초

   add(event: RawEvent) {
      this.buffer.push(event);
      this.cleanUp(event.t);
   }

   private cleanUp(currentT: number) {
      // 20초가 지난 오래된 데이터 제거
      while (this.buffer.length > 0 && currentT - this.buffer[0].t > this.retentionMs) {
         this.buffer.shift();
      }
   }

   // 특정 시간 구간의 데이터 추출 (다운샘플링 옵션 포함)
   extract(startT: number, endT: number, downsampleHz: number): RawEvent[] {
      const extracted = this.buffer.filter(e => e.t >= startT && e.t <= endT);

      // 다운샘플링 적용 (pointermove 대상)
      if (downsampleHz > 0) {
         const intervalMs = 1000 / downsampleHz;
         let lastPmT = 0;
         return extracted.filter(e => {
            if (e.type === 'pm') {
               if (e.t - lastPmT >= intervalMs) {
                  lastPmT = e.t;
                  return true;
               }
               return false;
            }
            return true; // 다른 이벤트는 그대로 통과
         });
      }
      return extracted;
   }
}

// ============================================================================
// 4. SDK 메인 클래스
// ============================================================================

export class GuardrailTelemetry {
   private config: TelemetryConfig;
   private ringBuffer = new RingBuffer();
   private currentWindowEvents: RawEvent[] = []; // 2초 윈도우 계산용

   // 상태 변수
   private windowStartTs = performance.now();
   private behaviorIntervalId: any = null;

   // 스로틀링 제어용 타임스탬프
   private lastPmTime = 0;
   private lastWheelTime = 0;
   private readonly pmThrottleMs = 100; // 10Hz
   private readonly wheelThrottleMs = 50;

   constructor(config: TelemetryConfig) {
      this.config = config;
   }

   public start() {
      this.attachListeners();
      // 2초마다 Behavior API 전송
      this.behaviorIntervalId = setInterval(() => this.processBehaviorWindow(), 2000);
   }

   public stop() {
      this.detachListeners();
      if (this.behaviorIntervalId) clearInterval(this.behaviorIntervalId);
   }

   // --------------------------------------------------------------------------
   // 이벤트 수집 리스너
   // --------------------------------------------------------------------------
   private attachListeners() {
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerdown', this.onPointerDown);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('click', this.onClick);
      window.addEventListener('wheel', this.onWheel);
      document.addEventListener('visibilitychange', this.onVisibilityChange);
      window.addEventListener('focus', this.onFocus);
      window.addEventListener('blur', this.onBlur);
   }

   private detachListeners() {
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerdown', this.onPointerDown);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('click', this.onClick);
      window.removeEventListener('wheel', this.onWheel);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      window.removeEventListener('focus', this.onFocus);
      window.removeEventListener('blur', this.onBlur);
   }

   private pushEvent(evt: RawEvent) {
      this.ringBuffer.add(evt);
      this.currentWindowEvents.push(evt);
   }

   private onPointerMove = (e: PointerEvent) => {
      const t = performance.now();
      if (t - this.lastPmTime < this.pmThrottleMs) return; // 10Hz Throttling
      this.lastPmTime = t;
      this.pushEvent({ t, type: 'pm', x: e.clientX, y: e.clientY });
   };

   private onPointerDown = (e: PointerEvent) =>
      this.pushEvent({ t: performance.now(), type: 'pd', x: e.clientX, y: e.clientY, b: e.button });
   private onPointerUp = (e: PointerEvent) =>
      this.pushEvent({ t: performance.now(), type: 'pu', x: e.clientX, y: e.clientY, b: e.button });
   private onClick = (e: MouseEvent) =>
      this.pushEvent({ t: performance.now(), type: 'cl', x: e.clientX, y: e.clientY, b: e.button });

   private onWheel = (e: WheelEvent) => {
      const t = performance.now();
      if (t - this.lastWheelTime < this.wheelThrottleMs) return;
      this.lastWheelTime = t;
      this.pushEvent({ t, type: 'sc', dx: e.deltaX, dy: e.deltaY });
   };

   private onVisibilityChange = () => this.pushEvent({ t: performance.now(), type: 'vc', v: document.hidden ? 0 : 1 });
   private onFocus = () => this.pushEvent({ t: performance.now(), type: 'fb', v: 1 });
   private onBlur = () => this.pushEvent({ t: performance.now(), type: 'fb', v: 0 });

   // --------------------------------------------------------------------------
   // Behavior(통계) 처리 및 전송
   // --------------------------------------------------------------------------
   private async processBehaviorWindow() {
      const windowEndTs = performance.now();
      const eventsToProcess = [...this.currentWindowEvents];
      this.currentWindowEvents = []; // 새 윈도우 시작

      const startTsMs = Date.now() - (windowEndTs - this.windowStartTs); // 대략적인 절대시간
      this.windowStartTs = windowEndTs;

      const stats = this.calculateStats(eventsToProcess);

      const payload = {
         session_id: this.config.sessionId,
         device_id: this.config.deviceId,
         client_trace_id: this.config.clientTraceId,
         window: {
            start_ts_ms: startTsMs,
            end_ts_ms: Date.now(),
            window_sec: 2,
         },
         page: {
            url_path: window.location.pathname,
            referrer_path: document.referrer || null,
            time_on_page_ms: performance.now(), // 페이지 진입 후 시간
         },
         ...stats,
      };

      try {
         const res = await fetch(this.config.apiUrlBehavior, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
         });

         const data: BehaviorResponse = await res.json();
         this.handleBehaviorResponse(data, windowEndTs);
      } catch (e) {
         console.error('Behavior API Error:', e);
      }
   }

   private calculateStats(events: RawEvent[]) {
      // 마우스 통계 계산 변수들
      let moveCount = 0;
      const speeds: number[] = [];
      const accels: number[] = [];
      let totalDist = 0;
      let straightDist = 0;

      const pmEvents = events.filter(e => e.type === 'pm');
      if (pmEvents.length > 1) {
         moveCount = pmEvents.length;
         straightDist = Utils.distance(
            pmEvents[0].x!,
            pmEvents[0].y!,
            pmEvents[pmEvents.length - 1].x!,
            pmEvents[pmEvents.length - 1].y!,
         );

         for (let i = 1; i < pmEvents.length; i++) {
            const prev = pmEvents[i - 1];
            const curr = pmEvents[i];
            const dist = Utils.distance(prev.x!, prev.y!, curr.x!, curr.y!);
            const dt = (curr.t - prev.t) / 1000; // 초 단위
            if (dt > 0) {
               const speed = dist / dt;
               speeds.push(speed);
               totalDist += dist;
               if (speeds.length > 1) {
                  accels.push((speed - speeds[speeds.length - 2]) / dt);
               }
            }
         }
      }

      const clickEvents = events.filter(e => e.type === 'cl');
      const scrollEvents = events.filter(e => e.type === 'sc');

      // Idle 비율 (가장 단순한 형태: 이벤트가 아예 없던 시간 비율)
      const idleRatio = pmEvents.length < 2 ? 1.0 : 0.1; // 정교한 로직 필요시 고도화

      return {
         mouse: {
            move_count: moveCount,
            speed_avg: Utils.avg(speeds),
            speed_std: Utils.std(speeds),
            speed_p95: Utils.p95(speeds),
            speed_max: Utils.max(speeds),
            accel_avg: Utils.avg(accels),
            accel_std: Utils.std(accels),
            curvature_avg: totalDist > 0 ? straightDist / totalDist : 0, // 1에 가까울수록 직선
            curvature_std: 0,
            direction_change_rate: 0, // 고도화 필요
            idle_ratio: idleRatio,
         },
         click: {
            count: clickEvents.length,
            interval_avg_ms: null,
            interval_std_ms: null,
            interval_p95_ms: null,
            double_click_ratio: 0,
            click_to_move_ratio: 0,
         },
         scroll: {
            count: scrollEvents.length,
            velocity_avg: null,
            velocity_std: null,
            burst_score: scrollEvents.length > 5 ? 1 : 0,
         },
         keyboard: {
            key_event_count: 0,
            interval_avg_ms: null,
            interval_std_ms: null,
            paste_count: 0,
            paste_ratio: 0,
         },
         focus: {
            visibility_hidden_count: events.filter(e => e.type === 'vc' && e.v === 0).length,
            focus_lost_count: events.filter(e => e.type === 'fb' && e.v === 0).length,
            tab_switch_suspect_score: 0,
         },
      };
   }

   // --------------------------------------------------------------------------
   // 고위험 판단 및 Raw Capture 로직
   // --------------------------------------------------------------------------
   private handleBehaviorResponse(response: BehaviorResponse, currentTs: number) {
      if (response.risk_feedback?.raw_capture?.enabled) {
         const capturePolicy = response.risk_feedback.raw_capture;

         // 포함해야 할 미래 시간(include_next_sec)만큼 대기 후 링버퍼 추출
         const waitMs = capturePolicy.include_next_sec * 1000;

         setTimeout(() => {
            this.executeRawCapture(
               currentTs,
               capturePolicy.include_prev_sec,
               capturePolicy.include_next_sec,
               capturePolicy.downsample_hz,
            );
         }, waitMs);
      }
   }

   private async executeRawCapture(triggerTs: number, prevSec: number, nextSec: number, downsampleHz: number) {
      const startT = triggerTs - prevSec * 1000;
      const endT = triggerTs + nextSec * 1000;

      // 링버퍼에서 지정된 범위 및 다운샘플링된 이벤트 추출
      const rawEvents = this.ringBuffer.extract(startT, endT, downsampleHz);

      const payload = {
         session_id: this.config.sessionId,
         device_id: this.config.deviceId,
         client_trace_id: this.config.clientTraceId,
         capture: {
            start_ts_ms: Date.now() - (performance.now() - startT),
            end_ts_ms: Date.now() - (performance.now() - endT),
            downsample_hz: downsampleHz,
         },
         events: rawEvents.map(e => ({
            t_ms: e.t,
            type: e.type,
            ...(e.x !== undefined && { x: e.x }),
            ...(e.y !== undefined && { y: e.y }),
            ...(e.b !== undefined && { b: e.b }),
            ...(e.dx !== undefined && { dx: e.dx }),
            ...(e.dy !== undefined && { dy: e.dy }),
            ...(e.v !== undefined && { v: e.v }),
         })),
      };

      try {
         await fetch(this.config.apiUrlRaw, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(payload),
         });
      } catch {
      }
   }

   // 공통 헤더
   private getHeaders() {
      return {
         'Content-Type': 'application/json',
         'X-Device-Id': this.config.deviceId,
         'X-Client-Trace-Id': this.config.clientTraceId,
      };
   }
}
