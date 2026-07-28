'use client'

import { useRef, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

const TARGET_FPS = 60
const CHECK_INTERVAL = 2.0
const MIN_DPR = 0.75
const MAX_DPR = 2.0

export function useAdaptiveDPR() {
  const { gl } = useThree()
  const frames = useRef(0)
  const lastCheck = useRef(0)
  const currentDPR = useRef(gl.getPixelRatio())

  useFrame((state) => {
    frames.current++
    const elapsed = state.clock.elapsedTime - lastCheck.current

    if (elapsed >= CHECK_INTERVAL) {
      const actualFPS = frames.current / elapsed
      frames.current = 0
      lastCheck.current = state.clock.elapsedTime

      let newDPR = currentDPR.current
      if (actualFPS < TARGET_FPS - 5) {
        newDPR = Math.max(MIN_DPR, currentDPR.current - 0.15)
      } else if (actualFPS > TARGET_FPS + 10 && currentDPR.current < MAX_DPR) {
        newDPR = Math.min(MAX_DPR, currentDPR.current + 0.1)
      }

      if (Math.abs(newDPR - currentDPR.current) > 0.01) {
        currentDPR.current = newDPR
        gl.setPixelRatio(newDPR)
      }
    }
  })
}
