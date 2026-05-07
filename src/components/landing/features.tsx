import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { BarChart3, Clock, MessageSquare, Phone, Shield, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Phone,
    title: "AI 전화 상담",
    description:
      "자연스러운 음성 인식과 대화 흐름으로 고객 문의에 즉시 응답합니다. 복잡한 문의는 상담원에게 자동 연결합니다.",
  },
  {
    icon: MessageSquare,
    title: "멀티채널 지원",
    description:
      "전화, 카카오톡, 문자 등 다양한 채널을 하나의 플랫폼에서 통합 관리할 수 있습니다.",
  },
  {
    icon: BarChart3,
    title: "실시간 분석",
    description:
      "상담 내용을 실시간으로 분석하고 고객 인사이트를 자동으로 추출합니다.",
  },
  {
    icon: Clock,
    title: "24시간 운영",
    description:
      "AI가 쉬지 않고 고객 문의에 응답합니다. 영업시간 외에도 놓치는 고객이 없습니다.",
  },
  {
    icon: Shield,
    title: "보안 및 규정 준수",
    description:
      "개인정보보호 기준을 준수하며 고객 데이터를 안전하게 보호합니다.",
  },
  {
    icon: Zap,
    title: "빠른 도입",
    description:
      "기존 시스템과 쉽게 연동되어 빠르게 도입할 수 있습니다. 복잡한 설정 없이 바로 시작하세요.",
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function Features() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="features" className="bg-background py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            주요 기능
          </p>
          <h2 className="mt-2 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            고객 상담의 모든 것을 AI로 혁신하세요
          </h2>
          <p className="mt-4 text-pretty text-lg text-muted-foreground">
            시시콜콜은 AI와 사람의 강점을 결합한 하이브리드 솔루션으로 최상의 고객 경험을 제공합니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <motion.div className="h-full">
                <Card className="h-full border-border bg-card transition-all duration-300">
                  <CardHeader>
                    <motion.div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300">
                      <feature.icon className="h-6 w-6" aria-hidden="true" />
                    </motion.div>
                    <CardTitle className="text-xl text-card-foreground">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
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
