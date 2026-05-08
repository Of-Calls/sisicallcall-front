import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { useDashboardEntryActions } from "@/components/landing/dashboard-entry-choice";
import { cn } from "@/lib/utils";

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png";

const navItems = [
  {
    label: "제품 소개",
    href: "#features",
    submenu: [
      {
        label: "AI 전화 상담",
        href: "#features",
        description: "자연스러운 AI 음성 상담",
      },
      {
        label: "실시간 분석",
        href: "#analytics",
        description: "VOC 및 감정 분석",
      },
      {
        label: "멀티채널 지원",
        href: "#multichannel",
        description: "전화, 메시지, 문자 통합",
      },
    ],
  },
  {
    label: "솔루션",
    href: "#solutions",
    submenu: [
      {
        label: "고객센터",
        href: "#contact-center",
        description: "대용량 콜센터 자동화",
      },
      {
        label: "예약 관리",
        href: "#booking",
        description: "자동 예약 및 확인",
      },
      { label: "주문 접수", href: "#orders", description: "음성 주문 처리" },
    ],
  },
  { label: "요금제", href: "#pricing" },
  { label: "라이브 데모", href: "#demo" },
];

const mobileSubmenuIcons: Record<string, LucideIcon> = {
  "#features": PhoneCall,
  "#analytics": BarChart3,
  "#multichannel": MessagesSquare,
  "#contact-center": Headphones,
  "#booking": CalendarCheck,
  "#orders": ShoppingCart,
};

export function Header() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { openInBrowser, openAsApp } = useDashboardEntryActions();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 8);
  });

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedMobileMenus([]);
  };

  const toggleMobileMenu = (label: string) => {
    setExpandedMobileMenus((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label],
    );
  };

  const handleWebDashboardEntry = () => {
    closeMobileMenu();
    openInBrowser();
  };

  const handleAppDashboardEntry = () => {
    closeMobileMenu();
    void openAsApp();
  };

  const floatingHeader = isScrolled || isMobileMenuOpen;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        floatingHeader
          ? "px-3 py-2 sm:py-3"
          : "bg-white/85 px-0 py-0 backdrop-blur-md border-b border-[#e5edf5]/70",
      )}
    >
      <div
        className={cn(
          "relative z-50 mx-auto flex max-w-[1280px] items-center justify-between px-6 transition-all duration-300 lg:px-10",
          floatingHeader
            ? "h-16 rounded-[8px] border border-[#e5edf5] bg-white/95 backdrop-blur-xl"
            : "h-[68px]",
        )}
        style={
          floatingHeader
            ? {
                boxShadow:
                  "rgba(50,50,93,0.18) 0px 18px 36px -18px, rgba(0,0,0,0.08) 0px 10px 24px -10px",
              }
            : undefined
        }
      >
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex min-w-0 items-center gap-2.5"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center"
          >
            <img
              src={logoSrc}
              alt="시시콜콜 로고"
              width={40}
              height={40}
              className="max-w-[40px]"
              style={{ mixBlendMode: "multiply" }}
            />
          </motion.div>
          <span
            className="truncate text-[18px] tracking-[-0.014em] text-[#061b31]"
            style={{ fontFamily: "var(--hds-font-display)", fontWeight: 700 }}
          >
            시시콜콜
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          style={{ fontFamily: "var(--hds-font-body)" }}
        >
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() => item.submenu && setActiveMenu(item.label)}
              onMouseLeave={() => setActiveMenu(null)}
            >
              <a
                href={item.href}
                className={cn(
                  "flex items-center gap-1 rounded-[6px] px-3.5 py-2 text-[14px] transition-colors",
                  "text-[#273951] hover:bg-[#f6f9fc] hover:text-[#061b31]",
                  activeMenu === item.label && "bg-[#f6f9fc] text-[#061b31]",
                )}
                style={{ fontWeight: 500 }}
              >
                {item.label}
                {item.submenu && (
                  <motion.span
                    animate={{ rotate: activeMenu === item.label ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </a>

              <AnimatePresence>
                {item.submenu && activeMenu === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full z-50 mt-2 w-72 origin-top rounded-[8px] border border-[#e5edf5] bg-white p-2"
                    style={{
                      boxShadow:
                        "rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px",
                    }}
                  >
                    {item.submenu.map((subItem, idx) => (
                      <motion.div
                        key={subItem.label}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <a
                          href={subItem.href}
                          className="block rounded-[6px] px-3.5 py-3 transition-colors hover:bg-[#f6f9fc]"
                        >
                          <span
                            className="block text-[14px] text-[#061b31]"
                            style={{ fontWeight: 600 }}
                          >
                            {subItem.label}
                          </span>
                          <span
                            className="mt-0.5 block text-[12.5px] leading-[1.45] text-[#64748d]"
                            style={{ fontWeight: 500 }}
                          >
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

        <div
          className="flex items-center gap-2 sm:gap-3 lg:gap-4"
          style={{ fontFamily: "var(--hds-font-body)" }}
        >
          <button
            type="button"
            onClick={handleWebDashboardEntry}
            className="hidden text-[14px] text-[#273951] transition-colors hover:text-[#533afd] sm:block"
            style={{ fontWeight: 500 }}
          >
            웹에서 보기
          </button>
          <Button
            type="button"
            onClick={handleAppDashboardEntry}
            className={cn(
              "h-10 rounded-[4px] px-4 text-[14px] text-white transition-all duration-300 sm:px-5",
              isMobileMenuOpen
                ? "bg-[#061b31] hover:bg-[#0d253d] shadow-none"
                : "bg-[#533afd] hover:bg-[#4434d4] shadow-[rgba(50,50,93,0.25)_0px_8px_18px_-10px,rgba(0,0,0,0.1)_0px_4px_8px_-4px] hover:shadow-[rgba(50,50,93,0.35)_0px_14px_28px_-12px,rgba(0,0,0,0.12)_0px_8px_16px_-8px]",
            )}
            style={{ fontWeight: 600 }}
          >
            앱으로 보기
          </Button>

          <IconButton
            label={isMobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            onClick={() => {
              setIsMobileMenuOpen((open) => !open);
              setExpandedMobileMenus([]);
            }}
            className="rounded-[4px] border-transparent bg-transparent text-[#061b31] shadow-none hover:bg-[#f6f9fc] lg:hidden"
            aria-label={isMobileMenuOpen ? "상단 메뉴 닫기" : "상단 메뉴 열기"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
              className="mx-auto flex max-w-[1280px] flex-col px-6 pb-10 pt-24 sm:px-8"
              style={{ fontFamily: "var(--hds-font-body)" }}
            >
              {navItems.map((item) => {
                const isExpanded = expandedMobileMenus.includes(item.label);

                return (
                  <div
                    key={item.label}
                    className={cn(
                      "border-b transition-colors duration-200",
                      isExpanded ? "border-[#533afd]" : "border-[#e5edf5]",
                    )}
                  >
                    {item.submenu ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={isExpanded}
                          onClick={() => toggleMobileMenu(item.label)}
                          className={cn(
                            "flex min-h-[68px] w-full items-center justify-between py-5 text-left text-[20px] tracking-[-0.014em] transition-colors",
                            isExpanded ? "text-[#533afd]" : "text-[#061b31]",
                          )}
                          style={{
                            fontFamily: "var(--hds-font-display)",
                            fontWeight: 700,
                          }}
                        >
                          {item.label}
                          <motion.span
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 transition-colors",
                                isExpanded
                                  ? "text-[#533afd]"
                                  : "text-[#64748d]",
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
                              transition={{
                                duration: 0.24,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className="overflow-hidden"
                            >
                              <motion.div
                                initial={{ y: -8 }}
                                animate={{ y: 0 }}
                                exit={{ y: -8 }}
                                transition={{ duration: 0.2 }}
                                className="pb-7 pt-1"
                              >
                                <div className="space-y-5 px-4 sm:px-6">
                                  {item.submenu.map((subItem, idx) => {
                                    const Icon =
                                      mobileSubmenuIcons[subItem.href] ??
                                      ChevronDown;

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
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-[rgba(83,58,253,0.08)] text-[#533afd] border border-[rgba(83,58,253,0.2)] transition-colors group-hover:bg-[rgba(83,58,253,0.12)]">
                                          <Icon
                                            className="h-4.5 w-4.5"
                                            strokeWidth={1.8}
                                          />
                                        </span>
                                        <span>
                                          <span
                                            className="block text-[15px] text-[#061b31]"
                                            style={{ fontWeight: 600 }}
                                          >
                                            {subItem.label}
                                          </span>
                                          <span
                                            className="mt-0.5 block text-[13px] leading-[1.5] text-[#64748d]"
                                            style={{ fontWeight: 500 }}
                                          >
                                            {subItem.description}
                                          </span>
                                        </span>
                                      </motion.a>
                                    );
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
                        className="flex min-h-[68px] w-full items-center justify-between py-5 text-[20px] tracking-[-0.014em] text-[#061b31]"
                        style={{
                          fontFamily: "var(--hds-font-display)",
                          fontWeight: 700,
                        }}
                      >
                        {item.label}
                      </a>
                    )}
                  </div>
                );
              })}

              <div className="mt-7 grid gap-3 sm:hidden">
                <button
                  type="button"
                  onClick={handleWebDashboardEntry}
                  className="rounded-[4px] border border-[#b9b9f9] bg-white px-5 py-3 text-center text-[15px] text-[#533afd]"
                  style={{ fontWeight: 600 }}
                >
                  웹에서 보기
                </button>
                <button
                  type="button"
                  onClick={handleAppDashboardEntry}
                  className="rounded-[4px] bg-[#533afd] px-5 py-3 text-center text-[15px] text-white shadow-[rgba(50,50,93,0.25)_0px_8px_18px_-10px,rgba(0,0,0,0.1)_0px_4px_8px_-4px] transition-colors hover:bg-[#4434d4]"
                  style={{ fontWeight: 600 }}
                >
                  앱으로 보기
                </button>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
