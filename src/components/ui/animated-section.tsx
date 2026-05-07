import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

import { cn } from '@/lib/utils'

type AnimatedSectionProps = Omit<HTMLMotionProps<'section'>, 'children'> & {
  children: React.ReactNode
  delay?: number
  once?: boolean
}

function AnimatedSection({
  children,
  className,
  delay = 0,
  once = true,
  transition,
  ...props
}: AnimatedSectionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.section
      data-slot="animated-section"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={transition ?? { duration: shouldReduceMotion ? 0 : 0.35, delay, ease: 'easeOut' }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.section>
  )
}

export { AnimatedSection }
