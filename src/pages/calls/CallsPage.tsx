import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  Bot,
  Check,
  Clock,
  Copy,
  MessageSquare,
  Phone,
  User,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatDateTime,
  formatDuration,
  getCallStatusClassName,
  getCallStatusLabel,
  getEmotionLabel,
  getResolutionStatusLabel,
  getResponsePathLabel,
  getSpeakerLabel,
} from "@/features/calls/callsAdapters"
import {
  useCallDetail,
  useCallMcpActions,
  useCalls,
  useCallSummary,
  useCallTranscripts,
} from "@/features/calls/callsQueries"
import type {
  BackendCall,
  CallStatus,
  McpActionLog,
  McpActionStatus,
} from "@/features/calls/callsTypes"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

function buildCallsQuery(page: number) {
  return {
    status: "all" as const,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  }
}

function getCallIntent(call: BackendCall) {
  const intent = call.branch_stats?.intent
  return typeof intent === "string" && intent.length > 0 ? intent : "분류 전"
}

function getCallSummaryPreview(call: BackendCall) {
  const summary = call.branch_stats?.summary
  if (typeof summary === "string" && summary.length > 0) {
    return summary
  }

  return `${getCallStatusLabel(call.status)} · ${formatDuration(call.duration_sec)}`
}

function formatCallId(callId: string) {
  if (callId.length <= 18) {
    return callId
  }

  return `${callId.slice(0, 8)}…${callId.slice(-6)}`
}

function CallsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function formatJsonPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload ?? {}, null, 2)
}

function getMcpActionTypeClassName(actionType: string) {
  switch (actionType) {
    case "gmail":
      return "border-red-200 bg-red-50 text-red-700"
    case "calendar":
      return "border-blue-200 bg-blue-50 text-blue-700"
    case "company_db":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    default:
      return "border-slate-200 bg-slate-50 text-slate-700"
  }
}

function getMcpStatusClassName(status: McpActionStatus | string) {
  return status === "success"
    ? "border-emerald-200 bg-emerald-100 text-emerald-700"
    : "border-red-200 bg-red-100 text-red-700"
}

function McpActionLogsSection({
  actions,
  isLoading,
  error,
}: {
  actions: McpActionLog[]
  isLoading: boolean
  error: Error | null
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="font-semibold">MCP 액션</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
          MCP 액션 로그를 불러오지 못했습니다. {error.message}
        </p>
      ) : actions.length === 0 ? (
        <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
          실행된 MCP 액션이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const actionLabel = action.action_detail ?? action.action_type

            return (
              <div
                key={action.id}
                className="rounded-lg border bg-background p-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-normal",
                      getMcpActionTypeClassName(actionLabel),
                    )}
                  >
                    {actionLabel}
                  </Badge>
                  <Badge
                    className={cn(
                      "border font-normal",
                      getMcpStatusClassName(action.status),
                    )}
                  >
                    {action.status}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatDateTime(action.executed_at)}
                  </span>
                </div>

                <p className="mt-2 text-muted-foreground">
                  {action.action_detail ?? "액션 상세 정보가 없습니다."}
                </p>

                {action.error_message ? (
                  <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                    {action.error_message}
                  </p>
                ) : null}

                <div className="mt-3 space-y-2">
                  <details className="rounded-md border bg-muted/30 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      request_payload
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {formatJsonPayload(action.request_payload)}
                    </pre>
                  </details>
                  <details className="rounded-md border bg-muted/30 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      response_payload
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {formatJsonPayload(action.response_payload)}
                    </pre>
                  </details>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CallsPage() {
  const [page, setPage] = useState(1)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [copiedCallId, setCopiedCallId] = useState<string | null>(null)

  const callsParams = useMemo(() => buildCallsQuery(page), [page])
  const callsQuery = useCalls(callsParams)
  const callDetailQuery = useCallDetail(selectedCallId)
  const transcriptsQuery = useCallTranscripts(selectedCallId)
  const mcpActionsQuery = useCallMcpActions(selectedCallId)
  const summaryQuery = useCallSummary(selectedCallId)

  const calls = callsQuery.data?.items ?? []
  const totalCalls = callsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCalls / PAGE_SIZE))
  const selectedCall =
    callDetailQuery.data ?? calls.find((call) => call.id === selectedCallId) ?? null
  const transcripts = transcriptsQuery.data?.items ?? []
  const mcpActions = mcpActionsQuery.data?.items ?? []
  const summary = summaryQuery.data

  useEffect(() => {
    if (callsQuery.isFetching) {
      return
    }

    if (totalCalls === 0) {
      return
    }

    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [callsQuery.isFetching, page, totalCalls, totalPages])

  useEffect(() => {
    if (!copiedCallId) {
      return
    }

    const timeout = window.setTimeout(() => setCopiedCallId(null), 1500)
    return () => window.clearTimeout(timeout)
  }, [copiedCallId])

  async function handleCopyCallId(callId: string) {
    try {
      await navigator.clipboard.writeText(callId)
      setCopiedCallId(callId)
    } catch {
      setCopiedCallId(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">통화 이력</h1>
          <p className="text-sm text-muted-foreground">
            전체 AI 상담 통화 이력을 조회하고 분석하세요.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" aria-hidden="true" />
          <span>총 {totalCalls.toLocaleString("ko-KR")}건</span>
        </div>
      </motion.div>

      {callsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          통화 이력을 불러오지 못했습니다. {callsQuery.error.message}
        </div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      >
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">일시</TableHead>
              <TableHead className="font-semibold">통화 ID</TableHead>
              <TableHead className="font-semibold">발신 번호</TableHead>
              <TableHead className="font-semibold">주요 의도</TableHead>
              <TableHead className="font-semibold text-center">통화 시간</TableHead>
              <TableHead className="font-semibold text-center">상태</TableHead>
              <TableHead className="font-semibold">요약</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callsQuery.isLoading ? <CallsTableSkeleton /> : null}

            {!callsQuery.isLoading && calls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  통화 이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : null}

            {calls.map((call, idx) => (
              <motion.tr
                key={call.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * idx, duration: 0.25 }}
                onClick={() => setSelectedCallId(call.id)}
                className="group cursor-pointer border-b align-top transition-colors hover:bg-muted/50"
              >
                <TableCell className="py-4 text-sm text-muted-foreground">
                  {formatDateTime(call.started_at)}
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono text-sm"
                      title={call.id}
                    >
                      {formatCallId(call.id)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleCopyCallId(call.id)
                      }}
                      aria-label="통화 ID 복사"
                    >
                      {copiedCallId === call.id ? (
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm">
                  {call.caller_number ?? "번호 없음"}
                </TableCell>
                <TableCell className="py-4">
                  <Badge variant="outline" className="font-normal">
                    {getCallIntent(call)}
                  </Badge>
                </TableCell>
                <TableCell className="py-4 text-center text-sm text-muted-foreground">
                  {formatDuration(call.duration_sec)}
                </TableCell>
                <TableCell className="py-4 text-center">
                  <Badge
                    className={cn(
                      "border font-normal",
                      getCallStatusClassName(call.status),
                    )}
                  >
                    {getCallStatusLabel(call.status)}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[260px] py-4 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  <div className="line-clamp-2">{getCallSummaryPreview(call)}</div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
          <div className="text-muted-foreground">
            페이지 {page} / {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1 || callsQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              이전
            </Button>
            <span className="min-w-24 text-center text-muted-foreground">
              총 {totalCalls.toLocaleString("ko-KR")}건
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages || callsQuery.isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              다음
            </Button>
          </div>
        </div>
      </motion.div>

      <Sheet
        open={!!selectedCallId}
        onOpenChange={(open) => !open && setSelectedCallId(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" aria-hidden="true" />
              통화 상세 정보
            </SheetTitle>
          </SheetHeader>

          {selectedCallId && (
            <div className="mt-6 space-y-6">
              {callDetailQuery.isError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  통화 상세를 불러오지 못했습니다. {callDetailQuery.error.message}
                </div>
              ) : null}

              {selectedCall ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">통화 ID</p>
                    <p className="font-mono text-sm font-medium">{selectedCall.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">일시</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(selectedCall.started_at)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">발신 번호</p>
                    <p className="text-sm font-medium">
                      {selectedCall.caller_number ?? "번호 없음"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">통화 시간</p>
                    <p className="text-sm font-medium">
                      {formatDuration(selectedCall.duration_sec)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">주요 의도</p>
                    <Badge variant="outline">{getCallIntent(selectedCall)}</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">상태</p>
                    <Badge
                      className={cn("border", getCallStatusClassName(selectedCall.status))}
                    >
                      {getCallStatusLabel(selectedCall.status)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-10 w-full" />
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">통화 요약</h3>
                </div>

                {summaryQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : summaryQuery.isError ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    요약을 불러오지 못했습니다. {summaryQuery.error.message}
                  </p>
                ) : summary ? (
                  <div className="space-y-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    <p>{summary.summary.summary_short ?? "요약 내용이 없습니다."}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">
                        감정: {getEmotionLabel(summary.summary.customer_emotion)}
                      </Badge>
                      <Badge variant="outline">
                        해결 상태:{" "}
                        {getResolutionStatusLabel(summary.summary.resolution_status)}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    아직 요약이 없습니다.
                  </p>
                )}
              </div>

              <McpActionLogsSection
                actions={mcpActions}
                isLoading={mcpActionsQuery.isLoading}
                error={mcpActionsQuery.error}
              />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h3 className="font-semibold">대화 스크립트</h3>
                </div>

                {transcriptsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-16 w-full" />
                    ))}
                  </div>
                ) : transcriptsQuery.isError ? (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                    발화 기록을 불러오지 못했습니다. {transcriptsQuery.error.message}
                  </p>
                ) : transcripts.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    발화 기록이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {transcripts.map((msg, idx) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 * idx }}
                        className={cn(
                          "flex gap-3 rounded-lg p-3",
                          msg.speaker === "customer" ? "bg-blue-50" : "bg-emerald-50",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            msg.speaker === "customer" ? "bg-blue-100" : "bg-emerald-100",
                          )}
                        >
                          {msg.speaker === "customer" ? (
                            <User className="h-4 w-4 text-blue-600" aria-hidden="true" />
                          ) : (
                            <Bot className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-medium text-muted-foreground">
                              {getSpeakerLabel(msg.speaker)}
                            </p>
                            <Badge variant="outline" className="text-[11px]">
                              {getResponsePathLabel(msg.response_path)}
                            </Badge>
                          </div>
                          <p className="text-sm">{msg.text}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(msg.spoken_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
