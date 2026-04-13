import { BarChart2, Sparkles } from 'lucide-react';

import type { MouseMacroSessionRow } from '../../api/dashboardApi';
import { toKST } from '../lib/dashboardFormat';

type MouseSessionsTableProps = {
  sessions: MouseMacroSessionRow[];
  onAnalyze: (sessionId: string) => void;
  onOpenTrajectory: (session: MouseMacroSessionRow) => void;
};

const MouseSessionsTable = ({
  sessions,
  onAnalyze,
  onOpenTrajectory,
}: MouseSessionsTableProps) => {
  if (sessions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
        수신된 마우스 매크로 세션이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--neutral-200)] text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            <th className="py-2 pr-4">Session ID</th>
            <th className="py-2 pr-4">User ID</th>
            <th className="py-2 pr-4">탐지 시각 (KST)</th>
            <th className="py-2 pr-4">이벤트 수</th>
            <th className="py-2 pr-4">매크로 확률</th>
            <th className="py-2 pr-4">신뢰도</th>
            <th className="py-2 pr-4">궤적</th>
            <th className="py-2">AI 분석</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--neutral-100)]">
          {sessions.map((session) => (
            <tr key={session.session_id} className="hover:bg-[var(--neutral-50)]">
              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                {session.session_id.slice(0, 16)}
              </td>
              <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{session.user_id || '-'}</td>
              <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{toKST(session.detected_at)}</td>
              <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{session.event_count.toLocaleString()}개</td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--neutral-200)]">
                    <div
                      className="h-full rounded-full bg-[#6366f1]"
                      style={{ width: `${Math.round(session.probability * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">
                    {(session.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </td>
              <td className="py-2.5 pr-4">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  {(session.confidence * 100).toFixed(1)}%
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <button
                  className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                  onClick={() => onOpenTrajectory(session)}
                >
                  <BarChart2 className="size-3" />
                  궤적
                </button>
              </td>
              <td className="py-2.5">
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#ede9fe] px-2 py-1 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                  onClick={() => onAnalyze(session.session_id)}
                >
                  <Sparkles className="size-3" />
                  분석
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MouseSessionsTable;
