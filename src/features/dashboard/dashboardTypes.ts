export type DashboardStatsResponse = {
  total_calls: number
  resolved_count: number
  escalated_count: number
  action_required_count: number
  mcp_success_count: number
  mcp_failed_count: number
  partial_success_count: number
}

export type DashboardOverview = {
  totalCalls: number
  resolvedCount: number
  resolvedRate: number
  escalationCount: number
  actionRequiredCount: number
  mcpSuccessCount: number
  mcpFailedCount: number
  partialSuccessCount: number
}

export type DashboardKeywordStatsResponseItem = {
  keyword?: string
  label?: string
  count?: number | string
}

export type DashboardKeywordStatsItem = {
  keyword: string
  count: number
}

export type DashboardKeywordStatsParams = {
  limit?: number
  from?: string
  to?: string
}

export type DashboardPriorityLevel =
  | "urgent"
  | "high"
  | "medium"
  | "low"

export type DashboardPriorityDistributionRecord = Partial<
  Record<DashboardPriorityLevel | "critical" | "normal", number | string>
>

export type DashboardPriorityDistributionResponseItem = {
  priority?: string
  label?: string
  count?: number | string
}

export type DashboardPriorityDistributionItem = {
  priority: DashboardPriorityLevel
  label: string
  count: number
}

export type DashboardPriorityDistributionParams = {
  from?: string
  to?: string
}

export type PriorityQueueItem = {
  id?: string
  call_id?: string
  tenant_id?: string
  caller_number?: string
  reason?: string
  summary_short?: string
  primary_category?: string | null
  suggested_action?: string
  keywords?: string[]
  priority?: string
  created_at?: string
  action_required?: boolean
  resolution_status?: "resolved" | "escalated" | "abandoned" | null
  follow_up_required?: boolean
  actionRequired?: boolean
  resolutionStatus?: "resolved" | "escalated" | "abandoned" | null
  followUpRequired?: boolean
  suggestedAction?: string
  [key: string]: unknown
}

export type DashboardAlert = {
  id: string
  callId: string
  tenantId?: string
  callerNumber: string
  reason: string
  summaryShort?: string
  primaryCategory?: string | null
  suggestedAction?: string
  keywords?: string[]
  priority: DashboardPriorityLevel
  createdAt: string
  actionRequired?: boolean
  resolutionStatus?: "resolved" | "escalated" | "abandoned" | null
  followUpRequired?: boolean
}

export type DashboardPriorityQueueData = {
  items: DashboardAlert[]
}

export type DashboardRecentCall = {
  id: string
  caller_number: string | null
  status: string
  started_at: string
  duration_sec: number | null
  summary_short: string | null
  customer_emotion: "positive" | "neutral" | "negative" | "angry" | null
  resolution_status: "resolved" | "escalated" | "abandoned" | null
  priority: string | null
}

export type DashboardRecentCallsData = {
  items: DashboardRecentCall[]
  total: number
  offset: number
  limit: number
}

export type DashboardRecentCallsParams = {
  limit?: number
  offset?: number
  started_from?: string
  started_to?: string
}

export type DashboardPriorityQueueParams = {
  limit?: number
  offset?: number
  from?: string
  to?: string
}

export type IntentDistributionItem = {
  label: string
  count: number
}

export type IntentDistributionParams = {
  limit?: number
  started_from?: string
  started_to?: string
}
