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

export type PriorityQueueItem = {
  id?: string
  call_id?: string
  caller_number?: string
  reason?: string
  priority?: string
  created_at?: string
  [key: string]: unknown
}

export type DashboardAlert = {
  id: string
  callId: string
  callerNumber: string
  reason: string
  priority: string
  createdAt: string
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

export type IntentDistributionItem = {
  label: string
  count: number
}

export type IntentDistributionParams = {
  limit?: number
  started_from?: string
  started_to?: string
}

export type EmotionDistribution = {
  positive: number
  neutral: number
  negative: number
  angry: number
}
