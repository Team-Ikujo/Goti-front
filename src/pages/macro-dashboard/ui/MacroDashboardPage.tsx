import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ClipboardList,
  Clock,
  Globe,
  MousePointer2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Wifi,
} from 'lucide-react';

import {
  analyzeGuardrailEvent,
  analyzeIPViolations,
  analyzeMouseMacroSession,
  fetchAlerts,
  fetchDashboardOverview,
  fetchDetections,
  fetchIPSummary,
  fetchMouseMacroSessions,
  type MouseMacroSessionRow,
  updateEventAction,
} from '../api/dashboardApi';
import AlertBanner from './components/AlertBanner';
import AlertList from './components/AlertList';
import AnalysisModal from './components/AnalysisModal';
import DashboardCharts from './components/DashboardCharts';
import DetectionsTable from './components/DetectionsTable';
import IPAnalysisTab from './components/IPAnalysisTab';
import MouseSessionsTable from './components/MouseSessionsTable';
import ReviewTab from './components/ReviewTab';
import StatCard from './components/StatCard';
import TrajectoryModal from './components/TrajectoryModal';
import { REFETCH_MS } from './lib/dashboardConstants';
import { formatDashboardUpdateTime } from './lib/dashboardFormat';
import type { DashboardTabKey, ReviewRow } from './types';

type AnalysisModalState = {
  open: boolean;
  title: string;
  analysis: string | null;
  isLoading: boolean;
  error: string | null;
};

const DEFAULT_ANALYSIS_MODAL_STATE: AnalysisModalState = {
  open: false,
  title: '',
  analysis: null,
  isLoading: false,
  error: null,
};

const TAB_ITEMS: Array<{ key: DashboardTabKey; label: string; countKey: 'detections' | 'mouse' | 'ip' | 'review' }> = [
  { key: 'guardrail', label: '가드레일 탐지', countKey: 'detections' },
  { key: 'mouse', label: '마우스 매크로', countKey: 'mouse' },
  { key: 'ip', label: 'IP 분석', countKey: 'ip' },
  { key: 'review', label: '수동 심사', countKey: 'review' },
];

const TAB_ICONS = {
  guardrail: <ShieldAlert className="size-3.5" />,
  mouse: <MousePointer2 className="size-3.5" />,
  ip: <Globe className="size-3.5" />,
  review: <ClipboardList className="size-3.5" />,
} satisfies Record<DashboardTabKey, React.ReactNode>;

const MacroDashboardPage = () => {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<DashboardTabKey>('guardrail');
  const [trajectorySession, setTrajectorySession] = useState<MouseMacroSessionRow | null>(null);
  const [analysisModal, setAnalysisModal] = useState<AnalysisModalState>(DEFAULT_ANALYSIS_MODAL_STATE);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

  const openAnalysis = (title: string) => {
    setAnalysisModal({
      open: true,
      title,
      analysis: null,
      isLoading: true,
      error: null,
    });
  };

  const closeAnalysis = () => {
    setAnalysisModal((prev) => ({ ...prev, open: false }));
  };

  const applyAnalysisSuccess = (analysis: string) => {
    setAnalysisModal((prev) => ({ ...prev, isLoading: false, analysis }));
  };

  const applyAnalysisError = (error: unknown) => {
    setAnalysisModal((prev) => ({
      ...prev,
      isLoading: false,
      error: (error as Error).message ?? '분석 실패',
    }));
  };

  const handleAnalyzeGuardrail = (eventId: string) => {
    openAnalysis(`가드레일 차단 분석 — ${eventId.slice(0, 14)}`);
    analyzeGuardrailEvent(eventId).then((res) => applyAnalysisSuccess(res.analysis)).catch(applyAnalysisError);
  };

  const handleAnalyzeMouseMacro = (sessionId: string) => {
    openAnalysis(`마우스 매크로 분석 — ${sessionId.slice(0, 16)}`);
    analyzeMouseMacroSession(sessionId).then((res) => applyAnalysisSuccess(res.analysis)).catch(applyAnalysisError);
  };

  const handleAnalyzeIp = (ipAddress: string) => {
    openAnalysis(`IP 종합 분석 — ${ipAddress}`);
    analyzeIPViolations(ipAddress).then((res) => applyAnalysisSuccess(res.analysis)).catch(applyAnalysisError);
  };

  const handleReviewAnalyze = (row: ReviewRow) => {
    const title =
      row.source === 'guardrail'
        ? `심사 의견 — ${row.id.slice(0, 14)} (가드레일)`
        : `심사 의견 — ${row.id.slice(0, 14)} (마우스 매크로)`;

    openAnalysis(title);

    const request =
      row.source === 'guardrail' ? analyzeGuardrailEvent(row.id) : analyzeMouseMacroSession(row.id);

    request.then((res) => applyAnalysisSuccess(res.analysis)).catch(applyAnalysisError);
  };

  const lastUpdated = formatDashboardUpdateTime(dataUpdatedAt);
  const stats = overview?.stats;
  const tabCounts = {
    detections: detections.length,
    mouse: mouseSessions.length,
    ip: ipSummary.length,
    review: detections.length + mouseSessions.length,
  };

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
        <TrajectoryModal session={trajectorySession} onClose={() => setTrajectorySession(null)} />
      )}

      <main className="min-h-screen bg-[var(--background-surface)] p-6">
        <div className="mx-auto max-w-7xl space-y-6">
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

          <AlertBanner alerts={alerts} />

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-2xl bg-[var(--neutral-200)]" />
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

          <DashboardCharts overview={overview} />

          <div className="rounded-2xl border border-[var(--neutral-200)] bg-white shadow-sm">
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[var(--neutral-200)] px-5 pt-4">
              {TAB_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setTab(item.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    tab === item.key
                      ? 'border-b-2 border-[var(--primary-normal)] text-[var(--primary-normal)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {TAB_ICONS[item.key]}
                  {item.label} ({tabCounts[item.countKey]})
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'guardrail' && (
                <DetectionsTable
                  rows={detections}
                  onAction={(id, action) => doAction({ id, action })}
                  actionLoading={actionLoading}
                  onAnalyze={handleAnalyzeGuardrail}
                />
              )}
              {tab === 'mouse' && (
                <MouseSessionsTable
                  sessions={mouseSessions}
                  onAnalyze={handleAnalyzeMouseMacro}
                  onOpenTrajectory={setTrajectorySession}
                />
              )}
              {tab === 'ip' && <IPAnalysisTab items={ipSummary} onAnalyze={handleAnalyzeIp} />}
              {tab === 'review' && (
                <ReviewTab
                  detections={detections}
                  mouseSessions={mouseSessions}
                  onAnalyze={handleReviewAnalyze}
                  onAction={(id, action) => doAction({ id, action })}
                  actionLoading={actionLoading}
                />
              )}
            </div>
          </div>

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
