import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/entities/auth/model/authStore';
import BookingGuideDialog from '@/shared/ui/booking-guide-dialog';

/**
 * 홈 경기 일정의 예매 진입 플로우를 다른 화면에서도 재사용하기 위한 훅입니다.
 */
export function useBookingEntryFlow() {
  const navigate = useNavigate();
  const accessToken = useAuthStore(state => state.accessToken);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const openBookingEntry = () => {
    if (!accessToken) {
      navigate('/auth/login');
      return;
    }

    setIsGuideOpen(true);
  };

  const bookingGuideDialog = (
    <BookingGuideDialog
      open={isGuideOpen}
      onOpenChange={setIsGuideOpen}
      onConfirm={() => {
        setIsGuideOpen(false);
        navigate('/books', {
          state: {
            requireCaptcha: true,
          },
        });
      }}
    />
  );

  return {
    openBookingEntry,
    bookingGuideDialog,
  };
}
