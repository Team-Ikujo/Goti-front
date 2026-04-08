import { useEffect, useMemo, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createBookingFlowSearch, getBookingFlowMode } from '@/shared/lib/booking-flow';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import apiClient from '@/shared/api/client';
import {
  enterQueue,
  getQueueGlobalStatus,
  leaveQueueKeepalive,
  seatEnterQueue,
} from '../api/queueApi';

/** global-status polling 간격 (CDN 1초 캐시 고려) */
const POLL_INTERVAL_MS = 2000;

type QueuePhase = 'entering' | 'waiting' | 'checking' | 'error';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const formatRank = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

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

const QueuePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeBookingEntryState = location.state as BookingEntryState | null;
  const storedBookingEntryState = useBookingEntryStore(state => state.entry);
  const setBookingEntry = useBookingEntryStore(state => state.setEntry);
  const patchEntry = useBookingEntryStore(state => state.patchEntry);
  const bookingEntryState = routeBookingEntryState ?? storedBookingEntryState;
  const bookingFlowMode = getBookingFlowMode(location.search);

  const [phase, setPhase] = useState<QueuePhase>('entering');
  const [queueToken, setQueueToken] = useState<string | null>(null);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [publishedRank, setPublishedRank] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const gameId = bookingEntryState?.gameId ?? '';
  // 입장 허용 전 언마운트 시에만 leave 호출을 위한 플래그
  const admittedRef = useRef(false);

  // location.state → store 동기화
  useEffect(() => {
    if (routeBookingEntryState) {
      setBookingEntry(routeBookingEntryState);
    }
  }, [routeBookingEntryState, setBookingEntry]);

  // bookingEntryState 없으면 홈으로
  useEffect(() => {
    if (!bookingEntryState) {
      navigate('/', { replace: true });
    }
  }, [bookingEntryState, navigate]);

  // 1단계: 대기열 진입
  useEffect(() => {
    if (!gameId) return;

    let cancelled = false;

    enterQueue(gameId)
      .then(res => {
        if (cancelled) return;
        setQueueToken(res.queueToken);
        setQueueNumber(res.queueNumber);
        setPhase('waiting');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('[Queue] enterQueue 실패:', err);
        setErrorMessage('대기열 진입에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [gameId]);

  // 언마운트 시 대기열 이탈 (입장 허용 전에만)
  // cleanup에서는 apiClient 사용 (MSW 가로채기 가능)
  // 실제 페이지 닫기(beforeunload)에서는 keepalive fetch 사용
  useEffect(() => {
    if (!gameId) return;

    const handleBeforeUnload = () => {
      if (!admittedRef.current) {
        leaveQueueKeepalive(gameId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (!admittedRef.current) {
        void apiClient.post(`/api/v1/queue/${encodeURIComponent(gameId)}/leave`).catch(() => {});
      }
    };
  }, [gameId]);

  // 2단계: global-status polling
  useEffect(() => {
    if (phase !== 'waiting' || !gameId || queueNumber === null) return;

    const poll = async () => {
      try {
        const status = await getQueueGlobalStatus(gameId);
        setPublishedRank(status.publishedRank);

        // 내 순번이 허용 순번 이하면 최종 입장 시도로 전환
        if (queueNumber <= status.publishedRank) {
          setPhase('checking');
        }
      } catch (err: unknown) {
        console.error('[Queue] global-status polling 실패:', err);
      }
    };

    void poll();
    const timerId = window.setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [phase, gameId, queueNumber]);

  // 3단계: 최종 입장 시도
  useEffect(() => {
    if (phase !== 'checking' || !gameId || !queueToken) return;

    let cancelled = false;

    seatEnterQueue(gameId, queueToken)
      .then(res => {
        if (cancelled) return;

        if (res.enterAllowed) {
          admittedRef.current = true;
          // 실제 queueToken을 bookingEntryState에 반영
          patchEntry({ queueTokenJti: queueToken });
          navigate(
            { pathname: '/books', search: createBookingFlowSearch(bookingFlowMode) },
            { replace: true, state: { ...bookingEntryState, queueTokenJti: queueToken } },
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
        console.error('[Queue] seatEnterQueue 실패:', err);
        setPhase('waiting');
      });

    return () => {
      cancelled = true;
    };
  }, [phase, gameId, queueToken, patchEntry, navigate, bookingFlowMode, bookingEntryState]);

  // 표시할 대기 순서: 내 순번 - 현재 허용 순번
  const displayRank = useMemo(() => {
    if (queueNumber === null || publishedRank === null) return null;
    return Math.max(0, queueNumber - publishedRank);
  }, [queueNumber, publishedRank]);

  // 진행률 (0~100%)
  const progress = useMemo(() => {
    if (queueNumber === null || queueNumber === 0) return 0;
    if (publishedRank === null) return 0;
    return clamp((publishedRank / queueNumber) * 100, 0, 100);
  }, [queueNumber, publishedRank]);

  if (!bookingEntryState) return null;

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
