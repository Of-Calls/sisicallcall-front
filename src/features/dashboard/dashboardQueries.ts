import { useQuery } from "@tanstack/react-query"
import {
  getDashboardEmotionDistribution,
  getDashboardIntentDistribution,
  getDashboardPriorityQueue,
  getDashboardRecentCalls,
  getDashboardStats,
} from "@/features/dashboard/dashboardApi"
import type {
  DashboardRecentCallsParams,
  IntentDistributionParams,
} from "@/features/dashboard/dashboardTypes"

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: getDashboardStats,
  })
}

export function useDashboardPriorityQueue() {
  return useQuery({
    queryKey: ["dashboard", "priority-queue"],
    queryFn: getDashboardPriorityQueue,
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
  })
}

export function useDashboardEmotionDistribution() {
  return useQuery({
    queryKey: ["dashboard", "emotion-distribution"],
    queryFn: getDashboardEmotionDistribution,
  })
}
