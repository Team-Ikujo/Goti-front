import { http, HttpResponse } from 'msw';

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const encodeBase64Url = (value: string) => {
  const latin1 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
  return btoa(latin1).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const buildMockQueueToken = (gameId: string, queueNumber: number) => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'dir', enc: 'A256GCM' }));
  const payload = encodeBase64Url(JSON.stringify({
    jti: createId('queue'),
    gameId,
    queueNumber,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  return `${header}.${payload}.mock-queue-iv.mock-queue-ciphertext.mock-queue-tag`;
};

/** 진입 시마다 순번을 올려서 실제 대기 흐름을 흉내냄 */
let nextQueueNumber = 1;

/** publishedRank를 시간이 지날수록 올려서 대기열 소진을 흉내냄 */
const queueEntryTime = new Map<string, number>(); // gameId → enterTime(ms)

const getPublishedRank = (gameId: string) => {
  const enterTime = queueEntryTime.get(gameId) ?? Date.now();
  const elapsed = (Date.now() - enterTime) / 1000; // 초
  // 진입 후 2초 뒤 즉시 입장 허용 (테스트 목적)
  return elapsed >= 2 ? 999999 : 0;
};

export const queueHandlers = [
  http.post('/api/v1/queue/enter', async ({ request }) => {
    const body = (await request.json()) as { gameId?: string };
    const gameId = body?.gameId ?? 'unknown-game';

    const queueNumber = nextQueueNumber++;
    queueEntryTime.set(gameId, Date.now());

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        queueToken: buildMockQueueToken(gameId, queueNumber),
        queueNumber,
        gameId,
        issuedAt: new Date().toISOString(),
      },
    });
  }),

  http.get('/api/v1/queue/:gameId/global-status', ({ params }) => {
    const gameId = String(params.gameId);
    const publishedRank = getPublishedRank(gameId);

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        gameId,
        maxCapacity: 3000,
        activeCount: Math.min(publishedRank, 3000),
        availableSlots: Math.max(0, 3000 - publishedRank),
        currentAllowedRank: publishedRank,
        publishedRank,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.get('/api/v1/queue/:gameId/status', ({ params }) => {
    const gameId = String(params.gameId);
    const publishedRank = getPublishedRank(gameId);

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        gameId,
        maxCapacity: 3000,
        activeCount: Math.min(publishedRank, 3000),
        availableSlots: Math.max(0, 3000 - publishedRank),
        currentAllowedRank: publishedRank,
        publishedRank,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.post('/api/v1/queue/:gameId/seat-enter', async ({ params, request }) => {
    const gameId = String(params.gameId);
    const body = (await request.json()) as { queueToken?: string };

    if (!body?.queueToken) {
      return HttpResponse.json({ code: 'BAD_REQUEST', message: 'queueToken is required' }, { status: 400 });
    }

    const publishedRank = getPublishedRank(gameId);
    // queueToken 페이로드에서 queueNumber 파싱
    const payloadB64 = body.queueToken.split('.')[1] ?? '';
    let queueNumber = 0;
    try {
      const decoded = JSON.parse(
        decodeURIComponent(
          atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(''),
        ),
      ) as { queueNumber?: number };
      queueNumber = decoded.queueNumber ?? 0;
    } catch {
      // 파싱 실패 시 즉시 입장 허용
    }

    const enterAllowed = queueNumber <= publishedRank;

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        gameId,
        enterAllowed,
        queueNumber,
        status: enterAllowed ? 'ADMITTED' : 'WAITING',
      },
    });
  }),

  http.post('/api/v1/queue/:gameId/leave', ({ params }) => {
    const gameId = String(params.gameId);
    queueEntryTime.delete(gameId);

    return HttpResponse.json({
      code: 'SUCCESS',
      message: 'ok',
      data: {
        gameId,
        released: true,
        status: 'LEFT',
      },
    });
  }),
];
