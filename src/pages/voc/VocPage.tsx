import { useMemo, useState, type ReactNode } from "react"
import { motion } from "framer-motion"
import { BarChart3, Hash } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CountChip,
  EmptyShell,
  PageShell,
  PageTopbar,
  SectionHeader,
} from "@/components/dashboard/page-chrome"
import { PeriodicVocSummary } from "@/components/voc/periodic-voc-summary"
import {
  buildVocPeriodRange,
  type VocSummaryPeriod,
} from "@/components/voc/periodic-voc-summary"
import { PriorityDistributionTable } from "@/components/voc/priority-distribution-table"
import { useDashboardPriorityQueue } from "@/features/dashboard/dashboardQueries"
import {
  useVocKeywordStats,
  useVocPriorityDistribution,
} from "@/features/voc/vocQueries"
import type {
  VocKeywordStatsItem,
  VocPriorityDistributionItem,
} from "@/features/voc/vocTypes"

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.06 * i,
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

function ChartCard({
  icon,
  title,
  children,
  rightSlot,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  rightSlot?: ReactNode
}) {
  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[12px]"
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
            {icon}
          </span>
          <h3
            className="text-[15px] tracking-[-0.01em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            {title}
          </h3>
        </div>
        {rightSlot}
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </div>
  )
}

function PendingCard({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <ChartCard icon={icon} title={title}>
      <EmptyShell height="h-[300px]">백엔드 지표 API 연결을 기다리는 중입니다.</EmptyShell>
    </ChartCard>
  )
}

function EmptyCard({
  title,
  icon,
  message,
  tone = "neutral",
}: {
  title: string
  icon: ReactNode
  message: string
  tone?: "neutral" | "error"
}) {
  return (
    <ChartCard icon={icon} title={title}>
      <EmptyShell height="h-[300px]" tone={tone}>
        {message}
      </EmptyShell>
    </ChartCard>
  )
}

function KeywordStatsCard({ items }: { items: VocKeywordStatsItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <ChartCard
      icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
      title="핵심 키워드 분석"
      rightSlot={
        <CountChip tone="primary">{total.toLocaleString("ko-KR")}건</CountChip>
      }
    >
      <ul className="space-y-2">
        {items.map((item, index) => {
          const ratio = total > 0 ? item.count / total : 0

          return (
            <motion.li
              key={`${item.keyword}-${index}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.32 }}
              className="rounded-[8px] p-3"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5edf5",
                fontFamily: "var(--hds-font-body)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="hds-tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[11px]"
                    style={{
                      color: "#533afd",
                      backgroundColor: "rgba(83,58,253,0.08)",
                      border: "1px solid rgba(83,58,253,0.20)",
                      fontFamily: "var(--hds-font-display)",
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ color: "#061b31", fontWeight: 600 }}
                  >
                    {item.keyword}
                  </span>
                </div>
                <CountChip>{item.count.toLocaleString("ko-KR")}건</CountChip>
              </div>

              <div
                className="mt-2 h-1 w-full overflow-hidden rounded-[2px]"
                style={{ backgroundColor: "#eef2f8" }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, ratio * 100)}%` }}
                  transition={{ delay: 0.1 + index * 0.04, duration: 0.5 }}
                  className="h-full rounded-[2px]"
                  style={{ backgroundColor: "#533afd" }}
                />
              </div>
            </motion.li>
          )
        })}
      </ul>
    </ChartCard>
  )
}

export function VocPage() {
  const [summaryPeriod, setSummaryPeriod] = useState<VocSummaryPeriod>("week")
  const summaryRange = useMemo(
    () => buildVocPeriodRange(summaryPeriod),
    [summaryPeriod],
  )

  const keywordStatsQuery = useVocKeywordStats(summaryRange)
  const priorityDistributionQuery = useVocPriorityDistribution(summaryRange)
  const priorityQueueQuery = useDashboardPriorityQueue({
    ...summaryRange,
    limit: 10,
  })

  const keywordItems = keywordStatsQuery.data
  const priorityItems = priorityDistributionQuery.data
  const keywordStatsItems = Array.isArray(keywordItems) ? keywordItems : []
  const priorityDistributionItems = Array.isArray(priorityItems)
    ? priorityItems
    : []
  const priorityQueueItems = priorityQueueQuery.data?.items ?? []

  const isKeywordPending = keywordItems === null
  const isKeywordEmpty =
    Array.isArray(keywordItems) && keywordItems.length === 0

  const summaryError =
    keywordStatsQuery.error ??
    priorityDistributionQuery.error ??
    priorityQueueQuery.error ??
    null
  const summaryLoading =
    keywordStatsQuery.isLoading ||
    priorityDistributionQuery.isLoading ||
    priorityQueueQuery.isLoading
  const tableError =
    priorityDistributionQuery.error ?? priorityQueueQuery.error ?? null
  const tableLoading =
    priorityDistributionQuery.isLoading || priorityQueueQuery.isLoading

  return (
    <PageShell>
      <PageTopbar
        eyebrow="운영"
        title="VOC 분석"
        description="고객 통화 데이터를 바탕으로 키워드 분포와 우선순위 항목을 확인합니다."
        rightSlot={
          <CountChip tone="primary">
            <BarChart3 className="h-3 w-3" aria-hidden="true" />
            전체 지표
          </CountChip>
        }
      />

      <div className="space-y-6 px-8 py-6">
        <section className="space-y-3">
          <SectionHeader
            eyebrow="기간별 정리"
            title="기간별 VOC 정리"
            description="키워드와 우선순위 항목을 기준으로 반복 문의와 긴급 이슈를 정리합니다."
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <PeriodicVocSummary
              period={summaryPeriod}
              onPeriodChange={setSummaryPeriod}
              keywordStats={keywordStatsItems}
              priorityDistribution={priorityDistributionItems}
              priorityQueueItems={priorityQueueItems}
              isLoading={summaryLoading}
              error={summaryError}
            />
          </motion.div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            eyebrow="분석"
            title="키워드 · 우선순위 분석"
            description="주요 문의 키워드와 우선순위 분포를 함께 확인합니다."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              {keywordStatsQuery.isLoading ? (
                <ChartCard
                  icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                  title="핵심 키워드 분석"
                >
                  <Skeleton className="h-[300px] w-full rounded-[8px]" />
                </ChartCard>
              ) : keywordStatsQuery.isError ? (
                <EmptyCard
                  title="핵심 키워드 분석"
                  icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                  message={`키워드 분석을 불러오지 못했습니다. ${keywordStatsQuery.error.message}`}
                  tone="error"
                />
              ) : isKeywordPending ? (
                <PendingCard
                  title="핵심 키워드 분석"
                  icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                />
              ) : isKeywordEmpty ? (
                <EmptyCard
                  title="핵심 키워드 분석"
                  icon={<Hash className="h-3.5 w-3.5" aria-hidden="true" />}
                  message="분석할 핵심 키워드가 없습니다."
                />
              ) : (
                <KeywordStatsCard items={keywordStatsItems} />
              )}
            </motion.div>

            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
            >
              <PriorityDistributionTable
                distributionItems={priorityDistributionItems}
                priorityQueueItems={priorityQueueItems}
                isLoading={tableLoading}
                error={tableError}
              />
            </motion.div>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
