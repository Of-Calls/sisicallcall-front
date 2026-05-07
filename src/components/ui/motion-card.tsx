import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

import { cn } from '@/lib/utils'

type MotionCardProps = HTMLMotionProps<'div'> & {
  children: React.ReactNode
  interactive?: boolean
}

function MotionCard({
  children,
  className,
  interactive = false,
  transition,
  ...props
}: MotionCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      data-slot="motion-card"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      whileHover={!shouldReduceMotion && interactive ? { y: -4, scale: 1.01 } : undefined}
      whileTap={!shouldReduceMotion && interactive ? { scale: 0.98 } : undefined}
      viewport={{ once: true, margin: '-40px' }}
      transition={transition ?? { duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeOut' }}
      className={cn(
        'rounded-2xl border bg-white/80 p-5 shadow-sm backdrop-blur transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 dark:bg-slate-950/80',
        interactive && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { MotionCard }
