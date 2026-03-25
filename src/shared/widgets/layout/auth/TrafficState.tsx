// src/shared/widgets/layout/auth/TrafficState.tsx

export type TrafficStatus = '원활' | '지연' | '혼잡';

interface TrafficStateProps {
   state?: TrafficStatus;
   className?: string;
}

function StatusIcon({ state }: { state: TrafficStatus }) {
   if (state === '원활') {
      return <div className="size-2 rounded-full bg-success shrink-0" />;
   }
   if (state === '지연') {
      return <div className="size-2 bg-warning shrink-0" />;
   }
   // 혼잡: 삼각형
   return (
      <svg width="8" height="7" viewBox="0 0 8 7" fill="none" className="shrink-0">
         <path d="M4 0L8 7H0L4 0Z" fill="currentColor" className="text-destructive" />
      </svg>
   );
}

export default function TrafficState({ state = '원활', className }: TrafficStateProps) {
   const stateColor =
      state === '원활' ? 'text-success' :
      state === '지연' ? 'text-warning' :
      'text-destructive';

   return (
      <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
         <StatusIcon state={state} />
         <span className="text-caption-2-medium text-(--text-tertiary)">혼잡도:</span>
         <span className={`text-caption-2-medium ${stateColor}`}>{state}</span>
      </div>
   );
}
