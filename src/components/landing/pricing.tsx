import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="pricing" className="bg-muted/30 py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            요금제
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            비즈니스 규모에 맞는 플랜을 선택하세요
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            14일 무료 체험 후 결제하세요. 언제든 플랜 변경이 가능합니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-8 lg:grid-cols-3"
        >
          {plans.map((plan, idx) => (
            <motion.div key={plan.name} variants={cardVariants}>
              <motion.div className="h-full">
                <Card
                  className={`relative flex h-full flex-col transition-all duration-300 ${
                    plan.highlighted
                      ? "border-2 border-primary shadow-xl shadow-primary/10"
                      : "border-border"
                  }`}
                >
                  {plan.highlighted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : { scale: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 300 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-semibold text-primary-foreground"
                    >
                      가장 인기
                    </motion.div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl text-card-foreground">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-card-foreground">
                        {plan.price === "문의" ? "" : "₩"}
                        {plan.price}
                      </span>
                      {plan.price !== "문의" && (
                        <span className="text-muted-foreground">/월</span>
                      )}
                    </div>

                    <ul className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature, featureIdx) => (
                        <motion.li
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                          transition={{ delay: 0.3 + featureIdx * 0.05 }}
                          className="flex items-start gap-3"
                        >
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className={`w-full transition-all duration-300 ${
                          plan.highlighted
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
                            : "bg-foreground text-background hover:bg-foreground/90"
                        }`}
                      >
                        {plan.price === "문의" ? "문의하기" : "시작하기"}
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
