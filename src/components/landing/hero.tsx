import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Headphones,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { DashboardEntryActions } from "@/components/landing/dashboard-entry-choice";

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png";

const easeOut = [0.22, 1, 0.36, 1] as const;

/* ---------- Live KPI hook ----------
 *
 * Drives the "this dashboard is alive" feeling. Every `intervalMs` ms
 * the value re-rolls via the supplied `drift` fn. The render uses
 * `key={value}` so framer-motion remounts the text node and runs the
 * subtle fade-in transition again — that's the visible flicker that
 * sells the live-update effect.
 */
function useLiveKpi(initial: string, drift: () => string, intervalMs: number) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => setValue(drift()), intervalMs);
    return () => clearInterval(id);
  }, [drift, intervalMs]);
  return value;
}

/* ---------- Call pool for the live list ----------
 *
 * The hero's mock call list cycles through these. Every ~4s the next
 * entry slides in at the top and the bottom row exits.
 */
type CallTone = "info" | "success" | "magenta";
type CallIcon = "phone" | "headphone" | "chart";
type LiveCall = {
  id: number;
  icon: CallIcon;
  title: string;
  meta: string;
  tag: string;
  tagTone: CallTone;
};

const callPool: Omit<LiveCall, "id">[] = [
  {
    icon: "phone",
    title: "010-****-2841",
    meta: "AI 응답 · 02:14",
    tag: "진행중",
    tagTone: "info",
  },
  {
    icon: "headphone",
    title: "010-****-9032",
    meta: "상담원 연결 · 04:52",
    tag: "이관됨",
    tagTone: "magenta",
  },
  {
    icon: "chart",
    title: "010-****-1107",
    meta: "VOC 분석 · 완료",
    tag: "완료",
    tagTone: "success",
  },
  {
    icon: "phone",
    title: "010-****-5526",
    meta: "AI 응답 · 00:38",
    tag: "진행중",
    tagTone: "info",
  },
  {
    icon: "phone",
    title: "010-****-3318",
    meta: "예약 처리 · 01:22",
    tag: "완료",
    tagTone: "success",
  },
  {
    icon: "headphone",
    title: "010-****-7704",
    meta: "상담원 연결 · 02:08",
    tag: "이관됨",
    tagTone: "magenta",
  },
];

export function Hero() {
  /* ---- Live KPIs ---- */
  const liveCallCount = useLiveKpi(
    "1,284",
    () => (1280 + Math.floor(Math.random() * 12)).toLocaleString("ko-KR"),
    3500,
  );
  const liveResponseTime = useLiveKpi(
    "3.1초",
    () => `${(2.8 + Math.random() * 0.6).toFixed(1)}초`,
    4200,
  );
  const liveSatisfaction = useLiveKpi(
    "95%",
    () => `${94 + Math.floor(Math.random() * 3)}%`,
    5000,
  );

  /* ---- Live call list (3 visible at a time) ---- */
  const [visibleCalls, setVisibleCalls] = useState<LiveCall[]>(() =>
    callPool.slice(0, 3).map((c, i) => ({ ...c, id: i })),
  );

  useEffect(() => {
    let poolIdx = 3;
    let nextId = 100; // distinct from initial 0..2
    const tick = setInterval(() => {
      setVisibleCalls((prev) => {
        const incoming: LiveCall = {
          ...callPool[poolIdx % callPool.length],
          id: nextId++,
        };
        poolIdx++;
        // Insert at top, drop the bottom — keeps list at 3 items
        return [incoming, ...prev.slice(0, 2)];
      });
    }, 4000);
    return () => clearInterval(tick);
  }, []);

  return (
    <section className="hds-hero-surface relative w-full overflow-hidden">
      {/* ✨ Drifting mesh gradient — sits behind everything else */}
      <div className="hds-mesh-bg" aria-hidden="true" />

      {/* Subtle grid texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(83,58,253,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(83,58,253,0.04) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, black 40%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1280px] items-center px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Left: copy block */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="flex flex-col items-start"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: easeOut }}
              className="hds-badge hds-badge-info mb-7"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              하이브리드 AI 에이전트 · 2026
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: easeOut }}
              className="hds-display text-[44px] leading-[1.15] tracking-[-0.02em] text-[#061b31] sm:text-[52px] sm:leading-[1.15] sm:tracking-[-0.024em] lg:text-[60px] lg:leading-[1.12] lg:tracking-[-0.028em]"
              style={{ fontWeight: 800 }}
            >
              모든 고객을 위한
              <br />
              <span className="hds-gradient-text">하이브리드 AI 에이전트</span>,
              <br />
              <span className="text-[#1c1e54]">시시콜콜</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: easeOut }}
              className="hds-body mt-7 max-w-[540px] text-[17px] leading-[1.6] text-[#64748d] sm:text-[18px] sm:leading-[1.6]"
              style={{ fontWeight: 500 }}
            >
              AI가 전화 상담을 대응하고, 필요한 순간 사람 상담원에게 연결합니다.
              24시간 운영되는 고객 상담 흐름으로 비즈니스의 응답 품질을
              높이세요.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: easeOut }}
              className="mt-10"
            >
              <DashboardEntryActions
                size="lg"
                className="items-stretch sm:items-center"
                primaryClassName="h-12 px-7 text-[15px] font-semibold"
                secondaryClassName="h-12 px-7 text-[15px] font-semibold"
              />
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-[13px] text-[#64748d]"
              style={{ fontFamily: "var(--hds-font-body)", fontWeight: 500 }}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#15be53" }}
                  aria-hidden="true"
                />
                실시간 음성 상담
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#533afd" }}
                  aria-hidden="true"
                />
                14일 무료 체험
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#f96bee" }}
                  aria-hidden="true"
                />
                신용카드 등록 불필요
              </span>
            </motion.div>
          </motion.div>

          {/* Right: floating mockup window */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.2, ease: easeOut }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            {/* Decorative glow blobs (still static — drift comes from the mesh layer behind) */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(83,58,253,0.18)" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(249,107,238,0.18)" }}
            />

            <div className="hds-mockup-window relative w-full max-w-[520px] overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center justify-between border-b border-[#e5edf5] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6058]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2d]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c941]" />
                </div>
                <div
                  className="flex items-center gap-1.5 rounded-[4px] bg-[#f6f9fc] px-2.5 py-1 text-[11px] text-[#64748d]"
                  style={{ fontFamily: "var(--hds-font-mono)" }}
                >
                  <span
                    className="inline-flex h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "#15be53" }}
                  />
                  app.시시콜콜.io / dashboard
                </div>
                <img
                  src={logoSrc}
                  alt=""
                  width={20}
                  height={20}
                  className="opacity-80"
                  style={{ mixBlendMode: "multiply" }}
                />
              </div>

              {/* Mock content */}
              <div className="space-y-4 p-5">
                {/* KPI tiles — values re-roll on a timer */}
                <div className="grid grid-cols-3 gap-3">
                  <KpiTile
                    label="오늘 상담"
                    value={liveCallCount}
                    delta="+12.4%"
                    accent="#533afd"
                  />
                  <KpiTile
                    label="평균 응답"
                    value={liveResponseTime}
                    delta="-0.4s"
                    accent="#15be53"
                  />
                  <KpiTile
                    label="만족도"
                    value={liveSatisfaction}
                    delta="+2.1%"
                    accent="#f96bee"
                  />
                </div>

                {/* Live calls list — rows slide in at top, drop at bottom */}
                <div className="rounded-[6px] border border-[#e5edf5] bg-white">
                  <div className="flex items-center justify-between border-b border-[#e5edf5] bg-[#f6f9fc] px-3 py-2">
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#273951]"
                      style={{ fontFamily: "var(--hds-font-body)" }}
                    >
                      실시간 통화
                    </span>
                    <span className="hds-badge hds-badge-success !py-0.5 !text-[10px]">
                      <span
                        className="inline-flex h-1 w-1 animate-pulse rounded-full"
                        style={{ backgroundColor: "#15be53" }}
                      />
                      LIVE
                    </span>
                  </div>

                  <ul className="divide-y divide-[#e5edf5]">
                    <AnimatePresence initial={false}>
                      {visibleCalls.map((call) => (
                        <motion.li
                          key={call.id}
                          layout
                          initial={{ opacity: 0, height: 0, y: -6 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: 8 }}
                          transition={{
                            duration: 0.42,
                            ease: easeOut,
                          }}
                          className="overflow-hidden"
                        >
                          <CallRowInner {...call} />
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* CTA hint */}
                <div className="flex items-center justify-between rounded-[6px] border border-dashed border-[#d6d9fc] bg-[rgba(83,58,253,0.04)] px-3 py-2.5">
                  <span
                    className="text-[12px] text-[#273951]"
                    style={{
                      fontFamily: "var(--hds-font-body)",
                      fontWeight: 500,
                    }}
                  >
                    오늘의 인사이트 리포트가 준비되었습니다
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#533afd]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Mockup sub-components ---------- */

function KpiTile({
  label,
  value,
  delta,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  accent: string;
}) {
  return (
    <div className="rounded-[6px] border border-[#e5edf5] bg-white px-3 py-2.5">
      <p
        className="text-[10px] uppercase tracking-[0.4px] text-[#64748d]"
        style={{ fontFamily: "var(--hds-font-body)", fontWeight: 600 }}
      >
        {label}
      </p>
      {/* key={value} forces remount on each tick → fade-in re-runs */}
      <motion.p
        key={value}
        initial={{ opacity: 0.35, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
        className="hds-tnum mt-1 text-[18px] tracking-[-0.01em] text-[#061b31]"
        style={{ fontFamily: "var(--hds-font-display)", fontWeight: 700 }}
      >
        {value}
      </motion.p>
      <p
        className="hds-tnum mt-0.5 text-[10px]"
        style={{
          fontFamily: "var(--hds-font-body)",
          fontWeight: 600,
          color: accent,
        }}
      >
        {delta}
      </p>
    </div>
  );
}

/**
 * Inner row content — rendered inside a motion.li.
 * Note: the parent <motion.li> handles enter/exit, so this stays a plain
 * div (no extra <li> nesting).
 */
function CallRowInner({
  icon,
  title,
  meta,
  tag,
  tagTone,
}: {
  icon: CallIcon;
  title: string;
  meta: string;
  tag: string;
  tagTone: CallTone;
}) {
  const tagClass =
    tagTone === "info"
      ? "hds-badge hds-badge-info"
      : tagTone === "success"
        ? "hds-badge hds-badge-success"
        : "hds-badge hds-badge-magenta";

  const IconNode =
    icon === "phone" ? (
      <PhoneCall className="h-3.5 w-3.5" />
    ) : icon === "headphone" ? (
      <Headphones className="h-3.5 w-3.5" />
    ) : (
      <BarChart3 className="h-3.5 w-3.5" />
    );

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#f6f9fc] text-[#533afd]">
          {IconNode}
        </span>
        <div>
          <p
            className="hds-tnum text-[12px] text-[#061b31]"
            style={{ fontFamily: "var(--hds-font-body)", fontWeight: 600 }}
          >
            {title}
          </p>
          <p
            className="text-[10.5px] text-[#64748d]"
            style={{ fontFamily: "var(--hds-font-body)", fontWeight: 500 }}
          >
            {meta}
          </p>
        </div>
      </div>
      <span className={`${tagClass} !py-0.5 !text-[10px]`}>{tag}</span>
    </div>
  );
}