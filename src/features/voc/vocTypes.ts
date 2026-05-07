export type EmotionKey = "positive" | "neutral" | "negative" | "angry"

export type EmotionDistributionResponse = {
  positive: number
  neutral: number
  negative: number
  angry: number
}

export type EmotionChartDatum = {
  name: string
  value: number
  key: EmotionKey
}

export type VocPriorityItemResponse = {
  call_id: string
  tenant_id?: string
  priority: string
  summary_short?: string
  primary_category?: string
  reason?: string
  created_at?: string
}

export type VocPriorityItem = {
  id: string
  callId: string
  priority: string
  summaryShort: string
  primaryCategory: string
  reason: string
  createdAt: string
}
