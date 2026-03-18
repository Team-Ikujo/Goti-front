import { Clock } from 'lucide-react';

type SessionStatusProps = {
   remainingSeconds: number;
   onLogout: () => void;
};

const formatTime = (seconds: number) => {
   const h = Math.floor(seconds / 3600);
   const m = Math.floor((seconds % 3600) / 60);
   const s = seconds % 60;
   return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

const SessionStatus = ({ remainingSeconds, onLogout }: SessionStatusProps) => {
   return (
      <div className="flex items-center gap-2 px-1.5">
         <Clock className="size-4 text-primary" />
         <span className="text-caption-2-medium text-primary">{formatTime(remainingSeconds)}</span>
         <button onClick={onLogout} className="text-caption-2-medium text-(--text-tertiary) underline">
            로그아웃
         </button>
      </div>
   );
};

export default SessionStatus;
