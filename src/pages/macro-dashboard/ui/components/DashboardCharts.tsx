import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { DashboardOverview, DetectionTypeItem } from '../../api/dashboardApi';
import { CHART_COLORS } from '../lib/dashboardConstants';

type DashboardChartsProps = {
  overview?: DashboardOverview;
  detectionTypes: DetectionTypeItem[];
};

const DashboardCharts = ({ overview, detectionTypes }: DashboardChartsProps) => {
  const hasDetectionTypes = detectionTypes.some((item) => item.count > 0);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">탐지 유형 분포</h2>
        {!hasDetectionTypes ? (
          <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={detectionTypes} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value) => [`${value}건`, '탐지 수']} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {detectionTypes.map((_, index) => (
                  <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">최근 24시간 탐지 트렌드 (KST)</h2>
        {(overview?.hourly_trend?.length ?? 0) === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">데이터 없음</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={overview?.hourly_trend} margin={{ left: 0, right: 8 }}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11 }}
                tickFormatter={(hour) => `${((Number(hour) + 9) % 24).toString().padStart(2, '0')}시`}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value) => [`${value}건`, '탐지']}
                labelFormatter={(hour) => `${((Number(hour) + 9) % 24).toString().padStart(2, '0')}시 (KST)`}
              />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default DashboardCharts;
