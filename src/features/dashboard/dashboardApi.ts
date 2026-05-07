import {
  apiFetch,
  unwrapApiResponse,
  warnInDev,
} from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import {
  normalizeDashboardStats,
  normalizePriorityQueue,
} from "@/features/dashboard/dashboardAdapters"
import type {
  DashboardRecentCallsData,
  DashboardRecentCallsParams,
  DashboardStatsResponse,
  EmotionDistribution,
  IntentDistributionItem,
  IntentDistributionParams,
  PriorityQueueItem,
} from "@/features/dashboard/dashboardTypes"

const dashboardStatKeys = [
  "total_calls",
  "resolved_count",
  "escalated_count",
  "action_required_count",
  "mcp_success_count",
  "mcp_failed_count",
  "partial_success_count",
] as const

function buildDashboardSearchParams(
  params: Partial<DashboardRecentCallsParams & IntentDistributionParams> = {},
) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isMissingEndpointError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("404") || error.message.includes("405"))
  )
}

function expectObject<T>(
  value: unknown,
  errorMessage: string,
): T & Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(errorMessage)
  }

  return value as T & Record<string, unknown>
}

function validateDashboardStatsPayload(payload: Record<string, unknown>) {
  const presentKeys = dashboardStatKeys.filter((key) => key in payload)

  if (presentKeys.length === 0) {
    warnInDev("Unexpected /dashboard/stats payload", payload)
    throw new Error("대시보드 통계 응답 형식이 예상과 다릅니다.")
  }

  if (presentKeys.length < dashboardStatKeys.length) {
    const missingKeys = dashboardStatKeys.filter((key) => !(key in payload))
    warnInDev("Partial /dashboard/stats payload", {
      missingKeys,
      payload,
    })
  }
}

function toCount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

export async function getDashboardStats() {
  const response = await apiFetch<DashboardStatsResponse | { data: DashboardStatsResponse }>(
    endpoints.dashboardStats,
  )
  const payload = expectObject<DashboardStatsResponse>(
    unwrapApiResponse(response),
    "대시보드 통계 응답 형식이 올바르지 않습니다.",
  )

  validateDashboardStatsPayload(payload)

  return normalizeDashboardStats(payload)
}

export async function getDashboardPriorityQueue() {
  const response = await apiFetch<PriorityQueueItem[] | { data: PriorityQueueItem[] }>(
    endpoints.dashboardPriorityQueue,
  )
  const payload = unwrapApiResponse(response)

  return normalizePriorityQueue(Array.isArray(payload) ? payload : [])
}

export async function getDashboardRecentCalls(
  params?: DashboardRecentCallsParams,
) {
  const response = await apiFetch<
    DashboardRecentCallsData | { data: DashboardRecentCallsData }
  >(`${endpoints.dashboardRecentCalls}${buildDashboardSearchParams(params)}`)

  return unwrapApiResponse(response)
}

export async function getDashboardIntentDistribution(
  params?: IntentDistributionParams,
) {
  try {
    const response = await apiFetch<
      IntentDistributionItem[] | { data: IntentDistributionItem[] }
    >(`${endpoints.dashboardIntentDistribution}${buildDashboardSearchParams(params)}`)

    const payload = unwrapApiResponse(response)
    return Array.isArray(payload) ? payload : []
  } catch (error) {
    if (isMissingEndpointError(error)) {
      warnInDev("Dashboard intent distribution endpoint is not available yet.", error)
      return null
    }

    throw error
  }
}

export async function getDashboardEmotionDistribution() {
  const response = await apiFetch<
    EmotionDistribution | { data: EmotionDistribution }
  >(endpoints.dashboardEmotionDistribution)
  const payload = expectObject<EmotionDistribution>(
    unwrapApiResponse(response),
    "감정 분포 응답 형식이 올바르지 않습니다.",
  )

  return {
    positive: toCount(payload.positive),
    neutral: toCount(payload.neutral),
    negative: toCount(payload.negative),
    angry: toCount(payload.angry),
  }
}
