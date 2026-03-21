'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { ReactNode, useRef } from 'react'

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function MagneticButton({
  children,
  className = '',
  onClick,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const xSpring = useSpring(x, { damping: 3, stiffness: 200, mass: 0.1 })
  const ySpring = useSpring(y, { damping: 3, stiffness: 200, mass: 0.1 })

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const distX = e.clientX - (rect.left + centerX)
    const distY = e.clientY - (rect.top + centerY)

    const distance = Math.sqrt(distX * distX + distY * distY)
    const magnetStrength = 30

    if (distance < 100) {
      x.set((distX / distance) * magnetStrength)
      y.set((distY / distance) * magnetStrength)
    }
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      style={{ x: xSpring, y: ySpring }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={className}
    >
      {children}
    </motion.button>
  )
}
