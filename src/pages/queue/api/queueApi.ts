// src/pages/queue/api/queueApi.ts

import apiClient from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/authStore';
import type { ApiEnvelope } from '@/features/auth/api/types';

const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? '').trim();
const shouldUseRelativeApiBase = import.meta.env.DEV;

export interface QueueEnterResponse {
  queueToken: string;
  queueNumber: number;
  gameId: string;
  issuedAt: string;
}

export interface QueueStatusResponse {
  gameId: string;
  maxCapacity: number;
  activeCount: number;
  availableSlots: number;
  currentAllowedRank: number;
  publishedRank: number;
  updatedAt: string;
}

export interface QueueSeatEnterResponse {
  gameId: string;
  enterAllowed: boolean;
  queueNumber: number;
  status: 'WAITING' | 'ADMITTED' | 'LEFT' | 'EXPIRED';
}

export interface QueueLeaveResponse {
  gameId: string;
  released: boolean;
  status: 'WAITING' | 'ADMITTED' | 'LEFT' | 'EXPIRED';
}

/** 대기열 진입 — 새 대기 순번(queueNumber)과 토큰(queueToken) 발급 */
export const enterQueue = async (gameId: string): Promise<QueueEnterResponse> => {
  const response = await apiClient.post<ApiEnvelope<QueueEnterResponse>>(
    '/api/v1/queue/enter',
    { gameId },
  );
  return response.data.data;
};

/** 대기열 전역 상태 조회 — CDN 1초 캐싱, 인증 불필요 */
export const getQueueGlobalStatus = async (gameId: string): Promise<QueueStatusResponse> => {
  const response = await apiClient.get<ApiEnvelope<QueueStatusResponse>>(
    `/api/v1/queue/${encodeURIComponent(gameId)}/global-status`,
  );
  return response.data.data;
};

/** 대기열 실제 상태 조회 — 인증 기반 실시간 상태 */
export const getQueueStatus = async (gameId: string): Promise<QueueStatusResponse> => {
  const response = await apiClient.get<ApiEnvelope<QueueStatusResponse>>(
    `/api/v1/queue/${encodeURIComponent(gameId)}/status`,
  );
  return response.data.data;
};

/** 대기열 최종 입장 시도 — enterAllowed: true 면 예매 페이지로 이동 가능 */
export const seatEnterQueue = async (
  gameId: string,
  queueToken: string,
): Promise<QueueSeatEnterResponse> => {
  const response = await apiClient.post<ApiEnvelope<QueueSeatEnterResponse>>(
    `/api/v1/queue/${encodeURIComponent(gameId)}/seat-enter`,
    { queueToken },
  );
  return response.data.data;
};

/** 대기열 이탈 — 결제 완료/명시적 종료 시 현재 수용 인원을 해제한다. */
export const leaveQueue = async (gameId: string): Promise<QueueLeaveResponse> => {
  const response = await apiClient.post<ApiEnvelope<QueueLeaveResponse>>(
    `/api/v1/queue/${encodeURIComponent(gameId)}/leave`,
  );
  return response.data.data;
};

const getLeaveQueueUrl = (gameId: string) => {
  const path = `/api/v1/queue/${encodeURIComponent(gameId)}/leave`;
  if (shouldUseRelativeApiBase || !configuredApiBaseUrl) return path;
  return new URL(path, configuredApiBaseUrl).toString();
};

/**
 * 대기열 이탈 — 페이지 언로드 시 keepalive fetch로 호출
 * 입장 허용 전 언마운트될 때만 호출해야 한다.
 */
export const leaveQueueKeepalive = (gameId: string) => {
  if (typeof window === 'undefined') return;

  const accessToken = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  void fetch(getLeaveQueueUrl(gameId), {
    method: 'POST',
    headers,
    keepalive: true,
  });
};

export const releaseQueueSession = async (gameId?: string) => {
  const trimmedGameId = gameId?.trim();

  if (!trimmedGameId) {
    return;
  }

  try {
    await leaveQueue(trimmedGameId);
  } catch {
    leaveQueueKeepalive(trimmedGameId);
  }
};
