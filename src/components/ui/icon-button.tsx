import * as React from 'react'

import { cn } from '@/lib/utils'

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
}

function IconButton({
  label,
  className,
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-background shadow-sm transition-all outline-none hover:bg-accent hover:text-accent-foreground active:scale-95 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { IconButton }
