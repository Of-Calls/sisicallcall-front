import { apiFetch } from "@/shared/api/client"
import { endpoints } from "@/shared/api/endpoints"
import type {
  ApiResponse,
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

function unwrapApiResponse<T>(response: ApiResponse<T> | T) {
  if (
    typeof response === "object" &&
    response !== null &&
    "data" in response
  ) {
    return (response as ApiResponse<T>).data
  }

  return response as T
}

export async function getCalls(query?: CallListQuery) {
  const response = await apiFetch<ApiResponse<CallListData>>(
    `${endpoints.callList}${buildCallsSearchParams(query)}`,
  )

  return response.data
}

export async function getCallDetail(callId: string) {
  const response = await apiFetch<ApiResponse<BackendCall>>(
    endpoints.callDetail(callId),
  )

  return response.data
}

export async function getCallTranscripts(callId: string) {
  const response = await apiFetch<ApiResponse<TranscriptListData>>(
    endpoints.callTranscripts(callId),
  )

  return response.data
}

export async function getCallMcpActions(callId: string) {
  const response = await apiFetch<
    ApiResponse<McpActionLogsResponse> | McpActionLogsResponse
  >(
    endpoints.callActions(callId),
  )

  return unwrapApiResponse(response)
}

export async function getCallSummary(callId: string) {
  try {
    return await apiFetch<BackendSummary>(endpoints.callSummary(callId))
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null
    }

    throw error
  }
}
