import type { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: number | string;
  unit?: string;
  delta?: string;
  icon: ReactNode;
};

const StatCard = ({ label, value, unit, delta, icon }: StatCardProps) => {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--text-tertiary)]">{label}</span>
        <span className="text-[var(--text-tertiary)]">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="mb-0.5 text-sm text-[var(--text-tertiary)]">{unit}</span>}
      </div>
      {delta && <span className="text-xs font-medium text-[var(--text-tertiary)]">{delta}</span>}
    </div>
  );
};

export default StatCard;
