import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SocialProvider = "kakao" | "naver" | "google";
export type LogoutReason = "manual" | "expired";

const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;

const getRemainingSeconds = (authExpiresAt: number | null) => {
  if (!authExpiresAt) {
    return 0;
  }

  return Math.max(0, Math.ceil((authExpiresAt - Date.now()) / 1000));
};

export type AuthState = {
  accessToken: string | null;
  authExpiresAt: number | null;
  sessionRemainingSeconds: number;
  socialVerifyToken: string | null;
  recentLoginProvider: SocialProvider | null;
  logoutReason: LogoutReason | null;
  sessionTimerId: number | null;
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
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      authExpiresAt: null,
      sessionRemainingSeconds: 0,
      socialVerifyToken: null,
      recentLoginProvider: null,
      logoutReason: null,
      sessionTimerId: null,
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
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken || !state.authExpiresAt) {
          state?.stopAuthSessionTimer();
          return;
        }

        if (state.authExpiresAt <= Date.now()) {
          state.clearAuth("expired");
          return;
        }

        state.syncAuthSession();
        state.startAuthSessionTimer();
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        authExpiresAt: state.authExpiresAt,
        recentLoginProvider: state.recentLoginProvider,
      }),
    },
  ),
);
