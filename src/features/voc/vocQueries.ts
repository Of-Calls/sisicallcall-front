import { useQuery } from "@tanstack/react-query"
import {
  getEmotionDistribution,
  getVocPriorityQueue,
} from "@/features/voc/vocApi"

export function useEmotionDistribution() {
  return useQuery({
    queryKey: ["voc", "emotion-distribution"],
    queryFn: getEmotionDistribution,
  })
}

export function useVocPriorityQueue() {
  return useQuery({
    queryKey: ["voc", "priority-queue"],
    queryFn: getVocPriorityQueue,
  })
}
