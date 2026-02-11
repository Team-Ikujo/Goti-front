import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type SocialProvider = "kakao" | "naver" | "google";

export type AuthState = {
  accessToken: string | null;
  tempToken: string | null;
  isLinked: boolean | null;
  recentLoginProvider: SocialProvider | null;
  // 로그인 응답 처리 시 setAuthTokens 사용(일관된 일괄 업데이트).
  // 토큰 갱신 등 일부 값만 바꿀 때는 setAccessToken 사용.
  setAccessToken: (accessToken: string | null) => void;
  setTempToken: (tempToken: string | null) => void;
  setIsLinked: (isLinked: boolean | null) => void;
  setRecentLoginProvider: (provider: SocialProvider) => void;
  setAuthTokens: (payload: {
    accessToken: string | null;
    tempToken: string | null;
    isLinked: boolean | null;
  }) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      tempToken: null,
      isLinked: null,
      recentLoginProvider: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setTempToken: (tempToken) => set({ tempToken }),
      setIsLinked: (isLinked) => set({ isLinked }),
      setRecentLoginProvider: (recentLoginProvider) =>
        set({ recentLoginProvider }),
      setAuthTokens: ({ accessToken, tempToken, isLinked }) =>
        set({ accessToken, tempToken, isLinked }),
      clearAuth: () => set({ accessToken: null, tempToken: null, isLinked: null }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recentLoginProvider: state.recentLoginProvider,
      }),
    },
  ),
);
