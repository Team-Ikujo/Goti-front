import axios from 'axios';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { configuredApiBaseUrl, shouldUseRelativeApiBase } from '@/shared/config/api';
import { ApiError, unwrapApiData } from '@/shared/api/client';

const tokenReissuePath = '/api/v1/auth/reissue';

let reissueAccessTokenPromise: Promise<string> | null = null;

export const reissueAccessTokenFromCookie = async (): Promise<string> => {
  if (useAuthStore.getState().isManualLogout) {
    throw new ApiError('수동 로그아웃 상태에서는 토큰을 재발급하지 않습니다.', 401);
  }

  if (!reissueAccessTokenPromise) {
    reissueAccessTokenPromise = axios
      .post(
        tokenReissuePath,
        undefined,
        {
          baseURL: shouldUseRelativeApiBase ? '' : configuredApiBaseUrl,
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        },
      )
      .then((response) => {
        const data = unwrapApiData<{ accessToken: string }>(response.data);

        if (!data.accessToken) {
          throw new ApiError('토큰 재발급 응답에 accessToken이 없습니다.', response.status, response.data);
        }

        if (useAuthStore.getState().isManualLogout) {
          throw new ApiError('로그아웃 이후 도착한 토큰 재발급 응답은 무시합니다.', 401, response.data);
        }

        useAuthStore.getState().setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .catch((error: unknown) => {
        const state = useAuthStore.getState();
        // 최초 방문자(currentUserId === null)는 refresh token 자체가 없어 401이 정상 응답이므로
        // 세션 만료로 처리하지 않는다. 이전에 로그인했던 흔적이 있을 때만 'expired'로 간주한다.
        if (!state.isManualLogout && state.currentUserId !== null) {
          state.clearAuth('expired');
        }

        throw error;
      })
      .finally(() => {
        reissueAccessTokenPromise = null;
      });
  }

  return reissueAccessTokenPromise;
};
