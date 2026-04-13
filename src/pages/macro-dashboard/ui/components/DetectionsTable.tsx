import { Clock, Sparkles } from 'lucide-react';

import type { BlockedEventRow } from '../../api/dashboardApi';
import { STATUS_STYLE } from '../lib/dashboardConstants';
import { toKST } from '../lib/dashboardFormat';

type DetectionsTableProps = {
  rows: BlockedEventRow[];
  onAction: (eventId: string, action: 'Blocked' | 'Passed') => void;
  actionLoading: string | null;
  onAnalyze: (eventId: string) => void;
};

const DetectionsTable = ({
  rows,
  onAction,
  actionLoading,
  onAnalyze,
}: DetectionsTableProps) => {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
        탐지된 이벤트가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--neutral-200)] text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            <th className="py-2 pr-4">Event ID</th>
            <th className="py-2 pr-4">탐지 시각 (KST)</th>
            <th className="py-2 pr-4">IP 주소</th>
            <th className="py-2 pr-4">탐지 유형</th>
            <th className="py-2 pr-4">Risk</th>
            <th className="py-2 pr-4">상태</th>
            <th className="py-2 pr-4">심사</th>
            <th className="py-2">AI 분석</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--neutral-100)]">
          {rows.map((row) => (
            <tr key={row.event_id} className="hover:bg-[var(--neutral-50)]">
              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                {row.event_id.slice(0, 14)}
              </td>
              <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <Clock className="size-3 shrink-0" />
                  {toKST(row.blocked_at)}
                </span>
              </td>
              <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                {row.ip_address || '-'}
              </td>
              <td className="py-2.5 pr-4 text-[var(--text-secondary)]">{row.detection_type}</td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--neutral-200)]">
                    <div
                      className={`h-full rounded-full ${row.risk_score >= 80 ? 'bg-red-500' : row.risk_score >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${row.risk_score}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{row.risk_score}%</span>
                </div>
              </td>
              <td className="py-2.5 pr-4">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {row.status}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex gap-1">
                  <button
                    disabled={row.status === 'Passed' || actionLoading === row.event_id}
                    className="rounded-lg bg-green-100 px-2 py-1 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onAction(row.event_id, 'Passed')}
                  >
                    통과
                  </button>
                  <button
                    disabled={row.status === 'Blocked' || actionLoading === row.event_id}
                    className="rounded-lg bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onAction(row.event_id, 'Blocked')}
                  >
                    차단
                  </button>
                </div>
              </td>
              <td className="py-2.5">
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#ede9fe] px-2 py-1 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                  onClick={() => onAnalyze(row.event_id)}
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

export default DetectionsTable;
