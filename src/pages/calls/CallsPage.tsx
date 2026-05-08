import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CountChip,
  EmptyShell,
  PageShell,
  PageTopbar,
  StatusBadge,
} from "@/components/dashboard/page-chrome";
import {
  formatDateTime,
  formatDuration,
  getCallStatusLabel,
  getEmotionLabel,
  getResolutionStatusLabel,
  getResponsePathLabel,
  getSpeakerLabel,
} from "@/features/calls/callsAdapters";
import {
  useCallDetail,
  useCallMcpActions,
  useCalls,
  useCallSummary,
  useCallTranscripts,
} from "@/features/calls/callsQueries";
import type {
  BackendCall,
  CallStatus,
  McpActionLog,
  McpActionStatus,
} from "@/features/calls/callsTypes";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

function buildCallsQuery(page: number) {
  return {
    status: "all" as const,
    offset: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
  };
}

function getCallIntent(call: BackendCall) {
  const intent = call.branch_stats?.intent;
  return typeof intent === "string" && intent.length > 0 ? intent : "분류 전";
}

function getCallSummaryPreview(call: BackendCall) {
  const summary = call.branch_stats?.summary;
  if (typeof summary === "string" && summary.length > 0) {
    return summary;
  }

  return `${getCallStatusLabel(call.status)} · ${formatDuration(call.duration_sec)}`;
}

function formatCallId(callId: string) {
  if (callId.length <= 18) {
    return callId;
  }
  return `${callId.slice(0, 8)}…${callId.slice(-6)}`;
}

/* Status mapping → token tones */
function getStatusBadgeTone(
  status: CallStatus,
): "info" | "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "completed":
      return "success";
    case "in_progress":
      return "info";
    case "abandoned":
      return "warning";
    case "error":
      return "error";
    default:
      return "neutral";
  }
}

/* MCP action type → token tone (we drop ad-hoc colors per the spec) */
function getMcpActionBadgeTone(
  actionType: string,
): "info" | "success" | "warning" | "error" | "neutral" {
  switch (actionType) {
    case "gmail":
      return "error"; // Gmail = brand red → semantic-error tinted
    case "calendar":
      return "info";
    case "company_db":
      return "success";
    default:
      return "neutral";
  }
}

function getMcpStatusTone(
  status: McpActionStatus | string,
): "success" | "error" {
  return status === "success" ? "success" : "error";
}

function CallsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} style={{ borderBottom: "1px solid #e5edf5" }}>
          {Array.from({ length: 7 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <Skeleton className="h-3.5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function formatJsonPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload ?? {}, null, 2);
}

/* ============================================================
 * MCP action logs section
 * ============================================================ */
function McpActionLogsSection({
  actions,
  isLoading,
  error,
}: {
  actions: McpActionLog[];
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity
          className="h-4 w-4"
          style={{ color: "#533afd" }}
          aria-hidden="true"
        />
        <h3
          className="text-[14px] tracking-[-0.008em]"
          style={{
            color: "#061b31",
            fontFamily: "var(--hds-font-display)",
            fontWeight: 700,
          }}
        >
          MCP 액션
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-[8px]" />
          ))}
        </div>
      ) : error ? (
        <p
          className="rounded-[8px] px-3 py-3 text-[13px]"
          style={{
            backgroundColor: "rgba(234,34,97,0.04)",
            border: "1px solid rgba(234,34,97,0.25)",
            color: "#ea2261",
            fontWeight: 500,
          }}
        >
          MCP 액션 로그를 불러오지 못했습니다. {error.message}
        </p>
      ) : actions.length === 0 ? (
        <EmptyShell height="h-[80px]">실행된 MCP 액션이 없습니다.</EmptyShell>
      ) : (
        <div className="space-y-3">
          {actions.map((action) => {
            const actionLabel = action.action_detail ?? action.action_type;

            return (
              <div
                key={action.id}
                className="rounded-[8px] p-3 text-[13px]"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5edf5",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone={getMcpActionBadgeTone(actionLabel)}>
                    {actionLabel}
                  </StatusBadge>
                  <StatusBadge tone={getMcpStatusTone(action.status)}>
                    {action.status}
                  </StatusBadge>
                  <span
                    className="hds-tnum ml-auto text-[11.5px]"
                    style={{ color: "#64748d", fontWeight: 500 }}
                  >
                    {formatDateTime(action.executed_at)}
                  </span>
                </div>

                <p
                  className="mt-2 text-[13px] leading-[1.55]"
                  style={{ color: "#273951", fontWeight: 500 }}
                >
                  {action.action_detail ?? "액션 상세 정보가 없습니다."}
                </p>

                {action.error_message ? (
                  <p
                    className="mt-2 rounded-[6px] px-3 py-2 text-[12.5px]"
                    style={{
                      backgroundColor: "rgba(234,34,97,0.04)",
                      border: "1px solid rgba(234,34,97,0.25)",
                      color: "#ea2261",
                      fontWeight: 500,
                    }}
                  >
                    {action.error_message}
                  </p>
                ) : null}

                <div className="mt-3 space-y-2">
                  <details
                    className="rounded-[6px] px-3 py-2"
                    style={{
                      backgroundColor: "#f6f9fc",
                      border: "1px solid #e5edf5",
                    }}
                  >
                    <summary
                      className="cursor-pointer text-[11.5px] uppercase"
                      style={{
                        color: "#64748d",
                        fontWeight: 600,
                        letterSpacing: "0.4px",
                        fontFamily: "var(--hds-font-mono)",
                      }}
                    >
                      request_payload
                    </summary>
                    <pre
                      className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11.5px]"
                      style={{
                        color: "#273951",
                        fontFamily: "var(--hds-font-mono)",
                      }}
                    >
                      {formatJsonPayload(action.request_payload)}
                    </pre>
                  </details>
                  <details
                    className="rounded-[6px] px-3 py-2"
                    style={{
                      backgroundColor: "#f6f9fc",
                      border: "1px solid #e5edf5",
                    }}
                  >
                    <summary
                      className="cursor-pointer text-[11.5px] uppercase"
                      style={{
                        color: "#64748d",
                        fontWeight: 600,
                        letterSpacing: "0.4px",
                        fontFamily: "var(--hds-font-mono)",
                      }}
                    >
                      response_payload
                    </summary>
                    <pre
                      className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11.5px]"
                      style={{
                        color: "#273951",
                        fontFamily: "var(--hds-font-mono)",
                      }}
                    >
                      {formatJsonPayload(action.response_payload)}
                    </pre>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * Page
 * ============================================================ */
export function CallsPage() {
  const [page, setPage] = useState(1);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [copiedCallId, setCopiedCallId] = useState<string | null>(null);

  const callsParams = useMemo(() => buildCallsQuery(page), [page]);
  const callsQuery = useCalls(callsParams);
  const callDetailQuery = useCallDetail(selectedCallId);
  const transcriptsQuery = useCallTranscripts(selectedCallId);
  const mcpActionsQuery = useCallMcpActions(selectedCallId);
  const summaryQuery = useCallSummary(selectedCallId);

  const calls = callsQuery.data?.items ?? [];
  const totalCalls = callsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCalls / PAGE_SIZE));
  const selectedCall =
    callDetailQuery.data ??
    calls.find((call) => call.id === selectedCallId) ??
    null;
  const transcripts = transcriptsQuery.data?.items ?? [];
  const mcpActions = mcpActionsQuery.data?.items ?? [];
  const summary = summaryQuery.data;

  useEffect(() => {
    if (callsQuery.isFetching) return;
    if (totalCalls === 0) return;
    if (page > totalPages) setPage(totalPages);
  }, [callsQuery.isFetching, page, totalCalls, totalPages]);

  useEffect(() => {
    if (!copiedCallId) return;
    const timeout = window.setTimeout(() => setCopiedCallId(null), 1500);
    return () => window.clearTimeout(timeout);
  }, [copiedCallId]);

  async function handleCopyCallId(callId: string) {
    try {
      await navigator.clipboard.writeText(callId);
      setCopiedCallId(callId);
    } catch {
      setCopiedCallId(null);
    }
  }

  const headers = [
    { label: "일시", className: "w-[170px]" },
    { label: "통화 ID", className: "w-[200px]" },
    { label: "발신 번호", className: "w-[140px]" },
    { label: "주요 의도", className: "w-[120px]" },
    { label: "통화 시간", className: "w-[100px] text-center" },
    { label: "상태", className: "w-[110px] text-center" },
    { label: "요약", className: "" },
  ] as const;

  return (
    <PageShell>
      <PageTopbar
        eyebrow="운영"
        title="통화 이력"
        description="전체 AI 상담 통화 이력을 조회하고 분석하세요."
        rightSlot={
          <CountChip tone="primary">
            <Phone className="h-3 w-3" aria-hidden="true" />총{" "}
            {totalCalls.toLocaleString("ko-KR")}건
          </CountChip>
        }
      />

      <div className="space-y-5 px-8 py-6">
        {callsQuery.isError ? (
          <div
            className="rounded-[8px] px-4 py-3 text-[13px]"
            style={{
              backgroundColor: "rgba(234,34,97,0.04)",
              border: "1px solid rgba(234,34,97,0.25)",
              color: "#ea2261",
              fontFamily: "var(--hds-font-body)",
              fontWeight: 500,
            }}
          >
            통화 이력을 불러오지 못했습니다. {callsQuery.error.message}
          </div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[12px]"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
            fontFamily: "var(--hds-font-body)",
          }}
        >
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse text-left"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#f6f9fc",
                    borderBottom: "1px solid #d6d9fc",
                  }}
                >
                  {headers.map((h) => (
                    <th
                      key={h.label}
                      scope="col"
                      className={cn(
                        "whitespace-nowrap px-4 py-3 text-[11.5px] uppercase",
                        h.className,
                      )}
                      style={{
                        color: "#64748d",
                        fontWeight: 600,
                        letterSpacing: "0.4px",
                      }}
                    >
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {callsQuery.isLoading ? <CallsTableSkeleton /> : null}

                {!callsQuery.isLoading && calls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="h-28 text-center text-[13px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      통화 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}

                {calls.map((call, idx) => (
                  <motion.tr
                    key={call.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.025 * idx, duration: 0.25 }}
                    onClick={() => setSelectedCallId(call.id)}
                    className="group cursor-pointer align-top transition-colors"
                    style={{ borderBottom: "1px solid #e5edf5" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f6f9fc")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td
                      className="hds-tnum px-4 py-4 text-[12.5px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      {formatDateTime(call.started_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="hds-tnum text-[12.5px]"
                          style={{
                            color: "#273951",
                            fontFamily: "var(--hds-font-mono)",
                            fontWeight: 500,
                          }}
                          title={call.id}
                        >
                          {formatCallId(call.id)}
                        </span>
                        <button
                          type="button"
                          aria-label="통화 ID 복사"
                          className="inline-flex h-6 w-6 items-center justify-center rounded-[4px] transition-colors"
                          style={{ color: "#94a3b8" }}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleCopyCallId(call.id);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#eef2f8";
                            e.currentTarget.style.color = "#273951";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.color = "#94a3b8";
                          }}
                        >
                          {copiedCallId === call.id ? (
                            <Check className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td
                      className="hds-tnum px-4 py-4 text-[13px]"
                      style={{ color: "#273951", fontWeight: 500 }}
                    >
                      {call.caller_number ?? "번호 없음"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone="neutral">
                        {getCallIntent(call)}
                      </StatusBadge>
                    </td>
                    <td
                      className="hds-tnum px-4 py-4 text-center text-[12.5px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      {formatDuration(call.duration_sec)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <StatusBadge tone={getStatusBadgeTone(call.status)}>
                        {getCallStatusLabel(call.status)}
                      </StatusBadge>
                    </td>
                    <td
                      className="max-w-[260px] px-4 py-4 text-[12.5px] transition-colors"
                      style={{
                        color: "#64748d",
                        fontWeight: 500,
                      }}
                    >
                      <div className="line-clamp-2 leading-[1.5]">
                        {getCallSummaryPreview(call)}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-4 py-3 text-[12.5px]"
            style={{ borderTop: "1px solid #e5edf5" }}
          >
            <div
              className="hds-tnum"
              style={{ color: "#64748d", fontWeight: 500 }}
            >
              페이지 {page} / {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <PaginationButton
                disabled={page <= 1 || callsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                이전
              </PaginationButton>
              <span
                className="hds-tnum min-w-24 text-center"
                style={{ color: "#64748d", fontWeight: 500 }}
              >
                총 {totalCalls.toLocaleString("ko-KR")}건
              </span>
              <PaginationButton
                disabled={page >= totalPages || callsQuery.isFetching}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                다음
                <ChevronRight className="h-3.5 w-3.5" />
              </PaginationButton>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Call detail Sheet */}
      <Sheet
        open={!!selectedCallId}
        onOpenChange={(open) => !open && setSelectedCallId(null)}
      >
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-lg"
          style={{
            backgroundColor: "#ffffff",
            fontFamily: "var(--hds-font-body)",
            color: "#061b31",
          }}
        >
          <SheetHeader
            className="pb-4"
            style={{ borderBottom: "1px solid #e5edf5" }}
          >
            <SheetTitle
              className="flex items-center gap-2 text-[18px] tracking-[-0.012em]"
              style={{
                color: "#061b31",
                fontFamily: "var(--hds-font-display)",
                fontWeight: 700,
              }}
            >
              <Phone
                className="h-4 w-4"
                style={{ color: "#533afd" }}
                aria-hidden="true"
              />
              통화 상세 정보
            </SheetTitle>
          </SheetHeader>

          {selectedCallId && (
            <div className="mt-6 space-y-6">
              {callDetailQuery.isError ? (
                <div
                  className="rounded-[8px] px-3 py-3 text-[13px]"
                  style={{
                    backgroundColor: "rgba(234,34,97,0.04)",
                    border: "1px solid rgba(234,34,97,0.25)",
                    color: "#ea2261",
                    fontWeight: 500,
                  }}
                >
                  통화 상세를 불러오지 못했습니다.{" "}
                  {callDetailQuery.error.message}
                </div>
              ) : null}

              {selectedCall ? (
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="통화 ID" mono>
                    {selectedCall.id}
                  </DetailField>
                  <DetailField label="일시">
                    {formatDateTime(selectedCall.started_at)}
                  </DetailField>
                  <DetailField label="발신 번호" tnum>
                    {selectedCall.caller_number ?? "번호 없음"}
                  </DetailField>
                  <DetailField label="통화 시간" tnum>
                    {formatDuration(selectedCall.duration_sec)}
                  </DetailField>
                  <DetailField label="주요 의도">
                    <StatusBadge tone="neutral">
                      {getCallIntent(selectedCall)}
                    </StatusBadge>
                  </DetailField>
                  <DetailField label="상태">
                    <StatusBadge tone={getStatusBadgeTone(selectedCall.status)}>
                      {getCallStatusLabel(selectedCall.status)}
                    </StatusBadge>
                  </DetailField>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-12 w-full rounded-[6px]"
                    />
                  ))}
                </div>
              )}

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare
                    className="h-4 w-4"
                    style={{ color: "#533afd" }}
                    aria-hidden="true"
                  />
                  <h3
                    className="text-[14px] tracking-[-0.008em]"
                    style={{
                      color: "#061b31",
                      fontFamily: "var(--hds-font-display)",
                      fontWeight: 700,
                    }}
                  >
                    통화 요약
                  </h3>
                </div>

                {summaryQuery.isLoading ? (
                  <Skeleton className="h-20 w-full rounded-[8px]" />
                ) : summaryQuery.isError ? (
                  <p
                    className="rounded-[8px] px-3 py-3 text-[13px]"
                    style={{
                      backgroundColor: "rgba(234,34,97,0.04)",
                      border: "1px solid rgba(234,34,97,0.25)",
                      color: "#ea2261",
                      fontWeight: 500,
                    }}
                  >
                    요약을 불러오지 못했습니다. {summaryQuery.error.message}
                  </p>
                ) : summary ? (
                  <div
                    className="space-y-3 rounded-[8px] p-3 text-[13px]"
                    style={{
                      backgroundColor: "#f6f9fc",
                      border: "1px solid #e5edf5",
                      color: "#273951",
                      fontWeight: 500,
                      lineHeight: 1.55,
                    }}
                  >
                    <p>
                      {summary.summary.summary_short ?? "요약 내용이 없습니다."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="info">
                        감정:{" "}
                        {getEmotionLabel(summary.summary.customer_emotion)}
                      </StatusBadge>
                      <StatusBadge tone="neutral">
                        해결 상태:{" "}
                        {getResolutionStatusLabel(
                          summary.summary.resolution_status,
                        )}
                      </StatusBadge>
                    </div>
                  </div>
                ) : (
                  <EmptyShell height="h-[80px]">
                    아직 요약이 없습니다.
                  </EmptyShell>
                )}
              </div>

              <McpActionLogsSection
                actions={mcpActions}
                isLoading={mcpActionsQuery.isLoading}
                error={mcpActionsQuery.error}
              />

              {/* Transcripts */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock
                    className="h-4 w-4"
                    style={{ color: "#533afd" }}
                    aria-hidden="true"
                  />
                  <h3
                    className="text-[14px] tracking-[-0.008em]"
                    style={{
                      color: "#061b31",
                      fontFamily: "var(--hds-font-display)",
                      fontWeight: 700,
                    }}
                  >
                    대화 스크립트
                  </h3>
                </div>

                {transcriptsQuery.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-16 w-full rounded-[8px]"
                      />
                    ))}
                  </div>
                ) : transcriptsQuery.isError ? (
                  <p
                    className="rounded-[8px] px-3 py-3 text-[13px]"
                    style={{
                      backgroundColor: "rgba(234,34,97,0.04)",
                      border: "1px solid rgba(234,34,97,0.25)",
                      color: "#ea2261",
                      fontWeight: 500,
                    }}
                  >
                    발화 기록을 불러오지 못했습니다.{" "}
                    {transcriptsQuery.error.message}
                  </p>
                ) : transcripts.length === 0 ? (
                  <EmptyShell height="h-[80px]">
                    발화 기록이 없습니다.
                  </EmptyShell>
                ) : (
                  <div className="space-y-3">
                    {transcripts.map((msg, idx) => {
                      const isCustomer = msg.speaker === "customer";
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * idx }}
                          className="flex gap-3 rounded-[8px] p-3"
                          style={{
                            backgroundColor: isCustomer
                              ? "rgba(83,58,253,0.04)"
                              : "#f6f9fc",
                            border: isCustomer
                              ? "1px solid rgba(83,58,253,0.20)"
                              : "1px solid #e5edf5",
                          }}
                        >
                          <div
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px]"
                            style={
                              isCustomer
                                ? {
                                    color: "#533afd",
                                    backgroundColor: "rgba(83,58,253,0.10)",
                                    border: "1px solid rgba(83,58,253,0.20)",
                                  }
                                : {
                                    color: "#108c3d",
                                    backgroundColor: "rgba(21,190,83,0.12)",
                                    border: "1px solid rgba(21,190,83,0.25)",
                                  }
                            }
                          >
                            {isCustomer ? (
                              <User className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Bot className="h-4 w-4" aria-hidden="true" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className="text-[11.5px]"
                                style={{ color: "#64748d", fontWeight: 600 }}
                              >
                                {getSpeakerLabel(msg.speaker)}
                              </p>
                              <StatusBadge tone="neutral">
                                {getResponsePathLabel(msg.response_path)}
                              </StatusBadge>
                            </div>
                            <p
                              className="text-[13px] leading-[1.6]"
                              style={{ color: "#061b31", fontWeight: 500 }}
                            >
                              {msg.text}
                            </p>
                            <p
                              className="hds-tnum text-[11px]"
                              style={{ color: "#94a3b8", fontWeight: 500 }}
                            >
                              {formatDateTime(msg.spoken_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

/* ---------------- Local helpers ---------------- */

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-[6px] px-2.5 text-[12px] transition-all"
      style={{
        color: disabled ? "#94a3b8" : "#273951",
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = "#f6f9fc";
        e.currentTarget.style.borderColor = "#d6d9fc";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.backgroundColor = "#ffffff";
        e.currentTarget.style.borderColor = "#e5edf5";
      }}
    >
      {children}
    </button>
  );
}

function DetailField({
  label,
  children,
  mono = false,
  tnum = false,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  tnum?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p
        className="text-[11px] uppercase"
        style={{
          color: "#94a3b8",
          fontWeight: 600,
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      <div
        className={cn("text-[13px]", tnum && "hds-tnum")}
        style={{
          color: "#061b31",
          fontWeight: 500,
          fontFamily: mono ? "var(--hds-font-mono)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
