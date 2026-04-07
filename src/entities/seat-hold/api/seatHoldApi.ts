import apiClient, { unwrapApiData } from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { useBookingEntryStore } from '@/shared/lib/useBookingEntryStore';
import { createBookingFlowHeaders } from '@/shared/lib/guardrailHeaders';

const configuredApiBaseUrl = (import.meta.env.PUBLIC_API_BASE_URL ?? '').trim();
const shouldUseRelativeApiBase = import.meta.env.DEV;

export type HoldSeatRequest = {
   gameId: string;
   queueTokenJti: string;
};

export type HoldSeatResponse = {
   holdId: string;
};

export type ReleaseSeatHoldResponse = {
   holdId: string;
};

const getSeatHoldReleaseUrl = (holdId: string) => {
   const path = `/api/v1/seat-reservations/${encodeURIComponent(holdId)}`;

   if (shouldUseRelativeApiBase || !configuredApiBaseUrl) {
      return path;
   }

   return new URL(path, configuredApiBaseUrl).toString();
};

export const holdSeatReservation = async (seatId: string, payload: HoldSeatRequest) => {
   const response = await apiClient.post<ApiEnvelope<HoldSeatResponse>>(
      `/api/v1/seat-reservations/seats/${encodeURIComponent(seatId)}`,
      payload,
   );

   return unwrapApiData<HoldSeatResponse>(response.data);
};

export const releaseSeatReservation = async (holdId: string) => {
   const response = await apiClient.post<ApiEnvelope<ReleaseSeatHoldResponse>>(
      `/api/v1/seat-reservations/${encodeURIComponent(holdId)}`,
   );

   return unwrapApiData<ReleaseSeatHoldResponse>(response.data);
};

export const releaseSeatReservationKeepalive = (holdId: string) => {
   if (typeof window === 'undefined') {
      return;
   }

   void fetch(getSeatHoldReleaseUrl(holdId), {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         ...createBookingFlowHeaders(useBookingEntryStore.getState().entry?.turnstileToken),
      },
      credentials: 'omit',
      keepalive: true,
   });
};
