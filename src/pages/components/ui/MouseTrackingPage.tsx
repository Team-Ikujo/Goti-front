import { useEffect, useMemo, useRef, useState } from "react";

type TrackEventType =
  | "move"
  | "down"
  | "up"
  | "click"
  | "wheel"
  | "keydown"
  | "visibility";

type TrackEvent = {
  ts: number;
  uid: string;
  sid: string;
  seq: number;
  type: TrackEventType;
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  dt?: number;
  key?: string;
  hidden?: boolean;
};

const TRACKING_MS = 10_000;
const MAX_EVENTS = 500;
const uid = "user_demo";

const createSid = () => `session_${Math.random().toString(36).slice(2, 10)}`;

const MouseTrackingPage = () => {
  const [sid, setSid] = useState(createSid);
  const [isTracking, setIsTracking] = useState(false);
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  const stopTimerRef = useRef<number | null>(null);
  const seqRef = useRef(0);
  const lastPointRef = useRef<{ x: number; y: number; ts: number } | null>(null);
  const pendingMoveRef = useRef<{ x: number; y: number; ts: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const pushEvent = (event: Omit<TrackEvent, "uid" | "sid" | "seq">) => {
    setEvents((prev) => {
      const next: TrackEvent = {
        ...event,
        uid,
        sid,
        seq: seqRef.current++,
      };
      const merged = [...prev, next];
      return merged.length > MAX_EVENTS
        ? merged.slice(merged.length - MAX_EVENTS)
        : merged;
    });
  };

  const stopTracking = () => {
    setIsTracking(false);
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingMoveRef.current = null;
    lastPointRef.current = null;
  };

  const startTracking = () => {
    stopTracking();
    const nextSid = createSid();
    setSid(nextSid);
    setEvents([]);
    seqRef.current = 0;
    setStartedAt(Date.now());
    setIsTracking(true);
    stopTimerRef.current = window.setTimeout(() => {
      stopTracking();
    }, TRACKING_MS);
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!isTracking) {
      return;
    }

    const flushMove = () => {
      rafRef.current = null;
      const point = pendingMoveRef.current;
      if (!point) {
        return;
      }

      const prev = lastPointRef.current;
      const dx = prev ? point.x - prev.x : 0;
      const dy = prev ? point.y - prev.y : 0;
      const dt = prev ? point.ts - prev.ts : 0;
      pushEvent({
        ts: point.ts,
        type: "move",
        x: point.x,
        y: point.y,
        dx,
        dy,
        dt,
      });
      lastPointRef.current = point;
      pendingMoveRef.current = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      pendingMoveRef.current = { x: e.clientX, y: e.clientY, ts: Date.now() };
      if (!rafRef.current) {
        rafRef.current = window.requestAnimationFrame(flushMove);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pushEvent({ ts: Date.now(), type: "down", x: e.clientX, y: e.clientY });
    };

    const onPointerUp = (e: PointerEvent) => {
      pushEvent({ ts: Date.now(), type: "up", x: e.clientX, y: e.clientY });
    };

    const onClick = (e: MouseEvent) => {
      pushEvent({ ts: Date.now(), type: "click", x: e.clientX, y: e.clientY });
    };

    const onWheel = (e: WheelEvent) => {
      pushEvent({ ts: Date.now(), type: "wheel", x: e.clientX, y: e.clientY });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      pushEvent({ ts: Date.now(), type: "keydown", key: e.key });
    };

    const onVisibilityChange = () => {
      pushEvent({
        ts: Date.now(),
        type: "visibility",
        hidden: document.hidden,
      });
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("click", onClick);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isTracking, sid]);

  useEffect(() => {
    return () => stopTracking();
  }, []);

  const moveCount = useMemo(
    () => events.filter((event) => event.type === "move").length,
    [events]
  );
  const remainingMs = startedAt
    ? Math.max(0, TRACKING_MS - (now - startedAt))
    : TRACKING_MS;
  const payloadPreview = useMemo(
    () => events.slice(Math.max(events.length - 30, 0)),
    [events]
  );

  return (
    <div className="min-h-screen bg-[var(--background-surface)] p-6 text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl border border-[var(--border-normal)] bg-[var(--background-base)] p-6">
        <h1 className="text-heading-2-bold">Mouse Tracking Test (10s)</h1>
        <p className="text-body-2-regular text-[var(--text-secondary)]">
          시작 버튼을 누르면 10초 동안 마우스/키보드/가시성 이벤트를 수집합니다.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startTracking}
            disabled={isTracking}
            className="rounded-md bg-[var(--primary-normal)] px-4 py-2 text-white disabled:opacity-50"
          >
            10초 수집 시작
          </button>
          <button
            type="button"
            onClick={stopTracking}
            disabled={!isTracking}
            className="rounded-md border border-[var(--border-normal)] bg-[var(--background-base)] px-4 py-2 disabled:opacity-50"
          >
            중지
          </button>
          <button
            type="button"
            onClick={() => setEvents([])}
            className="rounded-md border border-[var(--border-normal)] bg-[var(--background-base)] px-4 py-2"
          >
            로그 비우기
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-lg border border-[var(--border-light)] p-3">
            <p className="text-caption-1-medium text-[var(--text-tertiary)]">
              상태
            </p>
            <p className="text-body-2-semibold">
              {isTracking ? "수집 중" : "대기"}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] p-3">
            <p className="text-caption-1-medium text-[var(--text-tertiary)]">
              남은 시간(ms)
            </p>
            <p className="text-body-2-semibold">{remainingMs}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] p-3">
            <p className="text-caption-1-medium text-[var(--text-tertiary)]">
              move 이벤트 수
            </p>
            <p className="text-body-2-semibold">{moveCount}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] p-3">
            <p className="text-caption-1-medium text-[var(--text-tertiary)]">
              세션 ID
            </p>
            <p className="truncate text-body-2-semibold">{sid}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-lg border border-[var(--border-light)] p-4">
            <h2 className="text-label-2-semibold">최근 이벤트 로그</h2>
            <div className="mt-3 max-h-80 overflow-auto rounded-md bg-[var(--background-surface)] p-2">
              {events.length === 0 ? (
                <p className="text-body-3-regular text-[var(--text-secondary)]">
                  아직 수집된 이벤트가 없습니다.
                </p>
              ) : (
                <ul className="space-y-1 text-[12px]">
                  {events
                    .slice(Math.max(events.length - 80, 0))
                    .map((event, index) => (
                      <li
                        key={`${event.seq}-${index}`}
                        className="rounded bg-[var(--background-base)] px-2 py-1"
                      >
                        {JSON.stringify(event)}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border-light)] p-4">
            <h2 className="text-label-2-semibold">
              서버 전송 예시 Payload (최근 30개)
            </h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-[var(--background-surface)] p-3 text-[12px]">
              {JSON.stringify(payloadPreview, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MouseTrackingPage;
