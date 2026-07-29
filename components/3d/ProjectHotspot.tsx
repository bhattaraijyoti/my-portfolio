'use client'

import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text, RoundedBox, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { carStore } from './store'

interface ProjectHotspotProps {
  position: [number, number, number]
  label: string
  tags?: string
  image: string
  onProximityChange?: (label: string, isNear: boolean) => void
}

// ─── GROUND MARKER (visible from far away) ──────────────────────
function GroundMarker({ isNearRef, accentColor }: { isNearRef: React.MutableRefObject<boolean>; accentColor: string }) {
  const ringRefs = useRef<THREE.Mesh[]>([])
  const discRef = useRef<THREE.Mesh>(null!)
  const bigRingRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isNear = isNearRef.current

    if (discRef.current) {
      const mat = discRef.current.material as THREE.MeshBasicMaterial
      const target = isNear ? 0.25 : 0.12
      mat.opacity += (target - mat.opacity) * 0.05
    }

    if (bigRingRef.current) {
      bigRingRef.current.rotation.z = t * 0.15
      const mat = bigRingRef.current.material as THREE.MeshBasicMaterial
      const target = isNear ? 0.35 : 0.15
      mat.opacity += (target - mat.opacity) * 0.05
      const s = isNear ? 2.8 + Math.sin(t * 1.5) * 0.15 : 2.4
      bigRingRef.current.scale.set(s, s, 1)
    }

    for (let i = 0; i < ringRefs.current.length; i++) {
      const ring = ringRefs.current[i]
      if (!ring) continue
      const phase = (t * 0.3 + i * 0.33) % 1
      const scale = 1.0 + phase * 2.5
      ring.scale.set(scale, scale, 1)
      const mat = ring.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - phase) * (isNear ? 0.3 : 0.12)
    }
  })

  return (
    <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={discRef}>
        <circleGeometry args={[1.8, 48]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.12} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={bigRingRef}>
        <ringGeometry args={[2.7, 2.82, 48]} />
        <meshBasicMaterial color={accentColor} transparent opacity={0.15} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { if (el) ringRefs.current[i] = el }}>
          <ringGeometry args={[1.2, 1.26, 48]} />
          <meshBasicMaterial color={accentColor} transparent depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

// ─── BEACON ─────────────────────────────────────────────────────
function Beacon({ isNearRef, accentColor }: { isNearRef: React.MutableRefObject<boolean>; accentColor: string }) {
  const beamRef = useRef<THREE.Mesh>(null!)
  const lightRef = useRef<THREE.PointLight>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isNear = isNearRef.current
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = isNear
        ? 0.08 + Math.sin(t * 1.2) * 0.03
        : 0.035 + Math.sin(t * 0.8) * 0.015
    }
    if (lightRef.current) {
      const target = isNear ? 4 : 1.5
      lightRef.current.intensity += (target - lightRef.current.intensity) * 0.05
    }
  })

  return (
    <group>
      <mesh ref={beamRef} position={[0, 6, 0]}>
        <cylinderGeometry args={[0.06, 0.7, 12, 16, 1, true]} />
        <meshBasicMaterial color={accentColor} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight ref={lightRef} position={[0, 3, 0]} intensity={1.5} distance={12} color={accentColor} />
    </group>
  )
}

// ─── FLOATING ORBS ──────────────────────────────────────────────
function FloatingOrbs({ isNearRef, accentColor }: { isNearRef: React.MutableRefObject<boolean>; accentColor: string }) {
  const count = 20
  const refs = useRef<(THREE.Mesh | null)[]>([])
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2,
        dist: 1.5 + Math.random() * 2,
        y: 0.5 + Math.random() * 3.5,
        speed: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
        size: 0.025 + Math.random() * 0.035,
      })),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isNear = isNearRef.current
    for (let i = 0; i < refs.current.length; i++) {
      const mesh = refs.current[i]
      if (!mesh) continue
      const d = data[i]
      const a = d.angle + t * d.speed
      mesh.position.set(
        Math.cos(a) * d.dist,
        d.y + Math.sin(t * 0.6 + d.phase) * 0.6,
        Math.sin(a) * d.dist
      )
      const s = isNear
        ? d.size * 2.5 + Math.sin(t * 3 + d.phase) * d.size
        : d.size + Math.sin(t * 1.5 + d.phase) * d.size * 0.5
      mesh.scale.setScalar(s)
      const mat = mesh.material as THREE.MeshBasicMaterial
      const targetOpacity = isNear ? 0.9 : 0.4
      mat.opacity += (targetOpacity - mat.opacity) * 0.05
    }
  })

  return (
    <group>
      {data.map((d, i) => (
        <mesh key={i} ref={(el: THREE.Mesh | null) => { refs.current[i] = el }}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={accentColor} transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  )
}

// ─── PEDESTAL ───────────────────────────────────────────────────
function Pedestal({ isNearRef, accentColor }: { isNearRef: React.MutableRefObject<boolean>; accentColor: string }) {
  const glowRef = useRef<THREE.PointLight>(null!)
  const ringRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const isNear = isNearRef.current
    if (glowRef.current) {
      glowRef.current.intensity = isNear ? 5 + Math.sin(t * 1.5) * 1.5 : 1.5 + Math.sin(t) * 0.3
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.5
      const mat = ringRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = isNear ? 2 + Math.sin(t * 2) * 0.8 : 0.6 + Math.sin(t) * 0.2
    }
  })

  return (
    <group>
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.1, 32]} />
        <meshStandardMaterial color="#111111" roughness={0.15} metalness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.06, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={0.95} />
      </mesh>
      <mesh position={[0, 0.14, 0]} ref={ringRef}>
        <torusGeometry args={[0.48, 0.02, 8, 48]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.8} roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.68, 10]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.08, 0.04, 0.06, 16]} />
        <meshStandardMaterial color="#999" roughness={0.25} metalness={0.6} />
      </mesh>
      <pointLight ref={glowRef} position={[0, 0.5, 0]} distance={8} color={accentColor} />
    </group>
  )
}

// ─── PROJECT CARD ───────────────────────────────────────────────
function ProjectCard({
  label,
  tags,
  texture,
  isNearRef,
  accentColor,
}: {
  label: string
  tags: string
  texture: any,
  isNearRef: React.MutableRefObject<boolean>
  accentColor: string
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const borderRef = useRef<THREE.MeshStandardMaterial>(null!)
  const ctaRef = useRef<THREE.Group>(null!)
  const baseY = useRef(2.2)

  const initials = label
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    const isNear = isNearRef.current

    const targetY = isNear ? 2.6 : 2.2
    baseY.current = THREE.MathUtils.lerp(baseY.current, targetY, 0.04)
    groupRef.current.position.y = baseY.current + Math.sin(t * 0.45) * 0.04

    const targetScale = isNear ? 1.1 : 1.0
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.04)
    groupRef.current.scale.set(s, s, s)

    if (borderRef.current) {
      borderRef.current.emissiveIntensity = isNear ? 2.2 + Math.sin(t * 2) * 0.6 : 0.6
    }

    if (ctaRef.current) {
      const targetCta = isNear ? 1 : 0
      ctaRef.current.scale.setScalar(THREE.MathUtils.lerp(ctaRef.current.scale.x, targetCta, 0.08))
    }
  })

  const W = 4.2
  const H = 3.0
  const D = 0.1

  return (
    <group ref={groupRef} position={[0, 2.2, 0]}>
      <Billboard follow>
        {/* Back panel (furthest back) */}
        <RoundedBox args={[W + 0.06, H + 0.06, D]} radius={0.05} smoothness={4} position={[0, 0, -0.06]}>
          <meshStandardMaterial ref={borderRef} color={accentColor} emissive={accentColor} emissiveIntensity={0.6} roughness={0.1} metalness={0.5} transparent opacity={0.3} />
        </RoundedBox>

        {/* Dark frame */}
        <RoundedBox args={[W, H, D]} radius={0.04} smoothness={4} position={[0, 0, -0.03]}>
          <meshStandardMaterial color="#0d0d0d" roughness={0.15} metalness={0.7} />
        </RoundedBox>

        {/* Project screenshot */}
        <mesh position={[0, 0.12, 0.03]}>
          <planeGeometry args={[W - 0.12, H - 0.7]} />
          <meshBasicMaterial map={texture} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>

        {/* Bottom bar — project name + tags */}
        <group position={[0, -H / 2 + 0.18, 0.01]}>
          <mesh>
            <planeGeometry args={[W, 0.55]} />
            <meshBasicMaterial color="#0a0a0a" transparent opacity={0.92} depthWrite={false} />
          </mesh>
          {/* Accent line */}
          <mesh position={[0, 0.275, 0.002]}>
            <planeGeometry args={[W, 0.015]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <Text
            position={[-(W - 0.2) / 2, 0.04, 0.003]}
            fontSize={0.22}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
            font="/Inter-Regular.ttf"
            letterSpacing={-0.01}
            fontWeight={700}
          >
            {label}
          </Text>
          <Text
            position={[-(W - 0.2) / 2, -0.12, 0.003]}
            fontSize={0.075}
            color="rgba(255,255,255,0.4)"
            anchorX="left"
            anchorY="middle"
            font="/Inter-Regular.ttf"
            letterSpacing={0.08}
          >
            {tags.toUpperCase()}
          </Text>
        </group>

        {/* Initials badge — top right */}
        <group position={[W / 2 - 0.28, H / 2 - 0.28, 0.015]}>
          <mesh>
            <circleGeometry args={[0.16, 24]} />
            <meshBasicMaterial color="#0a0a0a" transparent opacity={0.9} depthWrite={false} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.15, 0.165, 24]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.8} depthWrite={false} />
          </mesh>
          <Text position={[0, 0, 0.002]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle" font="/Inter-Regular.ttf">
            {initials}
          </Text>
        </group>

        {/* CTA when near — always rendered, scaled in/out via useFrame */}
        <group ref={ctaRef} position={[0, -H / 2 - 0.26, 0.01]} scale={[0, 0, 0]}>
          <mesh position={[0, 0, -0.005]}>
            <planeGeometry args={[2.2, 0.55]} />
            <meshBasicMaterial color={accentColor} transparent opacity={0.15} depthWrite={false} />
          </mesh>
          <RoundedBox args={[1.6, 0.32, 0.04]} radius={0.16} smoothness={2}>
            <meshBasicMaterial color={accentColor} />
          </RoundedBox>
          <Text position={[0, 0, 0.03]} fontSize={0.1} color="#0a0e0c" anchorX="center" anchorY="middle" font="/Inter-Regular.ttf" letterSpacing={0.12}>
            PRESS ENTER
          </Text>
        </group>
      </Billboard>
    </group>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function ProjectHotspot({
  position,
  label,
  tags = '',
  image,
  onProximityChange,
}: ProjectHotspotProps) {
  const group = useRef<THREE.Group>(null!)
  const isNearRef = useRef(false)
  const glowRef = useRef<THREE.PointLight>(null!)
  const glowRef2 = useRef<THREE.PointLight>(null!)
  const glowRef3 = useRef<THREE.PointLight>(null!)

  const texture = useTexture(image)
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
  }, [texture])

  const accentColor = useMemo(() => {
    const colors = ['#00e86a', '#60a5fa', '#f472b6']
    return colors[label.charCodeAt(0) % colors.length]
  }, [label])

  useFrame(() => {
    if (!group.current) return
    const carPos = carStore.position
    const dx = carPos.x - position[0]
    const dz = carPos.z - position[2]
    const distSq = dx * dx + dz * dz
    const near = distSq < 36 // 6^2
    const wasNear = isNearRef.current

    if (near !== wasNear) {
      isNearRef.current = near
      onProximityChange?.(label, near)
    }

    const nearF = near ? 1 : 0
    if (glowRef.current) glowRef.current.intensity += (nearF * 3.5 + 1.5 - glowRef.current.intensity) * 0.05
    if (glowRef2.current) glowRef2.current.intensity += (nearF * 1.5 + 0.4 - glowRef2.current.intensity) * 0.05
    if (glowRef3.current) glowRef3.current.intensity += (nearF * 1 + 0.3 - glowRef3.current.intensity) * 0.05
  })

  return (
    <group ref={group} position={position}>
      <GroundMarker isNearRef={isNearRef} accentColor={accentColor} />
      <Pedestal isNearRef={isNearRef} accentColor={accentColor} />
      <Beacon isNearRef={isNearRef} accentColor={accentColor} />
      <FloatingOrbs isNearRef={isNearRef} accentColor={accentColor} />
      <ProjectCard label={label} tags={tags} texture={texture} isNearRef={isNearRef} accentColor={accentColor} />

      {/* Key light */}
      <pointLight ref={glowRef} position={[0, 5, 4]} intensity={1.5} distance={14} color="#fff5ee" />
      {/* Accent fill */}
      <pointLight ref={glowRef2} position={[3, 2, 2]} intensity={0.4} distance={10} color={accentColor} />
      {/* Rim */}
      <pointLight ref={glowRef3} position={[-2, 2.5, -2]} intensity={0.3} distance={10} color={accentColor} />
    </group>
  )
}
