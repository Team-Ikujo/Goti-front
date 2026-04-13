import {
  BarChart,
  Bar,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { MouseEventItem } from '../../api/dashboardApi';
import { EVENT_TYPE_META } from '../lib/dashboardConstants';

type MouseTrajectoryChartProps = {
  events: MouseEventItem[];
};

const MouseTrajectoryChart = ({ events }: MouseTrajectoryChartProps) => {
  if (!events || events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">
        이벤트 데이터가 없습니다.
      </p>
    );
  }

  const grouped = [1, 2, 3, 4, 5]
    .map((type) => ({
      type,
      meta: EVENT_TYPE_META[type],
      data: events
        .filter((event) => event.event_type === type)
        .map((event) => ({ x: Math.round(event.screen_x), y: Math.round(event.screen_y) })),
    }))
    .filter((group) => group.data.length > 0);

  const trajectory = [...events]
    .filter((event) => event.event_type === 2)
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((event) => ({ x: Math.round(event.screen_x), y: Math.round(event.screen_y) }));

  const typeCounts = [1, 2, 3, 4, 5]
    .map((type) => ({
      name: EVENT_TYPE_META[type].label,
      count: events.filter((event) => event.event_type === type).length,
      fill: EVENT_TYPE_META[type].color,
    }))
    .filter((item) => item.count > 0);

  const minTimestamp = Math.min(...events.map((event) => event.timestamp));
  const bucketMs = 500;
  const buckets: Record<number, number> = {};

  events.forEach((event) => {
    const bucket = Math.floor((event.timestamp - minTimestamp) / bucketMs);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  });

  const densityData = Object.entries(buckets)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([bucket, count]) => ({
      t: `${((Number(bucket) * bucketMs) / 1000).toFixed(1)}s`,
      count,
    }));

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">마우스 궤적 (화면 좌표)</p>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="X"
              tick={{ fontSize: 10 }}
              label={{ value: 'screen_x', position: 'insideBottom', offset: -4, fontSize: 10 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Y"
              reversed
              tick={{ fontSize: 10 }}
              label={{ value: 'screen_y', angle: -90, position: 'insideLeft', fontSize: 10 }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value, name) => [value, name === 'x' ? 'X' : 'Y']}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {trajectory.length > 1 && (
              <Scatter
                name="이동경로"
                data={trajectory}
                line={{ stroke: '#6366f1', strokeWidth: 1, strokeOpacity: 0.3 }}
                lineType="joint"
                fill="transparent"
                legendType="none"
              />
            )}
            {grouped.map((group) => (
              <Scatter
                key={group.type}
                name={group.meta.label}
                data={group.data}
                fill={group.meta.color}
                opacity={0.8}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">이벤트 타입 분포</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={typeCounts} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => [`${value}회`]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {typeCounts.map((item, index) => (
                  <Cell key={index} fill={item.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">시간대별 이벤트 밀도 (0.5s)</p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={densityData} margin={{ left: 0, right: 8 }}>
              <XAxis dataKey="t" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={(value) => [`${value}회`]} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MouseTrajectoryChart;
