import { useMemo } from "react"
import { CalendarClock, TriangleAlert } from "lucide-react"
import { CountChip, EmptyShell, StatusBadge } from "@/components/dashboard/page-chrome"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type VocSummaryPeriod = "week" | "month" | "year"

export type VocPeriodRange = {
  from: string
  to: string
}

export type PeriodicVocSummaryData = {
  topKeyword?: {
    label: string
    count: number
  }
  urgentOrHighCount: number
  actionRequiredCount: number
  summaryText: string
  isEmpty?: boolean
}

export type PeriodicVocKeywordStat = {
  keyword: string
  count: number
}

export type PeriodicVocPriorityStat = {
  priority: string
  label?: string
  count: number
}

export type PeriodicVocQueueItem = {
  priority?: string
  actionRequired?: boolean
  followUpRequired?: boolean
}

type PeriodicVocSummaryProps = {
  period: VocSummaryPeriod
  onPeriodChange: (period: VocSummaryPeriod) => void
  keywordStats: PeriodicVocKeywordStat[]
  priorityDistribution: PeriodicVocPriorityStat[]
  priorityQueueItems: PeriodicVocQueueItem[]
  isLoading?: boolean
  error?: Error | null
}

const periodLabels: Record<VocSummaryPeriod, string> = {
  week: "이번 주",
  month: "이번 달",
  year: "이번 해",
}

const priorityLevelOrder = ["urgent", "high", "medium", "low"] as const

function normalizePriorityLevel(
  value: string | null | undefined,
): (typeof priorityLevelOrder)[number] {
  const normalized = (value ?? "").toLowerCase()

  if (normalized === "urgent" || normalized === "critical") return "urgent"
  if (normalized === "high") return "high"
  if (normalized === "medium" || normalized === "normal") return "medium"
  return "low"
}

export function buildVocPeriodRange(
  period: VocSummaryPeriod,
  now = new Date(),
): VocPeriodRange {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  if (period === "week") {
    start.setDate(start.getDate() - 6)
  } else if (period === "month") {
    start.setDate(start.getDate() - 29)
  } else {
    start.setDate(start.getDate() - 364)
  }
  start.setHours(0, 0, 0, 0)

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  }
}

function formatCount(value: number) {
  return value.toLocaleString("ko-KR")
}

export function buildPeriodicVocSummary(
  period: VocSummaryPeriod,
  keywordStats: PeriodicVocKeywordStat[],
  priorityDistribution: PeriodicVocPriorityStat[],
  priorityQueueItems: PeriodicVocQueueItem[],
): PeriodicVocSummaryData {
  const topKeyword =
    keywordStats.slice().sort((left, right) => right.count - left.count)[0] ??
    null

  const urgentOrHighCount = priorityDistribution.reduce((sum, item) => {
    const normalizedPriority = normalizePriorityLevel(item.priority)
    if (normalizedPriority === "urgent" || normalizedPriority === "high") {
      return sum + item.count
    }
    return sum
  }, 0)

  const actionRequiredCount = priorityQueueItems.reduce((sum, item) => {
    if (item.followUpRequired === true || item.actionRequired === true) {
      return sum + 1
    }
    return sum
  }, 0)

  const isEmpty =
    keywordStats.length === 0 &&
    priorityDistribution.every((item) => item.count === 0) &&
    priorityQueueItems.length === 0

  const summaryText = isEmpty
    ? "분석할 VOC 데이터가 없습니다."
    : `${periodLabels[period]}에는 ${
        topKeyword?.keyword ?? "주요 키워드"
      } 문의가 가장 많고, 긴급/높음 항목은 ${formatCount(
        urgentOrHighCount,
      )}건, 후속 조치 필요 건수는 ${formatCount(actionRequiredCount)}건입니다.`

  return {
    topKeyword: topKeyword
      ? {
          label: topKeyword.keyword,
          count: topKeyword.count,
        }
      : undefined,
    urgentOrHighCount,
    actionRequiredCount,
    summaryText,
    isEmpty,
  }
}

export function PeriodicVocSummary({
  period,
  onPeriodChange,
  keywordStats,
  priorityDistribution,
  priorityQueueItems,
  isLoading = false,
  error = null,
}: PeriodicVocSummaryProps) {
  const summary = useMemo(
    () =>
      buildPeriodicVocSummary(
        period,
        keywordStats,
        priorityDistribution,
        priorityQueueItems,
      ),
    [keywordStats, period, priorityDistribution, priorityQueueItems],
  )

  return (
    <section
      className="overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex items-start justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[6px]"
            style={{
              color: "#533afd",
              backgroundColor: "rgba(83,58,253,0.08)",
              border: "1px solid rgba(83,58,253,0.20)",
            }}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <div>
            <h3
              className="text-[15px] tracking-[-0.01em]"
              style={{
                color: "#061b31",
                fontFamily: "var(--hds-font-display)",
                fontWeight: 700,
              }}
            >
              기간별 VOC 정리
            </h3>
            <p className="mt-0.5 text-[12.5px]" style={{ color: "#64748d", fontWeight: 500 }}>
              키워드와 우선순위 항목을 기준으로 반복 문의와 긴급 이슈를 정리합니다.
            </p>
          </div>
        </div>

        <Tabs
          value={period}
          onValueChange={(value) => onPeriodChange(value as VocSummaryPeriod)}
        >
          <TabsList>
            <TabsTrigger value="week">주간</TabsTrigger>
            <TabsTrigger value="month">월간</TabsTrigger>
            <TabsTrigger value="year">연간</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full rounded-[8px]" />
              ))}
            </div>
            <Skeleton className="h-4 w-full" />
          </>
        ) : error ? (
          <EmptyShell height="h-[180px]" tone="error">
            VOC 분석을 불러오지 못했습니다. {error.message}
          </EmptyShell>
        ) : summary.isEmpty ? (
          <EmptyShell height="h-[180px]">분석할 VOC 데이터가 없습니다.</EmptyShell>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div
                className="rounded-[8px] p-3"
                style={{ backgroundColor: "#f6f9fc", border: "1px solid #e5edf5" }}
              >
                <p className="text-[12px]" style={{ color: "#64748d", fontWeight: 500 }}>
                  최다 키워드
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p
                    className="truncate text-[13px]"
                    style={{ color: "#061b31", fontWeight: 600 }}
                    title={summary.topKeyword?.label ?? "-"}
                  >
                    {summary.topKeyword?.label ?? "-"}
                  </p>
                  <CountChip tone="primary">
                    {formatCount(summary.topKeyword?.count ?? 0)}건
                  </CountChip>
                </div>
              </div>

              <div
                className="rounded-[8px] p-3"
                style={{ backgroundColor: "#f6f9fc", border: "1px solid #e5edf5" }}
              >
                <p className="text-[12px]" style={{ color: "#64748d", fontWeight: 500 }}>
                  긴급/높음 항목 수
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p style={{ color: "#061b31", fontWeight: 600 }}>후속 검토 필요</p>
                  <CountChip tone="error">
                    {formatCount(summary.urgentOrHighCount)}건
                  </CountChip>
                </div>
              </div>

              <div
                className="rounded-[8px] p-3"
                style={{ backgroundColor: "#f6f9fc", border: "1px solid #e5edf5" }}
              >
                <p className="text-[12px]" style={{ color: "#64748d", fontWeight: 500 }}>
                  후속 조치 필요 건수
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p style={{ color: "#061b31", fontWeight: 600 }}>조치 검토 필요</p>
                  <CountChip tone="neutral">
                    {formatCount(summary.actionRequiredCount)}건
                  </CountChip>
                </div>
              </div>
            </div>

            <div
              className="flex items-start gap-2 rounded-[8px] px-3 py-3 text-[13px]"
              style={{
                backgroundColor: "rgba(83,58,253,0.04)",
                border: "1px solid rgba(83,58,253,0.16)",
              }}
            >
              <StatusBadge tone="info" icon={<TriangleAlert className="h-3 w-3" />}>
                요약
              </StatusBadge>
              <p style={{ color: "#273951", fontWeight: 500, lineHeight: 1.6 }}>
                {summary.summaryText}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
