import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { LoginAccountStatus } from "@/features/auth/api/authApi";

export type LoginAlert =
  | { type: 'failed_under_5'; failCount: number; redirectPath: string }
  | { type: 'failed_over_5'; failCount: number }
  | { type: 'dormant'; redirectPath: string }
  | { type: 'rejoining_locked' }

export type SocialProvider = "kakao" | "naver" | "google";
export type LogoutReason = "manual" | "expired";

const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;
const AUTH_STORAGE_KEY = "auth-store";

const getRemainingSeconds = (authExpiresAt: number | null) => {
  if (!authExpiresAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((authExpiresAt - Date.now()) / 1000));
};

export type AuthState = {
  hasHydrated: boolean;
  hasResolvedSession: boolean;
  accessToken: string | null;
  authExpiresAt: number | null;
  sessionRemainingSeconds: number;
  socialVerifyToken: string | null;
  recentLoginProvider: SocialProvider | null;
  isManualLogout: boolean;
  logoutReason: LogoutReason | null;
  sessionTimerId: number | null;
  loginPopupTimerId: number | null;
  loginTimedOut: boolean;
  loginAlert: LoginAlert | null;
  setHasHydrated: (hasHydrated: boolean) => void;
  setHasResolvedSession: (hasResolvedSession: boolean) => void;
  // 인증 단계 응답 처리 시 setAuthTokens 사용(일관된 일괄 업데이트).
  // 토큰 갱신 등 일부 값만 바꿀 때는 setAccessToken 사용.
  setAccessToken: (accessToken: string | null) => void;
  setSocialVerifyToken: (socialVerifyToken: string | null) => void;
  setRecentLoginProvider: (provider: SocialProvider) => void;
  setAuthTokens: (payload: {
    accessToken: string | null;
    socialVerifyToken: string | null;
  }) => void;
  clearAuth: (reason?: LogoutReason) => void;
  clearLogoutReason: () => void;
  syncAuthSession: () => void;
  startAuthSessionTimer: () => void;
  stopAuthSessionTimer: () => void;
  startLoginPopupTimer: () => void;
  clearLoginPopupTimer: () => void;
  clearLoginTimedOut: () => void;
  setLoginAlert: (alert: LoginAlert | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      hasResolvedSession: false,
      accessToken: null,
      authExpiresAt: null,
      sessionRemainingSeconds: 0,
      socialVerifyToken: null,
      recentLoginProvider: null,
      isManualLogout: false,
      logoutReason: null,
      sessionTimerId: null,
      loginPopupTimerId: null,
      loginTimedOut: false,
      loginAlert: null,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setHasResolvedSession: (hasResolvedSession) => set({ hasResolvedSession }),
      setAccessToken: (accessToken) => {
        const previousState = get();
        const nextAuthExpiresAt =
          accessToken === null
            ? null
            : accessToken === previousState.accessToken &&
                previousState.authExpiresAt &&
                previousState.authExpiresAt > Date.now()
              ? previousState.authExpiresAt
              : Date.now() + AUTH_SESSION_DURATION_MS;

        set({
          accessToken,
          authExpiresAt: nextAuthExpiresAt,
          sessionRemainingSeconds: getRemainingSeconds(nextAuthExpiresAt),
          hasResolvedSession: true,
          isManualLogout: false,
          logoutReason: null,
        });
      },
      setSocialVerifyToken: (socialVerifyToken) => set({ socialVerifyToken }),
      setRecentLoginProvider: (recentLoginProvider) =>
        set({ recentLoginProvider }),
      setAuthTokens: ({ accessToken, socialVerifyToken }) => {
        const previousState = get();
        const nextAuthExpiresAt =
          accessToken === null
            ? null
            : accessToken === previousState.accessToken &&
                previousState.authExpiresAt &&
                previousState.authExpiresAt > Date.now()
              ? previousState.authExpiresAt
              : Date.now() + AUTH_SESSION_DURATION_MS;

        set({
          accessToken,
          authExpiresAt: nextAuthExpiresAt,
          sessionRemainingSeconds: getRemainingSeconds(nextAuthExpiresAt),
          socialVerifyToken,
          hasResolvedSession: true,
          isManualLogout: false,
          logoutReason: null,
        });
      },
      clearAuth: (reason = "manual") => {
        const { sessionTimerId } = get();

        if (sessionTimerId !== null) {
          window.clearInterval(sessionTimerId);
        }

        set({
          accessToken: null,
          authExpiresAt: null,
          sessionRemainingSeconds: 0,
          socialVerifyToken: null,
          hasResolvedSession: true,
          // 수동/자동 로그아웃 모두 새로고침 시 자동 reissue 복원을 막는다.
          // 다음 정상 로그인(setAccessToken/setAuthTokens) 시 false로 초기화된다.
          isManualLogout: true,
          logoutReason: reason,
          sessionTimerId: null,
        });
      },
      clearLogoutReason: () => set({ logoutReason: null }),
      syncAuthSession: () => {
        const { accessToken, authExpiresAt } = get();

        if (!accessToken || !authExpiresAt) {
          set({ sessionRemainingSeconds: 0 });
          return;
        }

        const remainingSeconds = getRemainingSeconds(authExpiresAt);

        if (remainingSeconds <= 0) {
          get().clearAuth("expired");
          return;
        }

        set({ sessionRemainingSeconds: remainingSeconds });
      },
      startAuthSessionTimer: () => {
        const { authExpiresAt, sessionTimerId } = get();

        if (sessionTimerId !== null) {
          window.clearInterval(sessionTimerId);
        }

        if (!authExpiresAt) {
          set({ sessionTimerId: null, sessionRemainingSeconds: 0 });
          return;
        }

        get().syncAuthSession();

        const nextTimerId = window.setInterval(() => {
          get().syncAuthSession();
        }, 1000);

        set({ sessionTimerId: nextTimerId });
      },
      stopAuthSessionTimer: () => {
        const { sessionTimerId } = get();

        if (sessionTimerId !== null) {
          window.clearInterval(sessionTimerId);
        }

        set({ sessionTimerId: null });
      },
      // 로그인 팝업 5분 타임아웃 타이머 시작
      startLoginPopupTimer: () => {
        const { loginPopupTimerId } = get();

        if (loginPopupTimerId !== null) {
          window.clearTimeout(loginPopupTimerId);
        }

        const timerId = window.setTimeout(() => {
          set({ loginTimedOut: true, loginPopupTimerId: null });
        }, 5 * 60 * 1000);

        set({ loginPopupTimerId: timerId, loginTimedOut: false });
      },
      // 팝업 성공 시 타이머 취소
      clearLoginPopupTimer: () => {
        const { loginPopupTimerId } = get();

        if (loginPopupTimerId !== null) {
          window.clearTimeout(loginPopupTimerId);
        }

        set({ loginPopupTimerId: null });
      },
      // 타임아웃 다이얼로그 확인 후 상태 초기화
      clearLoginTimedOut: () => set({ loginTimedOut: false }),
      setLoginAlert: (loginAlert) => set({ loginAlert }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      version: 3,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.setHasResolvedSession(false);
        const recentLoginProvider = state?.recentLoginProvider ?? null;

        state?.stopAuthSessionTimer();

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({
              state: {
                recentLoginProvider,
                isManualLogout: state?.isManualLogout ?? false,
              },
              version: 3,
            }),
          );
        }
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AuthState> | undefined;

        return {
          ...currentState,
          recentLoginProvider:
            persisted?.recentLoginProvider ?? currentState.recentLoginProvider,
          isManualLogout:
            persisted?.isManualLogout ?? currentState.isManualLogout,
        };
      },
      partialize: (state) => ({
        recentLoginProvider: state.recentLoginProvider,
        isManualLogout: state.isManualLogout,
      }),
    },
  ),
);
