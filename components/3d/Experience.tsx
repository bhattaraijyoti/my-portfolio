'use client'

import { useCallback, useRef, useEffect } from 'react'
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
import GardenDecor from './GardenDecor'
import { carStore } from './store'
import { useAdaptiveDPR } from '../../hooks/useAdaptiveDPR'
import { PhysicsWorld } from './Physics'
import { WeatherProvider, useWeather, Rain, Snow, WindSystem } from './Weather'
import RaceTrack from './RaceTrack'
import { startAmbient, stopAmbient, updateAmbientWind, updateAmbientRain } from '../../lib/sound'
import { trackAchievements } from '../../lib/achievements'

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

function WeatherEffects() {
  const weather = useWeather()

  useFrame(() => {
    updateAmbientWind(weather.windStrength)
    updateAmbientRain(weather.isRaining, weather.windStrength)
  })

  return (
    <>
      <Rain />
      <Snow />
      <WindSystem />
    </>
  )
}

function AchievementTracker() {
  useFrame(() => {
    const speed = carStore.velocity.length()
    trackAchievements(speed, false)
  })
  return null
}

export default function Experience({ onProjectProximity, onTeleportReady }: ExperienceProps) {
  useAdaptiveDPR()

  useEffect(() => {
    startAmbient()
    return () => stopAmbient()
  }, [])

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
    <PhysicsWorld>
      <WeatherProvider>
        <Sky />
        <ChaseCamera />

        <fog attach="fog" args={['#b0c4d8', 40, 100]} />

        {/* Main light — cool winter sun */}
        <directionalLight
          position={[15, 20, 10]}
          intensity={2.5}
          color="#d0d8e8"
          castShadow
          shadow-mapSize-width={256}
          shadow-mapSize-height={256}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
          shadow-bias={-0.0003}
          shadow-normalBias={0.015}
          shadow-radius={3}
        />

        {/* Cool fill */}
        <directionalLight
          position={[-10, 18, -8]}
          intensity={0.6}
          color="#a0b0d0"
        />

        {/* Subtle warm bounce */}
        <directionalLight
          position={[0, 5, -15]}
          intensity={0.15}
          color="#c8c0d0"
        />

        <ambientLight intensity={0.55} color="#b8c8d8" />

        <hemisphereLight args={['#c8d0e0', '#8090a0', 0.6]} />

        <pointLight position={[0, 25, 0]} intensity={0.05} distance={80} color="#c0c8e0" />

        <World />

        <GardenDecor />

        <group userData={{ isCar: true }}>
          <Car />
        </group>

        <ContactShadows
          position={[0, -0.02, 0]}
          opacity={0.3}
          scale={40}
          blur={1.5}
          far={10}
          color="#3a4050"
        />

        <DustTrail />

        <RaceTrack />

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

        {/* Weather systems */}
        <WeatherEffects />

        {/* Achievement tracker */}
        <AchievementTracker />
      </WeatherProvider>
    </PhysicsWorld>
  )
}
