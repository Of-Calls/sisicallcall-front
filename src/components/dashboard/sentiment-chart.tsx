import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MotionCard } from "@/components/ui/motion-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { EmotionDistribution } from "@/features/dashboard/dashboardTypes"

function buildChartData(data: EmotionDistribution) {
  return [
    { name: "긍정", value: data.positive, color: "#14b8a6" },
    { name: "중립", value: data.neutral, color: "#94a3b8" },
    { name: "부정", value: data.negative, color: "#f87171" },
    { name: "분노", value: data.angry, color: "#ef4444" },
  ]
}

export function SentimentChart({
  data,
  isLoading,
  error,
}: {
  data: EmotionDistribution
  isLoading: boolean
  error: Error | null
}) {
  const chartData = buildChartData(data)
  const isEmpty = chartData.every((item) => item.value === 0)

  return (
    <MotionCard className="h-full bg-card p-0 py-6 text-card-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">고객 감정 분포</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[240px]">
              <Skeleton className="h-full w-full rounded-lg" />
            </div>
          ) : error ? (
            <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              고객 감정 분포를 불러오지 못했습니다.
            </div>
          ) : isEmpty ? (
            <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              집계된 고객 감정이 없습니다.
            </div>
          ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  animationBegin={200}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}건`, "통화 수"]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )}
        </CardContent>
    </MotionCard>
  )
}
