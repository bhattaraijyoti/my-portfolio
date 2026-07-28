'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import Grass from './Grass'

const FOG_COLOR = new THREE.Color('#b0c4d8')

// ─── GROUND SHADER ────────────────────────────────────────────────
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
  uniform vec3 uSnowCenter;
  uniform vec3 uSlushEdge;
  uniform float uSnowRadius;
  uniform float uSlushRadius;
  uniform float uFadeRadius;

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
    vec2 samplePos = vUv * 200.0 - 100.0;
    float dist = vDist;

    float n1 = noise(samplePos * 0.5) * 0.08;
    float n2 = noise(samplePos * 1.5) * 0.04;
    float n3 = noise(samplePos * 4.0) * 0.02;
    float texNoise = n1 + n2 + n3;

    vec3 snowColor = uSnowCenter + vec3(texNoise * 0.3, texNoise * 0.25, texNoise * 0.15);
    vec3 slushColor = uSlushEdge + vec3(texNoise * 0.5, texNoise * 0.4, texNoise * 0.3);

    vec3 color;
    if (dist < uSnowRadius) {
      color = snowColor;
    } else if (dist < uSlushRadius) {
      float t = smoothstep(uSnowRadius, uSlushRadius, dist);
      color = mix(snowColor, slushColor, t);
    } else {
      float t = smoothstep(uSlushRadius, uFadeRadius, dist);
      color = mix(slushColor, uFogColor, t);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`

// ─── GROUND PLANE ─────────────────────────────────────────────────
function Ground() {
  const uniforms = useMemo(() => ({
    uFogColor: { value: FOG_COLOR },
    uSnowCenter: { value: new THREE.Color('#d8dce8') },
    uSlushEdge: { value: new THREE.Color('#a0a8b8') },
    uSnowRadius: { value: 32.0 },
    uSlushRadius: { value: 50.0 },
    uFadeRadius: { value: 80.0 },
  }), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.006, 0]} receiveShadow>
      <circleGeometry args={[100, 48]} />
      <shaderMaterial
        vertexShader={groundVertexShader}
        fragmentShader={groundFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ─── ROAD SHOULDER ────────────────────────────────────────────────
function RoadShoulder({ rotation, position, args }: {
  rotation: [number, number, number]
  position: [number, number, number]
  args: [number, number]
}) {
  return (
    <mesh rotation={rotation} position={position} receiveShadow>
      <planeGeometry args={args} />
      <meshStandardMaterial
        color="#8090a0"
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  )
}

// ─── ROAD ─────────────────────────────────────────────────────────
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
      <mesh rotation={rot} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[4.4, 120]} />
        <meshStandardMaterial color="#505860" roughness={0.85} metalness={0.02} />
      </mesh>

      <RoadShoulder rotation={rot} position={[-2.45, 0.003, 0]} args={[0.6, 120]} />
      <RoadShoulder rotation={rot} position={[2.45, 0.003, 0]} args={[0.6, 120]} />

      <mesh rotation={rot} position={[-2.15, 0.011, 0]} receiveShadow>
        <planeGeometry args={[0.10, 120]} />
        <meshStandardMaterial color="#90a0b0" roughness={0.7} />
      </mesh>
      <mesh rotation={rot} position={[2.15, 0.011, 0]} receiveShadow>
        <planeGeometry args={[0.10, 120]} />
        <meshStandardMaterial color="#90a0b0" roughness={0.7} />
      </mesh>

      <lineSegments geometry={dashes}>
        <lineBasicMaterial color="#7080a0" transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

// ─── ROAD CROSS ───────────────────────────────────────────────────
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
      <mesh rotation={rot} position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[120, 4.4]} />
        <meshStandardMaterial color="#505860" roughness={0.85} metalness={0.02} />
      </mesh>

      <RoadShoulder rotation={rot} position={[0, 0.003, -2.45]} args={[120, 0.6]} />
      <RoadShoulder rotation={rot} position={[0, 0.003, 2.45]} args={[120, 0.6]} />

      <mesh rotation={rot} position={[0, 0.011, -2.15]} receiveShadow>
        <planeGeometry args={[120, 0.10]} />
        <meshStandardMaterial color="#90a0b0" roughness={0.7} />
      </mesh>
      <mesh rotation={rot} position={[0, 0.011, 2.15]} receiveShadow>
        <planeGeometry args={[120, 0.10]} />
        <meshStandardMaterial color="#90a0b0" roughness={0.7} />
      </mesh>

      <lineSegments geometry={dashes}>
        <lineBasicMaterial color="#7080a0" transparent opacity={0.6} />
      </lineSegments>
    </group>
  )
}

// ─── ROAD INTERSECTION COVER ──────────────────────────────────────
function RoadIntersection() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]} receiveShadow>
      <planeGeometry args={[4.6, 4.6]} />
      <meshStandardMaterial color="#505860" roughness={0.85} metalness={0.02} />
    </mesh>
  )
}

// ─── DISTANT HILLS (snow-covered) ─────────────────────────────────
function DistantHills() {
  const hills = useMemo(() => {
    const meshes: React.ReactElement[] = []
    const hillCount = 30
    for (let i = 0; i < hillCount; i++) {
      const angle = (i / hillCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
      const dist = 55 + Math.random() * 35
      const x = Math.cos(angle) * dist
      const z = Math.sin(angle) * dist
      const scaleX = 10 + Math.random() * 18
      const scaleY = 1.5 + Math.random() * 4.0
      const scaleZ = 8 + Math.random() * 14

      const fogBlend = Math.min((dist - 55) / 35, 1)
      const base = 0.6 + Math.random() * 0.15
      const r = Math.round((base + fogBlend * 0.28) * 255)
      const g = Math.round((base + 0.02 + fogBlend * 0.25) * 255)
      const b = Math.round((base + 0.08 + fogBlend * 0.22) * 255)
      meshes.push(
        <mesh
          key={`hill-${i}`}
          position={[x, scaleY * 0.22 - 0.35, z]}
          scale={[scaleX, scaleY, scaleZ]}
        >
          <sphereGeometry args={[1, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={`rgb(${r},${g},${b})`}
            roughness={0.9}
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

// ─── SNOW MOUND (replaces trees) ──────────────────────────────────
function SnowMounds() {
  const mounds = useMemo(() => {
    const meshes: React.ReactElement[] = []
    const count = 25
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 6 + Math.random() * 30
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      // Skip if on road
      if (Math.abs(x) < 3.2 && Math.abs(z) < 3.2) continue

      const scaleX = 1.5 + Math.random() * 3
      const scaleY = 0.3 + Math.random() * 0.6
      const scaleZ = 1.5 + Math.random() * 3
      const shade = 0.75 + Math.random() * 0.15

      meshes.push(
        <mesh
          key={`mound-${i}`}
          position={[x, scaleY * 0.15, z]}
          scale={[scaleX, scaleY, scaleZ]}
          receiveShadow
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={new THREE.Color().setRGB(shade, shade + 0.02, shade + 0.06)}
            roughness={0.85}
            metalness={0}
          />
        </mesh>
      )
    }
    return meshes
  }, [])

  return <>{mounds}</>
}

// ─── MAIN WORLD ───────────────────────────────────────────────────
export default function World() {
  return (
    <>
      <Road />
      <RoadCross />
      <RoadIntersection />
      <Ground />
      <Grass />
      <DistantHills />
      <SnowMounds />
    </>
  )
}
