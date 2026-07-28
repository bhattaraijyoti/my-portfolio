'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const FIREFLY_COUNT = 30

export default function Fireflies() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const particles = useMemo(() => {
    return Array.from({ length: FIREFLY_COUNT }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        0.5 + Math.random() * 3,
        (Math.random() - 0.5) * 30,
      ),
      speed: 0.3 + Math.random() * 0.5,
      offset: Math.random() * Math.PI * 2,
      radius: 0.5 + Math.random() * 1.5,
      phaseY: Math.random() * Math.PI * 2,
    }))
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime

    particles.forEach((p, i) => {
      const x = p.pos.x + Math.sin(t * p.speed + p.offset) * p.radius
      const y = p.pos.y + Math.sin(t * p.speed * 0.7 + p.phaseY) * 0.4
      const z = p.pos.z + Math.cos(t * p.speed + p.offset) * p.radius

      dummy.position.set(x, y, z)
      dummy.scale.setScalar(0.03 + Math.sin(t * 2 + p.offset) * 0.015)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, FIREFLY_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#ffe97f" transparent opacity={0.9} />
    </instancedMesh>
  )
}
