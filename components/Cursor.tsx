'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Cursor() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)
  const [rotation, setRotation] = useState(0)
  const trailCount = 5 // number of tail dots
  const [trail, setTrail] = useState(Array(trailCount).fill({ x: 0, y: 0 }))

  useEffect(() => {
    let x = 0, y = 0
    let raf: number

    const move = (e: MouseEvent) => {
      mouseTarget.x = e.clientX
      mouseTarget.y = e.clientY
    }

    const mouseTarget = { x: 0, y: 0 }

    const animate = () => {
      x += (mouseTarget.x - x) * 0.15
      y += (mouseTarget.y - y) * 0.15
      setMouse({ x, y })
      setRotation(prev => prev + 3)

      // Update trail positions
      setTrail(prev => {
        const newTrail = [...prev]
        newTrail[0] = { x, y }
        for (let i = 1; i < trailCount; i++) {
          newTrail[i] = {
            x: newTrail[i].x + (newTrail[i - 1].x - newTrail[i].x) * 0.3,
            y: newTrail[i].y + (newTrail[i - 1].y - newTrail[i].y) * 0.3,
          }
        }
        return newTrail
      })

      raf = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', move)
    animate()

    const interactiveElements = 'a, button, input, textarea, [role="button"]'
    const onHover = () => setHovering(true)
    const onLeave = () => setHovering(false)
    document.querySelectorAll(interactiveElements).forEach(el => {
      el.addEventListener('mouseenter', onHover)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      window.removeEventListener('mousemove', move)
      document.querySelectorAll(interactiveElements).forEach(el => {
        el.removeEventListener('mouseenter', onHover)
        el.removeEventListener('mouseleave', onLeave)
      })
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      {/* Trailing tail dots */}
      {trail.map((dot, idx) => (
        <motion.div
          key={idx}
          animate={{ x: dot.x - 4, y: dot.y - 4, opacity: (1 - idx / trailCount) * 0.3 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="fixed top-0 left-0 w-2 h-2 bg-blue-500 rounded-full pointer-events-none z-[9998]"
        />
      ))}

      {/* Trailing circle */}
      <motion.div
        animate={{
          x: mouse.x - 20,
          y: mouse.y - 20,
          scale: hovering ? 2.5 : 1,
          rotate: rotation,
          opacity: hovering ? 0.35 : 0.2,
        }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-blue-500 pointer-events-none z-[9999]"
      />
      {/* Main inner cursor dot */}
      <motion.div
        animate={{
          x: mouse.x - 5,
          y: mouse.y - 5,
          scale: hovering ? 1.5 : 1
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed top-0 left-0 w-2.5 h-2.5 bg-blue-500 rounded-full pointer-events-none z-[10000]"
      />
    </>
  )
}