import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SocialProvider = "kakao" | "naver" | "google";

const AUTH_SESSION_DURATION_MS = 60 * 60 * 1000;

export type AuthState = {
  accessToken: string | null;
  authExpiresAt: number | null;
  socialVerifyToken: string | null;
  recentLoginProvider: SocialProvider | null;
  // 인증 단계 응답 처리 시 setAuthTokens 사용(일관된 일괄 업데이트).
  // 토큰 갱신 등 일부 값만 바꿀 때는 setAccessToken 사용.
  setAccessToken: (accessToken: string | null) => void;
  setSocialVerifyToken: (socialVerifyToken: string | null) => void;
  setRecentLoginProvider: (provider: SocialProvider) => void;
  setAuthTokens: (payload: {
    accessToken: string | null;
    socialVerifyToken: string | null;
  }) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      authExpiresAt: null,
      socialVerifyToken: null,
      recentLoginProvider: null,
      setAccessToken: (accessToken) =>
        set({
          accessToken,
          authExpiresAt: accessToken
            ? Date.now() + AUTH_SESSION_DURATION_MS
            : null,
        }),
      setSocialVerifyToken: (socialVerifyToken) => set({ socialVerifyToken }),
      setRecentLoginProvider: (recentLoginProvider) =>
        set({ recentLoginProvider }),
      setAuthTokens: ({ accessToken, socialVerifyToken }) =>
        set({
          accessToken,
          authExpiresAt: accessToken
            ? Date.now() + AUTH_SESSION_DURATION_MS
            : null,
          socialVerifyToken,
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          authExpiresAt: null,
          socialVerifyToken: null,
        }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken || !state.authExpiresAt) {
          return;
        }

        if (state.authExpiresAt <= Date.now()) {
          state.clearAuth();
        }
      },
      partialize: (state) => ({
        accessToken: state.accessToken,
        authExpiresAt: state.authExpiresAt,
        recentLoginProvider: state.recentLoginProvider,
      }),
    },
  ),
);
