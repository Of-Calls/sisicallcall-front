import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmotionDistribution } from "@/features/dashboard/dashboardTypes";

/**
 * Sentiment palette — uses semantic tokens for status meaning + purple for
 * neutral. This is the one place semantic colors carry decoration: each slice
 * literally is a status, so the semantic mapping is on-spec.
 */
function buildChartData(data: EmotionDistribution) {
  return [
    { name: "긍정", value: data.positive, color: "#15be53" }, // success
    { name: "중립", value: data.neutral, color: "#94a3b8" }, // ink-tertiary
    { name: "부정", value: data.negative, color: "#f96bee" }, // magenta accent
    { name: "분노", value: data.angry, color: "#ea2261" }, // error
  ];
}

export function SentimentChart({
  data,
  isLoading,
  error,
}: {
  data: EmotionDistribution;
  isLoading: boolean;
  error: Error | null;
}) {
  const chartData = buildChartData(data);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const isEmpty = total === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div
        className="flex items-start justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div>
          <h3
            className="text-[15px] tracking-[-0.01em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            고객 감정 분포
          </h3>
          <p
            className="mt-0.5 text-[12px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            전체 통화 기준 4개 감정 카테고리
          </p>
        </div>
        {!isLoading && !error && !isEmpty ? (
          <span
            className="hds-tnum inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11.5px]"
            style={{
              color: "#273951",
              backgroundColor: "#f6f9fc",
              border: "1px solid #e5edf5",
              fontWeight: 600,
            }}
          >
            총 {total.toLocaleString("ko-KR")}건
          </span>
        ) : null}
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="h-[240px]">
            <Skeleton className="h-full w-full rounded-[8px]" />
          </div>
        ) : error ? (
          <EmptyShell tone="error">
            고객 감정 분포를 불러오지 못했습니다.
          </EmptyShell>
        ) : isEmpty ? (
          <EmptyShell>집계된 고객 감정이 없습니다.</EmptyShell>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                  animationBegin={150}
                  animationDuration={700}
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--hds-font-body)",
                    fontWeight: 600,
                    fill: "#273951",
                  }}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString("ko-KR")}건`,
                    "통화 수",
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5edf5",
                    borderRadius: "8px",
                    boxShadow:
                      "rgba(50,50,93,0.18) 0px 18px 30px -18px, rgba(0,0,0,0.08) 0px 10px 20px -10px",
                    fontSize: "12px",
                    fontFamily: "var(--hds-font-body)",
                    fontWeight: 500,
                    color: "#061b31",
                    padding: "8px 12px",
                  }}
                  labelStyle={{
                    color: "#273951",
                    fontWeight: 600,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "#273951",
                        fontFamily: "var(--hds-font-body)",
                        fontWeight: 500,
                        marginLeft: "4px",
                      }}
                    >
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------------- Local empty/error placeholders ---------------- */

function EmptyShell({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "error";
}) {
  const isError = tone === "error";
  return (
    <div
      className="flex h-[240px] flex-col items-center justify-center gap-1 rounded-[8px] text-center text-[13px]"
      style={{
        border: isError
          ? "1px solid rgba(234,34,97,0.25)"
          : "1px dashed #e5edf5",
        backgroundColor: isError ? "rgba(234,34,97,0.04)" : "#f6f9fc",
        color: isError ? "#ea2261" : "#64748d",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}
