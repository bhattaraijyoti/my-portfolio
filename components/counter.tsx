'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface CounterProps {
  target: number
  duration?: number
  suffix?: string
}

export function Counter({ target, duration = 2, suffix = '' }: CounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    const animate = (time: number) => {
      if (!startTime) startTime = time
      const progress = (time - startTime) / (duration * 1000)

      if (progress < 1) {
        setCount(Math.floor(target * progress))
        requestAnimationFrame(animate)
      } else {
        setCount(target)
      }
    }

    requestAnimationFrame(animate)
  }, [isInView, target, duration])

  return (
    <div ref={ref}>
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.5 }}
        className="text-4xl font-bold"
      >
        {count}
        {suffix}
      </motion.span>
    </div>
  )
}
