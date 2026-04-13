import { AlertTriangle } from 'lucide-react';

import type { AlertItem } from '../../api/dashboardApi';

type AlertBannerProps = {
  alerts: AlertItem[];
};

const AlertBanner = ({ alerts }: AlertBannerProps) => {
  if (alerts.length === 0) return null;

  const critical = alerts.filter((alert) => alert.severity === 'critical');
  const label =
    critical.length > 0
      ? `위험 알림 ${critical.length}건 — 즉시 확인이 필요합니다`
      : `주의 알림 ${alerts.length}건이 발생했습니다`;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border-l-4 p-4 ${
        critical.length > 0 ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'
      }`}
    >
      <AlertTriangle
        className={`size-5 shrink-0 ${critical.length > 0 ? 'text-red-600' : 'text-yellow-600'}`}
      />
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
    </div>
  );
};

export default AlertBanner;
