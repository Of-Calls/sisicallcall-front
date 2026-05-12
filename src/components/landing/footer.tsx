import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { BrandLogo } from "@/components/common/BrandLogo";

const footerLinks = {
  제품: [
    { label: "기능", href: "#features" },
    { label: "요금제", href: "#pricing" },
    { label: "사례 연구", href: "#" },
    { label: "API 문서", href: "#" },
  ],
  회사: [
    { label: "회사 소개", href: "#" },
    { label: "채용", href: "#" },
    { label: "블로그", href: "#" },
    { label: "문의하기", href: "#contact" },
  ],
  법률: [
    { label: "이용약관", href: "#" },
    { label: "개인정보처리방침", href: "#" },
    { label: "서비스수준협약", href: "#" },
  ],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Footer() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer
      className="border-t border-[#e5edf5] bg-[#f6f9fc]"
      ref={ref}
      style={{ fontFamily: "var(--hds-font-body)" }}
    >
      <div className="mx-auto max-w-[1280px] px-6 py-14 lg:px-10 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-10 lg:grid-cols-4 lg:gap-8"
        >
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <BrandLogo
                  variant="full"
                  className="h-9 w-auto max-w-[180px]"
                />
              </motion.div>
            </Link>
            <p
              className="mt-5 max-w-xs text-[14px] leading-[1.6] text-[#64748d]"
              style={{ fontWeight: 500 }}
            >
              모든 고객을 위한 하이브리드 AI 에이전트. AI와 사람의 조화로 최상의
              고객 경험을 제공합니다.
            </p>

            {/* Status pill */}
            <div
              className="mt-6 inline-flex items-center gap-1.5 rounded-[4px] border border-[rgba(21,190,83,0.3)] bg-[rgba(21,190,83,0.12)] px-2.5 py-1 text-[12px] text-[#108c3d]"
              style={{ fontWeight: 600 }}
            >
              <span
                className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full"
                style={{ backgroundColor: "#15be53" }}
              />
              모든 시스템 정상 작동중
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([category, links], idx) => (
            <motion.div key={category} variants={itemVariants}>
              <h3
                className="text-[12px] uppercase tracking-[1px] text-[#273951]"
                style={{ fontWeight: 700 }}
              >
                {category}
              </h3>
              <ul className="mt-5 space-y-3">
                {links.map((link, linkIdx) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={
                      isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
                    }
                    transition={{ delay: 0.2 + idx * 0.08 + linkIdx * 0.04 }}
                  >
                    <a
                      href={link.href}
                      className="inline-block text-[14px] text-[#64748d] transition-all duration-200 hover:translate-x-0.5 hover:text-[#533afd]"
                      style={{ fontWeight: 500 }}
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#e5edf5] pt-7 sm:flex-row"
        >
          <p
            className="hds-tnum text-[13px] text-[#64748d]"
            style={{ fontWeight: 500 }}
          >
            © {new Date().getFullYear()} 시시콜콜. All rights reserved.
          </p>
          <p
            className="text-[12px] text-[#64748d]"
            style={{ fontWeight: 500, letterSpacing: "0.2px" }}
          >
            Made in Seoul · 하이브리드 AI 에이전트
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
