export const REFETCH_MS = 15_000;

export const STATUS_STYLE: Record<string, string> = {
  Blocked: 'bg-red-100 text-red-700',
  Passed: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
};

export const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-400 bg-orange-50',
  medium: 'border-yellow-400 bg-yellow-50',
};

export const SEVERITY_ICON_CLASS: Record<string, string> = {
  critical: 'text-red-600',
  high: 'text-orange-500',
  medium: 'text-yellow-500',
};

export const CHART_COLORS = ['#6366f1', '#14b8a6', '#f59e0b', '#ef4444'];

export const EVENT_TYPE_META: Record<number, { label: string; color: string }> = {
  1: { label: '릴리즈', color: '#94a3b8' },
  2: { label: '이동', color: '#6366f1' },
  3: { label: '휠', color: '#14b8a6' },
  4: { label: '드래그', color: '#f59e0b' },
  5: { label: '클릭', color: '#ef4444' },
};
