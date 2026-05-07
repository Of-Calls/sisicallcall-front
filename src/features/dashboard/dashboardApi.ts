import { apiFetch } from "@/shared/api/client"
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

type ApiResponse<T> = {
  data: T
  request_id: string
}

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

export async function getDashboardStats() {
  const response = await apiFetch<DashboardStatsResponse>(
    endpoints.dashboardStats,
  )

  return normalizeDashboardStats(response)
}

export async function getDashboardPriorityQueue() {
  const response = await apiFetch<PriorityQueueItem[]>(
    endpoints.dashboardPriorityQueue,
  )

  return normalizePriorityQueue(Array.isArray(response) ? response : [])
}

export async function getDashboardRecentCalls(
  params?: DashboardRecentCallsParams,
) {
  const response = await apiFetch<ApiResponse<DashboardRecentCallsData>>(
    `${endpoints.dashboardRecentCalls}${buildDashboardSearchParams(params)}`,
  )

  return response.data
}

export async function getDashboardIntentDistribution(
  params?: IntentDistributionParams,
) {
  const response = await apiFetch<ApiResponse<IntentDistributionItem[]>>(
    `${endpoints.dashboardIntentDistribution}${buildDashboardSearchParams(params)}`,
  )

  return response.data
}

export async function getDashboardEmotionDistribution() {
  return apiFetch<EmotionDistribution>(endpoints.dashboardEmotionDistribution)
}
