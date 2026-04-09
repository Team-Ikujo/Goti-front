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
        if (!useAuthStore.getState().isManualLogout) {
          useAuthStore.getState().clearAuth('expired');
        }

        throw error;
      })
      .finally(() => {
        reissueAccessTokenPromise = null;
      });
  }

  return reissueAccessTokenPromise;
};
