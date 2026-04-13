import { BarChart2, X } from 'lucide-react';

import type { MouseMacroSessionRow } from '../../api/dashboardApi';
import { toKST } from '../lib/dashboardFormat';
import MouseTrajectoryChart from './MouseTrajectoryChart';

type TrajectoryModalProps = {
  session: MouseMacroSessionRow;
  onClose: () => void;
};

const TrajectoryModal = ({ session, onClose }: TrajectoryModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-5 text-[#6366f1]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">마우스 궤적 분석</h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {session.session_id.slice(0, 20)} · 확률 {(session.probability * 100).toFixed(1)}% · {toKST(session.detected_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--text-tertiary)] hover:bg-[var(--neutral-100)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          <MouseTrajectoryChart events={session.events ?? []} />
        </div>

        <div className="flex items-center justify-between border-t border-[var(--neutral-200)] px-6 py-3">
          <p className="text-xs text-[var(--text-tertiary)]">
            총 {session.event_count.toLocaleString()}개 이벤트 · 신뢰도 {(session.confidence * 100).toFixed(1)}%
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-[var(--neutral-100)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrajectoryModal;
