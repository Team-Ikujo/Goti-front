import { http, HttpResponse } from 'msw';

type MockLoginScenario = 'normal' | 'failed_under_5' | 'failed_over_5' | 'dormant' | 'rejoining_locked';

type MockAuthSession = {
   provider: string;
   isRegistered: boolean;
   userId: string;
   email?: string;
   name?: string;
   mobile?: string;
   smsCode?: string;
   // authCode 패턴으로 로그인 시나리오 결정
   loginScenario?: MockLoginScenario;
};

type MockRefreshSession = {
   userId: string;
   provider: string;
   email?: string;
   name?: string;
   mobile?: string;
};

type MockRegisteredMember = {
   userId: string;
   provider: string;
   email: string;
   name: string;
   mobile: string;
};

type MockMemberAccount = {
   accountId: string;
   accountNumber: string;
   bankName: string;
   accountHolder: string;
};

type MockMemberAddress = {
   addressId: string;
   zipCode: string;
   baseAddress: string;
   detailAddress: string;
};

// 팝업 창과 부모 창 간 세션 공유를 위해 localStorage 사용
const MOCK_AUTH_SESSIONS_KEY = '__mock_auth_sessions__';
const MOCK_REFRESH_SESSION_KEY = '__mock_refresh_session__';
const MOCK_MEMBER_ACCOUNTS_KEY = '__mock_member_accounts__';
const MOCK_MEMBER_ADDRESSES_KEY = '__mock_member_addresses__';
const MOCK_REGISTERED_MEMBERS_KEY = '__mock_registered_members__';

const mockAuthSessions = {
   get(token: string): MockAuthSession | undefined {
      try {
         const raw = localStorage.getItem(MOCK_AUTH_SESSIONS_KEY);
         const map: Record<string, MockAuthSession> = raw ? JSON.parse(raw) : {};
         return map[token];
      } catch {
         return undefined;
      }
   },
   set(token: string, session: MockAuthSession) {
      try {
         const raw = localStorage.getItem(MOCK_AUTH_SESSIONS_KEY);
         const map: Record<string, MockAuthSession> = raw ? JSON.parse(raw) : {};
         map[token] = session;
         localStorage.setItem(MOCK_AUTH_SESSIONS_KEY, JSON.stringify(map));
      } catch {
         // ignore
      }
   },
};

const mockRefreshSession = {
   get(): MockRefreshSession | undefined {
      try {
         const raw = localStorage.getItem(MOCK_REFRESH_SESSION_KEY);
         return raw ? (JSON.parse(raw) as MockRefreshSession) : undefined;
      } catch {
         return undefined;
      }
   },
   set(session: MockRefreshSession) {
      try {
         localStorage.setItem(MOCK_REFRESH_SESSION_KEY, JSON.stringify(session));
      } catch {
         // ignore
      }
   },
   clear() {
      try {
         localStorage.removeItem(MOCK_REFRESH_SESSION_KEY);
      } catch {
         // ignore
      }
   },
};

const mockMemberAccounts = {
   get(memberKey: string): MockMemberAccount | undefined {
      try {
         const raw = localStorage.getItem(MOCK_MEMBER_ACCOUNTS_KEY);
         const map: Record<string, MockMemberAccount> = raw ? JSON.parse(raw) : {};
         return map[memberKey];
      } catch {
         return undefined;
      }
   },
   set(memberKey: string, account: MockMemberAccount) {
      try {
         const raw = localStorage.getItem(MOCK_MEMBER_ACCOUNTS_KEY);
         const map: Record<string, MockMemberAccount> = raw ? JSON.parse(raw) : {};
         map[memberKey] = account;
         localStorage.setItem(MOCK_MEMBER_ACCOUNTS_KEY, JSON.stringify(map));
      } catch {
         // ignore
      }
   },
};

const mockMemberAddresses = {
   get(memberKey: string): MockMemberAddress | undefined {
      try {
         const raw = localStorage.getItem(MOCK_MEMBER_ADDRESSES_KEY);
         const map: Record<string, MockMemberAddress> = raw ? JSON.parse(raw) : {};
         return map[memberKey];
      } catch {
         return undefined;
      }
   },
   set(memberKey: string, address: MockMemberAddress) {
      try {
         const raw = localStorage.getItem(MOCK_MEMBER_ADDRESSES_KEY);
         const map: Record<string, MockMemberAddress> = raw ? JSON.parse(raw) : {};
         map[memberKey] = address;
         localStorage.setItem(MOCK_MEMBER_ADDRESSES_KEY, JSON.stringify(map));
      } catch {
         // ignore
      }
   },
};

const mockRegisteredMembers = {
   get(provider: string): MockRegisteredMember | undefined {
      try {
         const raw = localStorage.getItem(MOCK_REGISTERED_MEMBERS_KEY);
         const map: Record<string, MockRegisteredMember> = raw ? JSON.parse(raw) : {};
         return map[provider.toUpperCase()];
      } catch {
         return undefined;
      }
   },
   set(provider: string, member: MockRegisteredMember) {
      try {
         const raw = localStorage.getItem(MOCK_REGISTERED_MEMBERS_KEY);
         const map: Record<string, MockRegisteredMember> = raw ? JSON.parse(raw) : {};
         map[provider.toUpperCase()] = member;
         localStorage.setItem(MOCK_REGISTERED_MEMBERS_KEY, JSON.stringify(map));
      } catch {
         // ignore
      }
   },
};

const createId = (prefix: string) => {
   if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
   }

   return `${prefix}-${Date.now()}`;
};

const encodeBase64Url = (value: string) => {
   // encodeURIComponent로 유니코드(한글 등)를 Latin1 범위로 변환 후 btoa
   const latin1 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
   );
   return btoa(latin1).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const buildMockAccessToken = (payload: Record<string, unknown>) => {
   const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
   const body = encodeBase64Url(JSON.stringify(payload));
   const signature = encodeBase64Url('mock-signature');

   return `${header}.${body}.${signature}`;
};

const parseMockTokenPayload = (token: string): Record<string, string> | null => {
   if (!token) {
      return null;
   }

   try {
      const payloadB64 = token.split('.')[1] ?? '';
      return JSON.parse(
         decodeURIComponent(
            atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
               .split('')
               .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
               .join(''),
         ),
      ) as Record<string, string>;
   } catch {
      return null;
   }
};

const getMockMemberKey = (request: Request) => {
   const authHeader = request.headers.get('Authorization') ?? '';
   const token = authHeader.replace(/^Bearer\s+/i, '');
   const decoded = parseMockTokenPayload(token);

   return decoded?.userId || decoded?.sub || decoded?.email || 'guest';
};

const resolveRegisteredState = (authCode: string) => {
   return !/(signup|register|join|new)/i.test(authCode);
};

const resolveLoginScenario = (): MockLoginScenario => 'normal';

const DEFAULT_PROVIDER_PROFILE: Record<string, Omit<MockRegisteredMember, 'provider'>> = {
   KAKAO: {
      userId: 'mock-kakao-user',
      email: 'kakao.user@goti.co.kr',
      name: '카카오 사용자',
      mobile: '010-2222-2222',
   },
   GOOGLE: {
      userId: 'mock-google-user',
      email: 'google.user@goti.co.kr',
      name: '구글 사용자',
      mobile: '010-3333-3333',
   },
   NAVER: {
      userId: 'mock-naver-user',
      email: 'naver.user@goti.co.kr',
      name: '네이버 사용자',
      mobile: '010-4444-4444',
   },
};

const getDefaultRegisteredMember = (provider: string): MockRegisteredMember => {
   const upperProvider = provider.toUpperCase();
   const fallback = DEFAULT_PROVIDER_PROFILE[upperProvider] ?? {
      userId: `mock-${upperProvider.toLowerCase()}-user`,
      email: `${upperProvider.toLowerCase()}.user@goti.co.kr`,
      name: `${upperProvider} 사용자`,
      mobile: '010-9999-9999',
   };

   return {
      provider: upperProvider,
      ...fallback,
   };
};

const ensureDefaultMockRefreshSession = () => {
   const existingSession = mockRefreshSession.get();

   if (existingSession) {
      return existingSession;
   }

   const defaultMember = getDefaultRegisteredMember('KAKAO');
   const session: MockRefreshSession = {
      userId: defaultMember.userId,
      provider: defaultMember.provider,
      email: defaultMember.email,
      name: defaultMember.name,
      mobile: defaultMember.mobile,
   };

   mockRegisteredMembers.set(defaultMember.provider, defaultMember);
   mockRefreshSession.set(session);
   return session;
};

const resolveRegisteredMember = (provider: string) => {
   return mockRegisteredMembers.get(provider) ?? getDefaultRegisteredMember(provider);
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
      const registeredMember = isRegistered ? resolveRegisteredMember(provider) : null;
      const userId = registeredMember?.userId ?? createId('user');
      const loginScenario = isRegistered ? resolveLoginScenario() : undefined;

      mockAuthSessions.set(socialVerifyToken, {
         provider,
         isRegistered,
         userId,
         email: registeredMember?.email,
         name: registeredMember?.name,
         mobile: registeredMember?.mobile,
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

      mockRefreshSession.set({
         userId: session.userId,
         provider: session.provider,
         email: session.email,
         name: session.name,
         mobile: session.mobile,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               provider: session.provider,
               email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
               name: session.name ?? '테스트 유저',
               mobile: session.mobile ?? '010-0000-0000',
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
         email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
         name: body.name,
         mobile: body.mobile,
      });

      mockRegisteredMembers.set(session.provider, {
         userId: session.userId,
         provider: session.provider,
         email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
         name: body.name,
         mobile: body.mobile,
      });

      mockRefreshSession.set({
         userId: session.userId,
         provider: session.provider,
         email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
         name: body.name,
         mobile: body.mobile,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               provider: session.provider,
               email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
               mobile: body.mobile,
               name: body.name,
            }),
         },
      });
   }),

   // 내 프로필 조회 — Authorization 헤더의 JWT에서 유저 정보 파싱
   // 실제 응답: MemberDetailResponse (bankAccount, address, socialConnection 포함)
   http.get('/api/v1/members/me/summary', async ({ request }) => {
      const authHeader = request.headers.get('Authorization') ?? '';
      const token = authHeader.replace(/^Bearer\s+/i, '');

      let name = '테스트 유저';
      let mobile = '010-0000-0000';
      let email = '';

      const decoded = parseMockTokenPayload(token);
      const refreshSession = mockRefreshSession.get();

      if (decoded) {
         if (decoded.name) name = decoded.name;
         if (decoded.mobile) mobile = decoded.mobile;
         if (decoded.email) email = decoded.email;
      }
      if (refreshSession?.name) name = refreshSession.name;
      if (refreshSession?.mobile) mobile = refreshSession.mobile;
      if (refreshSession?.email) email = refreshSession.email;

      return HttpResponse.json({ code: 'SUCCESS', message: 'ok', data: { name, email, mobile } });
   }),

   http.get('/api/v1/members/me', async ({ request }) => {
      const authHeader = request.headers.get('Authorization') ?? '';
      const token = authHeader.replace(/^Bearer\s+/i, '');

      let name = '테스트 유저';
      let mobile = '010-0000-0000';
      let email = '';

      const decoded = parseMockTokenPayload(token);
      const refreshSession = mockRefreshSession.get();

      if (decoded) {
         if (decoded.name) name = decoded.name;
         if (decoded.mobile) mobile = decoded.mobile;
         if (decoded.email) email = decoded.email;
      }

      if (refreshSession?.name) {
         name = refreshSession.name;
      }

      if (refreshSession?.mobile) {
         mobile = refreshSession.mobile;
      }

      if (refreshSession?.email) {
         email = refreshSession.email;
      }

      const resolvedProvider = (decoded?.provider ?? refreshSession?.provider ?? 'GOOGLE').toUpperCase();

      const memberKey = getMockMemberKey(request);
      const account = mockMemberAccounts.get(memberKey);
      const address = mockMemberAddresses.get(memberKey);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            name,
            email,
            mobile,
            gender: 'MALE',
            birthDate: '1990-01-01',
            oAuthProvider: resolvedProvider,
            bankAccount: account
               ? { bankName: account.bankName, accountNumber: account.accountNumber, accountHolder: account.accountHolder }
               : null,
            address: address
               ? { zipCode: address.zipCode, baseAddress: address.baseAddress, detailAddress: address.detailAddress }
               : null,
            socialConnection: {
               isGoogleConnected: resolvedProvider === 'GOOGLE',
               isKakaoConnected: resolvedProvider === 'KAKAO',
               isNaverConnected: resolvedProvider === 'NAVER',
            },
         },
      });
   }),

   http.post('/api/v1/members/accounts', async ({ request }) => {
      const body = (await request.json()) as {
         accountNumber?: string;
         bankName?: string;
         accountHolder?: string;
      };

      if (!body?.accountNumber || !body?.bankName || !body?.accountHolder) {
         return HttpResponse.json({ message: 'Missing member account fields.' }, { status: 400 });
      }

      const memberKey = getMockMemberKey(request);
      const savedAccount = {
         accountId: createId('account'),
         accountNumber: body.accountNumber,
         bankName: body.bankName,
         accountHolder: body.accountHolder,
      };

      mockMemberAccounts.set(memberKey, savedAccount);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: savedAccount,
      });
   }),

   http.post('/api/v1/members/addresses', async ({ request }) => {
      const body = (await request.json()) as {
         zipCode?: string;
         baseAddress?: string;
         detailAddress?: string;
      };

      if (!body?.zipCode || !body?.baseAddress || !body?.detailAddress) {
         return HttpResponse.json({ message: 'Missing member address fields.' }, { status: 400 });
      }

      const memberKey = getMockMemberKey(request);
      const savedAddress = {
         addressId: createId('address'),
         zipCode: body.zipCode,
         baseAddress: body.baseAddress,
         detailAddress: body.detailAddress,
      };

      mockMemberAddresses.set(memberKey, savedAddress);

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: savedAddress,
      });
   }),

   http.patch('/api/v1/members/me', async ({ request }) => {
      const body = (await request.json()) as {
         mobile?: string;
         name?: string;
         gender?: 'MALE' | 'FEMALE' | 'UNKNOWN';
         birthDate?: string;
      };

      if (!body?.mobile || !body?.name || !body?.gender || !body?.birthDate) {
         return HttpResponse.json({ message: 'Missing member profile fields.' }, { status: 400 });
      }

      const session = mockRefreshSession.get();

      if (!session) {
         return HttpResponse.json({ message: 'Mock refresh session is missing.' }, { status: 401 });
      }

      mockRefreshSession.set({
         ...session,
         email: session.email,
         name: body.name,
         mobile: body.mobile,
      });

      mockRegisteredMembers.set(session.provider, {
         userId: session.userId,
         provider: session.provider,
         email: session.email ?? `${session.provider.toLowerCase()}.user@goti.co.kr`,
         name: body.name,
         mobile: body.mobile,
      });

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            mobile: body.mobile,
            name: body.name,
            gender: body.gender,
            birthDate: body.birthDate,
         },
      });
   }),

   http.post('/api/v1/auth/reissue', async () => {
      const session = ensureDefaultMockRefreshSession();

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: {
            accessToken: buildMockAccessToken({
               sub: session.userId,
               userId: session.userId,
               provider: session.provider,
               ...(session.mobile ? { mobile: session.mobile } : {}),
               ...(session.name ? { name: session.name } : {}),
            }),
         },
      });
   }),

   http.post('/api/v1/auth/logout', async () => {
      mockRefreshSession.clear();

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: null,
      });
   }),

   http.delete('/api/v1/members/me', async () => {
      mockRefreshSession.clear();

      return HttpResponse.json({
         code: 'SUCCESS',
         message: 'ok',
         data: null,
      });
   }),
];
