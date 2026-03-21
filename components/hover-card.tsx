'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { ReactNode } from 'react'

interface HoverCardProps {
  children: ReactNode
  className?: string
}

export function HoverCard({ children, className = '' }: HoverCardProps) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent<HTMLDivElement>) {
    let { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  let maskImage = useMotionTemplate`radial-gradient(150px at ${mouseX}px ${mouseY}px, black 0%, transparent 100%)`
  let maskSize = useMotionTemplate`${maskImage}`

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border bg-card p-6 ${className}`}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100"
        style={{
          maskImage,
          maskSize,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20" />
      </motion.div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
