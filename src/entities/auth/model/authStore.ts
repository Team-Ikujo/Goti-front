import { create } from "zustand";

export type AuthState = {
  accessToken: string | null;
  tempToken: string | null;
  isLinked: boolean | null;
  // 로그인 응답 처리 시 setAuthTokens 사용(일관된 일괄 업데이트).
  // 토큰 갱신 등 일부 값만 바꿀 때는 setAccessToken 사용.
  setAccessToken: (accessToken: string | null) => void;
  setTempToken: (tempToken: string | null) => void;
  setIsLinked: (isLinked: boolean | null) => void;
  setAuthTokens: (payload: {
    accessToken: string | null;
    tempToken: string | null;
    isLinked: boolean | null;
  }) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  tempToken: null,
  isLinked: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  setTempToken: (tempToken) => set({ tempToken }),
  setIsLinked: (isLinked) => set({ isLinked }),
  setAuthTokens: ({ accessToken, tempToken, isLinked }) =>
    set((state) => {
      state.setAccessToken(accessToken);
      state.setTempToken(tempToken);
      state.setIsLinked(isLinked);
      return state;
    }),
  clearAuth: () => set({ accessToken: null, tempToken: null, isLinked: null }),
}));
