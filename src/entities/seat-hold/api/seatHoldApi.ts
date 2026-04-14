import apiClient, { unwrapApiData } from '@/shared/api/client';
import type { ApiEnvelope } from '@/features/auth/api/types';
import { createBookingFlowHeaders } from '@/shared/lib/guardrailHeaders';
import { configuredApiBaseUrl, shouldUseRelativeApiBase } from '@/shared/config/api';
import { buildBookingApiPath, buildBookingApiUrl } from '@/shared/lib/bookingApiPath';

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
   return buildBookingApiUrl({
      path: `/api/v1/seat-reservations/${encodeURIComponent(holdId)}`,
      baseUrl: shouldUseRelativeApiBase ? undefined : configuredApiBaseUrl,
   });
};

export const holdSeatReservation = async (seatId: string, payload: HoldSeatRequest) => {
   const response = await apiClient.post<ApiEnvelope<HoldSeatResponse>>(
      buildBookingApiPath(`/api/v1/seat-reservations/seats/${encodeURIComponent(seatId)}`),
      payload,
   );

   return unwrapApiData<HoldSeatResponse>(response.data);
};

export const releaseSeatReservation = async (holdId: string) => {
   const response = await apiClient.post<ApiEnvelope<ReleaseSeatHoldResponse>>(
      buildBookingApiPath(`/api/v1/seat-reservations/${encodeURIComponent(holdId)}`),
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
         ...createBookingFlowHeaders(),
      },
      credentials: 'omit',
      keepalive: true,
   });
};
