import {
  apiFetch,
  unwrapApiResponse,
  warnInDev,
} from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import {
  normalizeEmotionDistribution,
  normalizeVocKeywordStats,
  normalizeVocPriorityDistribution,
} from "@/features/voc/vocAdapters"
import type {
  EmotionDistributionResponse,
  VocKeywordStatsResponse,
  VocPriorityDistributionRecord,
  VocPriorityDistributionResponseItem,
} from "@/features/voc/vocTypes"

function isMissingEndpointError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.includes("404") || error.message.includes("405"))
  )
}

function resolveKeywordStatsPayload(payload: unknown) {
  const normalized = normalizeVocKeywordStats(payload)
  if (normalized.length > 0) {
    return normalized
  }

  const unwrapped = normalizeVocKeywordStats(unwrapApiResponse(payload))
  return unwrapped
}

function resolvePriorityDistributionPayload(payload: unknown) {
  const normalized = normalizeVocPriorityDistribution(payload)
  if (
    Array.isArray(payload) ||
    normalized.some((item) => item.count > 0) ||
    normalized.length === 0
  ) {
    return normalized
  }

  return normalizeVocPriorityDistribution(unwrapApiResponse(payload))
}

export async function getEmotionDistribution() {
  const response = await apiFetch<
    EmotionDistributionResponse | { data: EmotionDistributionResponse }
  >(endpoints.dashboardEmotionDistribution)

  return normalizeEmotionDistribution(unwrapApiResponse(response))
}

export async function getVocKeywordStats() {
  try {
    const response = await apiFetch<
      VocKeywordStatsResponse | { data: VocKeywordStatsResponse["data"] }
    >(endpoints.dashboardKeywordStats)

    return resolveKeywordStatsPayload(response)
  } catch (error) {
    if (isMissingEndpointError(error)) {
      warnInDev("VOC keyword stats endpoint is not available yet.", error)
      return null
    }

    throw error
  }
}

export async function getVocPriorityDistribution() {
  try {
    const response = await apiFetch<
      | VocPriorityDistributionRecord
      | VocPriorityDistributionResponseItem[]
      | { data: VocPriorityDistributionRecord | VocPriorityDistributionResponseItem[] }
    >(endpoints.dashboardPriorityDistribution)

    return resolvePriorityDistributionPayload(response)
  } catch (error) {
    if (isMissingEndpointError(error)) {
      warnInDev("VOC priority distribution endpoint is not available yet.", error)
      return null
    }

    throw error
  }
}
