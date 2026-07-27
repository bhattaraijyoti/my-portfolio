'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

const TRAIL_COUNT = 40

export default function DustTrail() {
  const points = useRef<THREE.Points>(null!)
  const head = useRef(0)

  const [positions, opacities] = useMemo(() => {
    const pos = new Float32Array(TRAIL_COUNT * 3)
    const op = new Float32Array(TRAIL_COUNT)
    for (let i = 0; i < TRAIL_COUNT; i++) {
      op[i] = 0
    }
    return [pos, op]
  }, [])

  useFrame(() => {
    if (!points.current) return
    const speed = Math.sqrt(
      carStore.velocity?.x ** 2 + carStore.velocity?.z ** 2 || 0
    )

    const posAttr = points.current.geometry.attributes.position as THREE.BufferAttribute
    const opAttr = points.current.geometry.attributes.opacity as THREE.BufferAttribute

    const i3 = head.current * 3
    const carPos = carStore.position

    posAttr.array[i3] = carPos.x + (Math.random() - 0.5) * 0.2
    posAttr.array[i3 + 1] = 0.03
    posAttr.array[i3 + 2] = carPos.z + (Math.random() - 0.5) * 0.2

    opAttr.array[head.current] = speed > 0.3 ? Math.min(speed / 12, 0.3) : 0

    head.current = (head.current + 1) % TRAIL_COUNT

    for (let i = 0; i < TRAIL_COUNT; i++) {
      if (opAttr.array[i] > 0) {
        opAttr.array[i] *= 0.96
        posAttr.array[i * 3 + 1] += 0.001
        if (opAttr.array[i] < 0.01) opAttr.array[i] = 0
      }
    }

    posAttr.needsUpdate = true
    opAttr.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={TRAIL_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={TRAIL_COUNT}
          array={opacities}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#c8b89c"
        transparent
        opacity={0.2}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}