import axios from 'axios';

const BASE_URL = (import.meta.env.PUBLIC_MACRO_DASHBOARD_API_URL ?? '').trim();

const client = axios.create({ baseURL: BASE_URL });

// ─── 타입 정의 ───────────────────────────────

export interface StatsSummary {
  total_access: number;
  total_access_delta: string;
  unique_users: number;
  unique_users_delta: string;
  blocked_count: number;
  blocked_delta: string;
  block_rate: number;
  block_rate_delta: string;
  mouse_macro_count: number;
}

export interface BlockedEventRow {
  event_id: string;
  session_id: string;
  access_date: string;
  access_time: string;
  ip_address: string;
  detection_type: string;
  status: string;
  risk_score: number;
  reason_codes: string[];
  user_id: string;
  blocked_at: string;
}

export interface MouseEventItem {
  timestamp: number;  // Unix ms
  event_type: number; // 1=release 2=move 3=wheel 4=drag 5=click
  screen_x: number;
  screen_y: number;
}

export interface MouseMacroSessionRow {
  session_id: string;
  user_id: string;
  probability: number;
  confidence: number;
  event_count: number;
  events: MouseEventItem[];
  detected_at: string;
}

export interface DetectionTypeItem {
  type: string;
  count: number;
}

export interface HourlyTrendItem {
  hour: string;
  count: number;
}

export interface RiskDistributionItem {
  range: string;
  count: number;
}

export interface AlertItem {
  alert_id: string;
  session_id: string;
  user_id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium';
  risk_score: number;
  message: string;
  triggered_at: string;
}

export interface DashboardOverview {
  stats: StatsSummary;
  detection_types: DetectionTypeItem[];
  hourly_trend: HourlyTrendItem[];
  risk_distribution: RiskDistributionItem[];
  recent_guardrail: BlockedEventRow[];
  recent_mouse_macro: MouseMacroSessionRow[];
}

// ─── API 함수 ────────────────────────────────

export const fetchDashboardOverview = async (): Promise<DashboardOverview> => {
  const res = await client.get<DashboardOverview>('/api/v1/dashboard/overview');
  return res.data;
};

export const fetchDetections = async (limit = 100): Promise<BlockedEventRow[]> => {
  const res = await client.get<BlockedEventRow[]>('/api/v1/detections', { params: { limit } });
  return res.data;
};

export const fetchMouseMacroSessions = async (limit = 50): Promise<MouseMacroSessionRow[]> => {
  const res = await client.get<MouseMacroSessionRow[]>('/api/v1/mouse-macro/sessions', { params: { limit } });
  return res.data;
};

export const fetchAlerts = async (limit = 30): Promise<AlertItem[]> => {
  const res = await client.get<AlertItem[]>('/api/v1/alerts', { params: { limit } });
  return res.data;
};

export const updateEventAction = async (eventId: string, action: 'Blocked' | 'Passed') => {
  const res = await client.post(`/api/v1/interventions/${encodeURIComponent(eventId)}/action`, { action });
  return res.data;
};

export interface IPSummaryItem {
  ip_address: string;
  total_events: number;
  blocked_count: number;
  max_risk: number;        // 0~100
  first_seen: string;
  last_seen: string;
  detection_types: string; // comma-separated
}

export interface AnalysisResponse {
  event_id: string;
  analysis: string;
}

export const analyzeGuardrailEvent = async (eventId: string): Promise<AnalysisResponse> => {
  const res = await client.post<AnalysisResponse>(`/api/v1/analysis/guardrail/${encodeURIComponent(eventId)}`);
  return res.data;
};

export const analyzeMouseMacroSession = async (sessionId: string): Promise<AnalysisResponse> => {
  const res = await client.post<AnalysisResponse>(`/api/v1/analysis/mouse-macro/${encodeURIComponent(sessionId)}`);
  return res.data;
};

export const fetchIPSummary = async (): Promise<IPSummaryItem[]> => {
  const res = await client.get<IPSummaryItem[]>('/api/v1/analysis/ip-summary');
  return res.data;
};

export const analyzeIPViolations = async (ipAddress: string): Promise<AnalysisResponse> => {
  const res = await client.post<AnalysisResponse>(`/api/v1/analysis/ip/${encodeURIComponent(ipAddress)}`);
  return res.data;
};
