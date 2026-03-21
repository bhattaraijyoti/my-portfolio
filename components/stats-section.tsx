'use client'

import { motion } from 'framer-motion'
import { Counter } from './counter'

interface StatProps {
  value: number
  label: string
  suffix?: string
}

interface StatsSectionProps {
  stats: StatProps[]
  className?: string
}

export function StatsSection({ stats, className = '' }: StatsSectionProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      className={`grid grid-cols-2 md:grid-cols-4 gap-8 ${className}`}
    >
      {stats.map((stat, index) => (
        <motion.div key={index} variants={itemVariants} className="text-center">
          <div className="text-3xl md:text-4xl font-bold mb-2">
            <Counter target={stat.value} suffix={stat.suffix || ''} />
          </div>
          <p className="text-muted-foreground text-sm md:text-base">{stat.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
