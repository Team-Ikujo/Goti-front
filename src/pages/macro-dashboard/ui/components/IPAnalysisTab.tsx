import { Sparkles } from 'lucide-react';

import type { IPSummaryItem } from '../../api/dashboardApi';
import { toKST } from '../lib/dashboardFormat';

type IPAnalysisTabProps = {
  items: IPSummaryItem[];
  onAnalyze: (ip: string) => void;
};

const IPAnalysisTab = ({ items, onAnalyze }: IPAnalysisTabProps) => {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">
        IP 데이터가 없습니다. 가드레일 차단 이벤트에 IP가 포함되면 여기에 표시됩니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--neutral-200)] text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
            <th className="py-2 pr-4">IP 주소</th>
            <th className="py-2 pr-4">탐지 건수</th>
            <th className="py-2 pr-4">차단 건수</th>
            <th className="py-2 pr-4">최대 Risk</th>
            <th className="py-2 pr-4">탐지 유형</th>
            <th className="py-2 pr-4">첫 탐지 (KST)</th>
            <th className="py-2 pr-4">최근 탐지 (KST)</th>
            <th className="py-2">AI 분석</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--neutral-100)]">
          {items.map((item) => (
            <tr key={item.ip_address} className="hover:bg-[var(--neutral-50)]">
              <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[var(--text-primary)]">
                {item.ip_address}
              </td>
              <td className="py-2.5 pr-4 text-center text-[var(--text-secondary)]">{item.total_events}</td>
              <td className="py-2.5 pr-4 text-center">
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  {item.blocked_count}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[var(--neutral-200)]">
                    <div
                      className={`h-full rounded-full ${item.max_risk >= 80 ? 'bg-red-500' : item.max_risk >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${item.max_risk}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{Math.round(item.max_risk)}%</span>
                </div>
              </td>
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">{item.detection_types || '-'}</td>
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">{toKST(item.first_seen)}</td>
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">{toKST(item.last_seen)}</td>
              <td className="py-2.5">
                <button
                  className="flex items-center gap-1 rounded-lg bg-[#ede9fe] px-2 py-1 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                  onClick={() => onAnalyze(item.ip_address)}
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

export default IPAnalysisTab;
