import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

interface AlertBannerProps {
  count: number;
  onDismiss?: () => void;
  isVisible?: boolean;
}

export function AlertBanner({
  count,
  onDismiss,
  isVisible = true,
}: AlertBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.99 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between rounded-[8px] px-4 py-3"
          style={{
            backgroundColor: "rgba(234,34,97,0.04)",
            border: "1px solid rgba(234,34,97,0.25)",
            fontFamily: "var(--hds-font-body)",
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 320 }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px]"
              style={{
                backgroundColor: "rgba(234,34,97,0.10)",
                border: "1px solid rgba(234,34,97,0.25)",
              }}
            >
              <AlertTriangle
                className="h-4 w-4"
                style={{ color: "#ea2261" }}
                strokeWidth={2}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 }}
              className="text-[13px]"
              style={{ color: "#061b31", fontWeight: 500, lineHeight: 1.5 }}
            >
              <span
                className="mr-1.5 inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] uppercase"
                style={{
                  color: "#ea2261",
                  backgroundColor: "rgba(234,34,97,0.10)",
                  border: "1px solid rgba(234,34,97,0.25)",
                  fontWeight: 700,
                  letterSpacing: "0.4px",
                }}
              >
                긴급
              </span>
              <span
                className="hds-tnum"
                style={{ color: "#ea2261", fontWeight: 700 }}
              >
                {count.toLocaleString("ko-KR")}건
              </span>
              <span style={{ color: "#273951" }}>
                {" "}
                의 통화가 상담원 개입을 기다리고 있습니다.
              </span>
            </motion.p>
          </div>

          {onDismiss && (
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              aria-label="알림 닫기"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] transition-colors"
              style={{ color: "#ea2261" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(234,34,97,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
