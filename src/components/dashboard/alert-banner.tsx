import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AlertBannerProps {
  count: number
  onDismiss?: () => void
  isVisible?: boolean
}

export function AlertBanner({ count, onDismiss, isVisible = true }: AlertBannerProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, delay: 0.3, repeat: 2 }}
              >
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </motion.div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-sm font-medium text-red-800"
            >
              <span className="font-bold">[긴급 에스컬레이션]</span> {count}건의 통화가
              상담원 개입을 기다리고 있습니다.
            </motion.p>
          </div>
          {onDismiss && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-red-600 transition-colors hover:bg-red-100 hover:text-red-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
