import { http, HttpResponse } from 'msw';

type MockAuthSession = {
   provider: string;
   isRegistered: boolean;
   userId: string;
   mobile?: string;
   smsCode?: string;
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

const resolveRegisteredState = (authCode: string) => {
   return !/(signup|register|join|new)/i.test(authCode);
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

      mockAuthSessions.set(socialVerifyToken, {
         provider,
         isRegistered,
         userId,
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

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               provider: session.provider,
            }),
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
