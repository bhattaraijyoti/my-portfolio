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
import Bricks from './Bricks'
import Butterflies from './Butterflies'
import Flowers from './Flowers'
import GardenDecor from './GardenDecor'
import Fireflies from './Fireflies'
import SakuraTrees from './SakuraTrees'
import { carStore } from './store'

const PROJECTS = [
  {
    title: 'Treatss',
    position: [-14, 0, -4] as [number, number, number],
    tags: 'Product Design / Frontend / Local Commerce',
    image: '/treatss.png',
  },
  {
    title: 'Tech Club',
    position: [12, 0, -18] as [number, number, number],
    tags: 'Community Platform / Interface Design',
    image: '/tech.png',
  },
  {
    title: 'Tulsipur Dang',
    position: [-5, 0, -26] as [number, number, number],
    tags: 'Civic Tech / Content System',
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

      <fog attach="fog" args={['#c47840', 45, 110]} />

      {/* Main sun — low and warm */}
      <directionalLight
        position={[20, 8, 14]}
        intensity={4.0}
        color="#ff9040"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={60}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-bias={-0.0003}
        shadow-normalBias={0.015}
        shadow-radius={4}
      />

      {/* Cool fill from opposite side */}
      <directionalLight
        position={[-15, 15, -12]}
        intensity={0.4}
        color="#8090c0"
      />

      {/* Warm bounce from ground */}
      <directionalLight
        position={[0, 3, -20]}
        intensity={0.3}
        color="#ff8860"
      />

      <ambientLight intensity={0.35} color="#d09060" />

      <hemisphereLight args={['#c07040', '#2a3a1a', 0.8]} />

      <pointLight position={[0, 25, 0]} intensity={0.1} distance={80} color="#ffcc88" />

      <World />

      <Bricks />
      <Flowers />
      <Butterflies />
      <GardenDecor />
      <Fireflies />
      <SakuraTrees />

      <group userData={{ isCar: true }}>
        <Car />
      </group>

      <ContactShadows
        position={[0, -0.02, 0]}
        opacity={0.3}
        scale={100}
        blur={2}
        far={20}
        color="#2a1a10"
      />

      <DustTrail />

      {PROJECTS.map((project) => (
        <ProjectHotspot
          key={project.title}
          position={project.position}
          label={project.title}
          tags={project.tags}
          image={project.image}
          onProximityChange={handleProximity}
        />
      ))}

      <Particles />
    </>
  )
}