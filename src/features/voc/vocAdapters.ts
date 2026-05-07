import type {
  EmotionChartDatum,
  EmotionDistributionResponse,
  VocPriorityItem,
  VocPriorityItemResponse,
} from "@/features/voc/vocTypes"

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

export function normalizeEmotionDistribution(
  distribution: Partial<EmotionDistributionResponse> = {},
): EmotionChartDatum[] {
  return [
    {
      key: "positive",
      name: "긍정",
      value: toNumber(distribution.positive),
    },
    {
      key: "neutral",
      name: "중립",
      value: toNumber(distribution.neutral),
    },
    {
      key: "negative",
      name: "부정",
      value: toNumber(distribution.negative),
    },
    {
      key: "angry",
      name: "분노",
      value: toNumber(distribution.angry),
    },
  ]
}

export function normalizeVocPriorityQueue(
  items: VocPriorityItemResponse[] = [],
): VocPriorityItem[] {
  return items.map((item, index) => {
    const callId = toString(item.call_id, `priority-${index}`)

    return {
      id: callId,
      callId,
      priority: toString(item.priority, "normal"),
      summaryShort: toString(item.summary_short, "요약 없음"),
      primaryCategory: toString(item.primary_category, "미분류"),
      reason: toString(item.reason, "사유 없음"),
      createdAt: toString(item.created_at, ""),
    }
  })
}
