'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface ButterflyData {
  basePos: THREE.Vector3
  speed: number
  radius: number
  phaseX: number
  phaseZ: number
  phaseY: number
  flapSpeed: number
  color: THREE.Color
  scale: number
}

const BUTTERFLY_COLORS = [
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ef4444', // red
  '#10b981', // emerald
  '#f97316', // orange
  '#3b82f6', // blue
]

function Butterfly({ data }: { data: ButterflyData }) {
  const groupRef = useRef<THREE.Group>(null!)
  const leftWingRef = useRef<THREE.Mesh>(null!)
  const rightWingRef = useRef<THREE.Mesh>(null!)

  const wingMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      }),
    [data.color]
  )

  const bodyMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: '#1a1a1a' }),
    []
  )

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime * data.speed

    // Figure-8 / Lissajous flight path
    const x = data.basePos.x + Math.sin(t + data.phaseX) * data.radius
    const z = data.basePos.z + Math.cos(t * 0.7 + data.phaseZ) * data.radius * 0.8
    const y = data.basePos.y + Math.sin(t * 0.5 + data.phaseY) * 0.8

    groupRef.current.position.set(x, y, z)

    // Face direction of travel
    const dx = Math.cos(t + data.phaseX) * data.radius
    const dz = -Math.sin(t * 0.7 + data.phaseZ) * data.radius * 0.56
    groupRef.current.rotation.y = Math.atan2(dx, dz)

    // Wing flapping
    const flapAngle = Math.sin(state.clock.elapsedTime * data.flapSpeed) * 1.2
    if (leftWingRef.current) leftWingRef.current.rotation.y = flapAngle
    if (rightWingRef.current) rightWingRef.current.rotation.y = -flapAngle
  })

  return (
    <group ref={groupRef} scale={data.scale}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.008, 0.06, 4, 6]} />
        <primitive object={bodyMat} attach="material" />
      </mesh>

      {/* Left wing */}
      <mesh
        ref={leftWingRef}
        position={[0.02, 0.01, 0]}
      >
        <planeGeometry args={[0.06, 0.04]} />
        <primitive object={wingMat} attach="material" />
      </mesh>

      {/* Right wing */}
      <mesh
        ref={rightWingRef}
        position={[-0.02, 0.01, 0]}
      >
        <planeGeometry args={[0.06, 0.04]} />
        <primitive object={wingMat} attach="material" />
      </mesh>

      {/* Upper wings (larger) */}
      <mesh position={[0.025, 0.02, -0.01]}>
        <planeGeometry args={[0.05, 0.035]} />
        <primitive object={wingMat} attach="material" />
      </mesh>
      <mesh position={[-0.025, 0.02, -0.01]}>
        <planeGeometry args={[0.05, 0.035]} />
        <primitive object={wingMat} attach="material" />
      </mesh>
    </group>
  )
}

export default function Butterflies() {
  const butterflies = useMemo<ButterflyData[]>(() => {
    const count = 14
    const result: ButterflyData[] = []

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const dist = 5 + Math.random() * 20

      result.push({
        basePos: new THREE.Vector3(
          Math.cos(angle) * dist,
          1.5 + Math.random() * 3,
          Math.sin(angle) * dist
        ),
        speed: 0.3 + Math.random() * 0.4,
        radius: 1.5 + Math.random() * 3,
        phaseX: Math.random() * Math.PI * 2,
        phaseZ: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        flapSpeed: 12 + Math.random() * 8,
        color: new THREE.Color(
          BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]
        ),
        scale: 0.8 + Math.random() * 0.6,
      })
    }
    return result
  }, [])

  return (
    <group>
      {butterflies.map((data, i) => (
        <Butterfly key={i} data={data} />
      ))}
    </group>
  )
}
