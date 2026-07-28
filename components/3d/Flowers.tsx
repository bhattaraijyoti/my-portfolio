'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

const FLOWER_COLORS = [
  // Reds
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#e11d48',
  // Pinks
  '#ec4899',
  '#f472b6',
  '#fb7185',
  '#f43f5e',
  '#e879a8',
  '#f9a8d4',
  '#fbcfe8',
  // Purples
  '#d946ef',
  '#c084fc',
  '#a855f7',
  '#8b5cf6',
  '#7c3aed',
  '#6d28d9',
  '#a78bfa',
  '#c4b5fd',
  // Oranges
  '#f97316',
  '#fb923c',
  '#fdba74',
  '#ea580c',
  // Yellows
  '#eab308',
  '#facc15',
  '#fbbf24',
  '#fde047',
  '#fef08a',
  // Whites
  '#ffffff',
  '#fef3c7',
  '#fdf2f8',
  '#f5f5f4',
  // Blues
  '#60a5fa',
  '#818cf8',
  '#93c5fd',
  '#7dd3fc',
  // Greens
  '#34d399',
  '#4ade80',
  '#86efac',
  // Peach / Coral
  '#fda4af',
  '#fca5a5',
  '#fdba74',
]

const COUNT = 800
const PETALS_PER = 5

interface FlowerData {
  x: number
  y: number
  z: number
  scale: number
  phase: number
  colorIndex: number
}

export default function Flowers() {
  const stemRef = useRef<THREE.InstancedMesh>(null!)
  const centerRef = useRef<THREE.InstancedMesh>(null!)
  const petalRef = useRef<THREE.InstancedMesh>(null!)

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const stemColor = useMemo(() => new THREE.Color('#2d8a4e'), [])
  const centerColor = useMemo(() => new THREE.Color('#fbbf24'), [])
  const petalColors = useMemo(
    () => FLOWER_COLORS.map((c) => new THREE.Color(c)),
    []
  )

  const flowers = useMemo<FlowerData[]>(() => {
    const result: FlowerData[] = []
    let attempts = 0
    while (result.length < COUNT && attempts < COUNT * 8) {
      attempts++
      const angle = Math.random() * Math.PI * 2
      const dist = 2.5 + Math.random() * 32
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      if (Math.abs(x) < 2.5 || Math.abs(z) < 2.5) continue
      result.push({
        x,
        y: 0,
        z,
        scale: 0.2 + Math.random() * 3.0,
        phase: Math.random() * Math.PI * 2,
        colorIndex: Math.floor(Math.random() * FLOWER_COLORS.length),
      })
    }
    return result
  }, [])

  // Set initial transforms
  useMemo(() => {
    if (!stemRef.current || !centerRef.current || !petalRef.current) return

    flowers.forEach((f, i) => {
      // Stem
      dummy.position.set(f.x, f.y + 0.12 * f.scale, f.z)
      dummy.scale.set(f.scale, f.scale, f.scale)
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(i, dummy.matrix)

      // Center
      dummy.position.set(f.x, f.y + 0.25 * f.scale, f.z)
      dummy.scale.set(f.scale, f.scale, f.scale)
      dummy.updateMatrix()
      centerRef.current.setMatrixAt(i, dummy.matrix)

      // Petals (5 per flower)
      const baseAngle = (f.colorIndex * 137.508) % (Math.PI * 2)
      for (let p = 0; p < PETALS_PER; p++) {
        const angle = baseAngle + (p / PETALS_PER) * Math.PI * 2
        const px = f.x + Math.cos(angle) * 0.04 * f.scale
        const py = f.y + 0.25 * f.scale
        const pz = f.z + Math.sin(angle) * 0.04 * f.scale
        dummy.position.set(px, py, pz)
        dummy.scale.set(f.scale, f.scale, f.scale)
        dummy.rotation.set(0, -angle, 0.3)
        dummy.updateMatrix()
        petalRef.current.setMatrixAt(i * PETALS_PER + p, dummy.matrix)
      }
    })

    stemRef.current.instanceMatrix.needsUpdate = true
    centerRef.current.instanceMatrix.needsUpdate = true
    petalRef.current.instanceMatrix.needsUpdate = true
  }, [flowers, dummy])

  // Animation — only animate flowers within 15 units of the car
  const ANIM_RADIUS_SQ = 15 * 15
  useFrame((state) => {
    if (!stemRef.current || !centerRef.current || !petalRef.current) return
    const t = state.clock.elapsedTime
    const cx = carStore.position.x
    const cz = carStore.position.z

    let anyUpdated = false

    for (let i = 0; i < flowers.length; i++) {
      const f = flowers[i]
      const dx = f.x - cx
      const dz = f.z - cz
      if (dx * dx + dz * dz > ANIM_RADIUS_SQ) continue

      anyUpdated = true
      const swayZ = Math.sin(t * 0.8 + f.phase) * 0.08
      const swayX = Math.cos(t * 0.6 + f.phase) * 0.04

      dummy.position.set(f.x, f.y + 0.12 * f.scale, f.z)
      dummy.scale.set(f.scale, f.scale, f.scale)
      dummy.rotation.set(swayX, 0, swayZ)
      dummy.updateMatrix()
      stemRef.current.setMatrixAt(i, dummy.matrix)

      dummy.position.set(f.x, f.y + 0.25 * f.scale, f.z)
      dummy.scale.set(f.scale, f.scale, f.scale)
      dummy.rotation.set(swayX, 0, swayZ)
      dummy.updateMatrix()
      centerRef.current.setMatrixAt(i, dummy.matrix)

      const baseAngle = (f.colorIndex * 137.508) % (Math.PI * 2)
      for (let p = 0; p < PETALS_PER; p++) {
        const angle = baseAngle + (p / PETALS_PER) * Math.PI * 2
        const openAmount = Math.sin(t * 0.3 + f.phase + p * 0.5) * 0.15 + 0.35
        const px = f.x + Math.cos(angle) * 0.04 * f.scale
        const py = f.y + 0.25 * f.scale
        const pz = f.z + Math.sin(angle) * 0.04 * f.scale
        dummy.position.set(px, py, pz)
        dummy.scale.set(f.scale, f.scale, f.scale)
        dummy.rotation.set(swayX, -angle, openAmount * (p % 2 === 0 ? 1 : -1) + swayZ)
        dummy.updateMatrix()
        petalRef.current.setMatrixAt(i * PETALS_PER + p, dummy.matrix)
      }
    }

    if (anyUpdated) {
      stemRef.current.instanceMatrix.needsUpdate = true
      centerRef.current.instanceMatrix.needsUpdate = true
      petalRef.current.instanceMatrix.needsUpdate = true
    }
  })

  // Color per instance for petals
  const petalColorArray = useMemo(() => {
    const arr = new Float32Array(COUNT * PETALS_PER * 3)
    flowers.forEach((f, i) => {
      const c = petalColors[f.colorIndex]
      for (let p = 0; p < PETALS_PER; p++) {
        const idx = (i * PETALS_PER + p) * 3
        arr[idx] = c.r
        arr[idx + 1] = c.g
        arr[idx + 2] = c.b
      }
    })
    return arr
  }, [flowers, petalColors])

  // Apply per-instance color to petals
  useMemo(() => {
    if (!petalRef.current) return
    const colorAttr = new THREE.InstancedBufferAttribute(petalColorArray, 3)
    petalRef.current.geometry.setAttribute('color', colorAttr)
  }, [petalColorArray])

  return (
    <group>
      <instancedMesh ref={stemRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[0.008, 0.012, 0.24, 4]} />
        <meshStandardMaterial color="#2d8a4e" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={centerRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.03, 5, 4]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.5} />
      </instancedMesh>

      <instancedMesh ref={petalRef} args={[undefined, undefined, COUNT * PETALS_PER]} frustumCulled={false}>
        <planeGeometry args={[0.05, 0.03]} />
        <meshStandardMaterial roughness={0.4} side={THREE.DoubleSide} vertexColors />
      </instancedMesh>
    </group>
  )
}
