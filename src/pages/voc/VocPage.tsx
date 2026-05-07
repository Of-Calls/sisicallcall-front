import { useMemo } from "react"
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
import {
  useEmotionDistribution,
  useVocPriorityQueue,
} from "@/features/voc/vocQueries"
import type { EmotionKey, VocPriorityItem } from "@/features/voc/vocTypes"

const pendingKeywordsData = [
  { keyword: "반복 문의", status: "준비 중" },
  { keyword: "불만 표현", status: "준비 중" },
  { keyword: "상담원 연결", status: "준비 중" },
  { keyword: "업무 요청", status: "준비 중" },
  { keyword: "해결 지연", status: "준비 중" },
  { keyword: "콜백 요청", status: "준비 중" },
]

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
  normal: "#64748b",
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

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    normal: "Normal",
    low: "Low",
  }

  return labels[priority] ?? priority
}

function buildPriorityDistribution(items: VocPriorityItem[]) {
  const counts = items.reduce<Record<string, number>>((acc, item) => {
    const priority = item.priority || "normal"
    acc[priority] = (acc[priority] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts).map(([priority, count]) => ({
    priority: getPriorityLabel(priority),
    count,
    color: priorityColors[priority] ?? priorityColors.normal,
  }))
}

export function VocPage() {
  const emotionQuery = useEmotionDistribution()
  const priorityQuery = useVocPriorityQueue()

  const emotionData = emotionQuery.data ?? []
  const priorityItems = priorityQuery.data ?? []
  const isEmotionEmpty =
    emotionData.length === 0 || emotionData.every((item) => item.value === 0)
  const priorityDistribution = useMemo(
    () => buildPriorityDistribution(priorityItems),
    [priorityItems],
  )

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
            고객 통화 데이터에서 확인하는 감정과 우선순위 인사이트
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          <span>Dashboard 데이터 기준</span>
        </div>
      </motion.div>

      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}>
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
                감정 분석 데이터를 불러오지 못했습니다.
              </div>
            ) : isEmotionEmpty ? (
              <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                아직 감정 분석 데이터가 없습니다.
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
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Hash className="h-5 w-5 text-primary" aria-hidden="true" />
                핵심 키워드 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                전용 VOC 클러스터 API가 없어 현재는 준비 중인 영역입니다.
              </div>
              <div className="space-y-3">
                {pendingKeywordsData.map((item, idx) => (
                  <motion.div
                    key={item.keyword}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium">{item.keyword}</span>
                    </div>
                    <Badge variant="outline">{item.status}</Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}>
          <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" aria-hidden="true" />
                우선순위 항목 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              {priorityQuery.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-[250px] w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : priorityQuery.isError ? (
                <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  우선순위 항목을 불러오지 못했습니다.
                </div>
              ) : priorityItems.length === 0 ? (
                <div className="flex h-[250px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                  현재 우선순위 항목이 없습니다.
                </div>
              ) : (
                <>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={priorityDistribution} layout="vertical">
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
                          dataKey="priority"
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
                          {priorityDistribution.map((entry) => (
                            <Cell key={entry.priority} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-6 space-y-3">
                    {priorityItems.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-medium">
                            {item.primaryCategory}
                          </span>
                          <Badge variant="outline">
                            {getPriorityLabel(item.priority)}
                          </Badge>
                        </div>
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {item.summaryShort}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
