'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

// ═══════════════════════════════════════════════════════════════
// SHARED GLOBAL CLOCK — synced for all visitors
// One full day = 5 minutes real time
// ═══════════════════════════════════════════════════════════════
const DAY_DURATION = 300 // seconds for one full day cycle
const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const
const SEASON_DURATION = DAY_DURATION * 4 // each season lasts 4 days

export interface WeatherState {
  timeOfDay: number       // 0-1 (0=midnight, 0.5=noon)
  season: typeof SEASONS[number]
  seasonProgress: number  // 0-1 within season
  temperature: number     // -10 to 35 celsius
  windStrength: number    // 0-1
  windDirection: number   // radians
  isRaining: boolean
  isSnowing: boolean
  fogDensity: number
  ambientColor: THREE.Color
  sunColor: THREE.Color
  sunIntensity: number
}

// ═══════════════════════════════════════════════════════════════
// WEATHER CONTEXT
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState } from 'react'

const WeatherContext = createContext<WeatherState>({
  timeOfDay: 0.35,
  season: 'summer',
  seasonProgress: 0,
  temperature: 22,
  windStrength: 0.3,
  windDirection: 0,
  isRaining: false,
  isSnowing: false,
  fogDensity: 0.5,
  ambientColor: new THREE.Color('#d09060'),
  sunColor: new THREE.Color('#ff9040'),
  sunIntensity: 4,
})

export const useWeather = () => useContext(WeatherContext)

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const stateRef = useRef<WeatherState>({
    timeOfDay: 0.35,
    season: 'summer',
    seasonProgress: 0,
    temperature: 22,
    windStrength: 0.3,
    windDirection: 0,
    isRaining: false,
    isSnowing: false,
    fogDensity: 0.5,
    ambientColor: new THREE.Color('#d09060'),
    sunColor: new THREE.Color('#ff9040'),
    sunIntensity: 4,
  })

  const [tick, setTick] = useState(0)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const s = stateRef.current

    // Global time (synced across visitors via shared epoch)
    const globalTime = (Date.now() / 1000) % DAY_DURATION
    s.timeOfDay = globalTime / DAY_DURATION

    // Season
    const totalElapsed = (Date.now() / 1000) % (SEASON_DURATION * 4)
    const seasonIdx = Math.floor(totalElapsed / SEASON_DURATION) % 4
    s.season = SEASONS[seasonIdx]
    s.seasonProgress = (totalElapsed % SEASON_DURATION) / SEASON_DURATION

    // Temperature based on time + season
    const seasonBaseTemp = [15, 28, 12, -2][seasonIdx]
    const dayVariation = Math.sin(s.timeOfDay * Math.PI * 2 - Math.PI / 2) * 8
    s.temperature = seasonBaseTemp + dayVariation

    // Wind — gusty, perlin-like
    const windBase = 0.15 + Math.sin(t * 0.1) * 0.1 + Math.sin(t * 0.37) * 0.08
    s.windStrength = Math.max(0, Math.min(1, windBase))
    s.windDirection = t * 0.05 + Math.sin(t * 0.13) * 0.5

    // Rain / snow — snow always active
    s.isRaining = false
    s.isSnowing = true

    // Fog
    s.fogDensity = s.isRaining ? 0.7 : (s.isSnowing ? 0.8 : 0.5)

    // Ambient color from time of day
    const hour = s.timeOfDay * 24
    if (hour >= 6 && hour < 8) {
      // Dawn
      const p = (hour - 6) / 2
      s.ambientColor.setRGB(
        THREE.MathUtils.lerp(0.15, 0.82, p),
        THREE.MathUtils.lerp(0.1, 0.55, p),
        THREE.MathUtils.lerp(0.2, 0.38, p),
      )
      s.sunColor.setRGB(1, 0.6, 0.2)
      s.sunIntensity = THREE.MathUtils.lerp(0.5, 4, p)
    } else if (hour >= 8 && hour < 17) {
      // Day
      s.ambientColor.setRGB(0.82, 0.72, 0.55)
      s.sunColor.setRGB(1, 0.92, 0.78)
      s.sunIntensity = 4
    } else if (hour >= 17 && hour < 20) {
      // Sunset
      const p = (hour - 17) / 3
      s.ambientColor.setRGB(
        THREE.MathUtils.lerp(0.82, 0.2, p),
        THREE.MathUtils.lerp(0.55, 0.1, p),
        THREE.MathUtils.lerp(0.38, 0.18, p),
      )
      s.sunColor.setRGB(
        THREE.MathUtils.lerp(1, 0.98, p),
        THREE.MathUtils.lerp(0.78, 0.48, p),
        THREE.MathUtils.lerp(0.35, 0.15, p),
      )
      s.sunIntensity = THREE.MathUtils.lerp(4, 0.5, p)
    } else {
      // Night
      s.ambientColor.setRGB(0.12, 0.1, 0.2)
      s.sunColor.setRGB(0.3, 0.35, 0.5)
      s.sunIntensity = 0.3
    }

    // Update every 2 frames to reduce re-renders
    if (state.clock.elapsedTime % 0.1 < 0.02) {
      setTick((v) => v + 1)
    }
  })

  return (
    <WeatherContext.Provider value={stateRef.current}>
      {children}
    </WeatherContext.Provider>
  )
}

// ═══════════════════════════════════════════════════════════════
// RAIN SYSTEM
// ═══════════════════════════════════════════════════════════════
const RAIN_COUNT = 1500
const RAIN_RADIUS = 30
const RAIN_SPEED = 25

export function Rain() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const weather = useWeather()

  const drops = useMemo(() => {
    return Array.from({ length: RAIN_COUNT }, () => ({
      x: (Math.random() - 0.5) * RAIN_RADIUS * 2,
      y: Math.random() * 20,
      z: (Math.random() - 0.5) * RAIN_RADIUS * 2,
      speed: RAIN_SPEED + Math.random() * 8,
    }))
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const visible = weather.isRaining
    if (meshRef.current.visible !== visible) meshRef.current.visible = visible
    if (!visible) return

    const dt = Math.min(delta, 0.05)
    const carX = carStore.position.x
    const carZ = carStore.position.z

    for (let i = 0; i < RAIN_COUNT; i++) {
      const d = drops[i]
      d.y -= d.speed * dt
      if (d.y < 0) {
        d.y = 18 + Math.random() * 4
        d.x = carX + (Math.random() - 0.5) * RAIN_RADIUS * 2
        d.z = carZ + (Math.random() - 0.5) * RAIN_RADIUS * 2
      }

      dummy.position.set(d.x, d.y, d.z)
      dummy.scale.set(0.01, 0.3 + Math.random() * 0.2, 0.01)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, RAIN_COUNT]} frustumCulled={false} visible={false}>
      <cylinderGeometry args={[0.5, 0.5, 1, 3]} />
      <meshBasicMaterial color="#8ab4f8" transparent opacity={0.35} />
    </instancedMesh>
  )
}

// ═══════════════════════════════════════════════════════════════
// SNOW SYSTEM
// ═══════════════════════════════════════════════════════════════
const SNOW_COUNT = 250
const SNOW_RADIUS = 25

export function Snow() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const weather = useWeather()

  const flakes = useMemo(() => {
    return Array.from({ length: SNOW_COUNT }, () => ({
      x: (Math.random() - 0.5) * SNOW_RADIUS * 2,
      y: Math.random() * 15,
      z: (Math.random() - 0.5) * SNOW_RADIUS * 2,
      speed: 1 + Math.random() * 2,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.5 + Math.random() * 1.5,
    }))
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const visible = weather.isSnowing
    if (meshRef.current.visible !== visible) meshRef.current.visible = visible
    if (!visible) return

    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const carX = carStore.position.x
    const carZ = carStore.position.z

    for (let i = 0; i < SNOW_COUNT; i++) {
      const f = flakes[i]
      f.y -= f.speed * dt
      f.x += Math.sin(t * f.wobbleSpeed + f.wobblePhase) * 0.005
      f.z += Math.cos(t * f.wobbleSpeed * 0.7 + f.wobblePhase) * 0.004

      if (f.y < 0) {
        f.y = 12 + Math.random() * 5
        f.x = carX + (Math.random() - 0.5) * SNOW_RADIUS * 2
        f.z = carZ + (Math.random() - 0.5) * SNOW_RADIUS * 2
      }

      dummy.position.set(f.x, f.y, f.z)
      dummy.scale.setScalar(0.03 + Math.sin(t + i) * 0.01)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, SNOW_COUNT]} frustumCulled={false} visible={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
    </instancedMesh>
  )
}

// ═══════════════════════════════════════════════════════════════
// WIND-RESPONSIVE TREES (wraps existing tree refs)
// ═══════════════════════════════════════════════════════════════
// Applied via a component that modifies grass shader uniforms

export function WindSystem() {
  const weather = useWeather()

  useFrame(() => {
    // Global wind values accessible by grass shader via uniform
    // The grass shader reads uTime which already drives wind
    // We just ensure the weather state is available
  })

  return null
}
