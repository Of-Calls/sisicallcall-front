import type {
  DashboardAlert,
  DashboardKeywordStatsItem,
  DashboardKeywordStatsResponseItem,
  DashboardOverview,
  DashboardPriorityDistributionItem,
  DashboardPriorityDistributionResponseItem,
  DashboardStatsResponse,
  PriorityQueueItem,
  DashboardPriorityLevel,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizePriorityLevel(
  value: string,
): DashboardPriorityLevel | null {
  if (value === "critical" || value === "urgent") return "urgent"
  if (value === "high") return "high"
  if (value === "medium" || value === "normal") return "medium"
  if (value === "low") return "low"
  return null
}

function extractArrayPayload<T>(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as T[]
  }

  if (isRecord(payload) && Array.isArray(payload.items)) {
    return payload.items as T[]
  }

  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data as T[]
  }

  return []
}

function normalizeKeywordItem(
  item: DashboardKeywordStatsResponseItem,
): DashboardKeywordStatsItem {
  return {
    keyword: toString(item.keyword, toString(item.label, "기타")),
    count: toNumber(item.count),
  }
}

export function normalizeDashboardKeywordStats(
  payload: unknown,
): DashboardKeywordStatsItem[] {
  return extractArrayPayload<DashboardKeywordStatsResponseItem>(payload).map(
    normalizeKeywordItem,
  )
}

function normalizePriorityLabel(priority: DashboardPriorityLevel): string {
  switch (priority) {
    case "urgent":
      return "긴급"
    case "high":
      return "높음"
    case "medium":
      return "보통"
    case "low":
    default:
      return "낮음"
  }
}

export function normalizeDashboardPriorityDistribution(
  payload: unknown,
): DashboardPriorityDistributionItem[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        const record = item as DashboardPriorityDistributionResponseItem
        const priority = normalizePriorityLevel(
          toString(record.priority).toLowerCase(),
        )

        if (!priority) {
          return null
        }

        return {
          priority,
          label: toString(record.label, normalizePriorityLabel(priority)),
          count: toNumber(record.count),
        }
      })
      .filter(
        (item): item is DashboardPriorityDistributionItem => item !== null,
      )
  }

  const record = isRecord(payload) ? (payload as Record<string, unknown>) : {}

  return (["urgent", "high", "medium", "low"] as DashboardPriorityLevel[]).map(
    (priority) => {
      const count =
        priority === "urgent"
          ? toNumber(record.urgent ?? record.critical)
          : priority === "medium"
            ? toNumber(record.medium ?? record.normal)
            : toNumber(record[priority])

      return {
        priority,
        label: normalizePriorityLabel(priority),
        count,
      }
    },
  )
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

    const suggestedAction =
      typeof item.suggested_action === "string"
        ? item.suggested_action
        : typeof item.suggestedAction === "string"
          ? item.suggestedAction
          : undefined

    const keywords = Array.isArray(item.keywords)
      ? item.keywords.filter(
          (keyword): keyword is string =>
            typeof keyword === "string" && keyword.trim().length > 0,
        )
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
      suggestedAction,
      keywords,
      priority: normalizePriorityLevel(toString(item.priority, "low")) ?? "low",
      createdAt: toString(item.created_at, ""),
      actionRequired,
      resolutionStatus,
      followUpRequired,
    }
  })
}
