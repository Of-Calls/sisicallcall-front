export type VocKeywordStatsResponseItem = {
  keyword?: string
  label?: string
  count?: number | string
}

export type VocKeywordStatsResponse = {
  items?: VocKeywordStatsResponseItem[]
  data?: VocKeywordStatsResponseItem[]
  request_id?: string
}

export type VocKeywordStatsParams = {
  from?: string
  to?: string
  limit?: number
}

export type VocKeywordStatsItem = {
  keyword: string
  count: number
}

export type VocPriorityLevel = "urgent" | "high" | "medium" | "low"

export type VocPriorityDistributionRecord = Partial<
  Record<VocPriorityLevel | "critical" | "normal", number | string>
>

export type VocPriorityDistributionResponseItem = {
  priority?: string
  label?: string
  count?: number | string
}

export type VocPriorityDistributionItem = {
  priority: VocPriorityLevel
  label: string
  count: number
}

export type VocPriorityDistributionParams = {
  from?: string
  to?: string
}
