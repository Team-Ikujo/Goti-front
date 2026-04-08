import type { BookingEntryState } from '@/shared/lib/useBookingEntryStore';

const BOOKING_FLOW_DEBUG_PREFIX = '[BookingFlowDebug]';

const canUseConsole = () => typeof console !== 'undefined';

export const summarizeBookingEntry = (entry: BookingEntryState | null | undefined) => {
   if (!entry) {
      return null;
   }

   return {
      entrySourcePath: entry.entrySourcePath,
      homeTeamId: entry.homeTeamId,
      serverHomeTeamId: entry.serverHomeTeamId,
      gameId: entry.gameId,
      stadiumId: entry.stadiumId,
      leagueType: entry.leagueType,
      gameDate: entry.gameDate,
      queueTokenJti: entry.queueTokenJti,
      requireCaptcha: entry.requireCaptcha,
      forceNewSession: entry.forceNewSession,
      userId: entry.userId,
      matchTitle: entry.matchTitle,
      venue: entry.venue,
      dateTime: entry.dateTime,
      bookingZoneCount: entry.bookingZones?.length ?? 0,
      bookingZoneIds: entry.bookingZones?.map((zone) => zone.id) ?? [],
      hasBotData: Boolean(entry.botData),
   };
};

export const logBookingFlow = (scope: string, message: string, payload?: unknown) => {
   if (!canUseConsole()) {
      return;
   }

   if (payload === undefined) {
      console.log(`${BOOKING_FLOW_DEBUG_PREFIX}[${scope}] ${message}`);
      return;
   }

   console.log(`${BOOKING_FLOW_DEBUG_PREFIX}[${scope}] ${message}`, payload);
};

export const logBookingFlowError = (scope: string, message: string, payload?: unknown) => {
   if (!canUseConsole()) {
      return;
   }

   if (payload === undefined) {
      console.error(`${BOOKING_FLOW_DEBUG_PREFIX}[${scope}] ${message}`);
      return;
   }

   console.error(`${BOOKING_FLOW_DEBUG_PREFIX}[${scope}] ${message}`, payload);
};
