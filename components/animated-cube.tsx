'use client'

import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTheme } from 'next-themes'
import * as THREE from 'three'

function CubeContent() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { theme } = useTheme()

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005
      meshRef.current.rotation.y += 0.01
    }
  })

  const boxColor = theme === 'dark' ? '#ffffff' : '#000000'
  const edgeColor = theme === 'dark' ? '#64748b' : '#e2e8f0'

  return (
    <>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial
          color={boxColor}
          wireframe={false}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(2, 2, 2)]} />
        <lineBasicMaterial attach="material" color={edgeColor} linewidth={2} />
      </lineSegments>
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#64b5f6" />
    </>
  )
}

export function AnimatedCube() {
  return (
    <div className="w-full h-64 md:h-80">
      <Canvas
        camera={{ position: [0, 0, 4.5] }}
        style={{ background: 'transparent' }}
      >
        <CubeContent />
      </Canvas>
    </div>
  )
}
