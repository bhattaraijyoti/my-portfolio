'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SakuraData {
  x: number
  z: number
  scale: number
  phase: number
  foliageSeed: number
}

// Falling petal particle
function FallingPetals({ trees }: { trees: SakuraData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const PETAL_COUNT = 80
  const petals = useMemo(() => {
    return Array.from({ length: PETAL_COUNT }, () => {
      const tree = trees[Math.floor(Math.random() * trees.length)]
      return {
        x: tree.x + (Math.random() - 0.5) * 3,
        y: 1.5 + Math.random() * 2.5,
        z: tree.z + (Math.random() - 0.5) * 3,
        speed: 0.15 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 0.5,
        phase: Math.random() * Math.PI * 2,
        rotSpeed: 1 + Math.random() * 2,
      }
    })
  }, [trees])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    petals.forEach((p, i) => {
      const cycle = (t * p.speed + p.phase) % 6
      const progress = cycle / 6

      const x = p.x + Math.sin(t * 0.5 + p.phase) * 0.8 + p.drift * progress
      const y = p.y - progress * 3.5
      const z = p.z + Math.cos(t * 0.4 + p.phase) * 0.6

      dummy.position.set(x, Math.max(y, 0.05), z)
      dummy.rotation.set(
        t * p.rotSpeed,
        t * p.rotSpeed * 0.7,
        Math.sin(t + p.phase) * 0.5
      )
      dummy.scale.setScalar(0.02 + Math.sin(progress * Math.PI) * 0.015)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PETAL_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 0.7]} />
      <meshStandardMaterial
        color="#ffb0c8"
        roughness={0.6}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  )
}

// Single sakura tree
function SakuraTree({ data }: { data: SakuraData }) {
  const foliageRef = useRef<THREE.Group>(null!)

  const trunkColor = useMemo(() => {
    const r = 0.25 + Math.random() * 0.1
    const g = 0.12 + Math.random() * 0.05
    const b = 0.08
    return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
  }, [])

  // Generate foliage clusters
  const clusters = useMemo(() => {
    const rng = (s: number) => {
      let x = Math.sin(s * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    const result: { pos: [number, number, number]; scale: number; color: string }[] = []
    const count = 5 + Math.floor(rng(data.foliageSeed) * 4)
    const baseHue = 330 + rng(data.foliageSeed + 1) * 30 // pink range

    for (let i = 0; i < count; i++) {
      const angle = rng(data.foliageSeed + i * 3.7) * Math.PI * 2
      const dist = rng(data.foliageSeed + i * 7.3) * 0.5
      const height = 1.4 + rng(data.foliageSeed + i * 2.1) * 0.8
      const s = 0.5 + rng(data.foliageSeed + i * 5.9) * 0.6

      // Vary the pink: lighter, darker, more saturated
      const lightness = 55 + rng(data.foliageSeed + i * 11.3) * 25
      const saturation = 60 + rng(data.foliageSeed + i * 13.7) * 30
      result.push({
        pos: [Math.cos(angle) * dist, height, Math.sin(angle) * dist],
        scale: s,
        color: `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
      })
    }
    return result
  }, [data.foliageSeed])

  useFrame((state) => {
    if (!foliageRef.current) return
    const t = state.clock.elapsedTime
    foliageRef.current.rotation.z = Math.sin(t * 0.3 + data.phase) * 0.02
    foliageRef.current.rotation.x = Math.cos(t * 0.25 + data.phase) * 0.015
  })

  return (
    <group position={[data.x, 0, data.z]} scale={data.scale}>
      {/* Trunk */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.07, 1.1, 6]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>

      {/* Main branch */}
      <mesh position={[0.15, 1.0, 0]} rotation={[0, 0, -0.5]} castShadow>
        <cylinderGeometry args={[0.02, 0.035, 0.5, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[-0.12, 0.95, 0.1]} rotation={[0.3, 0, 0.6]} castShadow>
        <cylinderGeometry args={[0.015, 0.03, 0.45, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>

      {/* Foliage clusters */}
      <group ref={foliageRef}>
        {clusters.map((c, i) => (
          <mesh key={i} position={c.pos} scale={c.scale}>
            <icosahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial
              color={c.color}
              roughness={0.7}
              metalness={0.0}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// Main export
export default function SakuraTrees() {
  const trees = useMemo<SakuraData[]>(() => {
    const result: SakuraData[] = []
    const positions: [number, number][] = [
      [10, -2],
      [-9, 1],
      [7, 6],
      [-11, -8],
      [3, 9],
      [-7, -14],
      [14, -10],
      [-13, 5],
    ]

    positions.forEach(([x, z], i) => {
      result.push({
        x,
        z,
        scale: 0.9 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        foliageSeed: i * 13.7 + 42,
      })
    })
    return result
  }, [])

  return (
    <group>
      {trees.map((data, i) => (
        <SakuraTree key={i} data={data} />
      ))}
      <FallingPetals trees={trees} />
    </group>
  )
}
