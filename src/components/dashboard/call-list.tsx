import { motion } from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  formatDateTime,
  formatDuration,
  getCallStatusLabel,
  getEmotionLabel,
  getResolutionStatusLabel,
} from "@/features/calls/callsAdapters";
import type { DashboardRecentCall } from "@/features/dashboard/dashboardTypes";

const priorityLabels: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  normal: "Normal",
  low: "Low",
};

/* ---------------- Status badge variants (HDS tokens) ---------------- */

type BadgeTone = "info" | "success" | "warning" | "error" | "neutral";

const badgeStyles: Record<BadgeTone, React.CSSProperties> = {
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
};

function StatusBadge({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
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
  );
}

function PriorityBadge({ priority }: { priority: string | null }) {
  const priorityKey = priority?.toLowerCase() ?? "normal";
  const label = priorityLabels[priorityKey] ?? priority ?? "Normal";

  if (priorityKey === "critical")
    return <StatusBadge tone="error">{label}</StatusBadge>;
  if (priorityKey === "high")
    return <StatusBadge tone="warning">{label}</StatusBadge>;
  return <StatusBadge tone="neutral">{label}</StatusBadge>;
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: DashboardRecentCall["customer_emotion"];
}) {
  const label = getEmotionLabel(sentiment ?? undefined);

  if (sentiment === "negative" || sentiment === "angry") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[12px]"
        style={{
          color: "#ea2261",
          fontFamily: "var(--hds-font-body)",
          fontWeight: 500,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "#ea2261" }}
        />
        {label}
      </span>
    );
  }

  if (sentiment === "positive") {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[12px]"
        style={{
          color: "#108c3d",
          fontFamily: "var(--hds-font-body)",
          fontWeight: 500,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: "#15be53" }}
        />
        {label}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[12px]"
      style={{
        color: "#64748d",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: "#94a3b8" }}
      />
      {label}
    </span>
  );
}

const rowVariants = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.18 + i * 0.04,
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const COL_COUNT = 9;

const headers = [
  { label: "ID", className: "w-[120px]" },
  { label: "상태 / 시작", className: "w-[180px]" },
  { label: "연락처", className: "w-[140px]" },
  { label: "요약", className: "" },
  { label: "우선순위", className: "w-[100px]" },
  { label: "감정", className: "w-[88px]" },
  { label: "해결 상태", className: "w-[120px]" },
  { label: "통화 시간", className: "w-[100px] text-right" },
  { label: "액션", className: "w-[120px] text-right" },
] as const;

function CallListSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <tr key={rowIndex} style={{ borderBottom: "1px solid #e5edf5" }}>
          {Array.from({ length: COL_COUNT }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-4 py-3">
              <Skeleton className="h-3.5 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CallList({
  calls,
  isLoading,
  error,
}: {
  calls: DashboardRecentCall[];
  isLoading: boolean;
  error: Error | null;
}) {
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
      {/* Header strip — sits ABOVE the table, not on the same surface */}
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
            e.currentTarget.style.backgroundColor = "#f6f9fc";
            e.currentTarget.style.borderColor = "#d6d9fc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#e5edf5";
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
                    fontFamily: "var(--hds-font-body)",
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? <CallListSkeleton /> : null}

            {!isLoading && error ? (
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="h-24 text-center text-[13px]"
                  style={{ color: "#64748d" }}
                >
                  최근 통화 데이터를 불러오지 못했습니다.
                </td>
              </tr>
            ) : null}

            {!isLoading && !error && calls.length === 0 ? (
              <tr>
                <td
                  colSpan={COL_COUNT}
                  className="h-24 text-center text-[13px]"
                  style={{ color: "#64748d" }}
                >
                  최근 통화가 없습니다.
                </td>
              </tr>
            ) : null}

            {calls.map((call, idx) => (
              <motion.tr
                key={call.id}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={rowVariants}
                className="group transition-colors"
                style={{ borderBottom: "1px solid #e5edf5" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#f6f9fc")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <td
                  className="hds-mono px-4 py-3 text-[12px]"
                  style={{
                    color: "#64748d",
                    fontFamily: "var(--hds-font-mono)",
                    fontWeight: 400,
                  }}
                >
                  {call.id}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <StatusBadge tone="neutral">
                      {getCallStatusLabel(call.status)}
                    </StatusBadge>
                    <p
                      className="hds-tnum text-[11.5px]"
                      style={{ color: "#64748d", fontWeight: 500 }}
                    >
                      {formatDateTime(call.started_at)}
                    </p>
                  </div>
                </td>
                <td
                  className="hds-tnum px-4 py-3 text-[13px]"
                  style={{ color: "#273951", fontWeight: 500 }}
                >
                  {call.caller_number ?? "번호 없음"}
                </td>
                <td
                  className="max-w-[280px] truncate px-4 py-3 text-[13px]"
                  style={{
                    color: "#273951",
                    fontWeight: 500,
                  }}
                  title={call.summary_short ?? "요약 없음"}
                >
                  {call.summary_short ?? "요약 없음"}
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={call.priority} />
                </td>
                <td className="px-4 py-3">
                  <SentimentBadge sentiment={call.customer_emotion} />
                </td>
                <td
                  className="px-4 py-3 text-[12.5px]"
                  style={{ color: "#64748d", fontWeight: 500 }}
                >
                  {getResolutionStatusLabel(
                    call.resolution_status ?? undefined,
                  )}
                </td>
                <td
                  className="hds-tnum px-4 py-3 text-right text-[13px]"
                  style={{ color: "#273951", fontWeight: 500 }}
                >
                  {formatDuration(call.duration_sec)}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-1.5 rounded-[6px] px-2.5 py-1.5 text-[11.5px] transition-colors"
                    style={{
                      color: "#94a3b8",
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5edf5",
                      fontWeight: 500,
                      cursor: "not-allowed",
                    }}
                  >
                    <Phone className="h-3 w-3" />
                    연결 준비 중
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
