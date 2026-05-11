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
  return items.map((item, index) => {
    const actionRequired =
      typeof item.action_required === "boolean"
        ? item.action_required
        : typeof item.actionRequired === "boolean"
          ? item.actionRequired
          : undefined

    const resolutionStatus =
      item.resolution_status === "resolved" ||
      item.resolution_status === "escalated" ||
      item.resolution_status === "abandoned"
        ? item.resolution_status
        : item.resolutionStatus === "resolved" ||
            item.resolutionStatus === "escalated" ||
            item.resolutionStatus === "abandoned"
          ? item.resolutionStatus
          : null

    const followUpRequired =
      typeof item.follow_up_required === "boolean"
        ? item.follow_up_required
        : typeof item.followUpRequired === "boolean"
          ? item.followUpRequired
          : undefined

    return {
      id: toString(item.id, `alert-${index}`),
      callId: toString(item.call_id, ""),
      tenantId: toString(item.tenant_id, ""),
      callerNumber: toString(item.caller_number, "-"),
      reason: toString(item.reason, "조치 확인 필요"),
      summaryShort: toString(item.summary_short, ""),
      primaryCategory:
        typeof item.primary_category === "string"
          ? item.primary_category
          : null,
      priority: toString(item.priority, "normal"),
      createdAt: toString(item.created_at, ""),
      actionRequired,
      resolutionStatus,
      followUpRequired,
    }
  })
}
