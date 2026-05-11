import type {
  VocKeywordStatsItem,
  VocKeywordStatsResponse,
  VocKeywordStatsResponseItem,
  VocPriorityDistributionItem,
  VocPriorityDistributionResponseItem,
  VocPriorityLevel,
} from "@/features/voc/vocTypes"

const priorityLabelMap: Record<VocPriorityLevel, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
}

const priorityOrder: VocPriorityLevel[] = [
  "urgent",
  "high",
  "medium",
  "low",
]

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
    ? value.trim()
    : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function normalizePriorityLevel(value: string): VocPriorityLevel | null {
  if (value === "critical" || value === "urgent") return "urgent"
  if (value === "high") return "high"
  if (value === "medium" || value === "normal") return "medium"
  if (value === "low") return "low"
  return null
}

function normalizeKeywordItem(
  item: VocKeywordStatsResponseItem,
): VocKeywordStatsItem {
  return {
    keyword: toString(item.keyword, toString(item.label, "기타")),
    count: toNumber(item.count),
  }
}

function extractKeywordItems(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as VocKeywordStatsResponseItem[]
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.items)) {
      return payload.items as VocKeywordStatsResponseItem[]
    }

    if (Array.isArray(payload.data)) {
      return payload.data as VocKeywordStatsResponseItem[]
    }
  }

  return []
}

export function normalizeVocKeywordStats(
  payload: unknown,
): VocKeywordStatsItem[] {
  return extractKeywordItems(payload).map(normalizeKeywordItem)
}

export function normalizeVocPriorityDistribution(
  payload: unknown,
): VocPriorityDistributionItem[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => {
        const record = item as VocPriorityDistributionResponseItem
        const priority = normalizePriorityLevel(
          toString(record.priority).toLowerCase(),
        )

        if (!priority) {
          return null
        }

        return {
          priority,
          label: toString(record.label, priorityLabelMap[priority]),
          count: toNumber(record.count),
        }
      })
      .filter((item): item is VocPriorityDistributionItem => item !== null)
  }

  const record = isRecord(payload) ? (payload as Record<string, unknown>) : {}

  return priorityOrder.map((priority) => {
    const count =
      priority === "urgent"
        ? toNumber(record.urgent ?? record.critical)
        : priority === "medium"
          ? toNumber(record.medium ?? record.normal)
          : toNumber(record[priority])

    return {
      priority,
      label: priorityLabelMap[priority],
      count,
    }
  })
}
