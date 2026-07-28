'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── GARDEN BENCH ───────────────────────────────────────────────
function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8B6914', roughness: 0.8, metalness: 0.05 }), [])
  const metalMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.3, metalness: 0.7 }), [])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat planks */}
      {[-0.06, 0, 0.06].map((z, i) => (
        <mesh key={`seat-${i}`} position={[0, 0.32, z]} castShadow>
          <boxGeometry args={[0.8, 0.03, 0.14]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
      ))}
      {/* Backrest planks */}
      {[-0.04, 0.04].map((y, i) => (
        <mesh key={`back-${i}`} position={[0, 0.48 + y, -0.2]} castShadow>
          <boxGeometry args={[0.8, 0.06, 0.02]} />
          <primitive object={woodMat} attach="material" />
        </mesh>
      ))}
      {/* Backrest frame */}
      <mesh position={[0, 0.48, -0.2]}>
        <boxGeometry args={[0.82, 0.02, 0.03]} />
        <primitive object={metalMat} attach="material" />
      </mesh>
      {/* Legs */}
      {[-0.32, 0.32].map((x, i) => (
        <group key={`leg-${i}`}>
          <mesh position={[x, 0.16, -0.18]}>
            <boxGeometry args={[0.03, 0.32, 0.03]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
          <mesh position={[x, 0.16, 0.18]}>
            <boxGeometry args={[0.03, 0.32, 0.03]} />
            <primitive object={metalMat} attach="material" />
          </mesh>
        </group>
      ))}
      {/* Arm rests */}
      {[-0.4, 0.4].map((x, i) => (
        <mesh key={`arm-${i}`} position={[x, 0.38, -0.1]} castShadow>
          <boxGeometry args={[0.03, 0.03, 0.28]} />
          <primitive object={metalMat} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

// ─── LAMP POST ──────────────────────────────────────────────────
function LampPost({ position, lightRef }: { position: [number, number, number]; lightRef: React.RefObject<THREE.PointLight> }) {
  const poleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.25, metalness: 0.8 }), [])

  return (
    <group position={position}>
      {/* Base */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.08, 8]} />
        <primitive object={poleMat} attach="material" />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 1.7, 8]} />
        <primitive object={poleMat} attach="material" />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.06, 0.1, 0.12, 8]} />
        <primitive object={poleMat} attach="material" />
      </mesh>
      {/* Lamp glass */}
      <mesh position={[0, 1.72, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshBasicMaterial color="#e0e8ff" transparent opacity={0.9} />
      </mesh>
      {/* Light */}
      <pointLight
        ref={lightRef}
        position={[0, 1.7, 0]}
        intensity={1.5}
        distance={8}
        color="#d8e0ff"
      />
    </group>
  )
}

// ─── ROCK ───────────────────────────────────────────────────────
function Rock({ position, scale, color }: { position: [number, number, number]; scale: number; color: string }) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} flatShading />
    </mesh>
  )
}

// ─── MUSHROOM ───────────────────────────────────────────────────
function Mushroom({ position, scale }: { position: [number, number, number]; scale: number }) {
  const stemMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5f0e0', roughness: 0.7 }), [])
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#cc3333', roughness: 0.5 }), [])

  return (
    <group position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.12, 6]} />
        <primitive object={stemMat} attach="material" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.13, 0]}>
        <sphereGeometry args={[0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={capMat} attach="material" />
      </mesh>
      {/* Spots on cap */}
      <mesh position={[0.02, 0.14, 0.02]}>
        <sphereGeometry args={[0.012, 4, 4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.03, 0.14, 0.01]}>
        <sphereGeometry args={[0.01, 4, 4]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

// ─── GARDEN FENCE POST ──────────────────────────────────────────
function FenceSegment({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f5f0dc', roughness: 0.85, metalness: 0 }), [])

  const midX = (start[0] + end[0]) / 2
  const midZ = (start[2] + end[2]) / 2
  const dx = end[0] - start[0]
  const dz = end[2] - start[2]
  const length = Math.sqrt(dx * dx + dz * dz)
  const angle = Math.atan2(dx, dz)

  return (
    <group position={[midX, 0.15, midZ]} rotation={[0, angle, 0]}>
      {/* Top rail */}
      <mesh>
        <boxGeometry args={[0.03, 0.03, length]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Bottom rail */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[0.03, 0.03, length]} />
        <primitive object={woodMat} attach="material" />
      </mesh>
      {/* Pickets */}
      {Array.from({ length: Math.ceil(length / 0.2) + 1 }, (_, i) => {
        const t = i / Math.ceil(length / 0.2)
        const px = -length / 2 + t * length
        return (
          <mesh key={i} position={[0, -0.04, px]}>
            <boxGeometry args={[0.04, 0.32, 0.02]} />
            <primitive object={woodMat} attach="material" />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── MAIN GARDEN DECORATIONS ────────────────────────────────────
export default function GardenDecor() {
  const lampLightRefs = useRef<(THREE.PointLight | null)[]>([])

  // Single consolidated useFrame for all lamp lights — was 5 separate callbacks
  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < lampLightRefs.current.length; i++) {
      const light = lampLightRefs.current[i]
      if (!light) continue
      light.intensity = 1.5 + Math.sin(t * 0.5 + i * 2) * 0.2
    }
  })
  // Predefined placements
  const benches: { pos: [number, number, number]; rot: number }[] = [
    { pos: [5, 0, 2], rot: -Math.PI / 6 },
    { pos: [-6, 0, 3], rot: Math.PI / 4 },
    { pos: [3, 0, -15], rot: -Math.PI / 3 },
  ]

  const lampPosts: [number, number, number][] = [
    [3, 0, -3],
    [-3, 0, -7],
    [4, 0, -12],
    [-5, 0, -4],
    [2, 0, 5],
  ]

  const rocks = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number; color: string }[] = []
    const rockColors = ['#7a7a72', '#8a8a7e', '#6a6a60', '#9a9a8e']
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 4 + Math.random() * 25
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      if (Math.abs(x) < 3 || Math.abs(z) < 3) continue
      result.push({
        pos: [x, 0.05, z],
        scale: 0.5 + Math.random() * 1.5,
        color: rockColors[Math.floor(Math.random() * rockColors.length)],
      })
    }
    return result
  }, [])

  const mushrooms = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number }[] = []
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 5 + Math.random() * 18
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      if (Math.abs(x) < 3 || Math.abs(z) < 3) continue
      result.push({
        pos: [x, 0.005, z],
        scale: 0.6 + Math.random() * 1.0,
      })
    }
    return result
  }, [])

  const fences = useMemo(() => {
    // Small garden fence sections near the benches
    return [
      { start: [4.2, 0, 1.0] as [number, number, number], end: [6.0, 0, 0.5] as [number, number, number] },
      { start: [-5.2, 0, 2.2] as [number, number, number], end: [-6.8, 0, 3.5] as [number, number, number] },
    ]
  }, [])

  return (
    <group>
      {benches.map((b, i) => (
        <Bench key={`bench-${i}`} position={b.pos} rotation={b.rot} />
      ))}
      {lampPosts.map((pos, i) => (
        <LampPost
          key={`lamp-${i}`}
          position={pos}
          lightRef={{ get current() { return lampLightRefs.current[i] }, set current(v) { lampLightRefs.current[i] = v } } as React.RefObject<THREE.PointLight>}
        />
      ))}
      {rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.pos} scale={r.scale} color={r.color} />
      ))}
      {mushrooms.map((m, i) => (
        <Mushroom key={`mush-${i}`} position={m.pos} scale={m.scale} />
      ))}
      {fences.map((f, i) => (
        <FenceSegment key={`fence-${i}`} start={f.start} end={f.end} />
      ))}
    </group>
  )
}
