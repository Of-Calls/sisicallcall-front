import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileUp,
  LayoutDashboard,
  Link2,
  LogOut,
  MessageSquareText,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/shared/auth/authStore";

const logoSrc =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-F73u93gxOEnKoM0ShWO9oUBWEHDlnw.png";

type MenuItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type MenuGroup = {
  eyebrow: string;
  items: readonly MenuItem[];
};

const menuGroups: readonly MenuGroup[] = [
  {
    eyebrow: "OVERVIEW",
    items: [{ label: "대시보드", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    eyebrow: "OPERATIONS",
    items: [
      { label: "통화 이력", href: "/dashboard/calls", icon: Phone },
      { label: "VOC 분석", href: "/dashboard/voc", icon: MessageSquareText },
    ],
  },
  {
    eyebrow: "SETUP",
    items: [
      { label: "연동 설정", href: "/dashboard/integrations", icon: Link2 },
      { label: "지식 업로드", href: "/dashboard/knowledge", icon: FileUp },
    ],
  },
] as const;

const sidebarVariants = {
  hidden: { x: -16, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

const menuItemVariants = {
  hidden: { x: -8, opacity: 0 },
  visible: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.08 + i * 0.04,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export function DashboardSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tenant = useAuthStore((state) => state.tenant);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate("/login", { replace: true });
  };

  // Match the active item against the longest matching href so nested routes
  // ("/dashboard/calls") don't also light up the root "/dashboard" entry.
  const activeHref = (() => {
    const allHrefs = menuGroups.flatMap((g) => g.items.map((i) => i.href));
    return (
      allHrefs
        .filter((h) => pathname === h || pathname.startsWith(`${h}/`))
        .sort((a, b) => b.length - a.length)[0] ?? null
    );
  })();

  let renderIndex = 0;

  return (
    <motion.aside
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
      className="flex h-screen w-[240px] shrink-0 flex-col"
      style={{
        backgroundColor: "#f6f9fc",
        borderRight: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      {/* Brand block */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        style={{ borderBottom: "1px solid #e5edf5" }}
      >
        <Link
          to="/"
          className="flex h-[60px] items-center gap-2.5 px-5 transition-colors"
          aria-label="홈으로 이동"
          style={{ color: "#061b31" }}
        >
          <img
            src={logoSrc}
            alt="시시콜콜 로고"
            width={32}
            height={32}
            className="max-w-[32px]"
            style={{ mixBlendMode: "multiply" }}
          />
          <span
            className="text-[16px] tracking-[-0.012em]"
            style={{ fontFamily: "var(--hds-font-display)", fontWeight: 700 }}
          >
            시시콜콜
          </span>
        </Link>
      </motion.div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {menuGroups.map((group, groupIdx) => (
          <div key={group.eyebrow} className={cn(groupIdx > 0 && "mt-5")}>
            {/* Eyebrow */}
            <p
              className="px-3 pb-1.5 text-[11px] uppercase"
              style={{
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: "0.6px",
              }}
            >
              {group.eyebrow}
            </p>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = activeHref === item.href;
                const idx = renderIndex++;
                const Icon = item.icon;

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
                        "group relative flex items-center gap-2.5 rounded-[6px] py-2 pl-3 pr-3 text-[13px] transition-colors duration-150",
                        isActive
                          ? "text-[#533afd]"
                          : "text-[#273951] hover:bg-[#eef2f8] hover:text-[#061b31]",
                      )}
                      style={{
                        fontWeight: isActive ? 600 : 500,
                        backgroundColor: isActive
                          ? "rgba(83,58,253,0.08)"
                          : undefined,
                      }}
                    >
                      {/* 2px left active bar — flush to item edge per spec */}
                      {isActive ? (
                        <motion.span
                          layoutId="sidebar-active-bar"
                          aria-hidden="true"
                          className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-[2px]"
                          style={{ backgroundColor: "#533afd" }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 35,
                          }}
                        />
                      ) : null}

                      <Icon
                        className="h-4 w-4 shrink-0"
                        aria-hidden="true"
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: tenant info + logout */}
      <div className="p-3" style={{ borderTop: "1px solid #e5edf5" }}>
        <div
          className="mb-2 rounded-[6px] px-3 py-2.5"
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5edf5",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px]"
              style={{
                backgroundColor: "rgba(83,58,253,0.08)",
                border: "1px solid rgba(83,58,253,0.2)",
                color: "#533afd",
                fontFamily: "var(--hds-font-display)",
                fontWeight: 700,
                fontSize: "11px",
              }}
            >
              {tenant?.name?.slice(0, 1) ?? "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-[12.5px]"
                style={{ color: "#061b31", fontWeight: 600 }}
              >
                {tenant?.name ?? "회사 정보 확인 중"}
              </p>
              <p
                className="truncate text-[11px]"
                style={{ color: "#64748d", fontWeight: 500 }}
              >
                {user?.email ?? "관리자 계정"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-[6px] px-3 py-2 text-[12.5px] transition-colors duration-150",
            "text-[#273951] hover:bg-[#eef2f8] hover:text-[#061b31]",
          )}
          style={{ fontWeight: 500 }}
        >
          <LogOut
            className="h-3.5 w-3.5"
            aria-hidden="true"
            strokeWidth={1.8}
          />
          로그아웃
        </button>
      </div>
    </motion.aside>
  );
}
