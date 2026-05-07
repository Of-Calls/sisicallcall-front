import { useQuery } from "@tanstack/react-query"
import {
  getEmotionDistribution,
  getVocKeywordStats,
  getVocPriorityDistribution,
} from "@/features/voc/vocApi"

export function useEmotionDistribution() {
  return useQuery({
    queryKey: ["voc", "emotion-distribution"],
    queryFn: getEmotionDistribution,
  })
}

export function useVocKeywordStats() {
  return useQuery({
    queryKey: ["voc", "keyword-stats"],
    queryFn: getVocKeywordStats,
    retry: false,
  })
}

export function useVocPriorityDistribution() {
  return useQuery({
    queryKey: ["voc", "priority-distribution"],
    queryFn: getVocPriorityDistribution,
    retry: false,
  })
}
