import { motion } from "framer-motion"
import { User } from "lucide-react"
import { DashboardEntryActions } from "@/components/landing/dashboard-entry-choice"

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png"

export function Hero() {
  return (
    <section
      className="relative min-h-[calc(100vh-72px)] w-full overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #fdf4f5 0%, #f5e6f0 25%, #ede4f3 50%, #fdeee8 75%, #fef5f0 100%)",
      }}
    >
      <div className="mx-auto flex max-w-[1400px] items-center px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-start"
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-[44px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#0f172a] sm:text-[52px] lg:text-[60px]"
            >
              모든 고객을 위한
              <br />
              하이브리드 AI 에이전트,
              <br />
              시시콜콜
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-[520px] text-[17px] leading-[1.7] text-[#475569]"
            >
              AI가 전화 상담을 대응하고, 필요한 순간 사람 상담원에게 연결합니다.
              24시간 운영되는 고객 상담 흐름으로 비즈니스의 응답 품질을 높이세요.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10"
            >
              <DashboardEntryActions
                size="lg"
                className="items-stretch sm:items-center"
                primaryClassName="h-12 px-8 text-[15px] font-semibold shadow-none transition-all duration-300 hover:shadow-lg hover:shadow-[#0D9488]/25"
                secondaryClassName="h-12 px-8 text-[15px] font-semibold"
              />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center lg:justify-end"
          >
            <motion.div
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative h-[400px] w-full max-w-[500px] overflow-hidden rounded-[32px] sm:h-[450px] lg:h-[500px]"
              style={{
                background: "linear-gradient(180deg, #f0e6f4 0%, #e8daf0 50%, #ddd0ea 100%)",
              }}
            >
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.5, type: "spring", stiffness: 200 }}
                  className="flex h-[180px] w-[180px] items-center justify-center rounded-full sm:h-[200px] sm:w-[200px] lg:h-[220px] lg:w-[220px]"
                  style={{
                    background: "linear-gradient(180deg, #c9b8e0 0%, #b5a0d4 100%)",
                  }}
                >
                  <User
                    className="h-16 w-16 text-[#4a3a6a] sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="absolute bottom-6 right-6"
              >
                <img
                  src={logoSrc}
                  alt="시시콜콜 AI 에이전트"
                  width={80}
                  height={80}
                  className="drop-shadow-lg"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
