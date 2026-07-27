'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Billboard, Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { carStore } from './store'

interface ProjectHotspotProps {
  position: [number, number, number]
  label: string
  image: string
  onProximityChange?: (label: string, isNear: boolean) => void
}

// ─── GROUND RING PULSE ────────────────────────────────────────────
function GroundPulse({ isNear }: { isNear: boolean }) {
  const ring1Ref = useRef<THREE.Mesh>(null!)
  const ring2Ref = useRef<THREE.Mesh>(null!)
  const ring3Ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const rings = [ring1Ref, ring2Ref, ring3Ref]
    rings.forEach((ring, i) => {
      if (!ring.current) return
      const phase = (t * 0.4 + i * 0.33) % 1
      const scale = 0.8 + phase * 2.5
      ring.current.scale.set(scale, scale, 1)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity =
        (1 - phase) * (isNear ? 0.25 : 0.12)
    })
  })

  return (
    <group position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[ring1Ref, ring2Ref, ring3Ref].map((ref, i) => (
        <mesh key={i} ref={ref}>
          <ringGeometry args={[0.9, 1.0, 48]} />
          <meshBasicMaterial
            color={isNear ? '#00e86a' : '#00c853'}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── BEACON BEAM ──────────────────────────────────────────────────
function BeaconBeam({ isNear }: { isNear: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    if (!beamRef.current) return
    const t = state.clock.elapsedTime
    const mat = beamRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = isNear
      ? 0.08 + Math.sin(t * 2) * 0.03
      : 0.03 + Math.sin(t * 1.5) * 0.015
  })

  return (
    <mesh ref={beamRef} position={[0, 4.5, 0]}>
      <cylinderGeometry args={[0.06, 0.35, 9, 12, 1, true]} />
      <meshBasicMaterial
        color="#00c853"
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── PEDESTAL BASE ────────────────────────────────────────────────
function Pedestal({ isNear }: { isNear: boolean }) {
  const glowRef = useRef<THREE.PointLight>(null!)

  useFrame((state) => {
    if (!glowRef.current) return
    const t = state.clock.elapsedTime
    glowRef.current.intensity = isNear
      ? 2.5 + Math.sin(t * 2) * 0.5
      : 1.2 + Math.sin(t * 1.2) * 0.3
  })

  return (
    <group>
      {/* Base disc */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[0.7, 0.8, 0.08, 32]} />
        <meshStandardMaterial
          color="#2a2a2a"
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      {/* Accent ring on base edge */}
      <mesh position={[0, 0.085, 0]}>
        <torusGeometry args={[0.75, 0.015, 8, 48]} />
        <meshStandardMaterial
          color={isNear ? '#00e86a' : '#00c853'}
          emissive={isNear ? '#00e86a' : '#00c853'}
          emissiveIntensity={isNear ? 1.5 : 0.6}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 2.1, 8]} />
        <meshStandardMaterial
          color="#c8c0b4"
          roughness={0.35}
          metalness={0.4}
        />
      </mesh>
      {/* Accent ring mid-pole */}
      <mesh position={[0, 0.85, 0]}>
        <torusGeometry args={[0.045, 0.008, 8, 16]} />
        <meshStandardMaterial
          color="#00c853"
          emissive="#00c853"
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 2.16, 0]}>
        <cylinderGeometry args={[0.045, 0.025, 0.06, 16]} />
        <meshStandardMaterial
          color="#c8c0b4"
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>
      <pointLight
        ref={glowRef}
        position={[0, 0.3, 0]}
        distance={5}
        color="#00c853"
      />
    </group>
  )
}

// ─── PROJECT CARD (3D) ────────────────────────────────────────────
function ProjectCard({
  label,
  texture,
  isNear,
  cardWidth,
  cardHeight,
}: {
  label: string
  texture: THREE.Texture
  isNear: boolean
  cardWidth: number
  cardHeight: number
}) {
  const cardRef = useRef<THREE.Group>(null!)
  const frameMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.2,
        metalness: 0.6,
      }),
    []
  )
  const whiteMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
      }),
    []
  )

  useFrame((state) => {
    if (!cardRef.current) return
    const t = state.clock.elapsedTime
    // Gentle hover bob
    const targetY = isNear ? 3.1 : 2.8
    cardRef.current.position.y = THREE.MathUtils.lerp(
      cardRef.current.position.y,
      targetY,
      0.04
    )
    cardRef.current.position.y += Math.sin(t * 0.8) * 0.04
    // Subtle tilt
    cardRef.current.rotation.y = Math.sin(t * 0.3) * 0.03
    // Scale pop when near
    const s = THREE.MathUtils.lerp(
      cardRef.current.scale.x,
      isNear ? 1.08 : 1.0,
      0.05
    )
    cardRef.current.scale.set(s, s, s)
  })

  const fw = cardWidth + 0.14 // frame width
  const fh = cardHeight + 0.14
  const fd = 0.06 // frame depth

  return (
    <group ref={cardRef} position={[0, 2.8, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Frame backing */}
        <mesh position={[0, -0.04, -fd / 2 - 0.005]}>
          <planeGeometry args={[fw, fh]} />
          <primitive object={frameMat} attach="material" />
        </mesh>

        {/* White inner border */}
        <mesh position={[0, -0.04, -fd / 2 + 0.001]}>
          <planeGeometry args={[cardWidth + 0.06, cardHeight + 0.06]} />
          <primitive object={whiteMat} attach="material" />
        </mesh>

        {/* Project image */}
        <mesh position={[0, -0.04, 0]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshBasicMaterial map={texture} />
        </mesh>

        {/* Project name plate */}
        <group position={[0, -cardHeight / 2 - 0.2, 0]}>
          {/* Nameplate background */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[cardWidth + 0.14, 0.32]} />
            <meshBasicMaterial color="#111111" transparent opacity={0.85} />
          </mesh>
          <Text
            position={[0, 0, 0]}
            fontSize={0.14}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            font="/Inter-Regular.ttf"
            letterSpacing={0.04}
          >
            {label}
          </Text>
          {/* Accent underline */}
          <mesh position={[0, -0.12, 0]}>
            <planeGeometry args={[0.5, 0.012]} />
            <meshBasicMaterial
              color={isNear ? '#00e86a' : '#00c853'}
            />
          </mesh>
        </group>

        {/* "View Project" badge — only when near */}
        {isNear && (
          <group position={[0, -cardHeight / 2 - 0.5, 0]}>
            <mesh>
              <planeGeometry args={[1.1, 0.26]} />
              <meshBasicMaterial color="#00c853" />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.1}
              color="#0a0e0c"
              anchorX="center"
              anchorY="middle"
              font="/Inter-Regular.ttf"
              letterSpacing={0.08}
            >
              Press Enter
            </Text>
          </group>
        )}
      </Billboard>
    </group>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function ProjectHotspot({
  position,
  label,
  image,
  onProximityChange,
}: ProjectHotspotProps) {
  const group = useRef<THREE.Group>(null!)
  const [isNear, setIsNear] = useState(false)

  const texture = useLoader(THREE.TextureLoader, image)
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
  }, [texture])

  const cardWidth = 2.0
  const cardHeight = 1.25

  useFrame(() => {
    if (!group.current) return
    const carPos = carStore.position
    const dx = carPos.x - position[0]
    const dz = carPos.z - position[2]
    const dist = Math.sqrt(dx * dx + dz * dz)
    const near = dist < 6

    if (near !== isNear) {
      setIsNear(near)
      onProximityChange?.(label, near)
    }
  })

  return (
    <group ref={group} position={position}>
      <Pedestal isNear={isNear} />
      <BeaconBeam isNear={isNear} />
      <GroundPulse isNear={isNear} />
      <ProjectCard
        label={label}
        texture={texture}
        isNear={isNear}
        cardWidth={cardWidth}
        cardHeight={cardHeight}
      />

      {/* Spot light on card */}
      <spotLight
        position={[0, 5, 2]}
        target-position={[0, 2.8, 0]}
        angle={0.4}
        penumbra={0.6}
        intensity={isNear ? 3.0 : 1.5}
        distance={12}
        color="#ffffff"
        castShadow={false}
      />
    </group>
  )
}
