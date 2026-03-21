'use client'

import { motion } from 'framer-motion'

export function GradientBackground() {
  return (
    <div className="fixed inset-0 -z-20 overflow-hidden">
      <motion.div
        animate={{
          background: [
            'linear-gradient(45deg, #003366, #0066cc)',
            'linear-gradient(45deg, #0066cc, #6600cc)',
            'linear-gradient(45deg, #6600cc, #003366)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: 'loop',
        }}
        className="absolute inset-0"
      />
      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'loop',
        }}
        className="absolute inset-0 bg-gradient-radial from-transparent via-black/20 to-black/40"
      />
    </div>
  )
}
