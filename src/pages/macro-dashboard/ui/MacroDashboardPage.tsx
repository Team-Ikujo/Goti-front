import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line,
  ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  ShieldAlert, ShieldCheck, Activity, MousePointer2,
  RefreshCw, AlertTriangle, Clock, Wifi, Sparkles, X, Loader2, BarChart2,
  Globe, ClipboardList, Ban, CheckCircle2,
} from 'lucide-react';
import {
  fetchDashboardOverview,
  fetchDetections,
  fetchMouseMacroSessions,
  fetchAlerts,
  fetchIPSummary,
  updateEventAction,
  analyzeGuardrailEvent,
  analyzeMouseMacroSession,
  analyzeIPViolations,
  type BlockedEventRow,
  type AlertItem,
  type MouseMacroSessionRow,
  type MouseEventItem,
  type IPSummaryItem,
} from '../api/dashboardApi';

// ─── 상수 ────────────────────────────────────

const REFETCH_MS = 15_000;

const STATUS_STYLE: Record<string, string> = {
  Blocked: 'bg-red-100 text-red-700',
  Passed:  'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-red-500 bg-red-50',
  high:     'border-orange-400 bg-orange-50',
  medium:   'border-yellow-400 bg-yellow-50',
};

const SEVERITY_ICON_CLASS: Record<string, string> = {
  critical: 'text-red-600',
  high:     'text-orange-500',
  medium:   'text-yellow-500',
};

const CHART_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444'];

// 이벤트 타입별 색상 / 이름
const EVENT_TYPE_META: Record<number, { label: string; color: string }> = {
  1: { label: '릴리즈',  color: '#94a3b8' },
  2: { label: '이동',    color: '#6366f1' },
  3: { label: '휠',      color: '#14b8a6' },
  4: { label: '드래그',  color: '#f59e0b' },
  5: { label: '클릭',    color: '#ef4444' },
};

// ─── 유틸 ────────────────────────────────────

function toKST(utcStr: string): string {
  if (!utcStr) return '-';
  try {
    return new Date(utcStr).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return utcStr.slice(0, 19).replace('T', ' ');
  }
}

// ─── 서브 컴포넌트 ────────────────────────────

function StatCard({
  label, value, unit, delta, icon,
}: {
  label: string;
  value: number | string;
  unit?: string;
  delta?: string;
  icon: React.ReactNode;
}) {
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
      {delta && (
        <span className="text-xs font-medium text-[var(--text-tertiary)]">{delta}</span>
      )}
    </div>
  );
}

function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null;
  const critical = alerts.filter(a => a.severity === 'critical');
  const label = critical.length > 0
    ? `위험 알림 ${critical.length}건 — 즉시 확인이 필요합니다`
    : `주의 알림 ${alerts.length}건이 발생했습니다`;

  return (
    <div className={`flex items-center gap-3 rounded-xl border-l-4 p-4 ${
      critical.length > 0 ? 'border-red-500 bg-red-50' : 'border-yellow-400 bg-yellow-50'
    }`}>
      <AlertTriangle className={`size-5 shrink-0 ${critical.length > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
    </div>
  );
}

function AlertList({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
        현재 활성 알림이 없습니다.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {alerts.map(a => (
        <li
          key={a.alert_id}
          className={`flex items-start gap-3 rounded-xl border-l-4 p-4 ${SEVERITY_STYLE[a.severity]}`}
        >
          <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${SEVERITY_ICON_CLASS[a.severity]}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{a.message}</p>
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              {a.alert_type} · Risk {a.risk_score}% · {toKST(a.triggered_at)}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[var(--text-secondary)]">
            {a.severity}
          </span>
        </li>
      ))}
    </ul>
  );
}

function DetectionsTable({
  rows,
  onAction,
  actionLoading,
  onAnalyze,
}: {
  rows: BlockedEventRow[];
  onAction: (eventId: string, action: 'Blocked' | 'Passed') => void;
  actionLoading: string | null;
  onAnalyze: (eventId: string) => void;
}) {
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
          {rows.map(row => (
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
}

// ─── 마우스 궤적 시각화 ───────────────────────

function MouseTrajectoryChart({ events }: { events: MouseEventItem[] }) {
  if (!events || events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">
        이벤트 데이터가 없습니다.
      </p>
    );
  }

  // 이벤트 타입별 그룹핑
  const grouped = [1, 2, 3, 4, 5].map(type => ({
    type,
    meta: EVENT_TYPE_META[type],
    data: events
      .filter(e => e.event_type === type)
      .map(e => ({ x: Math.round(e.screen_x), y: Math.round(e.screen_y) })),
  })).filter(g => g.data.length > 0);

  // 이동 궤적 (move 이벤트만 시간 순으로)
  const trajectory = [...events]
    .filter(e => e.event_type === 2)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(e => ({ x: Math.round(e.screen_x), y: Math.round(e.screen_y) }));

  // 이벤트 타입 집계
  const typeCounts = [1, 2, 3, 4, 5].map(type => ({
    name: EVENT_TYPE_META[type].label,
    count: events.filter(e => e.event_type === type).length,
    fill: EVENT_TYPE_META[type].color,
  })).filter(t => t.count > 0);

  // 시간대별 이벤트 밀도 (100ms 단위)
  const minTs = Math.min(...events.map(e => e.timestamp));
  const bucketMs = 500;
  const buckets: Record<number, number> = {};
  events.forEach(e => {
    const bucket = Math.floor((e.timestamp - minTs) / bucketMs);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  });
  const densityData = Object.entries(buckets)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([k, v]) => ({ t: `${(Number(k) * bucketMs / 1000).toFixed(1)}s`, count: v }));

  return (
    <div className="space-y-6">
      {/* 궤적 산점도 */}
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
              formatter={(val, name) => [val, name === 'x' ? 'X' : 'Y']}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            {/* 이동 궤적 라인 */}
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
            {/* 타입별 점 */}
            {grouped.map(g => (
              <Scatter
                key={g.type}
                name={g.meta.label}
                data={g.data}
                fill={g.meta.color}
                opacity={0.8}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* 이벤트 타입 분포 + 시간별 밀도 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">이벤트 타입 분포</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={typeCounts} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" width={50} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [`${v}회`]} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {typeCounts.map((t, i) => (
                  <Cell key={i} fill={t.fill} />
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
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} formatter={v => [`${v}회`]} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─── IP 분석 탭 ──────────────────────────────

function IPAnalysisTab({
  items,
  onAnalyze,
}: {
  items: IPSummaryItem[];
  onAnalyze: (ip: string) => void;
}) {
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
          {items.map(item => (
            <tr key={item.ip_address} className="hover:bg-[var(--neutral-50)]">
              <td className="py-2.5 pr-4 font-mono text-xs font-semibold text-[var(--text-primary)]">
                {item.ip_address}
              </td>
              <td className="py-2.5 pr-4 text-center text-[var(--text-secondary)]">
                {item.total_events}
              </td>
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
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">
                {item.detection_types || '-'}
              </td>
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">
                {toKST(item.first_seen)}
              </td>
              <td className="py-2.5 pr-4 text-xs text-[var(--text-secondary)]">
                {toKST(item.last_seen)}
              </td>
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
}

// ─── 수동 심사 탭 ─────────────────────────────

type ReviewSource = 'guardrail' | 'mouse';

export interface ReviewRow {
  id: string;
  source: ReviewSource;
  userId: string;
  ipAddress: string;
  riskScore: number;
  reasons: string;
  status: string;
  detectedAt: string;
}

function ReviewTab({
  detections,
  mouseSessions,
  onAnalyze,
  onAction,
  actionLoading,
}: {
  detections: BlockedEventRow[];
  mouseSessions: MouseMacroSessionRow[];
  onAnalyze: (row: ReviewRow) => void;
  onAction: (id: string, action: 'Blocked' | 'Passed') => void;
  actionLoading: string | null;
}) {
  const [sourceFilter, setSourceFilter] = useState<'all' | ReviewSource>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Blocked' | 'Passed' | 'Pending'>('all');
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());

  const rows: ReviewRow[] = [
    ...detections.map(e => ({
      id: e.event_id,
      source: 'guardrail' as ReviewSource,
      userId: e.user_id || '-',
      ipAddress: e.ip_address || '-',
      riskScore: e.risk_score,
      reasons: e.reason_codes?.join(', ') || e.detection_type || '-',
      status: e.status,
      detectedAt: e.blocked_at,
    })),
    ...mouseSessions.map(s => ({
      id: s.session_id,
      source: 'mouse' as ReviewSource,
      userId: s.user_id || '-',
      ipAddress: '-',
      riskScore: Math.round(s.probability * 100),
      reasons: `Mouse Macro (확률 ${(s.probability * 100).toFixed(1)}%, 신뢰도 ${(s.confidence * 100).toFixed(1)}%)`,
      status: 'Blocked',
      detectedAt: s.detected_at,
    })),
  ].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));

  const filtered = rows.filter(r => {
    if (sourceFilter !== 'all' && r.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    return true;
  });

  const handleMockBlockIP = (ip: string) => {
    if (ip === '-') return;
    setBlockedIPs(prev => new Set([...prev, ip]));
  };

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">
        심사할 탐지 이벤트가 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">출처</span>
          {(['all', 'guardrail', 'mouse'] as const).map(v => (
            <button
              key={v}
              onClick={() => setSourceFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                sourceFilter === v
                  ? 'bg-[var(--primary-normal)] text-white'
                  : 'bg-[var(--neutral-100)] text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]'
              }`}
            >
              {v === 'all' ? '전체' : v === 'guardrail' ? '가드레일' : '마우스 매크로'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">상태</span>
          {(['all', 'Blocked', 'Passed', 'Pending'] as const).map(v => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === v
                  ? 'bg-[var(--primary-normal)] text-white'
                  : 'bg-[var(--neutral-100)] text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]'
              }`}
            >
              {v === 'all' ? '전체' : v}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          {filtered.length}건 표시 / 전체 {rows.length}건
        </span>
      </div>

      {/* 이벤트 카드 목록 */}
      <div className="space-y-3">
        {filtered.map(row => {
          const isIPBlocked = row.ipAddress !== '-' && blockedIPs.has(row.ipAddress);
          return (
            <div
              key={row.id}
              className={`rounded-xl border p-4 transition-colors ${
                row.riskScore >= 80
                  ? 'border-red-200 bg-red-50/40'
                  : row.riskScore >= 50
                  ? 'border-orange-200 bg-orange-50/40'
                  : 'border-[var(--neutral-200)] bg-white'
              }`}
            >
              {/* 상단: 이벤트 정보 3열 */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">이벤트</p>
                  <p className="font-mono text-xs text-[var(--text-primary)]">{row.id.slice(0, 20)}</p>
                  <p className="mt-0.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                      row.source === 'guardrail'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {row.source === 'guardrail' ? '가드레일' : '마우스 매크로'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">사용자 / IP</p>
                  <p className="text-xs text-[var(--text-primary)]">User: {row.userId}</p>
                  <p className="text-xs text-[var(--text-secondary)] font-mono flex items-center gap-1 mt-0.5">
                    <Globe className="size-3" />
                    {row.ipAddress}
                    {isIPBlocked && (
                      <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-white text-[10px] font-bold">차단됨</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">위험도 / 시각</p>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--neutral-200)]">
                      <div
                        className={`h-full rounded-full ${row.riskScore >= 80 ? 'bg-red-500' : row.riskScore >= 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${row.riskScore}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{row.riskScore}%</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{toKST(row.detectedAt)}</p>
                </div>
              </div>

              {/* 탐지 사유 */}
              <p className="mt-2 text-xs text-[var(--text-tertiary)] bg-[var(--neutral-50)] rounded-lg px-3 py-2">
                탐지 사유: {row.reasons}
              </p>

              {/* 액션 버튼 */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* AI 심사 의견 */}
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-[#ede9fe] px-3 py-1.5 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                  onClick={() => onAnalyze(row)}
                >
                  <Sparkles className="size-3" />
                  AI 심사 의견
                </button>

                {/* 가드레일 이벤트만 차단/통과 가능 */}
                {row.source === 'guardrail' && (
                  <>
                    <button
                      disabled={row.status === 'Passed' || actionLoading === row.id}
                      className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => onAction(row.id, 'Passed')}
                    >
                      <CheckCircle2 className="size-3" />
                      통과
                    </button>
                    <button
                      disabled={row.status === 'Blocked' || actionLoading === row.id}
                      className="flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => onAction(row.id, 'Blocked')}
                    >
                      <Ban className="size-3" />
                      차단
                    </button>
                  </>
                )}

                {/* IP 모의 차단 (실제 차단 없이 UI 표시만) */}
                {row.ipAddress !== '-' && (
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isIPBlocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                    onClick={() => !isIPBlocked && handleMockBlockIP(row.ipAddress)}
                    disabled={isIPBlocked}
                    title="시뮬레이션 — 실제 네트워크 차단은 적용되지 않습니다"
                  >
                    <Globe className="size-3" />
                    {isIPBlocked ? 'IP 차단됨' : 'IP 차단 (모의)'}
                  </button>
                )}

                {/* 현재 상태 뱃지 */}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${
                  STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'
                }`}>
                  {row.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI 분석 모달 ─────────────────────────────

function AnalysisModal({
  title,
  analysis,
  isLoading,
  error,
  onClose,
}: {
  title: string;
  analysis: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-6 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[#6366f1]" />
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-[var(--neutral-100)] text-[var(--text-tertiary)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 py-5 min-h-[200px]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="size-8 animate-spin text-[#6366f1]" />
              <p className="text-sm text-[var(--text-tertiary)]">Upstage Solar가 분석 중입니다...</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {analysis && !isLoading && (
            <div className="prose prose-sm max-w-none">
              {analysis.split('\n').map((line, i) => {
                if (line.startsWith('##')) {
                  return <p key={i} className="mt-3 mb-1 text-sm font-bold text-[var(--text-primary)]">{line.replace(/^##\s*/, '')}</p>;
                }
                if (/^\d+\./.test(line) || line.startsWith('- ') || line.startsWith('• ')) {
                  return <p key={i} className="ml-3 text-sm text-[var(--text-secondary)] leading-relaxed">{line}</p>;
                }
                if (line.trim() === '') return <div key={i} className="h-2" />;
                return <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">{line}</p>;
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--neutral-200)] px-6 py-3">
          <p className="mr-auto text-xs text-[var(--text-tertiary)]">Powered by Upstage Solar</p>
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
}

// ─── 마우스 궤적 모달 ─────────────────────────

function TrajectoryModal({
  session,
  onClose,
}: {
  session: MouseMacroSessionRow;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--neutral-200)] px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="size-5 text-[#6366f1]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                마우스 궤적 분석
              </h2>
              <p className="text-xs text-[var(--text-tertiary)]">
                {session.session_id.slice(0, 20)} · 확률 {(session.probability * 100).toFixed(1)}% · {toKST(session.detected_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-[var(--neutral-100)] text-[var(--text-tertiary)]"
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
}

// ─── 메인 페이지 ──────────────────────────────

const MacroDashboardPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'guardrail' | 'mouse' | 'ip' | 'review'>('guardrail');

  const { data: overview, isLoading, isError, dataUpdatedAt } = useQuery({
    queryKey: ['macro-dashboard-overview'],
    queryFn: fetchDashboardOverview,
    refetchInterval: REFETCH_MS,
  });

  const { data: detections = [] } = useQuery({
    queryKey: ['macro-dashboard-detections'],
    queryFn: () => fetchDetections(100),
    refetchInterval: REFETCH_MS,
  });

  const { data: mouseSessions = [] } = useQuery({
    queryKey: ['macro-dashboard-mouse'],
    queryFn: () => fetchMouseMacroSessions(50),
    refetchInterval: REFETCH_MS,
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['macro-dashboard-alerts'],
    queryFn: () => fetchAlerts(20),
    refetchInterval: REFETCH_MS,
  });

  const { data: ipSummary = [] } = useQuery({
    queryKey: ['macro-dashboard-ip-summary'],
    queryFn: fetchIPSummary,
    refetchInterval: REFETCH_MS,
  });

  // ── AI 분석 모달 상태 ──
  const [analysisModal, setAnalysisModal] = useState<{
    open: boolean;
    title: string;
    analysis: string | null;
    isLoading: boolean;
    error: string | null;
  }>({ open: false, title: '', analysis: null, isLoading: false, error: null });

  const openAnalysis = (title: string) => {
    setAnalysisModal({ open: true, title, analysis: null, isLoading: true, error: null });
  };
  const closeAnalysis = () => {
    setAnalysisModal(prev => ({ ...prev, open: false }));
  };

  // ── 궤적 모달 상태 ──
  const [trajectorySession, setTrajectorySession] = useState<MouseMacroSessionRow | null>(null);

  const handleAnalyzeGuardrail = (eventId: string) => {
    openAnalysis(`가드레일 차단 분석 — ${eventId.slice(0, 14)}`);
    analyzeGuardrailEvent(eventId)
      .then(res => setAnalysisModal(prev => ({ ...prev, isLoading: false, analysis: res.analysis })))
      .catch(err => setAnalysisModal(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message ?? '분석 실패',
      })));
  };

  const handleAnalyzeMouseMacro = (sessionId: string) => {
    openAnalysis(`마우스 매크로 분석 — ${sessionId.slice(0, 16)}`);
    analyzeMouseMacroSession(sessionId)
      .then(res => setAnalysisModal(prev => ({ ...prev, isLoading: false, analysis: res.analysis })))
      .catch(err => setAnalysisModal(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message ?? '분석 실패',
      })));
  };

  const handleAnalyzeIP = (ipAddress: string) => {
    openAnalysis(`IP 종합 분석 — ${ipAddress}`);
    analyzeIPViolations(ipAddress)
      .then(res => setAnalysisModal(prev => ({ ...prev, isLoading: false, analysis: res.analysis })))
      .catch(err => setAnalysisModal(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message ?? '분석 실패',
      })));
  };

  const handleReviewAnalyze = (row: ReviewRow) => {
    const label = row.source === 'guardrail'
      ? `심사 의견 — ${row.id.slice(0, 14)} (가드레일)`
      : `심사 의견 — ${row.id.slice(0, 14)} (마우스 매크로)`;
    openAnalysis(label);

    const analyzePromise = row.source === 'guardrail'
      ? analyzeGuardrailEvent(row.id)
      : analyzeMouseMacroSession(row.id);

    analyzePromise
      .then(res => setAnalysisModal(prev => ({ ...prev, isLoading: false, analysis: res.analysis })))
      .catch(err => setAnalysisModal(prev => ({
        ...prev,
        isLoading: false,
        error: (err as Error).message ?? '분석 실패',
      })));
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { mutate: doAction } = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'Blocked' | 'Passed' }) =>
      updateEventAction(id, action),
    onMutate: ({ id }) => setActionLoading(id),
    onSettled: () => {
      setActionLoading(null);
      void queryClient.invalidateQueries({ queryKey: ['macro-dashboard-detections'] });
      void queryClient.invalidateQueries({ queryKey: ['macro-dashboard-overview'] });
    },
  });

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
      })
    : '-';

  if (isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background-surface)] p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Wifi className="size-12 text-red-400" />
          <p className="text-lg font-semibold text-[var(--text-primary)]">Go 서버에 연결할 수 없습니다</p>
          <p className="text-sm text-[var(--text-tertiary)]">macro-dashboard-api 서버가 실행 중인지 확인하세요.</p>
          <button
            className="rounded-xl bg-[var(--primary-normal)] px-6 py-2.5 text-sm font-semibold text-white"
            onClick={() => void queryClient.refetchQueries({ queryKey: ['macro-dashboard-overview'] })}
          >
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  const stats = overview?.stats;

  return (
    <>
    {analysisModal.open && (
      <AnalysisModal
        title={analysisModal.title}
        analysis={analysisModal.analysis}
        isLoading={analysisModal.isLoading}
        error={analysisModal.error}
        onClose={closeAnalysis}
      />
    )}
    {trajectorySession && (
      <TrajectoryModal
        session={trajectorySession}
        onClose={() => setTrajectorySession(null)}
      />
    )}
    <main className="min-h-screen bg-[var(--background-surface)] p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* ── 헤더 ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              AI 매크로 보안 대시보드
            </h1>
            <p className="mt-1 text-sm text-[var(--text-tertiary)]">
              가드레일 · 마우스 매크로 실시간 탐지 현황
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
              <Clock className="size-3.5" />
              마지막 업데이트: {lastUpdated} KST
            </span>
            <button
              className="flex items-center gap-1.5 rounded-xl border border-[var(--neutral-200)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] shadow-sm hover:bg-[var(--neutral-50)]"
              onClick={() => void queryClient.invalidateQueries()}
            >
              <RefreshCw className="size-4" />
              새로고침
            </button>
          </div>
        </div>

        {/* ── 알림 배너 ── */}
        <AlertBanner alerts={alerts} />

        {/* ── 통계 카드 ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-[var(--neutral-200)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label="가드레일 차단 건수"
              value={stats?.blocked_count ?? 0}
              unit="건"
              delta={stats?.blocked_delta}
              icon={<ShieldAlert className="size-5" />}
            />
            <StatCard
              label="마우스 매크로 탐지"
              value={stats?.mouse_macro_count ?? 0}
              unit="건"
              icon={<MousePointer2 className="size-5" />}
            />
            <StatCard
              label="총 탐지 건수"
              value={stats?.total_access ?? 0}
              unit="건"
              delta={stats?.total_access_delta}
              icon={<Activity className="size-5" />}
            />
            <StatCard
              label="차단율"
              value={stats?.block_rate?.toFixed(1) ?? '0'}
              unit="%"
              delta={stats?.block_rate_delta}
              icon={<ShieldCheck className="size-5" />}
            />
          </div>
        )}

        {/* ── 차트 2열 ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">탐지 유형 분포</h2>
            {(overview?.detection_types?.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">데이터 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={overview!.detection_types} layout="vertical" margin={{ left: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" width={90} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${v}건`, '탐지 수']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {overview!.detection_types.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
              최근 24시간 탐지 트렌드 (KST)
            </h2>
            {(overview?.hourly_trend?.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--text-tertiary)]">데이터 없음</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={overview!.hourly_trend} margin={{ left: 0, right: 8 }}>
                  <XAxis
                    dataKey="hour"
                    tick={{ fontSize: 11 }}
                    tickFormatter={h => `${((Number(h) + 9) % 24).toString().padStart(2, '0')}시`}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v) => [`${v}건`, '탐지']}
                    labelFormatter={h => `${((Number(h) + 9) % 24).toString().padStart(2, '0')}시 (KST)`}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── 탐지 이벤트 테이블 (탭) ── */}
        <div className="rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm">
          <div className="flex items-center gap-1 border-b border-[var(--neutral-200)] px-5 pt-4 overflow-x-auto">
            {([
              { key: 'guardrail', label: `가드레일 탐지 (${detections.length})`, icon: <ShieldAlert className="size-3.5" /> },
              { key: 'mouse',     label: `마우스 매크로 (${mouseSessions.length})`, icon: <MousePointer2 className="size-3.5" /> },
              { key: 'ip',        label: `IP 분석 (${ipSummary.length})`, icon: <Globe className="size-3.5" /> },
              { key: 'review',    label: `수동 심사 (${detections.length + mouseSessions.length})`, icon: <ClipboardList className="size-3.5" /> },
            ] as const).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'border-b-2 border-[var(--primary-normal)] text-[var(--primary-normal)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {tab === 'guardrail' ? (
              <DetectionsTable
                rows={detections}
                onAction={(id, action) => doAction({ id, action })}
                actionLoading={actionLoading}
                onAnalyze={handleAnalyzeGuardrail}
              />
            ) : tab === 'ip' ? (
              <IPAnalysisTab
                items={ipSummary}
                onAnalyze={handleAnalyzeIP}
              />
            ) : tab === 'review' ? (
              <ReviewTab
                detections={detections}
                mouseSessions={mouseSessions}
                onAnalyze={handleReviewAnalyze}
                onAction={(id, action) => doAction({ id, action })}
                actionLoading={actionLoading}
              />
            ) : (
              mouseSessions.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--text-tertiary)]">
                  수신된 마우스 매크로 세션이 없습니다.
                </p>
              ) : (
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
                      {mouseSessions.map(s => (
                        <tr key={s.session_id} className="hover:bg-[var(--neutral-50)]">
                          <td className="py-2.5 pr-4 font-mono text-xs text-[var(--text-secondary)]">
                            {s.session_id.slice(0, 16)}
                          </td>
                          <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                            {s.user_id || '-'}
                          </td>
                          <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                            {toKST(s.detected_at)}
                          </td>
                          <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                            {s.event_count.toLocaleString()}개
                          </td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--neutral-200)]">
                                <div
                                  className="h-full rounded-full bg-[#6366f1]"
                                  style={{ width: `${Math.round(s.probability * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                                {(s.probability * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                              {(s.confidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 pr-4">
                            <button
                              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                              onClick={() => setTrajectorySession(s)}
                            >
                              <BarChart2 className="size-3" />
                              궤적
                            </button>
                          </td>
                          <td className="py-2.5">
                            <button
                              className="flex items-center gap-1 rounded-lg bg-[#ede9fe] px-2 py-1 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                              onClick={() => handleAnalyzeMouseMacro(s.session_id)}
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
              )
            )}
          </div>
        </div>

        {/* ── 활성 알림 목록 ── */}
        <div className="rounded-2xl border border-[var(--neutral-200)] bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
            활성 알림 (Risk ≥ 80%)
          </h2>
          <AlertList alerts={alerts} />
        </div>

      </div>
    </main>
    </>
  );
};

export default MacroDashboardPage;
