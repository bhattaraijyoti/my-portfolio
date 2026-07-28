'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const COUNT = 120

export default function Particles() {
  const mesh = useRef<THREE.Points>(null!)
  const velocities = useRef<Float32Array>()
  const offsets = useRef<Float32Array>()

  const [positions, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const sz = new Float32Array(COUNT)
    const col = new Float32Array(COUNT * 3)
    const vel = new Float32Array(COUNT * 3)
    const off = new Float32Array(COUNT)

    const palette = [
      [0.85, 0.88, 0.95],
      [0.78, 0.82, 0.92],
      [0.90, 0.92, 0.98],
      [0.72, 0.76, 0.88],
      [0.88, 0.90, 0.96],
      [0.80, 0.84, 0.93],
      [0.92, 0.94, 1.0],
    ]

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 30 + 3
      pos[i3] = Math.cos(angle) * radius
      pos[i3 + 1] = Math.random() * 14 + 0.5
      pos[i3 + 2] = Math.sin(angle) * radius
      sz[i] = Math.random() * 0.08 + 0.015
      off[i] = Math.random() * Math.PI * 2

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i3] = c[0]
      col[i3 + 1] = c[1]
      col[i3 + 2] = c[2]

      vel[i3] = (Math.random() - 0.5) * 0.001
      vel[i3 + 1] = (Math.random() - 0.5) * 0.0005
      vel[i3 + 2] = (Math.random() - 0.5) * 0.001
    }

    velocities.current = vel
    offsets.current = off
    return [pos, sz, col]
  }, [])

  useFrame((state) => {
    if (!mesh.current || !velocities.current || !offsets.current) return
    const t = state.clock.elapsedTime
    const posAttr = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    const sizeAttr = mesh.current.geometry.attributes.size as THREE.BufferAttribute

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3
      const off = offsets.current[i]

      posAttr.array[i3] += velocities.current[i3] + Math.sin(t * 0.1 + off) * 0.0005
      posAttr.array[i3 + 1] += Math.sin(t * 0.3 + off) * 0.003 + velocities.current[i3 + 1]
      posAttr.array[i3 + 2] += velocities.current[i3 + 2] + Math.cos(t * 0.08 + off) * 0.0005

      sizeAttr.array[i] = (Math.sin(t * 0.5 + off) * 0.5 + 0.5) * 0.08 + 0.015

      const dist = Math.sqrt(posAttr.array[i3] ** 2 + posAttr.array[i3 + 2] ** 2)
      if (dist > 35) {
        velocities.current[i3] *= -1
        velocities.current[i3 + 2] *= -1
      }
      if (posAttr.array[i3 + 1] > 16 || posAttr.array[i3 + 1] < 0.3) {
        velocities.current[i3 + 1] *= -1
      }
    }

    posAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={COUNT}
          array={sizes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}