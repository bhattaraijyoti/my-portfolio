'use client'

// ═══════════════════════════════════════════════════════════════
// SPORTS CAR COMPONENT
// Aggressive mid-engine silhouette — low wide body, sculpted
// haunches, front splitter, rear diffuser, GT wing, side skirts.
// ═══════════════════════════════════════════════════════════════

import { useRef, useEffect, useCallback, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

// ─── PHYSICS CONSTANTS ───────────────────────────────────────────

const ENGINE_POWER = 18
const POWER_CURVE_SHAPE = 2.0
const BOOST_MULTIPLIER = 1.5

const BRAKE_FORCE = 28
const REVERSE_FORCE = 8
const REVERSE_MAX_SPEED = 12

const ROLLING_RESISTANCE = 0.8
const DRAG_COEFFICIENT = 0.3
const IDLE_FRICTION = 4.0

const MAX_STEER_ANGLE = 0.55
const STEERING_SPEED = 2.5
const STEERING_RETURN_SPEED = 4.0
const WHEELBASE = 0.92
const TRACK_WIDTH = 0.82

const MAX_GRIP = 1.0
const PEAK_SLIP_ANGLE = 0.12
const SLIP_RECOVERY_RATE = 5.0

const SUSPENSION_STIFFNESS = 35
const SUSPENSION_DAMPING = 4.5
const SUSPENSION_REST = 0.15
const SUSPENSION_TRAVEL = 0.1
const CG_HEIGHT = 0.35
const BODY_RESPONSE = 8.0

const WORLD_BOUNDS = 22
const MAX_SPEED = 18

// ─── GEOMETRY HELPERS ────────────────────────────────────────────

// Low, aggressive sports car body — long hood, short deck, wide haunches
function createBodyGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape()
  // Side profile: X = car length (front = −X), Y = height
  // Low nose, rising hood, sharp windshield, low roof, fastback
  s.moveTo(-0.82, 0)
  s.lineTo(-0.82, 0.06)                             // front vertical
  s.quadraticCurveTo(-0.80, 0.12, -0.74, 0.14)      // front lip
  s.lineTo(-0.50, 0.15)                             // long flat hood
  s.quadraticCurveTo(-0.38, 0.16, -0.28, 0.18)      // hood rise toward cowl
  s.quadraticCurveTo(-0.18, 0.28, -0.10, 0.34)      // steep windshield
  s.quadraticCurveTo(0.02, 0.40, 0.12, 0.40)        // low roof
  s.quadraticCurveTo(0.24, 0.39, 0.34, 0.34)        // roof taper
  s.quadraticCurveTo(0.48, 0.26, 0.60, 0.22)        // fastback slope
  s.lineTo(0.72, 0.20)                              // short deck
  s.quadraticCurveTo(0.82, 0.18, 0.82, 0.10)        // rear vertical
  s.lineTo(0.82, 0)                                 // rear bottom
  s.lineTo(-0.82, 0)                                // close bottom

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.84,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
  })
  geo.translate(0, 0, -0.42)
  geo.rotateY(-Math.PI / 2)
  return geo
}

// Low, sleek cabin with steep rake
function createCabinGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape()
  s.moveTo(-0.28, 0)
  s.quadraticCurveTo(-0.18, 0.08, -0.08, 0.18)    // steep windshield
  s.quadraticCurveTo(0.04, 0.22, 0.14, 0.22)       // flat roof
  s.quadraticCurveTo(0.24, 0.20, 0.30, 0.14)       // rear window taper
  s.lineTo(0.30, 0)
  s.lineTo(-0.28, 0)

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.70,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  })
  geo.translate(0, 0, -0.35)
  geo.rotateY(-Math.PI / 2)
  return geo
}

// Low-profile performance tire with wider contact patch
function createTireGeometry(): THREE.BufferGeometry {
  const profile: THREE.Vector2[] = []
  const R = 0.16          // outer radius (lower profile)
  const r = 0.09          // inner rim radius
  const W = 0.095         // wider tire
  const sidewallBulge = 0.008

  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    const angle = t * Math.PI * 0.45
    const y = Math.sin(angle) * (R - r) + r
    const x = Math.cos(angle) * W
    profile.push(new THREE.Vector2(x, y))
  }
  const steps = 8
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const bulge = Math.sin(t * Math.PI) * sidewallBulge
    const y = r + (R - r) * (1 - t)
    const x = W * (1 - t) - bulge
    profile.push(new THREE.Vector2(x, y))
  }
  profile.push(new THREE.Vector2(0, r - 0.005))

  const geo = new THREE.LatheGeometry(profile, 48)
  geo.rotateZ(Math.PI / 2)

  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const radialDist = Math.sqrt(y * y + z * z)
    const angle = Math.atan2(z, y)
    if (radialDist > R - 0.015 && Math.abs(x) < W * 0.85) {
      const groove = Math.sin(angle * 10) * 0.005
      const nd = radialDist + groove
      pos.setY(i, (y / radialDist) * nd)
      pos.setZ(i, (z / radialDist) * nd)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// Large multi-spoke alloy rim
function createRimGeometry(): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(0.098, 0.098, 0.018, 32, 1)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const r = Math.sqrt(pos.getY(i) ** 2 + pos.getZ(i) ** 2)
    if (Math.abs(x) < 0.01 && r > 0.04) {
      pos.setX(i, x - 0.010)
    }
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// Wheel spoke geometry for sportier look
function createSpokeGeometry(): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(0.008, 0.18, 0.014)
  return geo
}

// ─── COMPONENT ───────────────────────────────────────────────────

export default function Car() {
  const group = useRef<THREE.Group>(null!)
  const bodyRef = useRef<THREE.Mesh>(null!)
  const cabinRef = useRef<THREE.Mesh>(null!)
  const wheelRefs = useRef<THREE.Mesh[]>([])
  const headlightL = useRef<THREE.PointLight>(null!)
  const headlightR = useRef<THREE.PointLight>(null!)

  const velocity = useRef(new THREE.Vector3())
  const steerAngle = useRef(0)
  const targetSteer = useRef(0)
  const bodyPitch = useRef(0)
  const bodyRoll = useRef(0)
  const bodyY = useRef(0)
  const visualAngle = useRef(0)

  const susp = useRef([
    { comp: 0, vel: 0 },
    { comp: 0, vel: 0 },
    { comp: 0, vel: 0 },
    { comp: 0, vel: 0 },
  ])

  const keys = useRef({ w: false, a: false, s: false, d: false, shift: false })

  // ─── KEYBOARD ──────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || k === 'arrowup') keys.current.w = true
    if (k === 'a' || k === 'arrowleft') keys.current.a = true
    if (k === 's' || k === 'arrowdown') keys.current.s = true
    if (k === 'd' || k === 'arrowright') keys.current.d = true
    if (k === 'shift') keys.current.shift = true
  }, [])
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || k === 'arrowup') keys.current.w = false
    if (k === 'a' || k === 'arrowleft') keys.current.a = false
    if (k === 's' || k === 'arrowdown') keys.current.s = false
    if (k === 'd' || k === 'arrowright') keys.current.d = false
    if (k === 'shift') keys.current.shift = false
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  // ─── MATERIALS ─────────────────────────────────────────────
  const mats = useMemo(() => ({
    body: new THREE.MeshPhysicalMaterial({
      color: '#1a1a2e', roughness: 0.12, metalness: 0.4,
      clearcoat: 1.0, clearcoatRoughness: 0.03, reflectivity: 0.9,
      envMapIntensity: 1.2,
    }),
    bodyDark: new THREE.MeshPhysicalMaterial({
      color: '#12121e', roughness: 0.2, metalness: 0.3,
      clearcoat: 0.8, clearcoatRoughness: 0.08,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#1a2a3a', roughness: 0.01, metalness: 0.5,
      transmission: 0.7, thickness: 0.15, transparent: true, opacity: 0.55, ior: 1.5,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: '#00e86a', roughness: 0.1, metalness: 0.35,
      emissive: '#00e86a', emissiveIntensity: 0.8,
    }),
    headlight: new THREE.MeshStandardMaterial({
      color: '#ffffff', emissive: '#fff8e0', emissiveIntensity: 5, roughness: 0.02,
    }),
    headlightLens: new THREE.MeshPhysicalMaterial({
      color: '#e8f0ff', roughness: 0.01, metalness: 0.3,
      transmission: 0.6, transparent: true, opacity: 0.4,
    }),
    taillight: new THREE.MeshStandardMaterial({
      color: '#cc2222', emissive: '#ff2222', emissiveIntensity: 3, roughness: 0.15,
    }),
    bumper: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.3, metalness: 0.3 }),
    tire: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.92, metalness: 0.01 }),
    rim: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.12, metalness: 0.9 }),
    rimFace: new THREE.MeshStandardMaterial({ color: '#444444', roughness: 0.1, metalness: 0.92 }),
    hubcap: new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.1, metalness: 0.85 }),
    undercarriage: new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.92 }),
    exhaust: new THREE.MeshStandardMaterial({ color: '#333333', roughness: 0.2, metalness: 0.8 }),
    exhaustInner: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.9 }),
    mirror: new THREE.MeshPhysicalMaterial({
      color: '#1a1a2e', roughness: 0.05, metalness: 0.5, clearcoat: 0.8,
    }),
    stripe: new THREE.MeshStandardMaterial({
      color: '#00e86a', roughness: 0.15, metalness: 0.25,
      emissive: '#00e86a', emissiveIntensity: 0.5,
    }),
    arch: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.92 }),
    splitter: new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.4, metalness: 0.2 }),
    diffuser: new THREE.MeshStandardMaterial({ color: '#0a0a0a', roughness: 0.4, metalness: 0.2 }),
    intake: new THREE.MeshStandardMaterial({ color: '#080808', roughness: 0.9 }),
    sideSkirt: new THREE.MeshStandardMaterial({ color: '#0e0e0e', roughness: 0.3, metalness: 0.2 }),
    wing: new THREE.MeshPhysicalMaterial({
      color: '#1a1a2e', roughness: 0.15, metalness: 0.3,
      clearcoat: 0.9, clearcoatRoughness: 0.05,
    }),
    carbon: new THREE.MeshStandardMaterial({ color: '#151515', roughness: 0.35, metalness: 0.15 }),
  }), [])

  // ─── GEOMETRY (memoized) ───────────────────────────────────
  const bodyGeo = useMemo(() => createBodyGeometry(), [])
  const cabinGeo = useMemo(() => createCabinGeometry(), [])
  const tireGeo = useMemo(() => createTireGeometry(), [])
  const rimGeo = useMemo(() => createRimGeometry(), [])
  const spokeGeo = useMemo(() => createSpokeGeometry(), [])
  const archGeo = useMemo(() => new THREE.TorusGeometry(0.18, 0.02, 8, 16, Math.PI), [])

  // ─── PHYSICS UPDATE ────────────────────────────────────────
  const heading = useRef(0)

  useFrame((state, delta) => {
    if (!group.current) return
    const dt = Math.min(delta, 0.05)
    const k = keys.current
    const vel = velocity.current
    const pos = group.current.position

    // ── TELEPORT ──────────────────────────────────────────────
    if (carStore.teleportTo) {
      pos.copy(carStore.teleportTo)
      vel.set(0, 0, 0)
      heading.current = 0
      steerAngle.current = 0
      targetSteer.current = 0
      bodyPitch.current = 0
      bodyRoll.current = 0
      bodyY.current = 0
      visualAngle.current = 0
      carStore.teleportTo = null
      carStore.position.copy(pos)
      carStore.rotation = 0
      carStore.velocity.set(0, 0, 0)
      return
    }

    const speed = vel.length()

    if (!isFinite(speed)) {
      vel.set(0, 0, 0)
      carStore.position.copy(pos)
      carStore.velocity.set(0, 0, 0)
      return
    }

    // ── STEERING ──────────────────────────────────────────────
    if (k.a) targetSteer.current = 1
    else if (k.d) targetSteer.current = -1
    else targetSteer.current = 0

    steerAngle.current = THREE.MathUtils.lerp(
      steerAngle.current,
      targetSteer.current,
      Math.min((k.a || k.d ? 10 : 14) * dt, 1),
    )

    const speedNorm = Math.min(speed / 8, 1)
    const turnSpeed = 2.8 * Math.sin(speedNorm * Math.PI * 0.5)
    heading.current += steerAngle.current * turnSpeed * dt

    // ── SPEED (signed: positive = forward, negative = reverse) ──
    const currentSigned = (() => {
      const dot = vel.x * (-Math.sin(heading.current)) + vel.z * (-Math.cos(heading.current))
      return dot
    })()
    let signedTarget = 0
    const maxSpd = k.shift ? MAX_SPEED * BOOST_MULTIPLIER : MAX_SPEED

    if (k.w) {
      signedTarget = maxSpd
    } else if (k.s) {
      if (currentSigned > 0.5) {
        signedTarget = 0
      } else {
        signedTarget = -REVERSE_MAX_SPEED
      }
    }

    let signedSpeed: number
    if (k.w) {
      const accelRate = 12
      signedSpeed = THREE.MathUtils.lerp(currentSigned, signedTarget, Math.min(accelRate * dt / Math.max(Math.abs(currentSigned), 1), 1))
    } else if (k.s && currentSigned > 0.5) {
      signedSpeed = THREE.MathUtils.lerp(currentSigned, 0, Math.min(25 * dt, 1))
    } else if (k.s && currentSigned <= 0.5) {
      signedSpeed = THREE.MathUtils.lerp(Math.max(currentSigned, 0), signedTarget, Math.min(20 * dt, 1))
    } else {
      signedSpeed = currentSigned > 0
        ? Math.max(0, currentSigned - 6 * dt)
        : Math.min(0, currentSigned + 6 * dt)
      if (Math.abs(signedSpeed) < 0.05) signedSpeed = 0
    }

    const newSpeed = Math.abs(signedSpeed)

    // ── APPLY VELOCITY ────────────────────────────────────────
    vel.set(
      -Math.sin(heading.current) * signedSpeed,
      0,
      -Math.cos(heading.current) * signedSpeed,
    )

    pos.x += vel.x * dt
    pos.z += vel.z * dt
    pos.x = THREE.MathUtils.clamp(pos.x, -WORLD_BOUNDS, WORLD_BOUNDS)
    pos.z = THREE.MathUtils.clamp(pos.z, -WORLD_BOUNDS, WORLD_BOUNDS)

    applyVisuals(k, newSpeed, dt, state)

    carStore.position.copy(pos)
    carStore.rotation = heading.current
    carStore.velocity.copy(vel)
  })

  // ─── VISUALS ──────────────────────────────────────────────
  function applyVisuals(k: { w: boolean; s: boolean; a: boolean; d: boolean; shift: boolean }, spd: number, dt: number, state: any) {
    const targetPitch = k.w ? -0.025 : (k.s && spd > 0.5 ? 0.04 : 0)
    bodyPitch.current = THREE.MathUtils.lerp(bodyPitch.current, targetPitch, 4 * dt)

    const targetRoll = steerAngle.current * Math.min(spd * 0.006, 0.06)
    bodyRoll.current = THREE.MathUtils.lerp(bodyRoll.current, targetRoll, 5 * dt)

    bodyY.current = THREE.MathUtils.lerp(bodyY.current, 0, 5 * dt)

    visualAngle.current = heading.current
    if (group.current) {
      group.current.rotation.y = heading.current
      group.current.rotation.x = bodyPitch.current
      group.current.rotation.z = bodyRoll.current
      group.current.position.y = 0.22 + bodyY.current
    }

    wheelRefs.current.forEach(w => { if (w) w.rotation.x += spd * dt * 3 })

    const t = state.clock.elapsedTime
    const flicker = 1 + Math.sin(t * 10) * 0.04
    const hi = spd > 0.5 ? 5 : 2
    if (headlightL.current) headlightL.current.intensity = hi * flicker
    if (headlightR.current) headlightR.current.intensity = hi * flicker
  }

  // ─── WHEEL POSITIONS (wider track) ────────────────────────
  const WHEELS: [number, number, number][] = [
    [-0.44, -0.09, 0.50],   // FL
    [0.44, -0.09, 0.50],    // FR
    [-0.44, -0.09, -0.50],  // RL
    [0.44, -0.09, -0.50],   // RR
  ]

  const SPOKE_ANGLES = [0, Math.PI / 2.5, Math.PI * 2 / 2.5, Math.PI * 3 / 2.5, Math.PI * 4 / 2.5]

  // ─── RENDER ──────────────────────────────────────────────
  return (
    <group ref={group} position={[0, 0.22, 0]}>
      <group rotation={[0, Math.PI, 0]}>
      {/* ── Main body ── */}
      <mesh ref={bodyRef} position={[0, 0.08, 0]} castShadow receiveShadow>
        <primitive object={bodyGeo} attach="geometry" />
        <primitive object={mats.body} attach="material" />
      </mesh>

      {/* ── Wide fender flares (front) ── */}
      <mesh position={[-0.38, 0.12, 0.42]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.22]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>
      <mesh position={[0.38, 0.12, 0.42]} castShadow>
        <boxGeometry args={[0.08, 0.14, 0.22]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>

      {/* ── Wide fender flares (rear) ── */}
      <mesh position={[-0.40, 0.12, -0.42]} castShadow>
        <boxGeometry args={[0.10, 0.16, 0.24]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>
      <mesh position={[0.40, 0.12, -0.42]} castShadow>
        <boxGeometry args={[0.10, 0.16, 0.24]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>

      {/* ── Hood scoop / vent ── */}
      <mesh position={[0, 0.165, 0.48]} castShadow>
        <boxGeometry args={[0.16, 0.005, 0.28]} />
        <primitive object={mats.intake} attach="material" />
      </mesh>
      {/* scoop raised edges */}
      <mesh position={[-0.082, 0.175, 0.48]}>
        <boxGeometry args={[0.005, 0.02, 0.28]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>
      <mesh position={[0.082, 0.175, 0.48]}>
        <boxGeometry args={[0.005, 0.02, 0.28]} />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>

      {/* ── Hood racing stripes ── */}
      <mesh position={[-0.06, 0.168, 0.48]} castShadow>
        <boxGeometry args={[0.04, 0.003, 0.30]} />
        <primitive object={mats.stripe} attach="material" />
      </mesh>
      <mesh position={[0.06, 0.168, 0.48]} castShadow>
        <boxGeometry args={[0.04, 0.003, 0.30]} />
        <primitive object={mats.stripe} attach="material" />
      </mesh>

      {/* ── Front splitter ── */}
      <mesh position={[0, 0.04, 0.84]} castShadow>
        <boxGeometry args={[0.82, 0.015, 0.12]} />
        <primitive object={mats.splitter} attach="material" />
      </mesh>
      {/* splitter side canards */}
      <mesh position={[-0.36, 0.06, 0.82]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.08, 0.01, 0.06]} />
        <primitive object={mats.splitter} attach="material" />
      </mesh>
      <mesh position={[0.36, 0.06, 0.82]} rotation={[0, 0, -0.15]}>
        <boxGeometry args={[0.08, 0.01, 0.06]} />
        <primitive object={mats.splitter} attach="material" />
      </mesh>

      {/* ── Front air intakes ── */}
      <mesh position={[-0.18, 0.08, 0.82]}>
        <boxGeometry args={[0.22, 0.06, 0.03]} />
        <primitive object={mats.intake} attach="material" />
      </mesh>
      <mesh position={[0.18, 0.08, 0.82]}>
        <boxGeometry args={[0.22, 0.06, 0.03]} />
        <primitive object={mats.intake} attach="material" />
      </mesh>
      {/* center intake */}
      <mesh position={[0, 0.06, 0.83]}>
        <boxGeometry args={[0.12, 0.04, 0.03]} />
        <primitive object={mats.intake} attach="material" />
      </mesh>

      {/* ── Side skirts ── */}
      <mesh position={[-0.40, 0.05, 0]} castShadow>
        <boxGeometry args={[0.03, 0.06, 1.0]} />
        <primitive object={mats.sideSkirt} attach="material" />
      </mesh>
      <mesh position={[0.40, 0.05, 0]} castShadow>
        <boxGeometry args={[0.03, 0.06, 1.0]} />
        <primitive object={mats.sideSkirt} attach="material" />
      </mesh>

      {/* ── Side accent line ── */}
      <mesh position={[-0.42, 0.14, 0]} castShadow>
        <boxGeometry args={[0.008, 0.02, 1.2]} />
        <primitive object={mats.stripe} attach="material" />
      </mesh>
      <mesh position={[0.42, 0.14, 0]} castShadow>
        <boxGeometry args={[0.008, 0.02, 1.2]} />
        <primitive object={mats.stripe} attach="material" />
      </mesh>

      {/* ── Cabin ── */}
      <mesh ref={cabinRef} position={[0, 0.30, -0.04]} castShadow receiveShadow>
        <primitive object={cabinGeo} attach="geometry" />
        <primitive object={mats.bodyDark} attach="material" />
      </mesh>

      {/* ── Roof panel (carbon fiber look) ── */}
      <mesh position={[0, 0.51, -0.04]} castShadow>
        <boxGeometry args={[0.50, 0.012, 0.52]} />
        <primitive object={mats.carbon} attach="material" />
      </mesh>

      {/* ── Glass ── */}
      <mesh position={[0, 0.40, 0.26]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[0.52, 0.18, 8, 1]} />
        <primitive object={mats.glass} attach="material" />
      </mesh>
      <mesh position={[0, 0.40, -0.36]} rotation={[-0.30, 0, 0]}>
        <planeGeometry args={[0.48, 0.14, 8, 1]} />
        <primitive object={mats.glass} attach="material" />
      </mesh>
      <mesh position={[-0.26, 0.40, -0.04]}>
        <boxGeometry args={[0.015, 0.12, 0.42]} />
        <primitive object={mats.glass} attach="material" />
      </mesh>
      <mesh position={[0.26, 0.40, -0.04]}>
        <boxGeometry args={[0.015, 0.12, 0.42]} />
        <primitive object={mats.glass} attach="material" />
      </mesh>

      {/* ── Headlights (angular, aggressive) ── */}
      {/* left headlight */}
      <mesh position={[-0.24, 0.16, 0.80]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.035, 0.025]} />
        <primitive object={mats.headlight} attach="material" />
      </mesh>
      <mesh position={[-0.24, 0.16, 0.805]}>
        <boxGeometry args={[0.17, 0.04, 0.01]} />
        <primitive object={mats.headlightLens} attach="material" />
      </mesh>
      {/* right headlight */}
      <mesh position={[0.24, 0.16, 0.80]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.16, 0.035, 0.025]} />
        <primitive object={mats.headlight} attach="material" />
      </mesh>
      <mesh position={[0.24, 0.16, 0.805]}>
        <boxGeometry args={[0.17, 0.04, 0.01]} />
        <primitive object={mats.headlightLens} attach="material" />
      </mesh>
      {/* DRL accent strip */}
      <mesh position={[-0.24, 0.14, 0.81]}>
        <boxGeometry args={[0.14, 0.008, 0.01]} />
        <primitive object={mats.accent} attach="material" />
      </mesh>
      <mesh position={[0.24, 0.14, 0.81]}>
        <boxGeometry args={[0.14, 0.008, 0.01]} />
        <primitive object={mats.accent} attach="material" />
      </mesh>

      {/* ── Taillights (wide LED bar) ── */}
      <mesh position={[-0.28, 0.16, -0.80]}>
        <boxGeometry args={[0.18, 0.04, 0.025]} />
        <primitive object={mats.taillight} attach="material" />
      </mesh>
      <mesh position={[0.28, 0.16, -0.80]}>
        <boxGeometry args={[0.18, 0.04, 0.025]} />
        <primitive object={mats.taillight} attach="material" />
      </mesh>
      {/* full-width LED bar */}
      <mesh position={[0, 0.16, -0.805]}>
        <boxGeometry args={[0.56, 0.015, 0.01]} />
        <primitive object={mats.taillight} attach="material" />
      </mesh>

      {/* ── Rear diffuser ── */}
      <mesh position={[0, 0.04, -0.82]} castShadow>
        <boxGeometry args={[0.70, 0.015, 0.10]} />
        <primitive object={mats.diffuser} attach="material" />
      </mesh>
      {/* diffuser vanes */}
      {[-0.20, -0.10, 0, 0.10, 0.20].map((x, i) => (
        <mesh key={`vane-${i}`} position={[x, 0.05, -0.83]}>
          <boxGeometry args={[0.012, 0.03, 0.08]} />
          <primitive object={mats.diffuser} attach="material" />
        </mesh>
      ))}

      {/* ── Rear bumper / lower panel ── */}
      <mesh position={[0, 0.10, -0.82]} castShadow>
        <boxGeometry args={[0.74, 0.08, 0.04]} />
        <primitive object={mats.bumper} attach="material" />
      </mesh>

      {/* ── GT Wing ── */}
      {/* wing blade */}
      <mesh position={[0, 0.50, -0.64]} castShadow>
        <boxGeometry args={[0.68, 0.018, 0.12]} />
        <primitive object={mats.wing} attach="material" />
      </mesh>
      {/* wing endplates */}
      <mesh position={[-0.34, 0.50, -0.64]} castShadow>
        <boxGeometry args={[0.008, 0.08, 0.14]} />
        <primitive object={mats.wing} attach="material" />
      </mesh>
      <mesh position={[0.34, 0.50, -0.64]} castShadow>
        <boxGeometry args={[0.008, 0.08, 0.14]} />
        <primitive object={mats.wing} attach="material" />
      </mesh>
      {/* wing swan-neck mounts */}
      <mesh position={[-0.15, 0.47, -0.64]} castShadow>
        <boxGeometry args={[0.025, 0.08, 0.025]} />
        <primitive object={mats.carbon} attach="material" />
      </mesh>
      <mesh position={[0.15, 0.47, -0.64]} castShadow>
        <boxGeometry args={[0.025, 0.08, 0.025]} />
        <primitive object={mats.carbon} attach="material" />
      </mesh>

      {/* ── Side mirrors (aero) ── */}
      <mesh position={[-0.36, 0.34, 0.24]} castShadow>
        <boxGeometry args={[0.05, 0.025, 0.06]} />
        <primitive object={mats.mirror} attach="material" />
      </mesh>
      <mesh position={[0.36, 0.34, 0.24]} castShadow>
        <boxGeometry args={[0.05, 0.025, 0.06]} />
        <primitive object={mats.mirror} attach="material" />
      </mesh>
      {/* mirror stalks */}
      <mesh position={[-0.33, 0.32, 0.22]}>
        <boxGeometry args={[0.015, 0.015, 0.04]} />
        <primitive object={mats.carbon} attach="material" />
      </mesh>
      <mesh position={[0.33, 0.32, 0.22]}>
        <boxGeometry args={[0.015, 0.015, 0.04]} />
        <primitive object={mats.carbon} attach="material" />
      </mesh>

      {/* ── Dual exhaust tips ── */}
      <mesh position={[-0.20, 0.06, -0.86]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.030, 0.06, 12]} />
        <primitive object={mats.exhaust} attach="material" />
      </mesh>
      <mesh position={[-0.20, 0.06, -0.86]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.07, 8]} />
        <primitive object={mats.exhaustInner} attach="material" />
      </mesh>
      <mesh position={[0.20, 0.06, -0.86]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.030, 0.06, 12]} />
        <primitive object={mats.exhaust} attach="material" />
      </mesh>
      <mesh position={[0.20, 0.06, -0.86]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.07, 8]} />
        <primitive object={mats.exhaustInner} attach="material" />
      </mesh>

      {/* ── Wheels + arches ── */}
      {WHEELS.map((wp, i) => (
        <group key={i} position={wp}>
          {/* fender arch */}
          <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <primitive object={archGeo} attach="geometry" />
            <primitive object={mats.arch} attach="material" />
          </mesh>
          {/* tire + rim + spokes */}
          <group rotation={[0, 0, Math.PI / 2]}>
            <mesh
              ref={el => { if (el) wheelRefs.current[i] = el as any }}
            >
              <primitive object={tireGeo} attach="geometry" />
              <primitive object={mats.tire} attach="material" />
            </mesh>
            {/* outer rim face */}
            <mesh position={[0.082, 0, 0]}>
              <primitive object={rimGeo} attach="geometry" />
              <primitive object={mats.rimFace} attach="material" />
            </mesh>
            {/* inner rim face */}
            <mesh position={[-0.082, 0, 0]}>
              <primitive object={rimGeo} attach="geometry" />
              <primitive object={mats.rim} attach="material" />
            </mesh>
            {/* spokes */}
            {SPOKE_ANGLES.map((angle, si) => (
              <group key={si} rotation={[0, 0, angle]}>
                <mesh position={[0.082, 0, 0]}>
                  <primitive object={spokeGeo} attach="geometry" />
                  <primitive object={mats.rimFace} attach="material" />
                </mesh>
              </group>
            ))}
            {/* hub center */}
            <mesh position={[0.082, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.02, 16]} />
              <primitive object={mats.hubcap} attach="material" />
            </mesh>
          </group>
        </group>
      ))}

      {/* ── Undercarriage ── */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.62, 0.03, 1.2]} />
        <primitive object={mats.undercarriage} attach="material" />
      </mesh>

      {/* ── Point lights ── */}
      <pointLight ref={headlightL} position={[-0.24, 0.18, 1.10]} intensity={3} distance={14} color="#fff8e0" />
      <pointLight ref={headlightR} position={[0.24, 0.18, 1.10]} intensity={3} distance={14} color="#fff8e0" />
      <pointLight position={[0, 0.16, -1.0]} intensity={1.0} distance={6} color="#ff2222" />
      </group>
    </group>
  )
}
