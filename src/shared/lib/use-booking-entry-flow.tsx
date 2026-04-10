import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  createBookingEntrySourcePath,
  type BookingFlowMode,
} from '@/shared/lib/booking-flow';
import { logBookingFlow, summarizeBookingEntry } from '@/shared/lib/bookingFlowDebug';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import { resolveUserIdFromJwt } from '@/shared/lib/jwt';
import type { ApiLeagueType } from '@/shared/types/game';
import BookingGuideDialog from '@/shared/ui/booking-guide-dialog';

export type OpenBookingEntryOptions = {
  bookingFlowMode?: BookingFlowMode;
  entrySourcePath?: string;
  homeTeamId?: string;
  serverHomeTeamId?: string;
  gameId?: string;
  stadiumId?: string;
  leagueType?: ApiLeagueType;
  gameDate?: string;
  queueTokenJti?: string;
  userId?: string;
  matchTitle?: string;
  venue?: string;
  dateTime?: string;
};

const createBookingEntryState = (options?: OpenBookingEntryOptions): BookingEntryState => {
  return {
    requireCaptcha: true,
    forceNewSession: true,
    bookingFlowMode: options?.bookingFlowMode ?? 'standard',
    entrySourcePath: options?.entrySourcePath,
    homeTeamId: options?.homeTeamId,
    serverHomeTeamId: options?.serverHomeTeamId,
    gameId: options?.gameId,
    stadiumId: options?.stadiumId,
    leagueType: options?.leagueType,
    gameDate: options?.gameDate,
    queueTokenJti: options?.queueTokenJti,
    userId: options?.userId,
    matchTitle: options?.matchTitle,
    venue: options?.venue,
    dateTime: options?.dateTime,
  } satisfies BookingEntryState;
};

type PendingEntry = {
  entryState: BookingEntryState;
  mode: BookingFlowMode;
};

/**
 * 홈 경기 일정의 예매 진입 플로우를 다른 화면에서도 재사용하기 위한 훅입니다.
 */
export function useBookingEntryFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasResolvedSession = useAuthStore(state => state.hasResolvedSession);
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUserId = useAuthStore(state => state.currentUserId);
  const setBookingEntry = useBookingEntryStore(state => state.setEntry);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);

  const openEntryWithGuide = (mode: BookingFlowMode, options?: OpenBookingEntryOptions) => {
    const nextEntryState = createBookingEntryState({
      ...options,
      bookingFlowMode: mode,
      userId: options?.userId ?? currentUserId ?? resolveUserIdFromJwt(accessToken) ?? undefined,
      entrySourcePath: createBookingEntrySourcePath(location),
    });

    logBookingFlow('useBookingEntryFlow', 'openEntryWithGuide', {
      mode,
      options,
      nextEntryState: summarizeBookingEntry(nextEntryState),
    });
    setBookingEntry(nextEntryState);
    setPendingEntry({
      entryState: nextEntryState,
      mode,
    });
    setIsGuideOpen(true);
  };

  const openBookingEntry = (options?: OpenBookingEntryOptions) => {
    logBookingFlow('useBookingEntryFlow', 'openBookingEntry called', {
      options,
      hasResolvedSession,
      hasAccessToken: Boolean(accessToken),
    });
    if (!hasResolvedSession) {
      return;
    }

    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    openEntryWithGuide('standard', options);
  };

  const openResellEntry = (options?: OpenBookingEntryOptions) => {
    logBookingFlow('useBookingEntryFlow', 'openResellEntry called', {
      options,
      hasResolvedSession,
      hasAccessToken: Boolean(accessToken),
    });
    if (!hasResolvedSession) {
      return;
    }

    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    openEntryWithGuide('resell', options);
  };

  const bookingGuideDialog = (
    <BookingGuideDialog
      open={isGuideOpen}
      onOpenChange={setIsGuideOpen}
      onConfirm={() => {
        setIsGuideOpen(false);
        const nextEntryState = (pendingEntry?.entryState ?? { requireCaptcha: true }) satisfies BookingEntryState;

        logBookingFlow('useBookingEntryFlow', 'booking guide confirm', {
          mode: pendingEntry?.mode ?? 'standard',
          nextEntryState: summarizeBookingEntry(nextEntryState),
        });
        setBookingEntry(nextEntryState);
        navigate('/queue', { state: nextEntryState });
      }}
    />
  );

  return {
    openBookingEntry,
    openResellEntry,
    bookingGuideDialog,
  };
}
