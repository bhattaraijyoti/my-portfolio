'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
}

export function AnimatedCard({ children, className = '' }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      viewport={{ once: true, margin: '-50px' }}
      className={`rounded-xl border border-border bg-card p-6 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}
