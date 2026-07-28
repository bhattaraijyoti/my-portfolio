'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Brick pattern on the ground near the roads — like a small plaza/patio
export default function Bricks() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)

  const { count, matrices, colors } = useMemo(() => {
    const brickW = 0.22
    const brickH = 0.11
    const brickD = 0.03
    const gap = 0.015
    const rowH = brickH + gap
    const cols = 20
    const rows = 12
    const total = cols * rows

    // Place bricks in a rectangular plaza near the intersection
    const offsetX = 5.5 // offset from road center
    const offsetZ = -1.5
    const plazaW = cols * (brickW + gap)
    const plazaH = rows * rowH

    const matrices: THREE.Matrix4[] = []
    const colors: THREE.Color[] = []

    const brickColors = [
      new THREE.Color('#8b5e3c'),
      new THREE.Color('#7a5233'),
      new THREE.Color('#9c6b44'),
      new THREE.Color('#6d4828'),
      new THREE.Color('#a07050'),
    ]

    const dummy = new THREE.Object3D()

    for (let row = 0; row < rows; row++) {
      // Offset every other row by half a brick
      const rowOffset = row % 2 === 1 ? (brickW + gap) / 2 : 0
      for (let col = 0; col < cols; col++) {
        const x = offsetX - plazaW / 2 + col * (brickW + gap) + rowOffset
        const z = offsetZ - plazaH / 2 + row * rowH

        // Skip bricks that would overlap the road (half-width 2.5 at x=0)
        if (Math.abs(x) < 2.6) continue

        // Slight random y variation for natural look
        const y = 0.005 + Math.random() * 0.003
        const rotY = (Math.random() - 0.5) * 0.02

        dummy.position.set(x, y, z)
        dummy.rotation.set(0, rotY, 0)
        dummy.scale.set(
          brickW + (Math.random() - 0.5) * 0.01,
          1,
          brickH + (Math.random() - 0.5) * 0.005
        )
        dummy.updateMatrix()
        matrices.push(dummy.matrix.clone())
        colors.push(brickColors[Math.floor(Math.random() * brickColors.length)])
      }
    }

    return { count: matrices.length, matrices, colors }
  }, [])

  useMemo(() => {
    if (!meshRef.current) return
    const colorAttr = meshRef.current.geometry.getAttribute('color') as THREE.InstancedBufferAttribute
    const tempColor = new THREE.Color()
    for (let i = 0; i < count; i++) {
      meshRef.current.setMatrixAt(i, matrices[i])
      tempColor.copy(colors[i])
      meshRef.current.setColorAt(i, tempColor)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [count, matrices, colors])

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        vertexColors
        roughness={0.85}
        metalness={0.05}
      />
    </instancedMesh>
  )
}
