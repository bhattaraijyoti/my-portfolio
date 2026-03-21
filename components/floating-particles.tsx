'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTheme } from 'next-themes'
import * as THREE from 'three'

function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const { theme } = useTheme()

  useEffect(() => {
    if (!pointsRef.current) return

    const particleCount = 150
    const geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20
      positions[i + 1] = (Math.random() - 0.5) * 20
      positions[i + 2] = (Math.random() - 0.5) * 20
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return () => geometry.dispose()
  }, [])

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.x += 0.001
      pointsRef.current.rotation.y += 0.002
    }
  })

  const particleColor = theme === 'dark' ? '#64b5f6' : '#1e40af'

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry />
        <pointsMaterial size={0.15} sizeAttenuation={true} color={particleColor} />
      </points>
      <ambientLight intensity={0.6} />
    </>
  )
}

export function FloatingParticles() {
  return (
    <div className="w-full h-screen fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 15] }}
        style={{ background: 'transparent' }}
      >
        <Particles />
      </Canvas>
    </div>
  )
}
