// 추적할 마우스 움직임 데이터 타입
interface MouseMovement {
   x: number;
   y: number;
   time: number;
}

// 봇 탐지 리포트 반환 타입
export interface BotReport {
   totalScore: number;
   riskLevel: string;
   detectedReasons: string[];
   timestamp: number;
}

export class BotDetector {
   private score: number = 0;
   private reasons: string[] = [];
   private clicks: number[] = [];
   private seatClicks: Record<string, number> = {};
   private mouseMovements: MouseMovement[] = [];
   private queueClearTime: number = Date.now();

   // 이벤트 리스너 함수 참조를 위한 프로퍼티
   private handleMouseMove!: (e: MouseEvent) => void;
   private handleClick!: (e: MouseEvent) => void;

   constructor() {
      this.initBehaviorTracking();
   }

   private evaluateBrowserMetrics(): void {
      if (navigator.webdriver) {
         this.addScore(50, 'webdriver=true 감지됨');
      }
      if (navigator.plugins.length === 0) {
         this.addScore(20, '플러그인 개수 0개 (자동화 브라우저 의심)');
      }
      if (!navigator.languages || navigator.languages.length === 0) {
         this.addScore(15, '언어 설정 없음');
      }
      if (navigator.userAgent.toLowerCase().includes('headless')) {
         this.addScore(30, 'UserAgent 내 Headless 감지됨');
      }
      const devtoolsOpen = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
      if (devtoolsOpen) {
         this.addScore(40, 'DevTools 활성화 의심');
      }
   }

   private initBehaviorTracking(): void {
      this.handleMouseMove = (e: MouseEvent) => {
         if (this.mouseMovements.length > 50) this.mouseMovements.shift();
         this.mouseMovements.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      };

      this.handleClick = (e: MouseEvent) => {
         const now = Date.now();

         if (this.clicks.length === 0 && now - this.queueClearTime < 100) {
            this.addScore(25, '대기열 통과 직후 0.1초 내 비정상적 빠른 클릭');
         }

         if (this.clicks.length > 0) {
            const lastClickTime = this.clicks[this.clicks.length - 1];
            if (now - lastClickTime < 200) {
               this.addScore(30, '클릭 간격 200ms 미만 (매크로 의심)');
            }
         }
         this.clicks.push(now);

         // TypeScript에서는 EventTarget에 기본적으로 id나 getAttribute가 없으므로 HTMLElement로 타입 단언 필요
         const target = e.target as HTMLElement;
         const targetId = target?.id || target?.getAttribute('data-seat');

         if (targetId) {
            this.seatClicks[targetId] = (this.seatClicks[targetId] || 0) + 1;
            if (this.seatClicks[targetId] === 3) {
               this.addScore(30, `동일 좌석(${targetId}) 3회 이상 반복 클릭`);
            }
         }
      };

      window.addEventListener('mousemove', this.handleMouseMove);
      window.addEventListener('click', this.handleClick);
   }

   private evaluateMouseBehavior(): void {
      if (this.mouseMovements.length > 10) {
         const isLinearOrInstant = false; // 실제 직선/순간이동 알고리즘 적용 필요
         if (isLinearOrInstant) {
            this.addScore(20, '마우스 움직임 일정 패턴/직선 이동 감지');
         }
      }
   }

   private addScore(points: number, reason: string): void {
      this.score += points;
      this.reasons.push(reason);
   }

   public generateReport(): BotReport {
      this.evaluateBrowserMetrics();
      this.evaluateMouseBehavior();

      return {
         totalScore: this.score,
         riskLevel: this.getRiskLevel(),
         detectedReasons: this.reasons,
         timestamp: Date.now(),
      };
   }

   private getRiskLevel(): string {
      if (this.score <= 30) return '🟢 Pass';
      if (this.score <= 60) return '🟡 Delay';
      if (this.score <= 85) return '🟠 Temporary Restriction';
      return '🔴 Block';
   }

   public cleanup(): void {
      window.removeEventListener('mousemove', this.handleMouseMove);
      window.removeEventListener('click', this.handleClick);
   }
}
