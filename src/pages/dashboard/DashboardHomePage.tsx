import { useState, type ComponentType, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Headphones,
  Info,
  Minus,
  PhoneIncoming,
  RefreshCw,
  Server,
  ServerCrash,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AlertBanner } from "@/components/dashboard/alert-banner";
import { CallList } from "@/components/dashboard/call-list";
import { IntentChart } from "@/components/dashboard/intent-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardIntentDistribution,
  useDashboardPriorityQueue,
  useDashboardStats,
} from "@/features/dashboard/dashboardQueries";
import type {
  DashboardAlert,
  DashboardOverview,
} from "@/features/dashboard/dashboardTypes";

const intentDistributionQueryParams = { limit: 5 } as const;

const emptyStats: DashboardOverview = {
  totalCalls: 0,
  resolvedCount: 0,
  resolvedRate: 0,
  escalationCount: 0,
  actionRequiredCount: 0,
  mcpSuccessCount: 0,
  mcpFailedCount: 0,
  partialSuccessCount: 0,
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDateTime(value: string) {
  if (!value) return "시간 정보 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ============================================================
 * Page topbar — sticky 60px header per spec, ink heading + ink-subtle meta
 * ============================================================ */
function PageTopbar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-8 py-5 backdrop-blur-md"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div>
        <p
          className="text-[11.5px] uppercase"
          style={{
            color: "#94a3b8",
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          홈
        </p>
        <h1
          className="mt-0.5 text-[22px] tracking-[-0.018em]"
          style={{
            color: "#061b31",
            fontFamily: "var(--hds-font-display)",
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          대시보드
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <span
          className="hidden items-center gap-1.5 rounded-[4px] px-2.5 py-1 text-[11.5px] sm:inline-flex"
          style={{
            color: "#108c3d",
            backgroundColor: "rgba(21,190,83,0.15)",
            border: "1px solid rgba(21,190,83,0.30)",
            fontWeight: 600,
          }}
        >
          <span
            className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: "#15be53" }}
          />
          실시간 동기화 중
        </span>
        <span
          className="hds-tnum hidden items-center gap-1.5 text-[12px] md:inline-flex"
          style={{ color: "#64748d", fontWeight: 500 }}
        >
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          마지막 업데이트 {new Date().toLocaleTimeString("ko-KR")}
        </span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] transition-colors"
          style={{
            color: "#273951",
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
          }}
          aria-label="새로고침"
          onClick={() => window.location.reload()}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f6f9fc";
            e.currentTarget.style.borderColor = "#d6d9fc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.borderColor = "#e5edf5";
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ============================================================
 * Metric (KPI) card — spec: Pretendard SemiBold value, Medium label,
 * tabular numerals, 1px hairline, 12px radius, blue-tinted soft shadow
 * ============================================================ */

type DeltaTone = "positive" | "negative" | "neutral";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  iconTone?: "primary" | "success" | "warning" | "error" | "neutral";
  delta?: { value: string; tone: DeltaTone };
};

const iconToneStyles: Record<
  NonNullable<MetricCardProps["iconTone"]>,
  CSSProperties
> = {
  primary: {
    color: "#533afd",
    backgroundColor: "rgba(83,58,253,0.08)",
    border: "1px solid rgba(83,58,253,0.20)",
  },
  success: {
    color: "#108c3d",
    backgroundColor: "rgba(21,190,83,0.12)",
    border: "1px solid rgba(21,190,83,0.25)",
  },
  warning: {
    color: "#9b6829",
    backgroundColor: "rgba(155,104,41,0.10)",
    border: "1px solid rgba(155,104,41,0.22)",
  },
  error: {
    color: "#ea2261",
    backgroundColor: "rgba(234,34,97,0.08)",
    border: "1px solid rgba(234,34,97,0.22)",
  },
  neutral: {
    color: "#64748d",
    backgroundColor: "#f6f9fc",
    border: "1px solid #e5edf5",
  },
};

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconTone = "neutral",
  delta,
}: MetricCardProps) {
  const deltaColor =
    delta?.tone === "positive"
      ? "#108c3d"
      : delta?.tone === "negative"
        ? "#ea2261"
        : "#64748d";
  const DeltaIcon =
    delta?.tone === "positive"
      ? ArrowUpRight
      : delta?.tone === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <div
      className="rounded-[12px] p-5 transition-all duration-200"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#d6d9fc";
        e.currentTarget.style.boxShadow =
          "rgba(50,50,93,0.10) 0px 18px 30px -18px, rgba(0,0,0,0.06) 0px 10px 20px -10px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#e5edf5";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className="text-[12px]"
          style={{
            color: "#64748d",
            fontWeight: 500,
            letterSpacing: "0",
          }}
        >
          {label}
        </p>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px]"
          style={iconToneStyles[iconTone]}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      </div>
      <p
        className="hds-tnum mt-3 text-[24px] tracking-[-0.014em]"
        style={{
          color: value === "0" || value === "0%" ? "#cbd5e1" : "#061b31",
          fontFamily: "var(--hds-font-display)",
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {delta ? (
          <span
            className="hds-tnum inline-flex items-center gap-0.5 text-[11.5px]"
            style={{ color: deltaColor, fontWeight: 600 }}
          >
            <DeltaIcon className="h-3 w-3" />
            {delta.value}
          </span>
        ) : null}
        {hint ? (
          <span
            className="text-[11.5px]"
            style={{ color: "#94a3b8", fontWeight: 500 }}
          >
            {hint}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function StatsGrid({
  stats,
  isLoading,
  error,
}: {
  stats: DashboardOverview;
  isLoading: boolean;
  error: Error | null;
}) {
  type GridItem = MetricCardProps;

  const items: GridItem[] = [
    {
      label: "총 통화 수",
      value: stats.totalCalls.toLocaleString("ko-KR"),
      hint: "지난 7일",
      icon: PhoneIncoming,
      iconTone: "primary",
    },
    {
      label: "해결 완료",
      value: stats.resolvedCount.toLocaleString("ko-KR"),
      hint: "AI 자동 해결",
      icon: CheckCircle2,
      iconTone: "success",
    },
    {
      label: "해결률",
      value: formatPercent(stats.resolvedRate),
      hint: "전체 대비",
      icon: Activity,
      iconTone: "primary",
    },
    {
      label: "상담원 연결",
      value: stats.escalationCount.toLocaleString("ko-KR"),
      hint: "에스컬레이션",
      icon: Headphones,
      iconTone: "warning",
    },
    {
      label: "조치 필요",
      value: stats.actionRequiredCount.toLocaleString("ko-KR"),
      hint: "후속 작업 대기",
      icon: AlertTriangle,
      iconTone: "error",
    },
    {
      label: "MCP 성공",
      value: stats.mcpSuccessCount.toLocaleString("ko-KR"),
      hint: "외부 호출 성공",
      icon: ShieldCheck,
      iconTone: "success",
    },
    {
      label: "MCP 실패",
      value: stats.mcpFailedCount.toLocaleString("ko-KR"),
      hint: "외부 호출 실패",
      icon: ServerCrash,
      iconTone: "error",
    },
    {
      label: "부분 성공",
      value: stats.partialSuccessCount.toLocaleString("ko-KR"),
      hint: "일부 단계만",
      icon: Server,
      iconTone: "neutral",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[12px] p-5"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5edf5",
            }}
          >
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-7 rounded-[6px]" />
            </div>
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-3 rounded-[12px] px-4 py-4 text-[13px]"
        style={{
          backgroundColor: "rgba(234,34,97,0.04)",
          border: "1px solid rgba(234,34,97,0.25)",
          color: "#061b31",
          fontFamily: "var(--hds-font-body)",
          fontWeight: 500,
        }}
      >
        <AlertTriangle
          className="h-4 w-4 shrink-0"
          style={{ color: "#ea2261" }}
        />
        대시보드 통계를 불러오지 못했습니다.{" "}
        <span style={{ color: "#64748d" }}>{error.message}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.04, delayChildren: 0.05 },
        },
      }}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {items.map((item) => (
        <motion.div
          key={item.label}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            },
          }}
        >
          <MetricCard {...item} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ============================================================
 * Priority queue — uses spec'd badge + hairline + neutral surface
 * ============================================================ */
function PriorityQueuePanel({
  alerts,
  isLoading,
  error,
}: {
  alerts: DashboardAlert[];
  isLoading: boolean;
  error: Error | null;
}) {
  const Shell = ({ children }: { children: ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-[12px]"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      {children}
    </motion.div>
  );

  if (isLoading) {
    return (
      <Shell>
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid #e5edf5" }}
        >
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="space-y-2 px-5 py-4">
          <Skeleton className="h-12 w-full rounded-[8px]" />
          <Skeleton className="h-12 w-full rounded-[8px]" />
        </div>
      </Shell>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-3 rounded-[12px] px-4 py-4 text-[13px]"
        style={{
          backgroundColor: "rgba(234,34,97,0.04)",
          border: "1px solid rgba(234,34,97,0.25)",
          color: "#061b31",
          fontFamily: "var(--hds-font-body)",
          fontWeight: 500,
        }}
      >
        <AlertTriangle
          className="h-4 w-4 shrink-0"
          style={{ color: "#ea2261" }}
        />
        우선순위 알림을 불러오지 못했습니다.{" "}
        <span style={{ color: "#64748d" }}>{error.message}</span>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[8px]"
            style={{
              color: "#108c3d",
              backgroundColor: "rgba(21,190,83,0.12)",
              border: "1px solid rgba(21,190,83,0.25)",
            }}
          >
            <ShieldCheck className="h-5 w-5" strokeWidth={2} />
          </span>
          <p
            className="text-[14px]"
            style={{ color: "#061b31", fontWeight: 600 }}
          >
            현재 우선순위 알림이 없습니다
          </p>
          <p
            className="text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            긴급 처리가 필요한 통화가 발생하면 여기에 표시됩니다.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert
            className="h-4 w-4"
            style={{ color: "#ea2261" }}
            strokeWidth={2}
          />
          <h2
            className="text-[15px] tracking-[-0.01em]"
            style={{
              color: "#061b31",
              fontFamily: "var(--hds-font-display)",
              fontWeight: 700,
            }}
          >
            우선순위 알림
          </h2>
        </div>
        <span
          className="hds-tnum inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11.5px]"
          style={{
            color: "#ea2261",
            backgroundColor: "rgba(234,34,97,0.10)",
            border: "1px solid rgba(234,34,97,0.25)",
            fontWeight: 600,
          }}
        >
          {alerts.length.toLocaleString("ko-KR")}건
        </span>
      </div>

      <ul>
        {alerts.slice(0, 5).map((alert, idx) => (
          <motion.li
            key={alert.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.15 + idx * 0.04,
              duration: 0.32,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="px-5 py-3"
            style={{
              borderTop: idx === 0 ? "none" : "1px solid #e5edf5",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className="truncate text-[13.5px]"
                    style={{ color: "#061b31", fontWeight: 600 }}
                  >
                    {alert.reason}
                  </p>
                </div>
                <p
                  className="hds-tnum mt-0.5 text-[12px]"
                  style={{ color: "#64748d", fontWeight: 500 }}
                >
                  {alert.callerNumber}
                  {alert.callId ? (
                    <span
                      style={{
                        fontFamily: "var(--hds-font-mono)",
                        marginLeft: "6px",
                      }}
                    >
                      · {alert.callId}
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[11px] uppercase"
                  style={{
                    color: "#ea2261",
                    backgroundColor: "rgba(234,34,97,0.10)",
                    border: "1px solid rgba(234,34,97,0.25)",
                    fontWeight: 700,
                    letterSpacing: "0.4px",
                  }}
                >
                  {alert.priority}
                </span>
                <p
                  className="hds-tnum text-[11px] whitespace-nowrap"
                  style={{ color: "#94a3b8", fontWeight: 500 }}
                >
                  {formatDateTime(alert.createdAt)}
                </p>
              </div>
            </div>
          </motion.li>
        ))}
      </ul>
    </Shell>
  );
}

/* ============================================================
 * Page
 * ============================================================ */
export function DashboardHomePage() {
  const [showAlert, setShowAlert] = useState(true);
  const statsQuery = useDashboardStats();
  const priorityQueueQuery = useDashboardPriorityQueue();
  const intentDistributionQuery = useDashboardIntentDistribution(
    intentDistributionQueryParams,
  );

  const stats = statsQuery.data ?? emptyStats;
  const alerts = priorityQueueQuery.data?.items ?? [];
  const intentDistribution = intentDistributionQuery.data ?? null;
  const visibleAlerts = alerts.filter((item) => {
    if (typeof item.followUpRequired === "boolean") {
      return item.followUpRequired;
    }

    return true;
  });
  const visibleAlertCount = visibleAlerts.length;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "var(--hds-font-body)",
        color: "#061b31",
      }}
    >
      <PageTopbar />

      <div className="space-y-6 px-8 py-6">
        {visibleAlertCount > 0 ? (
          <AlertBanner
            count={visibleAlertCount}
            onDismiss={() => setShowAlert(false)}
            isVisible={showAlert}
          />
        ) : null}

        {statsQuery.isSuccess && stats.totalCalls === 0 ? (
          <div
            className="flex items-start gap-3 rounded-[12px] px-4 py-3.5 text-[13px]"
            style={{
              backgroundColor: "#f6f9fc",
              border: "1px solid #e5edf5",
              fontFamily: "var(--hds-font-body)",
            }}
          >
            <Info
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "#533afd" }}
              aria-hidden="true"
            />
            <div className="space-y-0.5">
              <p style={{ color: "#061b31", fontWeight: 600 }}>
                아직 집계된 통화 데이터가 없습니다.
              </p>
              <p
                className="text-[12.5px]"
                style={{ color: "#64748d", fontWeight: 500 }}
              >
                통화가 진행되고 후처리 분석이 완료되면 여기에 자동으로
                채워집니다.
              </p>
            </div>
          </div>
        ) : null}

        {/* Section: KPI overview */}
        <section className="space-y-3">
          <header className="flex items-end justify-between">
            <div>
              <p
                className="text-[11.5px] uppercase"
                style={{
                  color: "#94a3b8",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                }}
              >
                개요
              </p>
              <h2
                className="text-[16px] tracking-[-0.012em]"
                style={{
                  color: "#061b31",
                  fontFamily: "var(--hds-font-display)",
                  fontWeight: 700,
                }}
              >
                실시간 AI 상담 현황
              </h2>
            </div>
          </header>

          <StatsGrid
            stats={stats}
            isLoading={statsQuery.isLoading}
            error={statsQuery.error}
          />
        </section>

        {/* Section: Priority queue */}
        {/* Section: Charts row */}
        <section className="grid gap-4 md:grid-cols-2">
          <IntentChart
            data={intentDistribution}
            isLoading={intentDistributionQuery.isLoading}
            error={intentDistributionQuery.error}
            isBackendPending={
              intentDistributionQuery.data === null &&
              !intentDistributionQuery.isLoading &&
              !intentDistributionQuery.error
            }
          />
        </section>

        {/* Section: Recent calls table */}
        <section>
          <CallList />
        </section>
      </div>
    </div>
  );
}
