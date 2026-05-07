import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { DashboardEntryActions } from "@/components/landing/dashboard-entry-choice"
import { Button } from "@/components/ui/button"

export function CTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="contact" className="bg-background py-24" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 sm:px-12 sm:py-20 lg:px-20"
        >
          <div className="relative mx-auto max-w-2xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-balance text-3xl font-bold tracking-tight text-background sm:text-4xl"
            >
              지금 바로 시시콜콜을 경험해보세요
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-pretty text-lg leading-relaxed text-background/80"
            >
              14일 무료 체험으로 AI 전화 상담의 변화를 직접 확인하세요.
              전문 컨설턴트가 도입을 지원합니다.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <DashboardEntryActions
                size="lg"
                className="items-stretch sm:items-center"
                primaryClassName="px-8 font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/30"
                secondaryClassName="border-background/30 bg-transparent px-8 font-semibold text-background hover:border-background/50 hover:bg-background/10 hover:text-background"
              />
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-background/30 bg-transparent px-8 font-semibold text-background transition-all duration-300 hover:border-background/50 hover:bg-background/10"
                >
                  도입 문의하기
                </Button>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl"
          />
        </motion.div>
      </div>
    </section>
  )
}
