import { useRef } from "react"
import { Link } from "react-router-dom"
import { motion, useInView } from "framer-motion"

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png"

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
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <footer className="border-t border-border bg-background" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid gap-8 lg:grid-cols-4"
        >
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400 }}>
                <img src={logoSrc} alt="시시콜콜 로고" width={32} height={32} className="rounded-lg" />
              </motion.div>
              <span className="text-lg font-bold text-foreground">시시콜콜</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              모든 고객을 위한 하이브리드 AI 에이전트.
              <br />
              AI와 사람의 조화로 최상의 고객 경험을 제공합니다.
            </p>
          </motion.div>

          {Object.entries(footerLinks).map(([category, links], idx) => (
            <motion.div key={category} variants={itemVariants}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                {category}
              </h3>
              <ul className="mt-4 space-y-3">
                {links.map((link, linkIdx) => (
                  <motion.li
                    key={link.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 0.2 + idx * 0.1 + linkIdx * 0.05 }}
                  >
                    <a
                      href={link.href}
                      className="inline-block text-sm text-muted-foreground transition-colors duration-200 hover:translate-x-1 hover:text-foreground"
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
          className="mt-12 border-t border-border pt-8"
        >
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} 시시콜콜. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
