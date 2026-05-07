export type CallStatus =
  | "in_progress"
  | "completed"
  | "abandoned"
  | "error"

export type BackendCall = {
  id: string
  tenant_id: string
  twilio_call_sid: string
  caller_number: string | null
  status: CallStatus
  started_at: string
  ended_at: string | null
  duration_sec: number | null
  latency_log: Record<string, unknown>
  branch_stats: Record<string, unknown>
  created_at: string
}

export type CallListData = {
  items: BackendCall[]
  total: number
  offset: number
  limit: number
}

export type TranscriptSpeaker = "customer" | "agent"

export type ResponsePath =
  | "cache"
  | "faq"
  | "task"
  | "auth"
  | "escalation"

export type ReviewerVerdict = "pass" | "revise"

export type BackendTranscript = {
  id: string
  call_id: string
  turn_index: number
  speaker: TranscriptSpeaker
  text: string
  response_path: ResponsePath | null
  reviewer_applied: boolean
  reviewer_verdict: ReviewerVerdict | null
  is_barge_in: boolean
  spoken_at: string
}

export type TranscriptListData = {
  items: BackendTranscript[]
  total: number
}

export type BackendSummary = {
  call_id: string
  tenant_id: string
  summary: {
    summary_short?: string
    customer_emotion?: "positive" | "neutral" | "negative" | "angry"
    resolution_status?: "resolved" | "escalated" | "abandoned"
    [key: string]: unknown
  }
  created_at: string
  updated_at: string
}

export type McpActionStatus = "success" | "fail"

export interface McpActionLog {
  id: string
  call_id: string
  tenant_id?: string
  action_type: string
  action_detail: string | null
  status: McpActionStatus
  request_payload: Record<string, unknown>
  response_payload: Record<string, unknown>
  error_message: string | null
  executed_at: string
}

export interface McpActionLogsResponse {
  items: McpActionLog[]
  total: number
}

export type CallListQuery = {
  status?: CallStatus | "all"
  startedFrom?: string
  startedTo?: string
  offset?: number
  limit?: number
}

export type ApiResponse<T> = {
  data: T
  request_id: string
}
