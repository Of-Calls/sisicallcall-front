import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  {
    value: "95%",
    label: "고객 만족도",
    description: "AI 상담 후 고객 만족도",
    accent: "#f96bee",
  },
  {
    value: "60%",
    label: "비용 절감",
    description: "기존 대비 운영 비용 절감",
    accent: "#665efd",
  },
  {
    value: "24/7",
    label: "무중단 운영",
    description: "연중무휴 AI 상담 서비스",
    accent: "#15be53",
  },
  {
    value: "3초",
    label: "평균 응답 시간",
    description: "고객 문의 첫 응답까지",
    accent: "#ea2261",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Stats() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      className="relative overflow-hidden py-24 lg:py-28"
      style={{ backgroundColor: "#1c1e54" }}
      ref={ref}
    >
      {/* ✨ Drifting mesh — sits behind the static blur layers */}
      <div className="hds-mesh-bg hds-mesh-bg-dark" aria-hidden="true" />

      {/* Decorative glow layers (kept — they add static highlights atop the moving mesh) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(83,58,253,0.35)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full blur-3xl"
        style={{ backgroundColor: "rgba(249,107,238,0.18)" }}
      />
      {/* Subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)",
        }}
      />

      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p
            className="text-[13px] uppercase tracking-[0.6px]"
            style={{
              fontFamily: "var(--hds-font-body)",
              fontWeight: 600,
              color: "#b9b9f9",
            }}
          >
            검증된 성과
          </p>
          <h2
            className="hds-display mt-3 text-balance text-[32px] leading-[1.2] tracking-[-0.024em] text-white sm:text-[40px] sm:leading-[1.18] sm:tracking-[-0.028em]"
            style={{ fontWeight: 700 }}
          >
            숫자로 증명하는 시시콜콜
          </h2>
          <p
            className="mt-5 text-[17px] leading-[1.6]"
            style={{
              fontFamily: "var(--hds-font-body)",
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
            }}
          >
            시시콜콜을 도입한 기업들의 실제 성과입니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className="relative overflow-hidden rounded-[8px] border p-7 backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 h-px w-12"
                style={{ backgroundColor: stat.accent }}
              />
              <p
                className="hds-tnum hds-display text-[44px] leading-[1.05] tracking-[-0.03em] text-white sm:text-[48px]"
                style={{ fontWeight: 800 }}
              >
                {stat.value}
              </p>
              <p
                className="mt-4 text-[16px] leading-[1.4] text-white"
                style={{ fontFamily: "var(--hds-font-body)", fontWeight: 600 }}
              >
                {stat.label}
              </p>
              <p
                className="mt-1.5 text-[13px] leading-[1.5]"
                style={{
                  fontFamily: "var(--hds-font-body)",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {stat.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}