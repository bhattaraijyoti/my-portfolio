'use client'

import { useRef, useEffect, useState } from 'react'

export function useFPS(refreshRate = 1000) {
  const [fps, setFps] = useState(0)
  const framesRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    let raf: number
    let interval: number

    const tick = () => {
      framesRef.current++
      raf = requestAnimationFrame(tick)
    }

    interval = window.setInterval(() => {
      const now = performance.now()
      const elapsed = now - lastTimeRef.current
      setFps(Math.round((framesRef.current / elapsed) * 1000))
      framesRef.current = 0
      lastTimeRef.current = now
    }, refreshRate)

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(interval)
    }
  }, [refreshRate])

  return fps
}