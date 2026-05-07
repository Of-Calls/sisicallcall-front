import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { IntentDistributionItem } from "@/features/dashboard/dashboardTypes"

function buildChartData(data: IntentDistributionItem[]) {
  return data.map((item) => ({
    name: item.label,
    value: item.count,
  }))
}

export function IntentChart({
  data,
  isLoading,
  error,
  isBackendPending = false,
}: {
  data: IntentDistributionItem[] | null
  isLoading: boolean
  error: Error | null
  isBackendPending?: boolean
}) {
  const chartData = buildChartData(data ?? [])

  return (
    <MotionCard
      className="h-full bg-card p-0 py-6 text-card-foreground"
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">주요 문의 의도</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[240px]">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            문의 의도 분포를 불러오지 못했습니다.
          </div>
        ) : isBackendPending ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
            백엔드 집계 API 연결 대기
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            집계된 문의 의도가 없습니다.
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={96}
                />
                <Tooltip
                  formatter={(value) => [`${value}건`, "문의"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  animationBegin={300}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={index === 0 ? "#14b8a6" : "#99f6e4"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </MotionCard>
  )
}
