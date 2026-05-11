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
  DashboardPriorityQueueData,
  DashboardPriorityQueueParams,
  DashboardRecentCallsData,
  DashboardRecentCallsParams,
  DashboardStatsResponse,
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
  params:
    | Partial<DashboardRecentCallsParams & IntentDistributionParams & DashboardPriorityQueueParams>
    | undefined = {},
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

function extractPriorityQueueItems(payload: unknown): PriorityQueueItem[] {
  if (Array.isArray(payload)) {
    return payload
  }

  if (isRecord(payload) && Array.isArray(payload.items)) {
    return payload.items as PriorityQueueItem[]
  }

  if (
    isRecord(payload) &&
    isRecord(payload.data) &&
    Array.isArray(payload.data.items)
  ) {
    return payload.data.items as PriorityQueueItem[]
  }

  return []
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

export async function getDashboardPriorityQueue(
  params?: DashboardPriorityQueueParams,
): Promise<DashboardPriorityQueueData> {
  const response = await apiFetch<PriorityQueueItem[] | { data: PriorityQueueItem[] }>(
    `${endpoints.dashboardPriorityQueue}${buildDashboardSearchParams(params)}`,
  )
  const payload = unwrapApiResponse(response)
  const items = normalizePriorityQueue(extractPriorityQueueItems(payload))

  return { items }
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
