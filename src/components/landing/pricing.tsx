import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "스타터",
    price: "49,000",
    description: "소규모 비즈니스에 적합한 기본 플랜",
    features: [
      "월 500건 AI 상담",
      "기본 분석 리포트",
      "이메일 지원",
      "1개 전화번호 연동",
    ],
    highlighted: false,
    cta: "시작하기",
  },
  {
    name: "프로",
    price: "149,000",
    description: "성장하는 비즈니스를 위한 추천 플랜",
    features: [
      "월 2,000건 AI 상담",
      "고급 분석 및 인사이트",
      "우선 기술 지원",
      "3개 전화번호 연동",
      "카카오톡 연동",
      "커스텀 시나리오",
    ],
    highlighted: true,
    cta: "시작하기",
  },
  {
    name: "엔터프라이즈",
    price: "문의",
    description: "대기업을 위한 맞춤형 솔루션",
    features: [
      "무제한 AI 상담",
      "전담 계정 매니저",
      "SLA 보장",
      "무제한 전화번호 연동",
      "모든 채널 연동",
      "온프레미스 배포 옵션",
      "API 전체 액세스",
    ],
    highlighted: false,
    cta: "문의하기",
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

/**
 * Mouse-tracking spotlight handler — writes pointer offset to CSS vars
 * `--mx` / `--my`. See features.tsx for the long-form explanation.
 * Module-scope so it's shared across all three plan cards.
 */
function handleSpotlight(e: React.MouseEvent<HTMLDivElement>) {
  const rect = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
}

export function Pricing() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" className="bg-[#f6f9fc] py-24 lg:py-28" ref={ref}>
      <div className="mx-auto max-w-[1280px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="hds-eyebrow">요금제</p>
          <h2
            className="hds-display mt-3 text-balance text-[32px] leading-[1.2] tracking-[-0.024em] text-[#061b31] sm:text-[40px] sm:leading-[1.18] sm:tracking-[-0.028em]"
            style={{ fontWeight: 700 }}
          >
            비즈니스 규모에 맞는 플랜을 선택하세요
          </h2>
          <p
            className="hds-body mt-5 text-pretty text-[17px] leading-[1.6] text-[#64748d]"
            style={{ fontWeight: 500 }}
          >
            14일 무료 체험 후 결제하세요. 언제든 플랜 변경이 가능합니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-6 lg:grid-cols-3"
        >
          {plans.map((plan, idx) => {
            const isHighlighted = plan.highlighted;

            return (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                onMouseMove={handleSpotlight}
                className={cn(
                  "hds-spotlight-card relative flex h-full flex-col rounded-[8px] bg-white p-8 transition-all duration-300",
                  isHighlighted
                    ? "border-[1.5px] border-[#533afd]"
                    : "border border-[#e5edf5]",
                )}
                style={{
                  boxShadow: isHighlighted
                    ? "rgba(50,50,93,0.18) 0px 30px 50px -25px, rgba(0,0,0,0.08) 0px 18px 36px -18px"
                    : "rgba(23,23,23,0.06) 0px 3px 6px",
                }}
              >
                {isHighlighted && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={
                      isInView
                        ? { scale: 1, opacity: 1 }
                        : { scale: 0, opacity: 0 }
                    }
                    transition={{
                      delay: 0.5 + idx * 0.1,
                      type: "spring",
                      stiffness: 280,
                      damping: 20,
                    }}
                    className="absolute -top-3 left-8"
                  >
                    <span
                      className="inline-flex items-center gap-1 rounded-[4px] bg-[#533afd] px-2.5 py-1 text-[11px] uppercase tracking-[0.5px] text-white"
                      style={{
                        fontFamily: "var(--hds-font-body)",
                        fontWeight: 700,
                      }}
                    >
                      가장 인기
                    </span>
                  </motion.div>
                )}

                <div>
                  <h3
                    className="hds-display text-[22px] leading-[1.3] tracking-[-0.018em] text-[#061b31]"
                    style={{ fontWeight: 700 }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="hds-body mt-2 text-[14px] leading-[1.5] text-[#64748d]"
                    style={{ fontWeight: 500 }}
                  >
                    {plan.description}
                  </p>
                </div>

                <div className="mt-7 flex items-baseline gap-1">
                  {plan.price !== "문의" && (
                    <span
                      className="text-[22px] text-[#273951]"
                      style={{
                        fontFamily: "var(--hds-font-display)",
                        fontWeight: 700,
                      }}
                    >
                      ₩
                    </span>
                  )}
                  <span
                    className="hds-tnum hds-display text-[44px] leading-[1] tracking-[-0.025em] text-[#061b31]"
                    style={{ fontWeight: 800 }}
                  >
                    {plan.price}
                  </span>
                  {plan.price !== "문의" && (
                    <span
                      className="hds-body text-[15px] text-[#64748d]"
                      style={{ fontWeight: 500 }}
                    >
                      /월
                    </span>
                  )}
                </div>

                <div className="my-7 hds-divider-soft" />

                <ul className="mb-8 flex-1 space-y-3.5">
                  {plan.features.map((feature, featureIdx) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -8 }}
                      animate={
                        isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
                      }
                      transition={{ delay: 0.3 + featureIdx * 0.04 }}
                      className="flex items-start gap-2.5"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px]",
                          isHighlighted
                            ? "bg-[#533afd]"
                            : "bg-[rgba(83,58,253,0.1)]",
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3",
                            isHighlighted ? "text-white" : "text-[#533afd]",
                          )}
                          strokeWidth={3}
                        />
                      </span>
                      <span
                        className="text-[14px] leading-[1.5] text-[#273951]"
                        style={{
                          fontFamily: "var(--hds-font-body)",
                          fontWeight: 500,
                        }}
                      >
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "h-11 w-full rounded-[4px] text-[15px] transition-all duration-300",
                    isHighlighted
                      ? "bg-[#533afd] text-white hover:bg-[#4434d4] shadow-[rgba(50,50,93,0.25)_0px_8px_20px_-10px,rgba(0,0,0,0.1)_0px_4px_10px_-4px] hover:shadow-[rgba(50,50,93,0.35)_0px_18px_30px_-15px,rgba(0,0,0,0.12)_0px_10px_20px_-8px]"
                      : "border border-[#e5edf5] bg-white text-[#273951] hover:bg-[#f6f9fc] hover:border-[#d6d9fc] shadow-none",
                  )}
                  style={{
                    fontFamily: "var(--hds-font-body)",
                    fontWeight: 600,
                  }}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
