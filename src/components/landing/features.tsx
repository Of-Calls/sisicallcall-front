import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  BarChart3,
  Clock,
  MessageSquare,
  Phone,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "AI 전화 상담",
    description:
      "자연스러운 음성 인식과 대화 흐름으로 고객 문의에 즉시 응답합니다. 복잡한 문의는 상담원에게 자동 연결합니다.",
    accent: "#533afd",
    accentBg: "rgba(83,58,253,0.08)",
    accentBorder: "rgba(83,58,253,0.2)",
  },
  {
    icon: MessageSquare,
    title: "멀티채널 지원",
    description:
      "전화, 카카오톡, 문자 등 다양한 채널을 하나의 플랫폼에서 통합 관리할 수 있습니다.",
    accent: "#665efd",
    accentBg: "rgba(102,94,253,0.08)",
    accentBorder: "rgba(102,94,253,0.2)",
  },
  {
    icon: BarChart3,
    title: "실시간 분석",
    description:
      "상담 내용을 실시간으로 분석하고 고객 인사이트를 자동으로 추출합니다.",
    accent: "#f96bee",
    accentBg: "#ffd7ef",
    accentBorder: "#ffc4e7",
  },
  {
    icon: Clock,
    title: "24시간 운영",
    description:
      "AI가 쉬지 않고 고객 문의에 응답합니다. 영업시간 외에도 놓치는 고객이 없습니다.",
    accent: "#108c3d",
    accentBg: "rgba(21,190,83,0.12)",
    accentBorder: "rgba(21,190,83,0.25)",
  },
  {
    icon: Shield,
    title: "보안 및 규정 준수",
    description:
      "개인정보보호 기준을 준수하며 고객 데이터를 안전하게 보호합니다.",
    accent: "#1c1e54",
    accentBg: "rgba(28,30,84,0.06)",
    accentBorder: "rgba(28,30,84,0.18)",
  },
  {
    icon: Zap,
    title: "빠른 도입",
    description:
      "기존 시스템과 쉽게 연동되어 빠르게 도입할 수 있습니다. 복잡한 설정 없이 바로 시작하세요.",
    accent: "#9b6829",
    accentBg: "rgba(155,104,41,0.1)",
    accentBorder: "rgba(155,104,41,0.22)",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="bg-white py-24 lg:py-28" ref={ref}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="hds-eyebrow">주요 기능</p>
          <h2
            className="hds-display mt-3 text-balance text-[32px] leading-[1.2] tracking-[-0.024em] text-[#061b31] sm:text-[40px] sm:leading-[1.18] sm:tracking-[-0.028em]"
            style={{ fontWeight: 700 }}
          >
            고객 상담의 모든 것을
            <br />
            <span className="hds-gradient-text">AI로 혁신</span>하세요
          </h2>
          <p
            className="hds-body mt-5 text-pretty text-[17px] leading-[1.6] text-[#64748d]"
            style={{ fontWeight: 500 }}
          >
            시시콜콜은 AI와 사람의 강점을 결합한 하이브리드 솔루션으로
            <br className="hidden sm:block" /> 최상의 고객 경험을 제공합니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="hds-card hds-card-hover group h-full p-7"
            >
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-[6px] transition-colors duration-300"
                style={{
                  backgroundColor: feature.accentBg,
                  border: `1px solid ${feature.accentBorder}`,
                  color: feature.accent,
                }}
              >
                <feature.icon
                  className="h-5 w-5"
                  aria-hidden="true"
                  strokeWidth={2}
                />
              </div>
              <h3
                className="hds-display text-[20px] leading-[1.3] tracking-[-0.018em] text-[#061b31]"
                style={{ fontWeight: 700 }}
              >
                {feature.title}
              </h3>
              <p
                className="hds-body mt-3 text-[15px] leading-[1.6] text-[#64748d]"
                style={{ fontWeight: 500 }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
