import { http, HttpResponse } from 'msw';

type MockLoginScenario = 'normal' | 'failed_under_5' | 'failed_over_5' | 'dormant' | 'rejoining_locked';

type MockAuthSession = {
   provider: string;
   isRegistered: boolean;
   userId: string;
   mobile?: string;
   smsCode?: string;
   // authCode 패턴으로 로그인 시나리오 결정
   loginScenario?: MockLoginScenario;
};

const mockAuthSessions = new Map<string, MockAuthSession>();

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}`;
};

const encodeBase64Url = (value: string) => {
   if (typeof btoa === 'function') {
      return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
   }

   throw new Error('Base64 encoding is not available in the current environment.');
};

const buildMockAccessToken = (payload: Record<string, unknown>) => {
   const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
   const body = encodeBase64Url(JSON.stringify(payload));
   const signature = encodeBase64Url('mock-signature');

   return `${header}.${body}.${signature}`;
};

const resolveRegisteredState = (_authCode: string) => {
   // 테스트용: 항상 미가입 상태로 고정 (회원가입 플로우 테스트)
   return false;
};

// authCode 패턴으로 로그인 후 시나리오 결정
// 예: authCode에 "scenario:dormant" 포함 시 휴면 시나리오
const resolveLoginScenario = (authCode: string): MockLoginScenario => {
   if (/scenario:failed_over_5/i.test(authCode)) return 'failed_over_5';
   if (/scenario:failed_under_5/i.test(authCode)) return 'failed_under_5';
   if (/scenario:dormant/i.test(authCode)) return 'dormant';
   if (/scenario:rejoining_locked/i.test(authCode)) return 'rejoining_locked';
   return 'normal';
};

export const authHandlers = [
   http.get('/api/v1/auth/:provider/state', async ({ params }) => {
      const provider = String(params.provider ?? '').toUpperCase();

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            state: `${provider}-state-token`,
         },
      });
   }),

   http.post('/api/v1/auth/:provider/social/verify', async ({ params, request }) => {
      const provider = String(params.provider ?? '').toUpperCase();
      const body = (await request.json()) as {
         authCode?: string;
         state?: string;
      };

      const requiresState = provider === 'NAVER' || provider === 'GOOGLE';

      if (!body?.authCode || (requiresState && !body?.state)) {
         return HttpResponse.json({ message: 'Missing social verify fields.' }, { status: 400 });
      }

      const socialVerifyToken = createId('svt');
      const isRegistered = resolveRegisteredState(body.authCode);
      const userId = createId('user');
      const loginScenario = isRegistered ? resolveLoginScenario(body.authCode) : undefined;

      mockAuthSessions.set(socialVerifyToken, {
         provider,
         isRegistered,
         userId,
         loginScenario,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            isRegistered,
            socialVerifyToken,
         },
      });
   }),

   http.post('/api/v1/auth/login', async ({ request }) => {
      const body = (await request.json()) as { socialVerifyToken?: string };

      if (!body?.socialVerifyToken) {
         return HttpResponse.json({ message: 'Missing social verify token.' }, { status: 400 });
      }

      const session = mockAuthSessions.get(body.socialVerifyToken);

      if (!session) {
         return HttpResponse.json({ message: 'Invalid social verify token.' }, { status: 401 });
      }

      if (!session.isRegistered) {
         return HttpResponse.json({ message: 'Signup is required for this account.' }, { status: 409 });
      }

      const scenario = session.loginScenario ?? 'normal';
      const failCountByScenario: Record<string, number | undefined> = {
         failed_under_5: 3,
         failed_over_5: 5,
      };

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               provider: session.provider,
            }),
            ...(scenario !== 'normal' && { accountStatus: scenario }),
            ...(failCountByScenario[scenario] !== undefined && { failCount: failCountByScenario[scenario] }),
         },
      });
   }),

   http.post('/api/v1/auth/signup/sms/send', async ({ request }) => {
      const body = (await request.json()) as {
         socialVerifyToken?: string;
         mobile?: string;
      };

      if (!body?.socialVerifyToken || !body?.mobile) {
         return HttpResponse.json({ message: 'Missing sms send fields.' }, { status: 400 });
      }

      const session = mockAuthSessions.get(body.socialVerifyToken);

      if (!session) {
         return HttpResponse.json({ message: 'Invalid social verify token.' }, { status: 401 });
      }

      if (session.isRegistered) {
         return HttpResponse.json({ message: 'Existing member does not require signup SMS.' }, { status: 409 });
      }

      const smsCode = '123456';
      mockAuthSessions.set(body.socialVerifyToken, {
         ...session,
         mobile: body.mobile,
         smsCode,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: smsCode,
      });
   }),

   http.post('/api/v1/auth/signup', async ({ request }) => {
      const body = (await request.json()) as {
         socialVerifyToken?: string;
         name?: string;
         gender?: string;
         mobile?: string;
         birthDate?: string;
         authCode?: string;
      };

      if (!body?.socialVerifyToken || !body?.name || !body?.gender || !body?.mobile || !body?.birthDate || !body?.authCode) {
         return HttpResponse.json({ message: 'Missing signup fields.' }, { status: 400 });
      }

      const session = mockAuthSessions.get(body.socialVerifyToken);

      if (!session) {
         return HttpResponse.json({ message: 'Invalid social verify token.' }, { status: 401 });
      }

      if (session.isRegistered) {
         return HttpResponse.json({ message: 'This account is already registered.' }, { status: 409 });
      }

      if (!session.smsCode || session.smsCode !== body.authCode) {
         return HttpResponse.json({ message: 'Invalid SMS verification code.' }, { status: 400 });
      }

      mockAuthSessions.set(body.socialVerifyToken, {
         ...session,
         isRegistered: true,
         mobile: body.mobile,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               mobile: body.mobile,
               name: body.name,
            }),
         },
      });
   }),
];
