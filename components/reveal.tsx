'use client'

import * as React from 'react'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

export function Reveal({
  as = 'div',
  children,
  className,
  delay = 0,
}: {
  as?: React.ElementType
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useReveal<HTMLDivElement>()
  const Tag = as as React.ElementType
  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  )
}
