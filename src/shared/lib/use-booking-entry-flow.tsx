import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/entities/auth/model/authStore';
import { useBookingEntryStore, type BookingEntryState } from '@/shared/lib/useBookingEntryStore';
import BookingGuideDialog from '@/shared/ui/booking-guide-dialog';

type OpenBookingEntryOptions = {
  homeTeamId?: string;
  gameId?: string;
  stadiumId?: string;
  queueTokenJti?: string;
  userId?: string;
  matchTitle?: string;
  venue?: string;
  dateTime?: string;
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
    // 테스트를 위해 예매 진입 단계의 로그인 여부 확인을 잠시 비활성화합니다.
    // if (!accessToken) {
    //   navigate('/auth/login');
    //   return;
    // }

    const nextEntryState = {
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

    setBookingEntry(nextEntryState);
    setPendingEntryState(nextEntryState);
    setIsGuideOpen(true);
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
    bookingGuideDialog,
  };
}
