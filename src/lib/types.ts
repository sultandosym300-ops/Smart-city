export type ReportStatus =
  | "new"
  | "approved"
  | "in_progress"
  | "awaiting_confirmation"
  | "completed"
  | "returned";
export type ReportPriority = "low" | "medium" | "high";
export type ReportCategory =
  | "roads"
  | "water"
  | "electricity"
  | "sanitation"
  | "transport"
  | "emergency"
  | "other";

export interface ReportRow {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  anon_name: string | null;
  anon_phone: string | null;
  description: string;
  photo_url: string | null;
  lat: number;
  lng: number;
  address: string | null;
  district: string | null;
  status: ReportStatus;
  category: ReportCategory | null;
  priority: ReportPriority | null;
  service_id: string | null;
  assigned_to: string | null;
  taken_at: string | null;
  awaiting_at: string | null;
  completed_at: string | null;
  completion_photo_url: string | null;
  completion_comment: string | null;
}

export interface ServiceRow {
  id: string;
  code: ReportCategory;
  name_ru: string;
  name_kk: string;
}

export interface AiAnalysisRow {
  id: string;
  report_id: string;
  category: ReportCategory | null;
  priority: ReportPriority | null;
  service_code: ReportCategory | null;
  reason: string | null;
  solution: string | null;
  raw: unknown;
  created_at: string;
}