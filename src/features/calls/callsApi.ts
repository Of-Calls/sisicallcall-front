import { apiFetch, unwrapApiResponse } from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import type {
  BackendCall,
  BackendSummary,
  CallListData,
  CallListQuery,
  McpActionLogsResponse,
  TranscriptListData,
} from "@/features/calls/callsTypes"

function buildCallsSearchParams(query: CallListQuery = {}) {
  const params = new URLSearchParams()

  if (query.status && query.status !== "all") {
    params.set("status", query.status)
  }

  if (query.startedFrom) {
    params.set("started_from", query.startedFrom)
  }

  if (query.startedTo) {
    params.set("started_to", query.startedTo)
  }

  if (typeof query.offset === "number") {
    params.set("offset", String(query.offset))
  }

  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit))
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ""
}

export async function getCalls(query?: CallListQuery) {
  const response = await apiFetch<CallListData | { data: CallListData }>(
    `${endpoints.callList}${buildCallsSearchParams(query)}`,
  )

  return unwrapApiResponse(response)
}

export async function getCallDetail(callId: string) {
  const response = await apiFetch<BackendCall | { data: BackendCall }>(
    endpoints.callDetail(callId),
  )

  return unwrapApiResponse(response)
}

export async function getCallTranscripts(callId: string) {
  const response = await apiFetch<
    TranscriptListData | { data: TranscriptListData }
  >(endpoints.callTranscripts(callId))

  return unwrapApiResponse(response)
}

export async function getCallMcpActions(callId: string) {
  const response = await apiFetch<
    McpActionLogsResponse | { data: McpActionLogsResponse }
  >(endpoints.callActions(callId))

  return unwrapApiResponse(response)
}

export async function getCallSummary(callId: string) {
  try {
    const response = await apiFetch<BackendSummary | { data: BackendSummary }>(
      endpoints.callSummary(callId),
    )

    return unwrapApiResponse(response)
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null
    }

    throw error
  }
}
