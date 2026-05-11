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

export type VocKeywordStatsItem = {
  keyword: string
  count: number
}

export type VocPriorityLevel = "critical" | "high" | "medium" | "low"

export type VocPriorityDistributionRecord = Partial<
  Record<VocPriorityLevel, number | string>
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
