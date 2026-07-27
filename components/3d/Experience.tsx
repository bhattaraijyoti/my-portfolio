'use client'

import { useCallback, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import Car from './Car'
import ChaseCamera from './Camera'
import World from './World'
import Sky from './Sky'
import ProjectHotspot from './ProjectHotspot'
import Particles from './Particles'
import DustTrail from './DustTrail'
import { carStore } from './store'

function FloatingIsland({ position, size = [2, 0.3, 2], color = '#2a4a2a' }: {
  position: [number, number, number]
  size?: [number, number, number]
  color?: string
}) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.9} metalness={0.05} />
      </mesh>
    </group>
  )
}

const PROJECTS = [
  {
    title: 'Treatss',
    position: [-8, 0, -5] as [number, number, number],
    image: '/treatss.png',
  },
  {
    title: 'Tech Club',
    position: [6, 0, -10] as [number, number, number],
    image: '/tech.png',
  },
  {
    title: 'Tulsipur Dang',
    position: [-3, 0, -12] as [number, number, number],
    image: '/tulsipurdang.png',
  },
]

interface ExperienceProps {
  onProjectProximity?: (title: string | null, isNear: boolean) => void
  onTeleportReady?: (fn: (pos: [number, number, number]) => void) => void
}

export default function Experience({ onProjectProximity, onTeleportReady }: ExperienceProps) {
  const handleProximity = useCallback((label: string, isNear: boolean) => {
    onProjectProximity?.(label, isNear)
  }, [onProjectProximity])

  const handleTeleport = useCallback((pos: [number, number, number]) => {
    carStore.teleportTo = new THREE.Vector3(pos[0], pos[1], pos[2])
    carStore.rotation = 0
    carStore.velocity.set(0, 0, 0)
  }, [])

  const registered = useRef(false)
  useFrame(() => {
    if (!registered.current && onTeleportReady) {
      onTeleportReady(handleTeleport)
      registered.current = true
    }
  })

  return (
    <>
      <Sky />
      <ChaseCamera />

      <fog attach="fog" args={['#b8cfe0', 40, 120]} />

      <directionalLight
        position={[15, 30, 12]}
        intensity={3.2}
        color="#fff0d0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={70}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
        shadow-radius={4}
      />

      <directionalLight
        position={[-20, 12, -10]}
        intensity={0.5}
        color="#a0b8d8"
      />

      <directionalLight
        position={[0, 8, -30]}
        intensity={0.25}
        color="#ffd8a0"
      />

      <ambientLight intensity={0.45} color="#c0d0e8" />

      <hemisphereLight args={['#90b8e0', '#3a5a2a', 0.7]} />

      <pointLight position={[0, 25, 0]} intensity={0.15} distance={80} color="#ffffff" />

      <FloatingIsland position={[15, 3, -8]} size={[3, 0.3, 2.5]} color="#2a4a2a" />
      <FloatingIsland position={[-10, 4, -15]} size={[2.5, 0.35, 2]} color="#2a3a2a" />
      <FloatingIsland position={[8, 2.5, 12]} size={[2, 0.25, 3]} color="#2a4a2a" />

      <World />

      <group userData={{ isCar: true }}>
        <Car />
      </group>

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.3}
        scale={100}
        blur={2}
        far={20}
        color="#1a3a1a"
      />

      <DustTrail />

      {PROJECTS.map((project) => (
        <ProjectHotspot
          key={project.title}
          position={project.position}
          label={project.title}
          image={project.image}
          onProximityChange={handleProximity}
        />
      ))}

      <Particles />
    </>
  )
}