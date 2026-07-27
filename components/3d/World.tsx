'use client'

import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Grass from './Grass'

const FOG_COLOR = new THREE.Color('#b8cfe0')

// ─── GROUND SHADER ────────────────────────────────────────────────
// Blends from ground green near center → dirt brown → fog color at edges
const groundVertexShader = `
  varying vec2 vUv;
  varying float vDist;
  void main() {
    vUv = uv;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vDist = length(worldPos.xz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const groundFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  varying float vDist;

  uniform vec3 uFogColor;
  uniform vec3 uGreenCenter;
  uniform vec3 uDirtEdge;
  uniform float uGreenRadius;
  uniform float uDirtRadius;
  uniform float uFadeRadius;

  // Simple noise for texture
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    // Sample position from world XZ
    vec2 samplePos = vUv * 200.0 - 100.0;
    float dist = vDist;

    // Layered noise for natural ground variation
    float n1 = noise(samplePos * 0.5) * 0.12;
    float n2 = noise(samplePos * 1.5) * 0.06;
    float n3 = noise(samplePos * 4.0) * 0.03;
    float texNoise = n1 + n2 + n3;

    // Base green center
    vec3 greenColor = uGreenCenter + vec3(texNoise * 0.5, texNoise, texNoise * 0.3);

    // Dirt transition band (around road edges and at distance)
    vec3 dirtColor = uDirtEdge + vec3(texNoise * 0.8, texNoise * 0.6, texNoise * 0.4);

    // Blend: green → dirt → fog
    vec3 color;
    if (dist < uGreenRadius) {
      color = greenColor;
    } else if (dist < uDirtRadius) {
      float t = smoothstep(uGreenRadius, uDirtRadius, dist);
      color = mix(greenColor, dirtColor, t);
    } else {
      float t = smoothstep(uDirtRadius, uFadeRadius, dist);
      color = mix(dirtColor, uFogColor, t);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── GROUND PLANE ─────────────────────────────────────────────────
function Ground() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(() => ({
    uFogColor: { value: FOG_COLOR },
    uGreenCenter: { value: new THREE.Color('#3a6a28') },
    uDirtEdge: { value: new THREE.Color('#5a5038') },
    uGreenRadius: { value: 32.0 },
    uDirtRadius: { value: 50.0 },
    uFadeRadius: { value: 80.0 },
  }), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]} receiveShadow>
      <circleGeometry args={[100, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={groundVertexShader}
        fragmentShader={groundFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── ROAD SHOULDER (dirt strip) ───────────────────────────────────
function RoadShoulder({ rotation, position, args }: {
  rotation: [number, number, number]
  position: [number, number, number]
  args: [number, number]
}) {
  return (
    <mesh rotation={rotation} position={position} receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial
        color="#6b6352"
        roughness={0.95}
        metalness={0}
      />
    </mesh>
  )
}

// ─── ROAD with shoulders and fade ─────────────────────────────────
function Road() {
  const dashes = useMemo(() => {
    const pos: number[] = []
    for (let z = -55; z < 55; z += 1.8) {
      pos.push(0, 0.013, z, 0, 0.013, z + 0.8)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return geo
  }, [])

  const rot: [number, number, number] = [-Math.PI / 2, 0, 0]

  return (
    <group>
      {/* Main asphalt — extended length */}
      <mesh rotation={rot} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[4.4, 120]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Left dirt shoulder */}
      <RoadShoulder rotation={rot} position={[-2.45, 0.003, 0]} args={[0.6, 120]} />
      {/* Right dirt shoulder */}
      <RoadShoulder rotation={rot} position={[2.45, 0.003, 0]} args={[0.6, 120]} />

      {/* Left edge line */}
      <mesh rotation={rot} position={[-2.15, 0.011, 0]} receiveShadow>
        <planeGeometry args={[0.10, 120]} />
        <meshStandardMaterial color="#cccccc" roughness={0.7} />
      </mesh>
      {/* Right edge line */}
      <mesh rotation={rot} position={[2.15, 0.011, 0]} receiveShadow>
        <planeGeometry args={[0.10, 120]} />
        <meshStandardMaterial color="#cccccc" roughness={0.7} />
      </mesh>

      {/* Center dashes */}
      <lineSegments geometry={dashes}>
        <lineBasicMaterial color="#d4a017" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}

// ─── ROAD CROSS with shoulders ────────────────────────────────────
function RoadCross() {
  const dashes = useMemo(() => {
    const pos: number[] = []
    for (let x = -55; x < 55; x += 1.8) {
      pos.push(x, 0.013, 0, x + 0.8, 0.013, 0)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    return geo
  }, [])

  const rot: [number, number, number] = [-Math.PI / 2, 0, 0]

  return (
    <group>
      {/* Main asphalt cross */}
      <mesh rotation={rot} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[120, 4.4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.88} metalness={0.02} />
      </mesh>

      {/* Top dirt shoulder */}
      <RoadShoulder rotation={rot} position={[0, 0.003, -2.45]} args={[120, 0.6]} />
      {/* Bottom dirt shoulder */}
      <RoadShoulder rotation={rot} position={[0, 0.003, 2.45]} args={[120, 0.6]} />

      {/* Top edge line */}
      <mesh rotation={rot} position={[0, 0.011, -2.15]} receiveShadow>
        <planeGeometry args={[120, 0.10]} />
        <meshStandardMaterial color="#cccccc" roughness={0.7} />
      </mesh>
      {/* Bottom edge line */}
      <mesh rotation={rot} position={[0, 0.011, 2.15]} receiveShadow>
        <planeGeometry args={[120, 0.10]} />
        <meshStandardMaterial color="#cccccc" roughness={0.7} />
      </mesh>

      {/* Center dashes */}
      <lineSegments geometry={dashes}>
        <lineBasicMaterial color="#d4a017" transparent opacity={0.7} />
      </lineSegments>
    </group>
  )
}

// ─── ROAD INTERSECTION COVER ──────────────────────────────────────
// Smooth patch at the cross to avoid z-fighting between overlapping roads
function RoadIntersection() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} receiveShadow>
      <planeGeometry args={[4.6, 4.6]} />
      <meshStandardMaterial color="#3a3a3a" roughness={0.88} metalness={0.02} />
    </mesh>
  )
}

// ─── TREE ─────────────────────────────────────────────────────────
function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const trunkRef = useRef<THREE.Mesh>(null!)
  const foliageRef = useRef<THREE.Group>(null!)

  const seed = useMemo(() => {
    return Math.abs(position[0] * 374761393 + position[1] * 668265263 + position[2] * 2147483647) % 1000
  }, [position])

  const trunkGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.07, 0.1, 1.2, 8, 5, false)
    const posAttr = geometry.attributes.position
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i)
      const y = posAttr.getY(i)
      const z = posAttr.getZ(i)
      const noise = 0.02 * (Math.sin(seed + y * 90 + x * 5) + Math.cos(seed + z * 7))
      posAttr.setXYZ(i, x + noise, y, z + noise)
    }
    posAttr.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
  }, [seed])

  const foliageMeshes = useMemo(() => {
    const foliageCount = 3
    const meshes: JSX.Element[] = []
    const baseColors = [new THREE.Color('#2a5a2a'), new THREE.Color('#3a6a3a'), new THREE.Color('#2a4a2a')]

    for (let i = 0; i < foliageCount; i++) {
      const geometry = new THREE.IcosahedronGeometry(0.5 - i * 0.1, 2)
      const positionAttr = geometry.attributes.position
      const colorAttr = new THREE.BufferAttribute(new Float32Array(positionAttr.count * 3), 3)

      for (let j = 0; j < positionAttr.count; j++) {
        const x = positionAttr.getX(j)
        const y = positionAttr.getY(j)
        const z = positionAttr.getZ(j)
        const displacement = 0.05 * (Math.sin(seed + j * 3.14 + i) + Math.cos(seed + j * 2.71 + i))
        const normal = new THREE.Vector3(x, y, z).normalize()
        positionAttr.setXYZ(j, x + normal.x * displacement, y + normal.y * displacement, z + normal.z * displacement)
        const baseColor = baseColors[i].clone()
        const light = THREE.MathUtils.clamp(normal.y * 0.5 + 0.5, 0, 1)
        baseColor.offsetHSL(0, 0, (light - 0.5) * 0.18)
        colorAttr.setXYZ(j, baseColor.r, baseColor.g, baseColor.b)
      }

      geometry.setAttribute('color', colorAttr)
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      geometry.computeVertexNormals()

      const offsetX = Math.sin(seed * 0.01 + i * 2.17) * 0.18
      const offsetZ = Math.cos(seed * 0.01 + i * 1.73) * 0.18
      const scaleJitter = 0.9 + 0.2 * Math.sin(seed * 0.02 + i)

      meshes.push(
        <mesh
          key={`foliage-${i}`}
          position={[offsetX, 1.15 + i * 0.42, offsetZ]}
          scale={scaleJitter}
          castShadow
          receiveShadow
          geometry={geometry}
        >
          <meshStandardMaterial vertexColors roughness={0.85} metalness={0.02} />
        </mesh>
      )
    }
    return meshes
  }, [seed])

  useFrame(({ clock }) => {
    if (!foliageRef.current) return
    const t = clock.elapsedTime
    foliageRef.current.rotation.z = 0.05 * Math.sin(t * 2 + seed)
    foliageRef.current.rotation.x = 0.03 * Math.cos(t * 1.5 + seed)
  })

  const trunkColor = '#4a3a2a'

  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh ref={trunkRef} geometry={trunkGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[0.08, 0.25, 0]} rotation={[0, 0, Math.PI / 3]} castShadow>
        <cylinderGeometry args={[0.015, 0.025, 0.22, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[-0.07, 0.55, 0.02]} rotation={[0, 0, -Math.PI / 4]} castShadow>
        <cylinderGeometry args={[0.014, 0.022, 0.18, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0.03} />
      </mesh>
      <mesh position={[0.06, 0.82, -0.03]} rotation={[0, 0, Math.PI / 5]} castShadow>
        <cylinderGeometry args={[0.012, 0.02, 0.16, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} metalness={0.03} />
      </mesh>
      <group ref={foliageRef}>
        {foliageMeshes}
      </group>
    </group>
  )
}

// ─── DISTANT HILLS ────────────────────────────────────────────────
function DistantHills() {
  const hills = useMemo(() => {
    const meshes: React.ReactElement[] = []
    const hillCount = 35
    for (let i = 0; i < hillCount; i++) {
      const angle = (i / hillCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
      const dist = 55 + Math.random() * 35
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      const scaleX = 10 + Math.random() * 18
      const scaleY = 1.5 + Math.random() * 4.0
      const scaleZ = 8 + Math.random() * 14

      // Smooth fog blending: closer to fog color as distance increases
      const fogBlend = Math.min((dist - 55) / 35, 1)
      const baseGreen = 0.30 + Math.random() * 0.1
      const r = Math.round((0.25 + fogBlend * 0.48) * 255)
      const g = Math.round((baseGreen + fogBlend * 0.42) * 255)
      const b = Math.round((0.22 + fogBlend * 0.48) * 255)
      meshes.push(
        <mesh
          key={`hill-${i}`}
          position={[x, scaleY * 0.22 - 0.35, z]}
          scale={[scaleX, scaleY, scaleZ]}
        >
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={`rgb(${r},${g},${b})`}
            roughness={0.95}
            metalness={0}
            fog={true}
          />
        </mesh>
      )
    }
    return meshes
  }, [])

  return <>{hills}</>
}

// ─── DISTANT TREELINE ─────────────────────────────────────────────
function DistantTreeLine() {
  const trees = useMemo(() => {
    const meshes: React.ReactElement[] = []
    const count = 120
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.12
      const dist = 42 + Math.random() * 12
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      const h = 0.6 + Math.random() * 1.8
      const w = 0.2 + Math.random() * 0.4

      // Fog blend: further trees fade into the sky
      const fogBlend = Math.min((dist - 42) / 12, 1)
      const shade = 0.15 + Math.random() * 0.12
      const r = Math.round((shade * 0.5 + fogBlend * 0.55) * 255)
      const g = Math.round((shade + 0.12 + fogBlend * 0.5) * 255)
      const b = Math.round((shade * 0.35 + fogBlend * 0.55) * 255)

      meshes.push(
        <mesh key={`dt-${i}`} position={[x, h * 0.42 - 0.05, z]}>
          <coneGeometry args={[w, h, 5 + Math.floor(Math.random() * 3)]} />
          <meshStandardMaterial
            color={`rgb(${r},${g},${b})`}
            roughness={0.92}
            fog={true}
          />
        </mesh>
      )
    }
    return meshes
  }, [])

  return <>{trees}</>
}

// ─── MAIN WORLD ───────────────────────────────────────────────────
export default function World() {
  const trees = useMemo(() => {
    const positions: [number, number, number][] = []
    const scales: number[] = []
    const FIELD_RADIUS = 35
    const ROAD_HALF_WIDTH = 2.5
    const MIN_TREE_SPACING = 2.0
    const TREE_COUNT = 60

    for (let i = 0; i < TREE_COUNT; i++) {
      let x = 0, z = 0, attempts = 0
      while (attempts < 50) {
        const angle = Math.random() * Math.PI * 2
        const radius = 5 + Math.random() * (FIELD_RADIUS - 5)
        x = Math.cos(angle) * radius
        z = Math.sin(angle) * radius

        const onRoad =
          Math.abs(x) <= ROAD_HALF_WIDTH ||
          Math.abs(z) <= ROAD_HALF_WIDTH

        const tooClose = positions.some(
          ([px, , pz]) => Math.hypot(px - x, pz - z) < MIN_TREE_SPACING
        )

        if (!onRoad && !tooClose) break
        attempts++
      }
      if (attempts < 50) {
        positions.push([x, 0, z])
        scales.push(0.7 + Math.random() * 0.6)
      }
    }
    return { positions, scales }
  }, [])

  return (
    <>
      <Road />
      <RoadCross />
      <RoadIntersection />
      <Ground />
      <Grass />
      <DistantHills />
      <DistantTreeLine />
      {trees.positions.map((pos, idx) => (
        <Tree key={idx} position={pos} scale={trees.scales[idx]} />
      ))}
    </>
  )
}
