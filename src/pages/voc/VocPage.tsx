import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { BarChart3, Hash, TrendingUp } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats } from "@/features/dashboard/dashboardQueries"
import {
  useEmotionDistribution,
  useVocKeywordStats,
  useVocPriorityDistribution,
} from "@/features/voc/vocQueries"
import type {
  EmotionKey,
  VocKeywordStatsItem,
  VocPriorityDistributionItem,
} from "@/features/voc/vocTypes"

const emotionColors: Record<EmotionKey, string> = {
  positive: "#10b981",
  neutral: "#6b7280",
  negative: "#f97316",
  angry: "#ef4444",
}

const priorityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.1 * i,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

function PendingAggregationCard({
  title,
  icon,
}: {
  title: string
  icon: ReactNode
}) {
  return (
    <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          백엔드 집계 API 연결 대기
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyAggregationCard({
  title,
  icon,
  message,
}: {
  title: string
  icon: ReactNode
  message: string
}) {
  return (
    <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
          {message}
        </div>
      </CardContent>
    </Card>
  )
}

function KeywordStatsCard({ items }: { items: VocKeywordStatsItem[] }) {
  return (
    <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Hash className="h-5 w-5 text-primary" aria-hidden="true" />
          핵심 키워드 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={`${item.keyword}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {index + 1}
              </span>
              <span className="text-sm font-medium">{item.keyword}</span>
            </div>
            <Badge variant="outline">{item.count.toLocaleString("ko-KR")}건</Badge>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}

function PriorityDistributionCard({
  items,
}: {
  items: VocPriorityDistributionItem[]
}) {
  return (
    <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
          우선순위 항목 분포
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                axisLine={{ stroke: "#e5e7eb" }}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value) => [`${value}건`, "통화"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {items.map((item) => (
                  <Cell
                    key={item.priority}
                    fill={priorityColors[item.priority] ?? "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.priority}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-foreground">{item.label}</span>
                <Badge variant="outline">{item.count.toLocaleString("ko-KR")}건</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{item.priority}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function VocPage() {
  const statsQuery = useDashboardStats()
  const emotionQuery = useEmotionDistribution()
  const keywordStatsQuery = useVocKeywordStats()
  const priorityDistributionQuery = useVocPriorityDistribution()

  const emotionData = emotionQuery.data ?? []
  const analyzedCalls = emotionData.reduce((sum, item) => sum + item.value, 0)
  const totalCalls = statsQuery.data?.totalCalls ?? null
  const isEmotionEmpty =
    emotionData.length === 0 || emotionData.every((item) => item.value === 0)

  const keywordItems = keywordStatsQuery.data
  const priorityItems = priorityDistributionQuery.data
  const keywordStatsItems = Array.isArray(keywordItems) ? keywordItems : []
  const priorityDistributionItems = Array.isArray(priorityItems)
    ? priorityItems
    : []
  const isKeywordPending = keywordItems === null
  const isPriorityPending = priorityItems === null
  const isKeywordEmpty = Array.isArray(keywordItems) && keywordItems.length === 0
  const isPriorityEmpty =
    Array.isArray(priorityItems) &&
    (priorityItems.length === 0 || priorityItems.every((item) => item.count === 0))

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">VOC 분석</h1>
          <p className="text-sm text-muted-foreground">
            고객 통화 데이터에서 감정 분포와 집계 지표를 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          <span>전체 집계 기준</span>
        </div>
      </motion.div>

      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
              고객 감정 분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emotionQuery.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-lg" />
                <Skeleton className="mx-auto h-5 w-72" />
              </div>
            ) : emotionQuery.isError ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                감정 분포 집계를 불러오지 못했습니다.
              </div>
            ) : isEmotionEmpty ? (
              <div className="space-y-4">
                <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  집계된 감정 분포가 없습니다.
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {totalCalls === null
                    ? `분석된 통화 ${analyzedCalls.toLocaleString("ko-KR")}건 기준`
                    : `분석된 통화 ${analyzedCalls.toLocaleString("ko-KR")}건 / 전체 통화 ${totalCalls.toLocaleString("ko-KR")}건`}
                </p>
              </div>
            ) : (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emotionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                      />
                      <YAxis
                        tick={{ fill: "#6b7280", fontSize: 12 }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        formatter={(value) => [`${value}건`, "통화"]}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {emotionData.map((entry) => (
                          <Cell key={entry.key} fill={emotionColors[entry.key]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
                  {emotionData.map((item) => (
                    <div key={item.key} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: emotionColors[item.key] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {totalCalls === null
                    ? `분석된 통화 ${analyzedCalls.toLocaleString("ko-KR")}건 기준`
                    : `분석된 통화 ${analyzedCalls.toLocaleString("ko-KR")}건 / 전체 통화 ${totalCalls.toLocaleString("ko-KR")}건`}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {keywordStatsQuery.isLoading ? (
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hash className="h-5 w-5 text-primary" aria-hidden="true" />
                  핵심 키워드 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : keywordStatsQuery.isError ? (
            <EmptyAggregationCard
              title="핵심 키워드 분석"
              icon={<Hash className="h-5 w-5 text-primary" aria-hidden="true" />}
              message={`키워드 집계를 불러오지 못했습니다. ${keywordStatsQuery.error.message}`}
            />
          ) : isKeywordPending ? (
            <PendingAggregationCard
              title="핵심 키워드 분석"
              icon={<Hash className="h-5 w-5 text-primary" aria-hidden="true" />}
            />
          ) : isKeywordEmpty ? (
            <EmptyAggregationCard
              title="핵심 키워드 분석"
              icon={<Hash className="h-5 w-5 text-primary" aria-hidden="true" />}
              message="집계된 핵심 키워드가 없습니다."
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
          {priorityDistributionQuery.isLoading ? (
            <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                  우선순위 항목 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : priorityDistributionQuery.isError ? (
            <EmptyAggregationCard
              title="우선순위 항목 분포"
              icon={<BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />}
              message={`우선순위 분포 집계를 불러오지 못했습니다. ${priorityDistributionQuery.error.message}`}
            />
          ) : isPriorityPending ? (
            <PendingAggregationCard
              title="우선순위 항목 분포"
              icon={<BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />}
            />
          ) : isPriorityEmpty ? (
            <EmptyAggregationCard
              title="우선순위 항목 분포"
              icon={<BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />}
              message="집계된 우선순위 항목이 없습니다."
            />
          ) : (
            <PriorityDistributionCard items={priorityDistributionItems} />
          )}
        </motion.div>
      </div>
    </div>
  )
}
