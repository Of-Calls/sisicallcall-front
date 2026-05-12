/**
 * Shared chrome for dashboard pages — page topbar + section header.
 * Use these instead of hand-rolling them on every page so the design
 * system stays consistent across /dashboard/*.
 */
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/* ============================================================
 * <PageTopbar>
 *   Sticky 60px-ish header with eyebrow + title + right slot.
 * ============================================================ */
export function PageTopbar({
  eyebrow,
  title,
  description,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-20 flex flex-wrap items-start justify-between gap-3 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-8 lg:py-5"
      style={{
        backgroundColor: "rgba(255,255,255,0.92)",
        borderBottom: "1px solid #e5edf5",
        fontFamily: "var(--hds-font-body)",
      }}
    >
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p
            className="no-text-break text-[11.5px] uppercase"
            style={{
              color: "#94a3b8",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="text-soft-wrap mt-0.5 text-[22px] tracking-[-0.018em]"
          style={{
            color: "#061b31",
            fontFamily: "var(--hds-font-display)",
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {title}
        </h1>
        {description ? (
          <p
            className="text-soft-wrap mt-1 text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {rightSlot ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {rightSlot}
        </div>
      ) : null}
    </motion.div>
  );
}

/* ============================================================
 * <SectionHeader>
 *   Eyebrow + section title; sits above grouped content within the page.
 * ============================================================ */
export function SectionHeader({
  eyebrow,
  title,
  description,
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p
            className="no-text-break text-[11.5px] uppercase"
            style={{
              color: "#94a3b8",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className="text-soft-wrap text-[16px] tracking-[-0.012em]"
          style={{
            color: "#061b31",
            fontFamily: "var(--hds-font-display)",
            fontWeight: 700,
          }}
        >
          {title}
        </h2>
        {description ? (
          <p
            className="text-soft-wrap mt-0.5 text-[12.5px]"
            style={{ color: "#64748d", fontWeight: 500 }}
          >
            {description}
          </p>
        ) : null}
      </div>
      {rightSlot ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {rightSlot}
        </div>
      ) : null}
    </header>
  );
}

/* ============================================================
 * <CountChip>
 *   Inline tnum count chip — "총 N건" / "N개" pattern.
 *   tone='primary' uses purple; tone='neutral' uses surface-1.
 * ============================================================ */
export function CountChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "primary" | "neutral" | "success" | "error";
}) {
  const styles =
    tone === "primary"
      ? {
          color: "#533afd",
          backgroundColor: "rgba(83,58,253,0.08)",
          border: "1px solid rgba(83,58,253,0.20)",
        }
      : tone === "success"
        ? {
            color: "#108c3d",
            backgroundColor: "rgba(21,190,83,0.15)",
            border: "1px solid rgba(21,190,83,0.30)",
          }
        : tone === "error"
          ? {
              color: "#ea2261",
              backgroundColor: "rgba(234,34,97,0.10)",
              border: "1px solid rgba(234,34,97,0.25)",
            }
          : {
              color: "#273951",
              backgroundColor: "#f6f9fc",
              border: "1px solid #e5edf5",
            };

  return (
    <span
      className="hds-tnum no-text-break inline-flex shrink-0 items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11.5px]"
      style={{
        ...styles,
        fontFamily: "var(--hds-font-body)",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
 * <StatusBadge>
 *   Per spec: 4px radius, 1px border, 12px caption, weight 500.
 * ============================================================ */
type BadgeTone = "info" | "success" | "warning" | "error" | "neutral";

const badgeToneStyles: Record<BadgeTone, React.CSSProperties> = {
  info: {
    backgroundColor: "rgba(83,58,253,0.08)",
    color: "#533afd",
    border: "1px solid rgba(83,58,253,0.20)",
  },
  success: {
    backgroundColor: "rgba(21,190,83,0.15)",
    color: "#108c3d",
    border: "1px solid rgba(21,190,83,0.30)",
  },
  warning: {
    backgroundColor: "rgba(155,104,41,0.12)",
    color: "#9b6829",
    border: "1px solid rgba(155,104,41,0.25)",
  },
  error: {
    backgroundColor: "rgba(234,34,97,0.10)",
    color: "#ea2261",
    border: "1px solid rgba(234,34,97,0.25)",
  },
  neutral: {
    backgroundColor: "#f6f9fc",
    color: "#64748d",
    border: "1px solid #e5edf5",
  },
};

export function StatusBadge({
  tone = "neutral",
  children,
  icon,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <span
      className="no-text-break inline-flex shrink-0 items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[11.5px] leading-[1.4]"
      style={{
        ...badgeToneStyles[tone],
        fontFamily: "var(--hds-font-body)",
        fontWeight: 600,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

/* ============================================================
 * <PageShell>
 *   Top-level wrapper — applies canvas background, ink color, body font.
 * ============================================================ */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-w-0"
      style={{
        backgroundColor: "#ffffff",
        fontFamily: "var(--hds-font-body)",
        color: "#061b31",
      }}
    >
      {children}
    </div>
  );
}

/* ============================================================
 * Inline empty / error state shells — flat, hairline border, ink-subtle text.
 * ============================================================ */
export function EmptyShell({
  children,
  height = "h-[240px]",
  tone = "neutral",
}: {
  children: ReactNode;
  height?: string;
  tone?: "neutral" | "error";
}) {
  const isError = tone === "error";
  return (
    <div
      className={`text-soft-wrap flex ${height} flex-col items-center justify-center gap-1 rounded-[8px] px-4 text-center text-[13px]`}
      style={{
        border: isError
          ? "1px solid rgba(234,34,97,0.25)"
          : "1px dashed #e5edf5",
        backgroundColor: isError ? "rgba(234,34,97,0.04)" : "#f6f9fc",
        color: isError ? "#ea2261" : "#64748d",
        fontFamily: "var(--hds-font-body)",
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
}
