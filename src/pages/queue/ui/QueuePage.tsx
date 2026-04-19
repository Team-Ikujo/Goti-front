import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mergeBookingEntryState, useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { useAuthStore } from '@/entities/auth/model/authStore';
import {
  enterQueue,
  getQueueGlobalStatus,
  leaveQueue,
  leaveQueueKeepalive,
  type QueueEnterResponse,
  seatEnterQueue,
} from '../api/queueApi';

/** global-status polling 간격 (CDN 1초 캐시 고려) */
const POLL_INTERVAL_MS = 2000;

type QueuePhase = 'entering' | 'waiting' | 'checking' | 'error';

const queuedEnterResponses = new Map<string, QueueEnterResponse>();
const queuedEnterPromises = new Map<string, Promise<QueueEnterResponse>>();
const pendingLeaveTimeoutIds = new Map<string, number>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatRank = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

const clearPendingLeave = (gameId: string) => {
  const timeoutId = pendingLeaveTimeoutIds.get(gameId);

  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    pendingLeaveTimeoutIds.delete(gameId);
  }
};

const clearQueuedEntryCache = (gameId: string) => {
  queuedEnterResponses.delete(gameId);
  queuedEnterPromises.delete(gameId);
};

const getOrCreateQueueEntry = (gameId: string) => {
  const cachedResponse = queuedEnterResponses.get(gameId);

  if (cachedResponse) {
    return Promise.resolve(cachedResponse);
  }

  const pendingPromise = queuedEnterPromises.get(gameId);

  if (pendingPromise) {
    return pendingPromise;
  }

  const createdPromise = enterQueue(gameId).then((response) => {
    queuedEnterResponses.set(gameId, response);
    queuedEnterPromises.delete(gameId);
    return response;
  }).catch((error) => {
    queuedEnterPromises.delete(gameId);
    throw error;
  });

  queuedEnterPromises.set(gameId, createdPromise);
  return createdPromise;
};

const scheduleQueueLeave = (gameId: string) => {
  clearPendingLeave(gameId);

  const timeoutId = window.setTimeout(() => {
    pendingLeaveTimeoutIds.delete(gameId);
    clearQueuedEntryCache(gameId);
    void leaveQueue(gameId).catch(() => {});
  }, 300);

  pendingLeaveTimeoutIds.set(gameId, timeoutId);
};

const getHttpStatus = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response?: { status?: unknown } }).response !== null
  ) {
    const status = (error as { response?: { status?: unknown } }).response?.status;
    return typeof status === 'number' ? status : null;
  }

  return null;
};

const QueueIllustration = () => {
  const [animationData, setAnimationData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnimation = async () => {
      const response = await fetch('/animation/queueAnimation.json');

      if (!response.ok) {
        throw new Error('queueAnimation.json을 불러오지 못했습니다.');
      }

      const data = (await response.json()) as Record<string, unknown>;

      if (isMounted) {
        setAnimationData(data);
      }
    };

    void loadAnimation().catch(() => {
      if (isMounted) {
        setAnimationData(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div aria-hidden="true" className="flex h-[216px] w-[335px] items-center justify-center">
      {animationData ? (
        <Lottie
          animationData={animationData}
          autoplay
          loop
          className="h-full w-full"
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
      ) : (
        <div className="h-full w-full animate-pulse rounded-[120px] bg-[linear-gradient(180deg,#ddecff_0%,#cfe0fb_100%)]" />
      )}
    </div>
  );
};

// 영상 촬영용 임시 데모 모드. /queue?demo=1 로 접근 시 가짜 카운트다운이 동작한다.
// TODO(ress): 영상 촬영 후 revert.
// 평균 간격 ~900ms, 평균 스텝 ~140 으로 대략 10분 내외에 걸쳐 자연스럽게 감소한다.
const DEMO_INITIAL_QUEUE_MIN = 94_500;
const DEMO_INITIAL_QUEUE_MAX = 95_500;
const DEMO_TICK_MIN_MS = 500;
const DEMO_TICK_MAX_MS = 1_300;
const DEMO_STEP_MIN = 20;
const DEMO_STEP_MAX = 260;
// 가끔 짧게 멈춘 듯한 리듬을 주기 위한 pause tick 확률 / 지속 시간.
const DEMO_PAUSE_PROBABILITY = 0.08;
const DEMO_PAUSE_MIN_MS = 1_800;
const DEMO_PAUSE_MAX_MS = 3_200;

const pickBetween = (min: number, max: number) => min + Math.random() * (max - min);

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeBookingEntryState = location.state as BookingEntryState | null;
  const storedBookingEntryState = useBookingEntryStore(state => state.entry);
  const setBookingEntry = useBookingEntryStore(state => state.setEntry);
  const patchEntry = useBookingEntryStore(state => state.patchEntry);
  const hasHydrated = useAuthStore(state => state.hasHydrated);
  const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
  const bookingEntryState = useMemo(
    () => mergeBookingEntryState(routeBookingEntryState, storedBookingEntryState),
    [routeBookingEntryState, storedBookingEntryState],
  );
  const bookingFlowMode = bookingEntryState?.bookingFlowMode ?? 'standard';
  // 데모 모드 플래그는 DemoModeController(전역) 에서 sessionStorage 에 저장한다.
  // 여기서는 값만 읽어 같은 탭 내에서 예매 버튼 경유로 /queue 에 도달해도 동일하게 적용.
  const isFakeDemo = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('queue-demo-mode') === '1';
  }, [location.pathname]);

  const [phase, setPhase] = useState<QueuePhase>('entering');
  const [queueToken, setQueueToken] = useState<string | null>(bookingEntryState?.queueTokenJti ?? null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [currentAllowedRank, setCurrentAllowedRank] = useState<number | null>(null);
  const [, setPublishedRank] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gameId = bookingEntryState?.gameId ?? '';
  // 입장 허용 전 언마운트 시에만 leave 호출을 위한 플래그
  const admittedRef = useRef(false);
  const seatEnterInFlightRef = useRef(false);

  // location.state → store 동기화
  useEffect(() => {
    if (routeBookingEntryState) {
      setBookingEntry(routeBookingEntryState);
    }
  }, [routeBookingEntryState, setBookingEntry]);

  // bookingEntryState 없으면 홈으로 (데모 모드에선 가드 우회)
  useEffect(() => {
    if (isFakeDemo) return;
    if (!bookingEntryState) {
      navigate('/', { replace: true });
    }
  }, [isFakeDemo, bookingEntryState, navigate]);

  // 1단계: 대기열 진입
  useEffect(() => {
    if (isFakeDemo) return;
    if (!gameId || !hasHydrated || !hasResolvedSession) return;

    let cancelled = false;

    clearPendingLeave(gameId);

    getOrCreateQueueEntry(gameId)
      .then(res => {
        if (cancelled) return;
        setQueueToken(res.queueToken);
        setQueueNumber(res.queueNumber);
        patchEntry({
          queueTokenJti: res.queueToken,
        });
        setPhase('waiting');
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMessage('대기열 진입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, hasHydrated, hasResolvedSession, isFakeDemo]);

  // 언마운트 시 대기열 이탈 (입장 허용 전에만)
  // cleanup에서는 apiClient 사용 (MSW 가로채기 가능)
  // 실제 페이지 닫기(beforeunload)에서는 keepalive fetch 사용
  useEffect(() => {
    if (isFakeDemo) return;
    if (!gameId) return;

    const handleBeforeUnload = () => {
      if (!admittedRef.current) {
        clearPendingLeave(gameId);
        clearQueuedEntryCache(gameId);
        leaveQueueKeepalive(gameId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      if (!admittedRef.current) {
        scheduleQueueLeave(gameId);
      }
    };
  }, [gameId, isFakeDemo]);

  // 2단계: 실시간 대기열 상태 polling
  useEffect(() => {
    if (isFakeDemo) return;
    if (phase !== 'waiting' || !gameId || queueNumber === null) return;

    const poll = async () => {
      try {
        const status = await getQueueGlobalStatus(gameId);
        setCurrentAllowedRank(status.currentAllowedRank);
        setPublishedRank(status.publishedRank);

        // publishedRank까지는 선입장 후보군으로 보고 최종 입장 API로 재검증한다.
        if (queueNumber <= status.publishedRank) {
          setPhase('checking');
        }
      } catch {
      }
    };

    void poll();
    const timerId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [phase, gameId, queueNumber, isFakeDemo]);

  // 3단계: 최종 입장 시도
  useEffect(() => {
    if (isFakeDemo) return;
    if (phase !== 'checking' || !gameId || !queueToken || !hasHydrated || !hasResolvedSession) return;
    if (seatEnterInFlightRef.current) return;

    let cancelled = false;
    seatEnterInFlightRef.current = true;

    seatEnterQueue(gameId, queueToken)
      .then(res => {
        if (cancelled) return;

        if (res.enterAllowed) {
          admittedRef.current = true;
          clearPendingLeave(gameId);
          clearQueuedEntryCache(gameId);
          // queue 최종 입장 이후에는 예매 세션을 새로 열어 선행 API를 다시 호출한다.
          const nextBookingEntryState = {
            ...bookingEntryState,
            queueTokenJti: queueToken,
            forceNewSession: true,
            bookingZones: undefined,
          } satisfies BookingEntryState;

          patchEntry(nextBookingEntryState);
          const nextPathname = bookingFlowMode === 'resell' ? '/resell-books' : '/books';
          navigate(
            { pathname: nextPathname },
            { replace: true, state: nextBookingEntryState },
          );
        } else if (res.status === 'EXPIRED') {
          setErrorMessage('대기 시간이 만료되었습니다. 다시 시도해 주세요.');
          setPhase('error');
        } else {
          // 아직 입장 불가 → 다시 polling
          setPhase('waiting');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (getHttpStatus(err) === 409) {
          clearPendingLeave(gameId);
          clearQueuedEntryCache(gameId);
          setErrorMessage('이전 예매 세션과 충돌했습니다. 다시 예매를 시작해 주세요.');
          setPhase('error');
          return;
        }

        setPhase('waiting');
      })
      .finally(() => {
        seatEnterInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [phase, gameId, queueToken, patchEntry, navigate, bookingFlowMode, bookingEntryState, hasHydrated, hasResolvedSession, isFakeDemo]);

  // 영상 촬영용 데모 카운트다운: 95000 근처에서 시작해 랜덤 간격/스텝으로 0까지 감소.
  // 실제 API는 호출하지 않고 순수 UI 시뮬레이션만 수행한다.
  useEffect(() => {
    if (!isFakeDemo) return;

    const initialNumber = Math.round(pickBetween(DEMO_INITIAL_QUEUE_MIN, DEMO_INITIAL_QUEUE_MAX));
    setPhase('waiting');
    setQueueToken('demo-token');
    setQueueNumber(initialNumber);
    setCurrentAllowedRank(0);

    let allowed = 0;
    let timerId: number | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      // 가끔은 스텝 없이 조금 쉬어가는 pause — 시각적으로 "멈춘 듯"한 긴장감 연출.
      const isPause = Math.random() < DEMO_PAUSE_PROBABILITY;

      if (!isPause) {
        const step = Math.round(pickBetween(DEMO_STEP_MIN, DEMO_STEP_MAX));
        allowed = Math.min(allowed + step, initialNumber);
        setCurrentAllowedRank(allowed);
      }

      if (allowed >= initialNumber) {
        return;
      }

      const nextDelay = isPause
        ? pickBetween(DEMO_PAUSE_MIN_MS, DEMO_PAUSE_MAX_MS)
        : pickBetween(DEMO_TICK_MIN_MS, DEMO_TICK_MAX_MS);

      timerId = window.setTimeout(tick, nextDelay);
    };

    timerId = window.setTimeout(tick, 800);

    return () => {
      cancelled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
    };
  }, [isFakeDemo]);

  // 표시할 대기 순서: 내 순번 - 현재 실제 허용 순번
  const displayRank = useMemo(() => {
    if (queueNumber === null || currentAllowedRank === null) return null;
    return Math.max(0, queueNumber - currentAllowedRank);
  }, [currentAllowedRank, queueNumber]);

  // 진행률은 캐시용 공개 순번이 아니라 실제 허용 순번 기준으로 계산한다.
  const progress = useMemo(() => {
    if (queueNumber === null || queueNumber === 0) return 0;
    if (currentAllowedRank === null) return 0;
    return clamp((currentAllowedRank / queueNumber) * 100, 0, 100);
  }, [currentAllowedRank, queueNumber]);

  if (!isFakeDemo && !bookingEntryState) return null;

  if (phase === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background-base)] px-6 text-[var(--text-primary)]">
        <section className="flex w-full max-w-[420px] flex-col items-center gap-6 text-center">
          <p className="text-[18px] font-semibold">{errorMessage}</p>
          <button
            className="rounded-xl bg-[var(--primary-normal)] px-6 py-3 text-white"
            onClick={() => navigate(-1)}
          >
            돌아가기
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[var(--background-base)] px-6 py-10 text-[var(--text-primary)]">
      <section className="m-auto flex w-full max-w-[420px] flex-col items-center justify-center gap-10">
        <header className="flex flex-col items-center gap-4">
          <h1 className="text-center text-[32px] leading-[1.45] font-bold tracking-[-0.032px]">
            접속자가 많아 잠시 대기 중이에요
          </h1>
          <QueueIllustration />
        </header>

        <div className="flex w-full flex-col items-center gap-5">
          <div className="flex flex-col items-center">
            <p className="text-center text-[22px] leading-[1.55] font-semibold text-[var(--text-tertiary)]">
              나의 대기 순서
            </p>
            <p className="flex items-center gap-1 text-center">
              <strong className="text-[48px] leading-[1.33] font-bold tracking-[-0.048px] text-[var(--primary-normal)]">
                {phase === 'entering' || displayRank === null
                  ? '-'
                  : formatRank(displayRank)}
              </strong>
              <span className="pt-3 text-[24px] leading-[1.5] font-semibold text-[var(--text-tertiary)]">번째</span>
            </p>
          </div>

          <div
            aria-label={`현재 대기 진행률 ${Math.round(progress)}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={Math.round(progress)}
            className="h-4 w-full overflow-hidden rounded-full bg-[var(--neutral-200)]"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(135deg,#6ca4f8_0%,#2563eb_100%)] transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <p className="text-center text-[16px] leading-[1.5] font-medium text-[var(--text-tertiary)]">
          순서에 따라 예매 페이지로 연결되며,
          <br />
          새로고침 및 재접속 시 대기 순서가 다시 부여되니 유의해주세요.
        </p>
      </section>
    </main>
  );
};

export default QueuePage;
