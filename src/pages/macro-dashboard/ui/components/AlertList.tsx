import { AlertTriangle } from 'lucide-react';

import type { AlertItem } from '../../api/dashboardApi';
import { SEVERITY_ICON_CLASS, SEVERITY_STYLE } from '../lib/dashboardConstants';
import { toKST } from '../lib/dashboardFormat';

type AlertListProps = {
  alerts: AlertItem[];
};

const AlertList = ({ alerts }: AlertListProps) => {
  if (alerts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
        현재 활성 알림이 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {alerts.map((alert) => (
        <li
          key={alert.alert_id}
          className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${SEVERITY_STYLE[alert.severity]}`}
        >
          <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${SEVERITY_ICON_CLASS[alert.severity]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{alert.message}</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {alert.alert_type} · Risk {alert.risk_score}% · {toKST(alert.triggered_at)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {alert.severity}
          </span>
        </li>
      ))}
    </ul>
  );
};

export default AlertList;
