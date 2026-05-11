import type { CSSProperties, ReactNode } from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardPriorityQueue } from "@/features/dashboard/dashboardQueries"
import type { DashboardAlert } from "@/features/dashboard/dashboardTypes"
import { cn } from "@/lib/utils"
import { getResolutionStatusLabel } from "@/features/calls/callsAdapters"

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  normal: "Normal",
  low: "Low",
}

type BadgeTone = "info" | "success" | "warning" | "error" | "neutral"

const badgeStyles: Record<BadgeTone, CSSProperties> = {
  info: {
    backgroundColor: "rgba(83,58,253,0.08)",
    color: "#533afd",
    border: "1px solid rgba(83,58,253,0.20)",
  },
  success: {
    backgroundColor: "rgba(21,190,83,0.15)",
    color: "#108c3d",
    border: "1px solid rgba(21,190,83,0.30)",
  },
  warning: {
    backgroundColor: "rgba(155,104,41,0.12)",
    color: "#9b6829",
    border: "1px solid rgba(155,104,41,0.25)",
  },
  error: {
    backgroundColor: "rgba(234,34,97,0.10)",
    color: "#ea2261",
    border: "1px solid rgba(234,34,97,0.25)",
  },
  neutral: {
    backgroundColor: "#f6f9fc",
    color: "#64748d",
    border: "1px solid #e5edf5",
  },
}

function StatusBadge({
  tone,
  children,
}: {
  tone: BadgeTone
  children: ReactNode
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11.5px] leading-[1.4]"
      style={{
        ...badgeStyles[tone],
        fontFamily: "var(--hds-font-body)",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const priorityKey = priority?.toLowerCase() ?? "normal"
  const label = priorityLabels[priorityKey] ?? priority ?? "Normal"

  if (priorityKey === "critical") return <StatusBadge tone="error">{label}</StatusBadge>
  if (priorityKey === "high") return <StatusBadge tone="warning">{label}</StatusBadge>
  return <StatusBadge tone="neutral">{label}</StatusBadge>
}

function getActionTone(
  actionRequired: boolean | undefined,
  resolutionStatus: DashboardAlert["resolutionStatus"],
): BadgeTone {
  if (actionRequired === true) return "error"
  if (resolutionStatus === "resolved") return "success"
  if (resolutionStatus === "escalated") return "warning"
  if (resolutionStatus === "abandoned") return "neutral"
  return "neutral"
}

function CallListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} style={{ borderBottom: "1px solid #e5edf5" }}>
          {Array.from({ length: 5 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <Skeleton className="h-3.5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function formatDateTime(value: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function CallList() {
  const priorityQueueQuery = useDashboardPriorityQueue({ limit: 10 })
  const actionCalls = priorityQueueQuery.data?.items ?? []
  const visibleActionCalls = actionCalls.filter((item) => {
    if (typeof item.followUpRequired === "boolean") {
      return item.followUpRequired
    }

    return true
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div className="min-w-0">
          <h2
            className="text-[16px] tracking-[-0.012em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            최근 조치 필요 콜
          </h2>
          <p
            className="mt-0.5 text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            상담원 검토가 필요한 가장 최신 통화 10건
          </p>
        </div>

        <Link
          to="/dashboard/calls"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-2 text-[12.5px] transition-all duration-150",
          )}
          style={{
            color: "#273951",
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
            fontWeight: 500,
            fontFamily: "var(--hds-font-body)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f6f9fc"
            e.currentTarget.style.borderColor = "#d6d9fc"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff"
            e.currentTarget.style.borderColor = "#e5edf5"
          }}
        >
          전체 보기
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

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
              <th
                scope="col"
                className="w-[200px] whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                style={{
                  color: "#64748d",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                일시
              </th>
              <th
                scope="col"
                className="w-[130px] whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                style={{
                  color: "#64748d",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                연락처
              </th>
              <th
                scope="col"
                className="whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                style={{
                  color: "#64748d",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                요약
              </th>
              <th
                scope="col"
                className="w-[90px] whitespace-nowrap px-4 py-3 text-center text-[11.5px] uppercase"
                style={{
                  color: "#64748d",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                우선순위
              </th>
              <th
                scope="col"
                className="w-[100px] whitespace-nowrap px-4 py-3 text-right text-[11.5px] uppercase"
                style={{
                  color: "#64748d",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                }}
              >
                통화 시간
              </th>
            </tr>
          </thead>

          <tbody>
            {priorityQueueQuery.isLoading ? <CallListSkeleton /> : null}

            {!priorityQueueQuery.isLoading && priorityQueueQuery.isError ? (
              <tr>
                <td
                  colSpan={5}
                  className="h-24 text-center text-[13px]"
                  style={{ color: "#64748d" }}
                >
                  최근 조치 필요 콜 데이터를 불러오지 못했습니다.
                </td>
              </tr>
            ) : null}

            {!priorityQueueQuery.isLoading &&
            !priorityQueueQuery.isError &&
            visibleActionCalls.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="h-24 text-center text-[13px]"
                  style={{ color: "#64748d" }}
                >
                  현재 상담원 후속 조치가 필요한 콜이 없습니다.
                </td>
              </tr>
            ) : null}

            {visibleActionCalls.slice(0, 10).map((item, idx) => {
              const summary = item.summaryShort || item.reason || "요약 없음"
              const actionTone = getActionTone(
                item.actionRequired,
                item.resolutionStatus,
              )

              return (
                <motion.tr
                  key={item.id}
                  custom={idx}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.18 + idx * 0.04,
                    duration: 0.34,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  className="group align-middle transition-colors"
                  style={{ borderBottom: "1px solid #e5edf5" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f6f9fc")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className="hds-tnum text-[12px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      {formatDateTime(item.createdAt)}
                    </span>
                  </td>
                  <td
                    className="hds-tnum whitespace-nowrap px-4 py-3 text-[13px]"
                    style={{ color: "#273951", fontWeight: 500 }}
                  >
                    {item.callerNumber || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p
                        className="line-clamp-2 text-[13px] leading-[1.5]"
                        style={{ color: "#273951", fontWeight: 500 }}
                        title={summary}
                      >
                        {summary}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.actionRequired === true ? (
                          <StatusBadge tone="error">조치 필요</StatusBadge>
                        ) : null}
                        {item.resolutionStatus ? (
                          <StatusBadge tone={actionTone}>
                            {getResolutionStatusLabel(item.resolutionStatus)}
                          </StatusBadge>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td
                    className="hds-tnum whitespace-nowrap px-4 py-3 text-right text-[13px]"
                    style={{ color: "#273951", fontWeight: 500 }}
                  >
                    -
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
