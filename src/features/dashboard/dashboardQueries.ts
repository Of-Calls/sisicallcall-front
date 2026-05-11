import { useQuery } from "@tanstack/react-query"
import {
  getDashboardIntentDistribution,
  getDashboardPriorityQueue,
  getDashboardRecentCalls,
  getDashboardStats,
} from "@/features/dashboard/dashboardApi"
import type {
  DashboardPriorityQueueParams,
  DashboardRecentCallsParams,
  IntentDistributionParams,
} from "@/features/dashboard/dashboardTypes"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  })
}

export function useDashboardPriorityQueue(params?: DashboardPriorityQueueParams) {
  return useQuery({
    queryKey: ["dashboard", "priority-queue", params],
    queryFn: () => getDashboardPriorityQueue(params),
  })
}

export function useDashboardRecentCalls(params?: DashboardRecentCallsParams) {
  return useQuery({
    queryKey: ["dashboard", "recent-calls", params],
    queryFn: () => getDashboardRecentCalls(params),
  })
}

export function useDashboardIntentDistribution(
  params?: IntentDistributionParams,
) {
  return useQuery({
    queryKey: ["dashboard", "intent-distribution", params],
    queryFn: () => getDashboardIntentDistribution(params),
    retry: false,
  })
}
