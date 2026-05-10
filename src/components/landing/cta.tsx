import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DashboardEntryActions } from "@/components/landing/dashboard-entry-choice";

export function CTA() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="bg-white py-24 lg:py-28" ref={ref}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.98 }}
          animate={
            isInView
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 32, scale: 0.98 }
          }
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[8px] px-8 py-16 sm:px-12 sm:py-20 lg:px-20 lg:py-24"
          style={{
            backgroundColor: "#1c1e54",
            boxShadow:
              "rgba(50,50,93,0.25) 0px 30px 60px -20px, rgba(0,0,0,0.15) 0px 18px 36px -18px",
          }}
        >
          {/* ✨ Drifting mesh — sits at the back of the indigo block */}
          <div className="hds-mesh-bg hds-mesh-bg-dark" aria-hidden="true" />

          {/* Decorative ruby→magenta glow accents (kept — they layer on top of mesh) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }
            }
            transition={{ duration: 1.1, delay: 0.2 }}
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(83,58,253,0.55) 0%, transparent 70%)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }
            }
            transition={{ duration: 1.1, delay: 0.3 }}
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(249,107,238,0.45) 0%, transparent 70%)",
            }}
          />

          {/* Subtle grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse at 50% 50%, black 35%, transparent 80%)",
            }}
          />

          <div className="relative mx-auto max-w-2xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-[12px]"
              style={{
                fontFamily: "var(--hds-font-body)",
                fontWeight: 600,
                letterSpacing: "0.4px",
                backgroundColor: "rgba(83,58,253,0.18)",
                borderColor: "rgba(185,185,249,0.3)",
                color: "#b9b9f9",
              }}
            >
              <span
                className="inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "#15be53" }}
              />
              지금 시작하기
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="hds-display mt-5 text-balance text-[32px] leading-[1.18] tracking-[-0.024em] text-white sm:text-[44px] sm:leading-[1.15] sm:tracking-[-0.03em]"
              style={{ fontWeight: 800 }}
            >
              지금 바로 시시콜콜을
              <br className="hidden sm:block" /> 경험해보세요
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="mx-auto mt-6 max-w-xl text-pretty text-[17px] leading-[1.65]"
              style={{
                fontFamily: "var(--hds-font-body)",
                fontWeight: 500,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              14일 무료 체험으로 AI 전화 상담의 변화를 직접 확인하세요. 전문
              컨설턴트가 도입을 지원합니다.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <DashboardEntryActions
                size="lg"
                className="items-stretch sm:items-center"
                primaryClassName="h-12 px-7 text-[15px] font-semibold"
                secondaryClassName="h-12 px-7 text-[15px] font-semibold border-white/25 bg-transparent text-white hover:bg-white/10 hover:border-white/40 hover:text-white"
              />
              <Button
                variant="outline"
                size="lg"
                className="h-12 rounded-[4px] border-white/25 bg-transparent px-7 text-[15px] text-white shadow-none transition-all duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
                style={{ fontFamily: "var(--hds-font-body)", fontWeight: 600 }}
              >
                도입 문의하기
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}