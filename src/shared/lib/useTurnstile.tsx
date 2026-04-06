import { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          size?: 'normal' | 'compact' | 'flexible' | 'invisible';
          execution?: 'render' | 'execute';
          appearance?: 'always' | 'execute' | 'interaction-only';
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
        },
      ) => string;
      execute: (target?: string | HTMLElement) => void;
      reset: (target?: string | HTMLElement) => void;
      remove: (target?: string | HTMLElement) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileScriptPromise: Promise<void> | null = null;

const loadTurnstileScript = () => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.turnstile) {
    return Promise.resolve();
  }

  if (turnstileScriptPromise) {
    return turnstileScriptPromise;
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile 스크립트를 불러오지 못했습니다.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile 스크립트를 불러오지 못했습니다.'));
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
};

type UseTurnstileResult = {
  token: string | null;
  reset: () => void;
  execute: () => void;
  widget: JSX.Element | null;
  isConfigured: boolean;
  errorMessage: string | null;
  isVerifying: boolean;
};

export const useTurnstile = (open: boolean): UseTurnstileResult => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const localSiteKey = (import.meta.env.PUBLIC_TURNSTILE_LOCAL ?? '').trim();
  const defaultSiteKey = (import.meta.env.PUBLIC_TURNSTILE ?? '').trim();
  const siteKey = isLocalHost ? localSiteKey : defaultSiteKey;
  const isConfigured = siteKey.length > 0;

  const reset = () => {
    setToken(null);
    setIsVerifying(false);

    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
  };

  const execute = () => {
    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }

    setToken(null);
    setErrorMessage(null);
    setIsVerifying(true);
    window.turnstile.execute(widgetIdRef.current);
  };

  useEffect(() => {
    if (!isConfigured) {
      setErrorMessage(
        isLocalHost
          ? 'localhost 환경에서는 PUBLIC_TURNSTILE_LOCAL 환경변수를 설정해주세요.'
          : 'PUBLIC_TURNSTILE 환경변수를 확인해주세요.',
      );
      return;
    }

    let cancelled = false;

    const mountWidget = async () => {
      try {
        await loadTurnstileScript();

        if (cancelled || !containerRef.current || !window.turnstile || widgetIdRef.current) {
          return;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: 'normal',
          execution: 'execute',
          appearance: 'execute',
          callback: (nextToken: string) => {
            if (cancelled) return;
            setErrorMessage(null);
            setIsVerifying(false);
            setToken(nextToken);
          },
          'error-callback': (errorCode?: string) => {
            if (cancelled) return;
            setToken(null);
            setIsVerifying(false);
            setErrorMessage(`Turnstile 검증에 실패했습니다. (${errorCode ?? 'unknown'})`);
          },
          'expired-callback': () => {
            if (cancelled) return;
            setToken(null);
            setIsVerifying(false);
          },
          'timeout-callback': () => {
            if (cancelled) return;
            setToken(null);
            setIsVerifying(false);
            setErrorMessage('Turnstile 검증 시간이 초과되었습니다. 다시 시도해주세요.');
          },
        });

        if (open) {
          setIsVerifying(true);
          window.turnstile.execute(widgetIdRef.current);
        }
      } catch (error) {
        if (cancelled) return;
        setIsVerifying(false);
        setErrorMessage(error instanceof Error ? error.message : 'Turnstile 초기화에 실패했습니다.');
      }
    };

    void mountWidget();

    return () => {
      cancelled = true;
      setToken(null);

      if (!widgetIdRef.current || !window.turnstile) {
        return;
      }

      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [isConfigured, isLocalHost, open, siteKey]);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    if (!widgetIdRef.current || !window.turnstile) {
      return;
    }

    execute();
  }, [open]);

  const widget = useMemo(() => {
    if (!isConfigured) {
      return null;
    }

    return <div ref={containerRef} aria-hidden="true" className="hidden" />;
  }, [isConfigured]);

  return {
    token,
    reset,
    execute,
    widget,
    isConfigured,
    errorMessage,
    isVerifying,
  };
};
