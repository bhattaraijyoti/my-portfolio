'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

// ═══════════════════════════════════════════════════════════════
// RACE TRACK — circular lap timer
// Place near the starting area
// ═══════════════════════════════════════════════════════════════

const TRACK_RADIUS = 18
const TRACK_WIDTH = 4
const CHECKPOINT_COUNT = 4
const START_FINISH_WIDTH = 6

export default function RaceTrack() {
  const checkpointRefs = useRef<(THREE.Mesh | null)[]>([])
  const [lapTime, setLapTime] = useState(0)
  const [bestLap, setBestLap] = useState<number | null>(null)
  const [inLap, setInLap] = useState(false)
  const [laps, setLaps] = useState(0)
  const lapStart = useRef(0)
  const lastCheckpoint = useRef(-1)
  const passedStart = useRef(false)

  // Checkpoint positions around the track
  const checkpoints = useMemo(() => {
    return Array.from({ length: CHECKPOINT_COUNT }, (_, i) => {
      const angle = (i / CHECKPOINT_COUNT) * Math.PI * 2
      return {
        x: Math.cos(angle) * TRACK_RADIUS,
        z: Math.sin(angle) * TRACK_RADIUS,
        angle,
      }
    })
  }, [])

  // Track line geometry
  const trackLine = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 64
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * TRACK_RADIUS,
        0.015,
        Math.sin(angle) * TRACK_RADIUS,
      ))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  // Inner/outer track boundaries
  const innerLine = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 64
    const innerR = TRACK_RADIUS - TRACK_WIDTH / 2
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * innerR, 0.016, Math.sin(angle) * innerR))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  const outerLine = useMemo(() => {
    const points: THREE.Vector3[] = []
    const segments = 64
    const outerR = TRACK_RADIUS + TRACK_WIDTH / 2
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * outerR, 0.016, Math.sin(angle) * outerR))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  useFrame(() => {
    const carPos = carStore.position
    const speed = carStore.velocity.length()

    // Check which checkpoint the car is near
    for (let i = 0; i < CHECKPOINT_COUNT; i++) {
      const cp = checkpoints[i]
      const dx = carPos.x - cp.x
      const dz = carPos.z - cp.z
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 5) {
        // Checkpoint 0 is start/finish
        if (i === 0) {
          if (!passedStart.current && lastCheckpoint.current === CHECKPOINT_COUNT - 1) {
            // Completed a full lap!
            if (inLap) {
              const now = performance.now()
              const lapMs = now - lapStart.current
              setLapTime(lapMs)
              setLaps((l) => l + 1)
              if (!bestLap || lapMs < bestLap) {
                setBestLap(lapMs)
              }
              lapStart.current = now
            } else {
              // Start first lap
              lapStart.current = performance.now()
              setInLap(true)
            }
            passedStart.current = true
          }
        } else {
          passedStart.current = false
        }

        if (lastCheckpoint.current !== i && i === (lastCheckpoint.current + 1) % CHECKPOINT_COUNT) {
          lastCheckpoint.current = i
        }

        // Visual feedback on checkpoint
        if (checkpointRefs.current[i]) {
          const mat = checkpointRefs.current[i]!.material as THREE.MeshBasicMaterial
          mat.opacity = 0.6
        }
      } else {
        if (checkpointRefs.current[i]) {
          const mat = checkpointRefs.current[i]!.material as THREE.MeshBasicMaterial
          mat.opacity = 0.15
        }
      }
    }

    // Update live lap time
    if (inLap) {
      setLapTime(performance.now() - lapStart.current)
    }
  })

  const formatTime = (ms: number) => {
    const s = ms / 1000
    const min = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    const ms3 = Math.floor((s % 1) * 1000)
    return `${min}:${String(sec).padStart(2, '0')}.${String(ms3).padStart(3, '0')}`
  }

  return (
    <group position={[0, 0, -8]}>
      {/* Track line */}
      <line geometry={trackLine}>
        <lineBasicMaterial color="#d4a017" transparent opacity={0.4} />
      </line>
      <line geometry={innerLine}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </line>
      <line geometry={outerLine}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </line>

      {/* Start/Finish line */}
      <mesh position={[TRACK_RADIUS, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.3, START_FINISH_WIDTH]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[TRACK_RADIUS, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshBasicMaterial color="#d4a017" transparent opacity={0.3} />
      </mesh>

      {/* Checkpoint markers */}
      {checkpoints.map((cp, i) => (
        <mesh
          key={i}
          ref={(el) => { checkpointRefs.current[i] = el }}
          position={[cp.x, 0.02, cp.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[1.5, 1.8, 24]} />
          <meshBasicMaterial
            color={i === 0 ? '#d4a017' : '#ffffff'}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Track HUD — 3D billboard */}
      <group position={[TRACK_RADIUS, 3, 0]}>
        {/* Timer display (simple 3D text placeholder) */}
        <mesh position={[0, 0, 0]}>
          <planeGeometry args={[3, 1.2]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.5} />
        </mesh>
      </group>
    </group>
  )
}
