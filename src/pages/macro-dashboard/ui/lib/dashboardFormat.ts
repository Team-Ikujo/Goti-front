export function toKST(utcStr: string): string {
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

export function formatDashboardUpdateTime(timestamp: number): string {
  if (!timestamp) {
    return '-';
  }

  return new Date(timestamp).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
