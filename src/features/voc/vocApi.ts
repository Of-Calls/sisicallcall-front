import { apiFetch } from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import {
  normalizeEmotionDistribution,
  normalizeVocPriorityQueue,
} from "@/features/voc/vocAdapters"
import type {
  EmotionDistributionResponse,
  VocPriorityItemResponse,
} from "@/features/voc/vocTypes"

export async function getEmotionDistribution() {
  const response = await apiFetch<EmotionDistributionResponse>(
    endpoints.dashboardEmotionDistribution,
  )

  return normalizeEmotionDistribution(response)
}

export async function getVocPriorityQueue() {
  const response = await apiFetch<VocPriorityItemResponse[]>(
    endpoints.dashboardPriorityQueue,
  )

  return normalizeVocPriorityQueue(Array.isArray(response) ? response : [])
}
