// src/shared/ui/snackbar.tsx

import { useEffect, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Alert } from './alert';

interface SnackbarProps {
   open: boolean;
   message: string;
   /** 자동 닫힘 지연 (ms), 기본 3000 */
   duration?: number;
   onClose?: () => void;
   className?: string;
}

export function Snackbar({ open, message, duration = 3000, onClose, className }: SnackbarProps) {
   const [visible, setVisible] = useState(false);

   useEffect(() => {
      if (!open) {
         setVisible(false);
         return;
      }

      // 열릴 때 fade-in
      const showTimer = requestAnimationFrame(() => setVisible(true));
      const hideTimer = setTimeout(() => setVisible(false), duration - 300);
      const closeTimer = setTimeout(() => onClose?.(), duration);

      return () => {
         cancelAnimationFrame(showTimer);
         clearTimeout(hideTimer);
         clearTimeout(closeTimer);
      };
   }, [open, duration, onClose]);

   return (
      <Alert
         variant="success"
         aria-live="polite"
         className={cn(
            'fixed bottom-8 left-1/2 -translate-x-1/2 z-100',
            'transition-opacity duration-300',
            visible ? 'opacity-100' : 'opacity-0',
            className,
         )}
      >
         {message}
      </Alert>
   );
}
