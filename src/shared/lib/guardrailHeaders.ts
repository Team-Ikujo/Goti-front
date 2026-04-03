import { AxiosHeaders, type AxiosRequestConfig } from 'axios';

export const GUARDRAIL_HEADER_NAME = 'X-GR-BS';

export type GuardrailBrowserSignals = {
   webdriver: boolean;
   pluginsCount: number;
   languagesCount: number;
   userAgentHeadless: boolean;
   devtoolsProtocolDetected: boolean;
};

const DEFAULT_BROWSER_SIGNALS: GuardrailBrowserSignals = {
   webdriver: false,
   pluginsCount: 0,
   languagesCount: 0,
   userAgentHeadless: false,
   devtoolsProtocolDetected: false,
};

const toBooleanHeaderValue = (value: boolean) => (value ? '1' : '0');

const detectDevtoolsProtocol = () => {
   if (typeof window === 'undefined') {
      return false;
   }

   // 현재 요구사항 문서에는 "DevTools Protocol 감지"만 정의되어 있고
   // 구체적인 브라우저별 탐지 방식은 명시되지 않았다.
   // 프론트에서는 기존 코드의 휴리스틱을 유지해 서버 분석 신호로만 전달한다.
   return window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
};

export const getGuardrailBrowserSignals = (): GuardrailBrowserSignals => {
   if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return DEFAULT_BROWSER_SIGNALS;
   }

   return {
      webdriver: Boolean(navigator.webdriver),
      pluginsCount: navigator.plugins?.length ?? 0,
      languagesCount: navigator.languages?.length ?? 0,
      userAgentHeadless: navigator.userAgent.toLowerCase().includes('headless'),
      devtoolsProtocolDetected: detectDevtoolsProtocol(),
   };
};

export const createGuardrailHeaders = (): Record<string, string> => {
   const signals = getGuardrailBrowserSignals();

   return {
      // 순서: webdriver, pluginsCount, languagesCount, userAgentHeadless, devtoolsProtocolDetected
      [GUARDRAIL_HEADER_NAME]: [
         toBooleanHeaderValue(signals.webdriver),
         String(signals.pluginsCount),
         String(signals.languagesCount),
         toBooleanHeaderValue(signals.userAgentHeadless),
         toBooleanHeaderValue(signals.devtoolsProtocolDetected),
      ].join(','),
   };
};

export const applyGuardrailHeadersToAxiosConfig = (config: AxiosRequestConfig) => {
   const nextHeaders = AxiosHeaders.from(config.headers);
   const guardrailHeaders = createGuardrailHeaders();

   for (const [headerName, headerValue] of Object.entries(guardrailHeaders)) {
      nextHeaders.set(headerName, headerValue);
   }

   config.headers = nextHeaders;
};
