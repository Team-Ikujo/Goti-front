import { useState } from 'react';
import { Ban, CheckCircle2, Globe, Sparkles } from 'lucide-react';

import type { BlockedEventRow, MouseMacroSessionRow } from '../../api/dashboardApi';
import { STATUS_STYLE } from '../lib/dashboardConstants';
import { toKST } from '../lib/dashboardFormat';
import type { ReviewRow, ReviewSource } from '../types';

type ReviewTabProps = {
  detections: BlockedEventRow[];
  mouseSessions: MouseMacroSessionRow[];
  onAnalyze: (row: ReviewRow) => void;
  onAction: (id: string, action: 'Blocked' | 'Passed') => void;
  actionLoading: string | null;
};

const ReviewTab = ({
  detections,
  mouseSessions,
  onAnalyze,
  onAction,
  actionLoading,
}: ReviewTabProps) => {
  const [sourceFilter, setSourceFilter] = useState<'all' | ReviewSource>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Blocked' | 'Passed' | 'Pending'>('all');
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());

  const rows: ReviewRow[] = [
    ...detections.map((event) => ({
      id: event.event_id,
      source: 'guardrail' as const,
      userId: event.user_id || '-',
      ipAddress: event.ip_address || '-',
      riskScore: event.risk_score,
      reasons: event.reason_codes?.join(', ') || event.detection_type || '-',
      status: event.status,
      detectedAt: event.blocked_at,
    })),
    ...mouseSessions.map((session) => ({
      id: session.session_id,
      source: 'mouse' as const,
      userId: session.user_id || '-',
      ipAddress: '-',
      riskScore: Math.round(session.probability * 100),
      reasons: `Mouse Macro (확률 ${(session.probability * 100).toFixed(1)}%, 신뢰도 ${(session.confidence * 100).toFixed(1)}%)`,
      status: 'Blocked',
      detectedAt: session.detected_at,
    })),
  ].sort((left, right) => right.detectedAt.localeCompare(left.detectedAt));

  const filteredRows = rows.filter((row) => {
    if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
    if (statusFilter !== 'all' && row.status !== statusFilter) return false;
    return true;
  });

  const handleMockBlockIp = (ipAddress: string) => {
    if (ipAddress === '-') return;
    setBlockedIps((prev) => new Set([...prev, ipAddress]));
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
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">출처</span>
          {(['all', 'guardrail', 'mouse'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSourceFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                sourceFilter === value
                  ? 'bg-[var(--primary-normal)] text-white'
                  : 'bg-[var(--neutral-100)] text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]'
              }`}
            >
              {value === 'all' ? '전체' : value === 'guardrail' ? '가드레일' : '마우스 매크로'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-tertiary)]">상태</span>
          {(['all', 'Blocked', 'Passed', 'Pending'] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === value
                  ? 'bg-[var(--primary-normal)] text-white'
                  : 'bg-[var(--neutral-100)] text-[var(--text-secondary)] hover:bg-[var(--neutral-200)]'
              }`}
            >
              {value === 'all' ? '전체' : value}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[var(--text-tertiary)]">
          {filteredRows.length}건 표시 / 전체 {rows.length}건
        </span>
      </div>

      <div className="space-y-3">
        {filteredRows.map((row) => {
          const isIpBlocked = row.ipAddress !== '-' && blockedIps.has(row.ipAddress);

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
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--text-tertiary)]">이벤트</p>
                  <p className="font-mono text-xs text-[var(--text-primary)]">{row.id.slice(0, 20)}</p>
                  <p className="mt-0.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.source === 'guardrail' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {row.source === 'guardrail' ? '가드레일' : '마우스 매크로'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--text-tertiary)]">사용자 / IP</p>
                  <p className="text-xs text-[var(--text-primary)]">User: {row.userId}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-[var(--text-secondary)]">
                    <Globe className="size-3" />
                    {row.ipAddress}
                    {isIpBlocked && (
                      <span className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        차단됨
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold text-[var(--text-tertiary)]">위험도 / 시각</p>
                  <div className="mb-0.5 flex items-center gap-2">
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

              <p className="mt-2 rounded-lg bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--text-tertiary)]">
                탐지 사유: {row.reasons}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  className="flex items-center gap-1.5 rounded-lg bg-[#ede9fe] px-3 py-1.5 text-xs font-semibold text-[#6366f1] hover:bg-[#ddd6fe]"
                  onClick={() => onAnalyze(row)}
                >
                  <Sparkles className="size-3" />
                  AI 심사 의견
                </button>

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

                {row.ipAddress !== '-' && (
                  <button
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isIpBlocked
                        ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    }`}
                    onClick={() => !isIpBlocked && handleMockBlockIp(row.ipAddress)}
                    disabled={isIpBlocked}
                    title="시뮬레이션 — 실제 네트워크 차단은 적용되지 않습니다"
                  >
                    <Globe className="size-3" />
                    {isIpBlocked ? 'IP 차단됨' : 'IP 차단 (모의)'}
                  </button>
                )}

                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[row.status] ?? 'bg-gray-100 text-gray-700'}`}>
                  {row.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReviewTab;
