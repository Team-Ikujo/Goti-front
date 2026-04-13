export type ReviewSource = 'guardrail' | 'mouse';

export type DashboardTabKey = 'guardrail' | 'mouse' | 'ip' | 'review';

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
