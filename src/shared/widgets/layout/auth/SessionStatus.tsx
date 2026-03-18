import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type SessionStatusProps = {
   authExpiresAt: number | null;
   onLogout: () => void;
   onTimeout: () => void;
};

const formatTime = (seconds: number) => {
   const h = Math.floor(seconds / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = seconds % 60;
   return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

const SessionStatus = ({ authExpiresAt, onLogout, onTimeout }: SessionStatusProps) => {
   const [now, setNow] = useState(Date.now());
   const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   const hasTimedOutRef = useRef(false);

   useEffect(() => {
      if (authExpiresAt === null) {
         if (intervalRef.current) clearInterval(intervalRef.current);
         hasTimedOutRef.current = false;
         return;
      }

      setNow(Date.now());
      hasTimedOutRef.current = false;
      intervalRef.current = setInterval(() => {
         setNow(Date.now());
      }, 1000);

      return () => {
         if (intervalRef.current) clearInterval(intervalRef.current);
      };
   }, [authExpiresAt]);

   const remaining = authExpiresAt ? Math.max(0, Math.ceil((authExpiresAt - now) / 1000)) : 0;

   useEffect(() => {
      if (authExpiresAt === null || remaining > 0) {
         return;
      }

      if (hasTimedOutRef.current) {
         return;
      }

      hasTimedOutRef.current = true;
      onTimeout();
   }, [authExpiresAt, onTimeout, remaining]);

   if (authExpiresAt === null) {
      return null;
   }

   return (
      <div className="flex items-center gap-2 px-1.5">
         <Clock className="size-4 text-primary" />
         <span className="text-caption-2-medium text-primary">{formatTime(remaining)}</span>
         <button onClick={onLogout} className="text-caption-2-medium text-(--text-tertiary) underline">
            로그아웃
         </button>
      </div>
   );
};

export default SessionStatus;
