import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import type { IntentDistributionItem } from "@/features/dashboard/dashboardTypes";

/**
 * Intent chart bar palette — single-hue ramp anchored on the primary purple.
 * Per the design spec: "chart palettes should be derived from a single hue
 * ramp anchored on {colors.primary}". We darken→lighten through the purple
 * scale so longer bars naturally read as "stronger".
 */
const PURPLE_RAMP = [
  "#533afd", // primary
  "#665efd", // primary-focus
  "#8c84fd",
  "#b9b9f9", // primary-light
  "#d6d9fc", // primary-soft
  "#eceffe",
] as const;

function buildChartData(data: IntentDistributionItem[]) {
  return data.map((item) => ({ name: item.label, value: item.count }));
}

function ChartShell({
  children,
  delay = 0.1,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-full overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      {children}
    </motion.div>
  );
}

export function IntentChart({
  data,
  isLoading,
  error,
  isBackendPending = false,
}: {
  data: IntentDistributionItem[] | null;
  isLoading: boolean;
  error: Error | null;
  isBackendPending?: boolean;
}) {
  const chartData = buildChartData(data ?? []);
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartShell delay={0.12}>
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
            주요 문의 의도
          </h3>
          <p
            className="mt-0.5 text-[12px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            상위 5개 카테고리 · 최근 7일 기준
          </p>
        </div>
        {!isLoading && !error && !isBackendPending && total > 0 ? (
          <span
            className="hds-tnum inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11.5px]"
            style={{
              color: "#533afd",
              backgroundColor: "rgba(83,58,253,0.08)",
              border: "1px solid rgba(83,58,253,0.20)",
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
            문의 의도 분포를 불러오지 못했습니다.
          </EmptyShell>
        ) : isBackendPending ? (
          <EmptyShell>백엔드 집계 API 연결 대기</EmptyShell>
        ) : chartData.length === 0 ? (
          <EmptyShell>집계된 문의 의도가 없습니다.</EmptyShell>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: "#64748d",
                    fontFamily: "var(--hds-font-body)",
                    fontWeight: 500,
                  }}
                  width={104}
                />
                <Tooltip
                  cursor={{ fill: "rgba(83,58,253,0.04)" }}
                  formatter={(value: number) => [
                    `${value.toLocaleString("ko-KR")}건`,
                    "문의",
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
                    marginBottom: "2px",
                  }}
                  itemStyle={{ color: "#533afd" }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                  animationBegin={200}
                  animationDuration={700}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.name}`}
                      fill={
                        PURPLE_RAMP[index] ??
                        PURPLE_RAMP[PURPLE_RAMP.length - 1]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </ChartShell>
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
