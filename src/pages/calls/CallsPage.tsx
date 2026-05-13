import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Bot,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CountChip,
  EmptyShell,
  PageShell,
  PageTopbar,
  StatusBadge,
} from "@/components/dashboard/page-chrome";
import {
  formatCaller,
  formatDateTime,
  formatDateTimeShort,
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

function getCallIntent(call: BackendCall): string | null {
  const intent = call.branch_stats?.intent;
  return typeof intent === "string" && intent.length > 0 ? intent : null;
}

function getCallSummaryPreview(call: BackendCall): string | null {
  const summary = call.branch_stats?.summary;
  return typeof summary === "string" && summary.length > 0 ? summary : null;
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

/* MCP provider → token tone (we drop ad-hoc colors per the spec) */
function getMcpActionKey(action: McpActionLog): string {
  return action.action_detail ?? action.action_type ?? ""
}

function getMcpProviderBadgeTone(
  actionKey: string,
): "info" | "success" | "warning" | "error" | "neutral" {
  switch (actionKey) {
    case "gmail":
      return "error"; // Gmail = brand red → semantic-error tinted
    case "calendar":
      return "info";
    case "slack":
      return "neutral";
    case "company_db":
      return "success";
    default:
      return "neutral";
  }
}

/* MCP provider key → human-friendly label (사용자에게 보여주는 이름) */
function getMcpProviderLabel(actionKey: string): string {
  switch (actionKey) {
    case "gmail":
      return "Gmail";
    case "calendar":
      return "Google Calendar";
    case "slack":
      return "Slack";
    case "company_db":
      return "사내 DB";
    default:
      return actionKey || "알 수 없는 액션";
  }
}

function getMcpStatusTone(
  status: McpActionStatus | string,
): "success" | "error" {
  return status === "success" ? "success" : "error";
}

function getMcpStatusLabel(status: McpActionStatus | string): string {
  return status === "success" ? "성공" : "실패";
}

function getMcpActionMessage(action: McpActionLog): string {
  const actionKey = getMcpActionKey(action)

  if (action.status === "success") {
    if (actionKey === "gmail") return "GMail에 메일 보내기 성공"
    if (actionKey === "slack") return "Slack에 메시지 보내기 성공"
    if (actionKey === "calendar")
      return "Google Calendar에 예약 내역 저장 성공"
  }

  return actionKey || "알 수 없는 액션"
}

function CallsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} style={{ borderBottom: "1px solid #e5edf5" }}>
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <Skeleton className="h-3.5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
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
      <div className="flex min-w-0 items-center gap-2">
        <Activity
          className="h-4 w-4"
          style={{ color: "#533afd" }}
          aria-hidden="true"
        />
        <h3
          className="text-soft-wrap text-[14px] tracking-[-0.008em]"
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
            const actionKey = getMcpActionKey(action)
            const providerLabel = getMcpProviderLabel(actionKey);

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
                  <StatusBadge tone={getMcpProviderBadgeTone(actionKey)}>
                    {providerLabel}
                  </StatusBadge>
                  <StatusBadge tone={getMcpStatusTone(action.status)}>
                    {getMcpStatusLabel(action.status)}
                  </StatusBadge>
                  <span
                    className="hds-tnum no-text-break ml-auto text-[11.5px]"
                    style={{ color: "#64748d", fontWeight: 500 }}
                  >
                    {formatDateTime(action.executed_at)}
                  </span>
                </div>

                {action.status === "success" ? (
                  <p
                    className="text-soft-wrap mt-2 text-[12.5px]"
                    style={{
                      color: "#273951",
                      fontWeight: 500,
                      lineHeight: 1.55,
                    }}
                  >
                    {getMcpActionMessage(action)}
                  </p>
                ) : action.error_message ? (
                  <p
                    className="text-soft-wrap mt-2 rounded-[6px] px-3 py-2 text-[12.5px]"
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

  const headers = [
    { label: "일시", className: "w-[150px]" },
    { label: "발신 번호", className: "w-[140px]" },
    { label: "통화 시간", className: "w-[90px] text-center" },
    { label: "상태", className: "w-[110px] text-center" },
    { label: "요약", className: "" },
    { label: "", className: "w-[40px]" },
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

      <div className="mx-auto w-full max-w-[1200px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
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
          <div className="responsive-table-wrapper">
            <table
              className="w-full min-w-[760px] border-collapse text-left"
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
                      key={h.label || "chevron"}
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
                      colSpan={6}
                      className="h-28 text-center text-[13px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      통화 이력이 없습니다.
                    </td>
                  </tr>
                ) : null}

                {calls.map((call, idx) => {
                  const intent = getCallIntent(call);
                  const summary = getCallSummaryPreview(call);
                  return (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.025 * idx, duration: 0.25 }}
                      onClick={() => setSelectedCallId(call.id)}
                      className="group cursor-pointer align-middle transition-colors"
                      style={{ borderBottom: "1px solid #e5edf5" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f6f9fc")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <td
                        className="hds-tnum whitespace-nowrap px-4 py-4 text-[12.5px]"
                        style={{ color: "#64748d", fontWeight: 500 }}
                      >
                        {formatDateTimeShort(call.started_at)}
                      </td>
                      <td
                        className="hds-tnum whitespace-nowrap px-4 py-4 text-[13px]"
                        style={{ color: "#273951", fontWeight: 500 }}
                      >
                        {formatCaller(call.caller_number)}
                      </td>
                      <td
                        className="hds-tnum whitespace-nowrap px-4 py-4 text-center text-[12.5px]"
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
                        className="px-4 py-4 text-[12.5px] transition-colors"
                        style={{
                          color: "#64748d",
                          fontWeight: 500,
                        }}
                      >
                        <div className="space-y-1.5">
                          {intent ? (
                            <StatusBadge tone="neutral">{intent}</StatusBadge>
                          ) : null}
                          {summary ? (
                            <p className="text-soft-wrap line-clamp-2 leading-[1.55]" title={summary}>
                              {summary}
                            </p>
                          ) : (
                            <p
                              className="text-[12px] italic"
                              style={{ color: "#94a3b8", fontWeight: 500 }}
                            >
                              후처리 분석 대기 중
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-right">
                        <ChevronRight
                          className="ml-auto h-4 w-4 transition-colors group-hover:text-[#533afd]"
                          style={{ color: "#cbd5e1" }}
                          aria-hidden="true"
                        />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[12.5px]"
            style={{ borderTop: "1px solid #e5edf5" }}
          >
            <div
              className="hds-tnum no-text-break"
              style={{ color: "#64748d", fontWeight: 500 }}
            >
              페이지 {page} / {totalPages}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <PaginationButton
                disabled={page <= 1 || callsQuery.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                이전
              </PaginationButton>
              <span
                className="hds-tnum no-text-break min-w-24 text-center"
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
      <Dialog
        open={!!selectedCallId}
        onOpenChange={(open) => !open && setSelectedCallId(null)}
      >
        <DialogContent
          key={selectedCallId ?? "call-detail"}
          className="w-[95vw] max-w-5xl max-h-[80vh] overflow-y-auto p-0 sm:!max-w-5xl"
          style={{
            backgroundColor: "#ffffff",
            fontFamily: "var(--hds-font-body)",
            color: "#061b31",
          }}
        >
          <DialogHeader
            className="gap-0 px-6 py-5"
            style={{ borderBottom: "1px solid #e5edf5" }}
          >
                                    <DialogTitle
              className="text-soft-wrap flex items-center gap-2 text-[18px] tracking-[-0.012em]"
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
              통화 이력 상세보기
            </DialogTitle>
            <DialogDescription
              className="mt-1 text-[12.5px] leading-[1.55]"
              style={{ color: "#64748d", fontWeight: 500 }}
            >
              선택한 통화의 기본 정보, 요약, 대화 내용, VOC와 후속조치 정보를 확인합니다.
            </DialogDescription>
          </DialogHeader>

          {selectedCallId && (
            <div className="space-y-6 px-4 py-5 sm:px-6 sm:py-6">
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
                <dl
                  className="overflow-hidden rounded-[8px]"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5edf5",
                  }}
                >
                  <InfoRow label="일시">
                    <span className="hds-tnum no-text-break">
                      {formatDateTimeShort(selectedCall.started_at)}
                    </span>
                  </InfoRow>
                  <InfoRow label="발신 번호">
                    <span className="hds-tnum no-text-break">
                      {formatCaller(selectedCall.caller_number)}
                    </span>
                  </InfoRow>
                  <InfoRow label="통화 시간">
                    <span className="hds-tnum no-text-break">
                      {formatDuration(selectedCall.duration_sec)}
                    </span>
                  </InfoRow>
                  <InfoRow label="상태">
                    <StatusBadge tone={getStatusBadgeTone(selectedCall.status)}>
                      {getCallStatusLabel(selectedCall.status)}
                    </StatusBadge>
                  </InfoRow>
                  <InfoRow label="주요 의도" isLast>
                    <StatusBadge tone="neutral">
                      {getCallIntent(selectedCall) ?? "분류 전"}
                    </StatusBadge>
                  </InfoRow>
                </dl>
              ) : (
                <Skeleton className="h-[220px] w-full rounded-[8px]" />
              )}

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <MessageSquare
                    className="h-4 w-4"
                    style={{ color: "#533afd" }}
                    aria-hidden="true"
                  />
                  <h3
                    className="text-soft-wrap text-[14px] tracking-[-0.008em]"
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
                <div className="flex min-w-0 items-center gap-2">
                  <Clock
                    className="h-4 w-4"
                    style={{ color: "#533afd" }}
                    aria-hidden="true"
                  />
                  <h3
                    className="text-soft-wrap text-[14px] tracking-[-0.008em]"
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
                              className="no-text-break text-[11.5px]"
                                style={{ color: "#64748d", fontWeight: 600 }}
                              >
                                {getSpeakerLabel(msg.speaker)}
                              </p>
                              <StatusBadge tone="neutral">
                                {getResponsePathLabel(msg.response_path)}
                              </StatusBadge>
                            </div>
                            <p
                              className="text-soft-wrap text-[13px] leading-[1.6]"
                              style={{ color: "#061b31", fontWeight: 500 }}
                            >
                              {msg.text}
                            </p>
                            <p
                              className="hds-tnum no-text-break text-[11px]"
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
        </DialogContent>
      </Dialog>
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
      className="no-text-break inline-flex h-8 items-center gap-1 rounded-[6px] px-2.5 text-[12px] transition-all"
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

function InfoRow({
  label,
  children,
  isLast = false,
}: {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid #f1f5f9",
      }}
    >
      <dt
        className="no-text-break w-[88px] shrink-0 text-[12.5px]"
        style={{ color: "#64748d", fontWeight: 500 }}
      >
        {label}
      </dt>
      <dd
        className="min-w-0 flex-1 text-[13px]"
        style={{ color: "#061b31", fontWeight: 500 }}
      >
        {children}
      </dd>
    </div>
  );
}
