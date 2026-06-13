import { useI18n } from "@/lib/i18n";
import type { ReportStatus, ReportPriority } from "@/lib/types";

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { t } = useI18n();
  const map: Record<ReportStatus, string> = {
    new: "bg-blue-500/15 text-blue-700",
    approved: "bg-indigo-500/15 text-indigo-700",
    in_progress: "bg-amber-500/15 text-amber-800",
    awaiting_confirmation: "bg-purple-500/15 text-purple-700",
    completed: "bg-emerald-500/15 text-emerald-800",
    returned: "bg-rose-500/15 text-rose-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {t(`report.status.${status}` as const)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ReportPriority | null }) {
  const { t } = useI18n();
  if (!priority) return null;
  const map: Record<ReportPriority, string> = {
    high: "bg-red-500/15 text-red-700",
    medium: "bg-amber-500/15 text-amber-800",
    low: "bg-slate-500/15 text-slate-700",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[priority]}`}>
      ⚑ {t(`report.priority.${priority}` as const)}
    </span>
  );
}