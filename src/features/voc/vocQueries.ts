import { useQuery } from "@tanstack/react-query"
import {
  getVocKeywordStats,
  getVocPriorityDistribution,
} from "@/features/voc/vocApi"
import type {
  VocKeywordStatsParams,
  VocPriorityDistributionParams,
} from "@/features/voc/vocTypes"

export function useVocKeywordStats(params?: VocKeywordStatsParams) {
  return useQuery({
    queryKey: ["voc", "keyword-stats", params],
    queryFn: () => getVocKeywordStats(params),
    retry: false,
  })
}

export function useVocPriorityDistribution(
  params?: VocPriorityDistributionParams,
) {
  return useQuery({
    queryKey: ["voc", "priority-distribution", params],
    queryFn: () => getVocPriorityDistribution(params),
    retry: false,
  })
}
