import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import {
  ChevronRight,
  FileUp,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquareText,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/shared/auth/authStore"

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png"

const menuItems = [
  {
    label: "대시보드",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "연동 설정",
    href: "/dashboard/integrations",
    icon: Link2,
  },
  {
    label: "통화 이력",
    href: "/dashboard/calls",
    icon: Phone,
  },
  {
    label: "VOC 분석",
    href: "/dashboard/voc",
    icon: MessageSquareText,
  },
  {
    label: "지식 업로드",
    href: "/dashboard/knowledge",
    icon: FileUp,
  },
] as const

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
}

const menuItemVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.1 + i * 0.05,
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

export function DashboardSidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const tenant = useAuthStore((state) => state.tenant)
  const user = useAuthStore((state) => state.user)
  const clearAuth = useAuthStore((state) => state.clearAuth)

  const handleLogout = () => {
    clearAuth()
    navigate("/login", { replace: true })
  }

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="flex h-screen w-64 flex-col border-r border-border bg-card"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="border-b border-border"
      >
        <Link
          to="/"
          className="flex h-16 items-center gap-2 px-6 transition-colors hover:bg-muted/50"
          aria-label="홈으로 이동"
        >
          <img
            src={logoSrc}
            alt="시시콜콜 로고"
            width={40}
            height={40}
            className="max-w-[40px]"
            style={{ mixBlendMode: "multiply" }}
          />
          <span className="text-lg font-bold text-foreground">시시콜콜</span>
        </Link>
      </motion.div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item, idx) => {
            const isActive = pathname === item.href

            return (
              <motion.li
                key={item.href}
                custom={idx}
                initial="hidden"
                animate="visible"
                variants={menuItemVariants}
              >
                <Link
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <motion.span>
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </motion.span>
                  {item.label}
                  {isActive ? (
                    <motion.span
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-auto"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </motion.span>
                  ) : null}
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-3 rounded-lg bg-muted/50 px-3 py-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {tenant?.name ?? "회사 정보 확인 중"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {user?.email ?? "관리자 계정"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          로그아웃
        </Button>
      </div>
    </motion.aside>
  )
}
