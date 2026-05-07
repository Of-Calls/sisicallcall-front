import { useState } from "react"
import { Link } from "react-router-dom"
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion"
import {
  BarChart3,
  CalendarCheck,
  ChevronDown,
  Headphones,
  Menu,
  MessagesSquare,
  PhoneCall,
  ShoppingCart,
  X,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { useDashboardEntryActions } from "@/components/landing/dashboard-entry-choice"
import { cn } from "@/lib/utils"

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png"

const navItems = [
  {
    label: "제품 소개",
    href: "#features",
    submenu: [
      { label: "AI 전화 상담", href: "#features", description: "자연스러운 AI 음성 상담" },
      { label: "실시간 분석", href: "#analytics", description: "VOC 및 감정 분석" },
      { label: "멀티채널 지원", href: "#multichannel", description: "전화, 메시지, 문자 통합" },
    ],
  },
  {
    label: "솔루션",
    href: "#solutions",
    submenu: [
      { label: "고객센터", href: "#contact-center", description: "대용량 콜센터 자동화" },
      { label: "예약 관리", href: "#booking", description: "자동 예약 및 확인" },
      { label: "주문 접수", href: "#orders", description: "음성 주문 처리" },
    ],
  },
  { label: "요금제", href: "#pricing" },
  { label: "라이브 데모", href: "#demo" },
]

const mobileSubmenuIcons: Record<string, LucideIcon> = {
  "#features": PhoneCall,
  "#analytics": BarChart3,
  "#multichannel": MessagesSquare,
  "#contact-center": Headphones,
  "#booking": CalendarCheck,
  "#orders": ShoppingCart,
}

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { openInBrowser, openAsApp } = useDashboardEntryActions()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 8)
  })

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setExpandedMobileMenus([])
  }

  const toggleMobileMenu = (label: string) => {
    setExpandedMobileMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    )
  }

  const handleWebDashboardEntry = () => {
    closeMobileMenu()
    openInBrowser()
  }

  const handleAppDashboardEntry = () => {
    closeMobileMenu()
    void openAsApp()
  }

  const floatingHeader = isScrolled || isMobileMenuOpen

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        floatingHeader ? "px-3 py-2 sm:py-3" : "bg-white/80 px-0 py-0 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "relative z-50 mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-all duration-300 lg:px-10",
          floatingHeader
            ? "h-16 rounded-2xl border border-slate-200/80 bg-white/95 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
            : "h-[72px]",
        )}
      >
        <Link to="/" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-2.5">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center"
          >
            <img
              src={logoSrc}
              alt="시시콜콜 로고"
              width={44}
              height={44}
              className="max-w-[44px]"
              style={{ mixBlendMode: "multiply" }}
            />
          </motion.div>
          <span className="truncate text-[18px] font-semibold tracking-tight text-[#0f172a]">
            시시콜콜
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.submenu && setActiveMenu(item.label)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <a
                href={item.href}
                className="flex items-center gap-1 rounded-lg px-4 py-2 text-[15px] font-medium text-[#475569] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              >
                {item.label}
                {item.submenu && (
                  <motion.span
                    animate={{ rotate: activeMenu === item.label ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.span>
                )}
              </a>

              <AnimatePresence>
                {item.submenu && activeMenu === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full z-50 mt-1 w-64 origin-top rounded-xl border border-[#e2e8f0] bg-white p-2 shadow-lg"
                  >
                    {item.submenu.map((subItem, idx) => (
                      <motion.div
                        key={subItem.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <a
                          href={subItem.href}
                          className="block rounded-lg px-4 py-3 transition-colors hover:bg-[#f1f5f9]"
                        >
                          <span className="block text-[14px] font-medium text-[#0f172a]">
                            {subItem.label}
                          </span>
                          <span className="block text-[13px] text-[#64748b]">
                            {subItem.description}
                          </span>
                        </a>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 lg:gap-6">
          <button
            type="button"
            onClick={handleWebDashboardEntry}
            className="hidden text-[15px] font-medium text-[#0f172a] transition-colors hover:text-[#475569] sm:block"
          >
            웹에서 보기
          </button>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              type="button"
              onClick={handleAppDashboardEntry}
              className={cn(
                "h-10 rounded-full px-4 text-[14px] font-semibold text-white shadow-none transition-all duration-300 sm:px-6",
                isMobileMenuOpen
                  ? "bg-black hover:bg-black/85"
                  : "bg-[#0D9488] hover:bg-[#0f766e] hover:shadow-lg hover:shadow-[#0D9488]/25",
              )}
            >
              앱으로 보기
            </Button>
          </motion.div>

          <IconButton
            label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            onClick={() => {
              setIsMobileMenuOpen((open) => !open)
              setExpandedMobileMenus([])
            }}
            className="rounded-full border-transparent bg-transparent text-[#0f172a] shadow-none hover:bg-[#f1f5f9] lg:hidden"
            aria-label={isMobileMenuOpen ? "상단 메뉴 닫기" : "상단 메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </IconButton>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white lg:hidden"
          >
            <motion.nav
              initial={{ y: -16 }}
              animate={{ y: 0 }}
              exit={{ y: -16 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex max-w-[1400px] flex-col px-6 pb-10 pt-24 sm:px-8"
            >
              {navItems.map((item) => {
                const isExpanded = expandedMobileMenus.includes(item.label)

                return (
                  <div
                    key={item.label}
                    className={cn(
                      "border-b transition-colors duration-200",
                      isExpanded ? "border-[#4f46e5]" : "border-[#e2e8f0]",
                    )}
                  >
                    {item.submenu ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleMobileMenu(item.label)}
                          className={cn(
                            "flex min-h-20 w-full items-center justify-between py-5 text-left text-[21px] font-medium tracking-tight transition-colors",
                            isExpanded ? "text-[#4f46e5]" : "text-[#0f172a]",
                          )}
                        >
                          {item.label}
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 transition-colors",
                                isExpanded ? "text-[#4f46e5]" : "text-[#334155]",
                              )}
                            />
                          </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <motion.div
                                initial={{ y: -8 }}
                                animate={{ y: 0 }}
                                exit={{ y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="pb-7 pt-1"
                              >
                                <div className="space-y-5 px-6 sm:px-8">
                                  {item.submenu.map((subItem, idx) => {
                                    const Icon = mobileSubmenuIcons[subItem.href] ?? ChevronDown

                                    return (
                                      <motion.a
                                        key={subItem.label}
                                        href={subItem.href}
                                        onClick={closeMobileMenu}
                                        initial={{ opacity: 0, x: -8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        className="group flex items-start gap-3"
                                      >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[5px] bg-[#f3efff] text-[#635bff] transition-colors group-hover:bg-[#ebe6ff]">
                                          <Icon className="h-5 w-5" strokeWidth={1.7} />
                                        </span>
                                        <span>
                                          <span className="block text-[15px] font-semibold text-[#0f172a]">
                                            {subItem.label}
                                          </span>
                                          <span className="mt-0.5 block text-[13px] leading-5 text-[#64748b]">
                                            {subItem.description}
                                          </span>
                                        </span>
                                      </motion.a>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <a
                        href={item.href}
                        onClick={closeMobileMenu}
                        className="flex min-h-20 w-full items-center justify-between py-5 text-[21px] font-medium tracking-tight text-[#0f172a]"
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                )
              })}

              <div className="mt-6 grid gap-3 sm:hidden">
                <button
                  type="button"
                  onClick={handleWebDashboardEntry}
                  className="rounded-full border border-[#e2e8f0] px-5 py-3 text-center text-[15px] font-semibold text-[#0f172a]"
                >
                  웹에서 보기
                </button>
                <button
                  type="button"
                  onClick={handleAppDashboardEntry}
                  className="rounded-full bg-[#0D9488] px-5 py-3 text-center text-[15px] font-semibold text-white"
                >
                  앱으로 보기
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
