import type {
  DashboardAlert,
  DashboardOverview,
  DashboardStatsResponse,
  PriorityQueueItem,
} from "@/features/dashboard/dashboardTypes"

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function toString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback
}

export function normalizeDashboardStats(
  stats: Partial<DashboardStatsResponse>,
): DashboardOverview {
  const totalCalls = toNumber(stats.total_calls)
  const resolvedCount = toNumber(stats.resolved_count)

  return {
    totalCalls,
    resolvedCount,
    resolvedRate: totalCalls > 0 ? resolvedCount / totalCalls : 0,
    escalationCount: toNumber(stats.escalated_count),
    actionRequiredCount: toNumber(stats.action_required_count),
    mcpSuccessCount: toNumber(stats.mcp_success_count),
    mcpFailedCount: toNumber(stats.mcp_failed_count),
    partialSuccessCount: toNumber(stats.partial_success_count),
  }
}

export function normalizePriorityQueue(
  items: PriorityQueueItem[],
): DashboardAlert[] {
  return items.map((item, index) => ({
    id: toString(item.id, `alert-${index}`),
    callId: toString(item.call_id, ""),
    callerNumber: toString(item.caller_number, "번호 없음"),
    reason: toString(item.reason, "확인 필요"),
    priority: toString(item.priority, "normal"),
    createdAt: toString(item.created_at, ""),
  }))
}
