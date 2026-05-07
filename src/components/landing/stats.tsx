import { useRef } from "react"
import { motion, useInView } from "framer-motion"

const stats = [
  {
    value: "95%",
    label: "고객 만족도",
    description: "AI 상담 후 고객 만족도",
  },
  {
    value: "60%",
    label: "비용 절감",
    description: "기존 대비 운영 비용 절감",
  },
  {
    value: "24/7",
    label: "무중단 운영",
    description: "연중무휴 AI 상담 서비스",
  },
  {
    value: "3초",
    label: "평균 응답 시간",
    description: "고객 문의 첫 응답까지",
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

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function Stats() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="bg-foreground py-20" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-background sm:text-4xl">
            검증된 성과로 증명합니다
          </h2>
          <p className="mt-4 text-lg text-background/70">
            시시콜콜을 도입한 기업들의 실제 성과입니다.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="group text-center"
            >
              <motion.p
                initial={{ scale: 0.5 }}
                animate={isInView ? { scale: 1 } : { scale: 0.5 }}
                transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
                className="text-5xl font-bold text-primary"
              >
                {stat.value}
              </motion.p>
              <p className="mt-2 text-xl font-semibold text-background">{stat.label}</p>
              <p className="mt-1 text-sm text-background/60">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
