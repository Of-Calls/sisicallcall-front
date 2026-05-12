import { useMemo } from "react"
import { EmptyShell, StatusBadge, CountChip } from "@/components/dashboard/page-chrome"
import { Skeleton } from "@/components/ui/skeleton"

export type PriorityLevel = "urgent" | "high" | "medium" | "low"

type PriorityDistributionStat = {
  priority?: string
  label?: string
  count: number
}

type PriorityQueueItem = {
  priority?: string
  actionRequired?: boolean
  followUpRequired?: boolean
}

type PriorityDistributionTableProps = {
  distributionItems: PriorityDistributionStat[]
  priorityQueueItems: PriorityQueueItem[]
  isLoading?: boolean
  error?: Error | null
}

const priorityOrder: PriorityLevel[] = ["urgent", "high", "medium", "low"]

const priorityLabelMap: Record<PriorityLevel, string> = {
  urgent: "긴급",
  high: "높음",
  medium: "보통",
  low: "낮음",
}

function normalizePriorityLevel(value?: string | null): PriorityLevel {
  const normalized = (value ?? "").toLowerCase()

  if (normalized === "critical" || normalized === "urgent") return "urgent"
  if (normalized === "high") return "high"
  if (normalized === "medium" || normalized === "normal") return "medium"
  return "low"
}

function getPriorityTone(priority: PriorityLevel): "info" | "success" | "warning" | "error" | "neutral" {
  switch (priority) {
    case "urgent":
      return "error"
    case "high":
      return "warning"
    case "medium":
      return "info"
    case "low":
    default:
      return "neutral"
  }
}

function getRowTone(priority: PriorityLevel, count: number) {
  if (priority === "urgent" && count > 0) return "error"
  if (priority === "high" && count > 0) return "primary"
  return "neutral"
}

function buildPriorityDistributionRows(
  distributionItems: PriorityDistributionStat[],
  priorityQueueItems: PriorityQueueItem[],
) {
  const countByPriority = new Map<PriorityLevel, number>()
  const actionRequiredByPriority = new Map<PriorityLevel, number>()

  priorityOrder.forEach((priority) => {
    countByPriority.set(priority, 0)
    actionRequiredByPriority.set(priority, 0)
  })

  distributionItems.forEach((item) => {
    const priority = normalizePriorityLevel(item.priority)
    countByPriority.set(priority, (countByPriority.get(priority) ?? 0) + item.count)
  })

  priorityQueueItems.forEach((item) => {
    if (item.followUpRequired !== true && item.actionRequired !== true) {
      return
    }

    const priority = normalizePriorityLevel(item.priority)
    actionRequiredByPriority.set(
      priority,
      (actionRequiredByPriority.get(priority) ?? 0) + 1,
    )
  })

  const total = Array.from(countByPriority.values()).reduce((sum, count) => sum + count, 0)

  return priorityOrder.map((priority) => {
    const count = countByPriority.get(priority) ?? 0

    return {
      priority,
      label: priorityLabelMap[priority],
      count,
      ratio: total > 0 ? count / total : 0,
      actionRequiredCount: actionRequiredByPriority.get(priority) ?? 0,
    }
  })
}

function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return <StatusBadge tone={getPriorityTone(priority)}>{priorityLabelMap[priority]}</StatusBadge>
}

export function PriorityDistributionTable({
  distributionItems,
  priorityQueueItems,
  isLoading = false,
  error = null,
}: PriorityDistributionTableProps) {
  const rows = useMemo(
    () => buildPriorityDistributionRows(distributionItems, priorityQueueItems),
    [distributionItems, priorityQueueItems],
  )

  return (
    <section
      className="min-w-0 overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div className="min-w-0">
          <h3
            className="text-soft-wrap text-[15px] tracking-[-0.01em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            우선 순위 항목 분포
          </h3>
          <p className="text-soft-wrap mt-0.5 text-[12.5px]" style={{ color: "#64748d", fontWeight: 500 }}>
            긴급, 높음, 보통, 낮음 항목의 분포와 후속 조치 필요 건수를 확인합니다.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-[8px]" />
          ))}
        </div>
      ) : error ? (
        <div className="p-5">
          <EmptyShell height="h-[160px]" tone="error">
            우선 순위 항목 분포를 불러오지 못했습니다. {error.message}
          </EmptyShell>
        </div>
      ) : (
        <div className="responsive-table-wrapper">
          <table className="w-full min-w-[560px] border-collapse text-left" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr style={{ backgroundColor: "#f6f9fc", borderBottom: "1px solid #d6d9fc" }}>
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                  style={{ color: "#64748d", fontWeight: 600, letterSpacing: "0.4px" }}
                >
                  우선순위
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                  style={{ color: "#64748d", fontWeight: 600, letterSpacing: "0.4px" }}
                >
                  건수
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                  style={{ color: "#64748d", fontWeight: 600, letterSpacing: "0.4px" }}
                >
                  전체 대비
                </th>
                <th
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-[11.5px] uppercase"
                  style={{ color: "#64748d", fontWeight: 600, letterSpacing: "0.4px" }}
                >
                  후속 조치 필요
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.priority}
                  style={{
                    borderBottom: index === rows.length - 1 ? "none" : "1px solid #e5edf5",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <td className="px-4 py-3">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <CountChip tone={getRowTone(row.priority, row.count)}>
                      {row.count.toLocaleString("ko-KR")}건
                    </CountChip>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px]" style={{ color: "#273951", fontWeight: 500 }}>
                    {(row.ratio * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3">
                    <CountChip tone={row.actionRequiredCount > 0 ? "error" : "neutral"}>
                      {row.actionRequiredCount.toLocaleString("ko-KR")}건
                    </CountChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
