import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/entities/auth/model/authStore';
import BookingGuideDialog from '@/shared/ui/booking-guide-dialog';

export type BookingEntryState = {
  requireCaptcha?: boolean;
  homeTeamId?: string;
  matchTitle?: string;
  venue?: string;
  dateTime?: string;
};

type OpenBookingEntryOptions = {
  homeTeamId?: string;
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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pendingEntryState, setPendingEntryState] = useState<BookingEntryState | null>(null);

  const openBookingEntry = (options?: OpenBookingEntryOptions) => {
    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    setPendingEntryState({
      requireCaptcha: true,
      homeTeamId: options?.homeTeamId,
      matchTitle: options?.matchTitle,
      venue: options?.venue,
      dateTime: options?.dateTime,
    });
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
