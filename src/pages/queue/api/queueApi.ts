// src/pages/queue/api/queueApi.ts

import apiClient from '@/shared/api/client';
import { useAuthStore } from '@/entities/auth/model/authStore';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { configuredApiBaseUrl, shouldUseRelativeApiBase } from '@/shared/config/api';
import { buildMockQueueTokenJti } from '@/shared/config/booking';
import { isResaleBookingMockEnabled } from '@/shared/config/runtime';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';

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

const getShouldUseResellQueueMock = () => {
  const bookingEntry = useBookingEntryStore.getState().entry;
  return isResaleBookingMockEnabled && bookingEntry?.bookingFlowMode === 'resell';
};

const createMockQueueEnterResponse = (gameId: string): QueueEnterResponse => ({
  gameId,
  issuedAt: new Date().toISOString(),
  queueNumber: 1,
  queueToken: buildMockQueueTokenJti(gameId) ?? `queue-token-${gameId}`,
});

const createMockQueueStatusResponse = (gameId: string): QueueStatusResponse => ({
  gameId,
  maxCapacity: 1000,
  activeCount: 1,
  availableSlots: 999,
  currentAllowedRank: 1,
  publishedRank: 1,
  updatedAt: new Date().toISOString(),
});

/** 대기열 진입 — 새 대기 순번(queueNumber)과 토큰(queueToken) 발급 */
export const enterQueue = async (gameId: string): Promise<QueueEnterResponse> => {
  if (getShouldUseResellQueueMock()) {
    return createMockQueueEnterResponse(gameId);
  }

  try {
    const response = await apiClient.post<ApiEnvelope<QueueEnterResponse>>(
      '/api/v1/queue/enter',
      { gameId },
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/** 대기열 전역 상태 조회 — CDN 1초 캐싱, 인증 불필요 */
export const getQueueGlobalStatus = async (gameId: string): Promise<QueueStatusResponse> => {
  if (getShouldUseResellQueueMock()) {
    return createMockQueueStatusResponse(gameId);
  }

  const response = await apiClient.get<ApiEnvelope<QueueStatusResponse>>(
    `/api/v1/queue/${encodeURIComponent(gameId)}/global-status`,
  );
  return response.data.data;
};

/** 대기열 실제 상태 조회 — 인증 기반 실시간 상태 */
export const getQueueStatus = async (gameId: string): Promise<QueueStatusResponse> => {
  if (getShouldUseResellQueueMock()) {
    return createMockQueueStatusResponse(gameId);
  }

  try {
    const response = await apiClient.get<ApiEnvelope<QueueStatusResponse>>(
      `/api/v1/queue/${encodeURIComponent(gameId)}/status`,
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/** 대기열 최종 입장 시도 — enterAllowed: true 면 예매 페이지로 이동 가능 */
export const seatEnterQueue = async (
  gameId: string,
  queueToken: string,
): Promise<QueueSeatEnterResponse> => {
  if (getShouldUseResellQueueMock()) {
    return {
      gameId,
      enterAllowed: true,
      queueNumber: 1,
      status: 'ADMITTED',
    };
  }

  try {
    const response = await apiClient.post<ApiEnvelope<QueueSeatEnterResponse>>(
      `/api/v1/queue/${encodeURIComponent(gameId)}/seat-enter`,
      { queueToken },
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

/** 대기열 이탈 — 결제 완료/명시적 종료 시 현재 수용 인원을 해제한다. */
export const leaveQueue = async (gameId: string): Promise<QueueLeaveResponse> => {
  if (getShouldUseResellQueueMock()) {
    return {
      gameId,
      released: true,
      status: 'LEFT',
    };
  }

  try {
    const response = await apiClient.post<ApiEnvelope<QueueLeaveResponse>>(
      `/api/v1/queue/${encodeURIComponent(gameId)}/leave`,
    );
    return response.data.data;
  } catch (error) {
    throw error;
  }
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
  if (getShouldUseResellQueueMock()) return;

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
