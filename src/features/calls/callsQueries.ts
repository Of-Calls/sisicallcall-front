import { useQuery } from "@tanstack/react-query"
import {
  getCallDetail,
  getCallMcpActions,
  getCallSummary,
  getCallTranscripts,
  getCalls,
} from "@/features/calls/callsApi"
import type { CallListQuery } from "@/features/calls/callsTypes"

export function useCalls(query: CallListQuery) {
  return useQuery({
    queryKey: ["calls", query],
    queryFn: () => getCalls(query),
  })
}

export function useCallDetail(callId: string | null) {
  return useQuery({
    queryKey: ["calls", "detail", callId],
    queryFn: () => getCallDetail(callId!),
    enabled: Boolean(callId),
  })
}

export function useCallTranscripts(callId: string | null) {
  return useQuery({
    queryKey: ["calls", "transcripts", callId],
    queryFn: () => getCallTranscripts(callId!),
    enabled: Boolean(callId),
  })
}

export function useCallMcpActions(callId: string | null) {
  return useQuery({
    queryKey: ["calls", "mcp-actions", callId],
    queryFn: () => getCallMcpActions(callId!),
    enabled: Boolean(callId),
  })
}

export function useCallSummary(callId: string | null) {
  return useQuery({
    queryKey: ["calls", "summary", callId],
    queryFn: () => getCallSummary(callId!),
    enabled: Boolean(callId),
    retry: false,
  })
}
