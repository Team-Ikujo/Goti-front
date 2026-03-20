import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createBookingFlowSearch } from '@/shared/lib/booking-flow';
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

/**
 * 홈 경기 일정의 예매 진입 플로우를 다른 화면에서도 재사용하기 위한 훅입니다.
 */
export function useBookingEntryFlow() {
  const navigate = useNavigate();
  const accessToken = useAuthStore(state => state.accessToken);
  const setBookingEntry = useBookingEntryStore(state => state.setEntry);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pendingEntryState, setPendingEntryState] = useState<BookingEntryState | null>(null);

  const openBookingEntry = (options?: OpenBookingEntryOptions) => {
    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    const nextEntryState = createBookingEntryState(options);
    setBookingEntry(nextEntryState);
    setPendingEntryState(nextEntryState);
    setIsGuideOpen(true);
  };

  const openResellEntry = (options?: OpenBookingEntryOptions) => {
    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    const nextEntryState = createBookingEntryState(options);
    setBookingEntry(nextEntryState);
    navigate({
      pathname: '/books',
      search: createBookingFlowSearch('resell'),
    }, {
      state: nextEntryState,
    });
  };

  const bookingGuideDialog = (
    <BookingGuideDialog
      open={isGuideOpen}
      onOpenChange={setIsGuideOpen}
      onConfirm={() => {
        setIsGuideOpen(false);
        navigate('/books', {
          state: pendingEntryState ?? { requireCaptcha: true },
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
