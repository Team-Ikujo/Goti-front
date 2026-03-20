import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createBookingFlowSearch, type BookingFlowMode } from '@/shared/lib/booking-flow';
import { useAuthStore } from '@/entities/auth/model/authStore';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import BookingGuideDialog from '@/shared/ui/booking-guide-dialog';

export type OpenBookingEntryOptions = {
  homeTeamId?: string;
  gameId?: string;
  stadiumId?: string;
  queueTokenJti?: string;
  userId?: string;
  matchTitle?: string;
  venue?: string;
  dateTime?: string;
};

const createBookingEntryState = (options?: OpenBookingEntryOptions): BookingEntryState => {
  return {
    requireCaptcha: true,
    homeTeamId: options?.homeTeamId,
    gameId: options?.gameId,
    stadiumId: options?.stadiumId,
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
  const accessToken = useAuthStore(state => state.accessToken);
  const setBookingEntry = useBookingEntryStore(state => state.setEntry);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pendingEntry, setPendingEntry] = useState<PendingEntry | null>(null);

  const openEntryWithGuide = (mode: BookingFlowMode, options?: OpenBookingEntryOptions) => {
    const nextEntryState = createBookingEntryState(options);

    setBookingEntry(nextEntryState);
    setPendingEntry({
      entryState: nextEntryState,
      mode,
    });
    setIsGuideOpen(true);
  };

  const openBookingEntry = (options?: OpenBookingEntryOptions) => {
    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    openEntryWithGuide('standard', options);
  };

  const openResellEntry = (options?: OpenBookingEntryOptions) => {
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
        navigate({
          pathname: '/books',
          search: createBookingFlowSearch(pendingEntry?.mode ?? 'standard'),
        }, {
          state: pendingEntry?.entryState ?? { requireCaptcha: true },
        });
      }}
    />
  );

  return {
    openBookingEntry,
    openResellEntry,
    bookingGuideDialog,
  };
}
