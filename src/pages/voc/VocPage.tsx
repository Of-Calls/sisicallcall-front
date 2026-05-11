import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { BarChart3, Hash } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CountChip,
  EmptyShell,
  PageShell,
  PageTopbar,
  SectionHeader,
} from "@/components/dashboard/page-chrome";
import {
  useVocKeywordStats,
  useVocPriorityDistribution,
} from "@/features/voc/vocQueries";
import type {
  VocKeywordStatsItem,
  VocPriorityDistributionItem,
} from "@/features/voc/vocTypes";

/* Priority palette — uses semantic + warning + neutral */
const priorityColors: Record<string, string> = {
  critical: "#ea2261",
  high: "#9b6829",
  medium: "#665efd",
  low: "#15be53",
  normal: "#94a3b8",
};

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
};

/* ============================================================
 * Chart shell — replaces shadcn Card with token-driven panel
 * ============================================================ */
function ChartCard({
  icon,
  title,
  children,
  rightSlot,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  rightSlot?: ReactNode;
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
  );
}

function PendingCard({ title, icon }: { title: string; icon: ReactNode }) {
  return (
    <ChartCard icon={icon} title={title}>
      <EmptyShell height="h-[300px]">백엔드 집계 API 연결 대기</EmptyShell>
    </ChartCard>
  );
}

function EmptyCard({
  title,
  icon,
  message,
  tone = "neutral",
}: {
  title: string;
  icon: ReactNode;
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <ChartCard icon={icon} title={title}>
      <EmptyShell height="h-[300px]" tone={tone}>
        {message}
      </EmptyShell>
    </ChartCard>
  );
}

/* ============================================================
 * Keyword stats (top-N list)
 * ============================================================ */
function KeywordStatsCard({ items }: { items: VocKeywordStatsItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

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
          const ratio = total > 0 ? item.count / total : 0;
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
              {/* mini ratio bar */}
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
          );
        })}
      </ul>
    </ChartCard>
  );
}

/* ============================================================
 * Priority distribution (vertical bar + tile grid)
 * ============================================================ */
function PriorityDistributionCard({
  items,
}: {
  items: VocPriorityDistributionItem[];
}) {
  return (
    <ChartCard
      icon={<BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />}
      title="우선순위 항목 분포"
    >
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} layout="vertical">
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5edf5"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{
                fill: "#64748d",
                fontSize: 11.5,
                fontFamily: "var(--hds-font-body)",
                fontWeight: 500,
              }}
              axisLine={{ stroke: "#e5edf5" }}
              tickLine={{ stroke: "#e5edf5" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{
                fill: "#64748d",
                fontSize: 11.5,
                fontFamily: "var(--hds-font-body)",
                fontWeight: 500,
              }}
              axisLine={{ stroke: "#e5edf5" }}
              tickLine={false}
              width={70}
            />
            <Tooltip
              cursor={{ fill: "rgba(83,58,253,0.04)" }}
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
              labelStyle={{ color: "#273951", fontWeight: 600 }}
              formatter={(value: number) => [
                `${value.toLocaleString("ko-KR")}건`,
                "통화",
              ]}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {items.map((item) => (
                <Cell
                  key={item.priority}
                  fill={priorityColors[item.priority] ?? "#94a3b8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.priority}
            className="rounded-[8px] p-3"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5edf5",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: priorityColors[item.priority] ?? "#94a3b8",
                  }}
                />
                <span
                  className="text-[13px]"
                  style={{ color: "#061b31", fontWeight: 600 }}
                >
                  {item.label}
                </span>
              </div>
              <CountChip>{item.count.toLocaleString("ko-KR")}건</CountChip>
            </div>
            <p
              className="mt-1 text-[11px]"
              style={{
                color: "#94a3b8",
                fontFamily: "var(--hds-font-mono)",
                fontWeight: 500,
              }}
            >
              {item.priority}
            </p>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/* ============================================================
 * Page
 * ============================================================ */
export function VocPage() {
  const keywordStatsQuery = useVocKeywordStats();
  const priorityDistributionQuery = useVocPriorityDistribution();

  const keywordItems = keywordStatsQuery.data;
  const priorityItems = priorityDistributionQuery.data;
  const keywordStatsItems = Array.isArray(keywordItems) ? keywordItems : [];
  const priorityDistributionItems = Array.isArray(priorityItems)
    ? priorityItems
    : [];
  const isKeywordPending = keywordItems === null;
  const isPriorityPending = priorityItems === null;
  const isKeywordEmpty =
    Array.isArray(keywordItems) && keywordItems.length === 0;
  const isPriorityEmpty =
    Array.isArray(priorityItems) &&
    (priorityItems.length === 0 ||
      priorityItems.every((item) => item.count === 0));

  return (
    <PageShell>
      <PageTopbar
        eyebrow="운영"
        title="VOC 분석"
        description="고객 통화 데이터에서 감정 분포와 집계 지표를 확인합니다."
        rightSlot={
          <CountChip tone="primary">
            <BarChart3 className="h-3 w-3" aria-hidden="true" />
            전체 집계 기준
          </CountChip>
        }
      />

      <div className="space-y-6 px-8 py-6">
        {/* Section: keywords + priority */}
        <section className="space-y-3">
          <SectionHeader
            eyebrow="집계 지표"
            title="키워드 · 우선순위 분포"
            description="자주 언급된 키워드와 우선순위별 통화 분포"
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
                  message={`키워드 집계를 불러오지 못했습니다. ${keywordStatsQuery.error.message}`}
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
                <ChartCard
                  icon={
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  }
                  title="우선순위 항목 분포"
                >
                  <Skeleton className="h-[300px] w-full rounded-[8px]" />
                </ChartCard>
              ) : priorityDistributionQuery.isError ? (
                <EmptyCard
                  title="우선순위 항목 분포"
                  icon={
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  }
                  message={`우선순위 분포 집계를 불러오지 못했습니다. ${priorityDistributionQuery.error.message}`}
                  tone="error"
                />
              ) : isPriorityPending ? (
                <PendingCard
                  title="우선순위 항목 분포"
                  icon={
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  }
                />
              ) : isPriorityEmpty ? (
                <EmptyCard
                  title="우선순위 항목 분포"
                  icon={
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                  }
                  message="집계된 우선순위 항목이 없습니다."
                />
              ) : (
                <PriorityDistributionCard items={priorityDistributionItems} />
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
