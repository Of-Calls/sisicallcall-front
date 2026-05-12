import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  Headphones,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { DashboardEntryActions } from "@/components/landing/dashboard-entry-choice";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function Hero() {
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
              <BrandLogo
                variant="wordmark"
                className="mt-2 block h-14 w-auto max-w-[280px] sm:h-16 sm:max-w-[340px] lg:h-20 lg:max-w-[420px]"
              />
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
            {/* Decorative glow blobs — drift with hds-blob-* (strengthened) */}
            <div
              aria-hidden="true"
              className="hds-blob-a pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(83,58,253,0.40)" }}
            />
            <div
              aria-hidden="true"
              className="hds-blob-b pointer-events-none absolute -bottom-10 -left-6 h-40 w-40 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(249,107,238,0.40)" }}
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
                <BrandLogo variant="icon" className="h-6 w-6 opacity-90" />
              </div>

              {/* Mock content */}
              <div className="space-y-4 p-5">
                {/* KPI tiles — static */}
                <div className="grid grid-cols-3 gap-3">
                  <KpiTile
                    label="오늘 상담"
                    value="1,284"
                    delta="+12.4%"
                    accent="#533afd"
                  />
                  <KpiTile
                    label="평균 응답"
                    value="3.1초"
                    delta="-0.4s"
                    accent="#15be53"
                  />
                  <KpiTile
                    label="만족도"
                    value="95%"
                    delta="+2.1%"
                    accent="#f96bee"
                  />
                </div>

                {/* Calls list — static three rows (no row rotation, no height jitter) */}
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
                    <CallRow
                      icon={<PhoneCall className="h-3.5 w-3.5" />}
                      title="010-****-2841"
                      meta="AI 응답 · 02:14"
                      tag="진행중"
                      tagTone="info"
                    />
                    <CallRow
                      icon={<Headphones className="h-3.5 w-3.5" />}
                      title="010-****-9032"
                      meta="상담원 연결 · 04:52"
                      tag="이관됨"
                      tagTone="magenta"
                    />
                    <CallRow
                      icon={<BarChart3 className="h-3.5 w-3.5" />}
                      title="010-****-1107"
                      meta="VOC 분석 · 완료"
                      tag="완료"
                      tagTone="success"
                    />
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
      <p
        className="hds-tnum mt-1 text-[18px] tracking-[-0.01em] text-[#061b31]"
        style={{ fontFamily: "var(--hds-font-display)", fontWeight: 700 }}
      >
        {value}
      </p>
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

function CallRow({
  icon,
  title,
  meta,
  tag,
  tagTone,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  tag: string;
  tagTone: "info" | "success" | "magenta";
}) {
  const tagClass =
    tagTone === "info"
      ? "hds-badge hds-badge-info"
      : tagTone === "success"
        ? "hds-badge hds-badge-success"
        : "hds-badge hds-badge-magenta";

  return (
    <li className="flex items-center justify-between px-3 py-2">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#f6f9fc] text-[#533afd]">
          {icon}
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
    </li>
  );
}
