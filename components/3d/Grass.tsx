'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

// ─── TUNABLE PARAMETERS ───────────────────────────────────────────
const GRASS_COUNT = 990000           // Number of grass blades
const FIELD_SIZE = 50               // Radius of grass field
const BLADE_HEIGHT = 0.45           // Base height of a blade
const BLADE_WIDTH = 0.06            // Width at base
const WIND_SPEED = 0.8              // Wind wave speed
const WIND_STRENGTH = 0.15          // Max sway displacement
const FLUTTER_SPEED = 2.5           // Micro-flutter speed
const FLUTTER_STRENGTH = 0.03       // Micro-flutter displacement
const CAR_BEND_RADIUS = 1.8         // How far car bends grass
const CAR_BEND_STRENGTH = 0.6       // How much car bends grass
const LOD_INNER_RADIUS = 40         // Full density within this
const LOD_OUTER_RADIUS = 55         // Grass fades to nothing here
 
// ─── CUSTOM SHADER ────────────────────────────────────────────────
const grassVertexShader = `
  precision highp float;

  uniform float uTime;
  uniform float uWindSpeed;
  uniform float uWindStrength;
  uniform float uFlutterSpeed;
  uniform float uFlutterStrength;
  uniform float uBladeHeight;
  uniform float uBladeWidth;
  uniform float uLodInner;
  uniform float uLodOuter;
  uniform vec3 uCarPosition;
  uniform float uCarBendRadius;
  uniform float uCarBendStrength;
  uniform float uCameraRadius;

  attribute vec3 instanceOffset;   // xyz position
  attribute float instanceRotation; // y-axis rotation in radians
  attribute vec3 instanceScale;    // x, y, z scale (y = height multiplier)
  attribute vec3 instanceColor;    // per-blade color tint

  varying vec3 vColor;
  varying float vHeight;           // 0 at base, 1 at tip
  varying float vAoFactor;         // for ambient occlusion
  varying vec3 vWorldPosition;

  // Simplex noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  void main() {
    // Local vertex position: blade is a thin triangle strip
    // x = lateral offset, y = height (0 to 1), z = 0
    float heightFactor = instanceScale.y;
    float localHeight = position.y * uBladeHeight * heightFactor;
    float localWidth = position.x * uBladeWidth * instanceScale.x;

    // Per-blade UV height (0 = base, 1 = tip)
    vHeight = position.y;

    // ─── WIND ANIMATION ───────────────────────────────────
    // World position of this blade's base
    vec3 worldBase = instanceOffset;

    // Main wind sway — large noise wave across the field
    float windPhase = worldBase.x * 0.08 + worldBase.z * 0.06 + uTime * uWindSpeed;
    float windNoise = snoise(vec3(windPhase, 0.0, worldBase.z * 0.04));
    float windDisplace = windNoise * uWindStrength * vHeight * vHeight;

    // Second faster noise layer for micro-flutter
    float flutterPhase = worldBase.x * 0.25 + worldBase.z * 0.2 + uTime * uFlutterSpeed;
    float flutterNoise = snoise(vec3(flutterPhase, 1.0, worldBase.z * 0.15));
    float flutterDisplace = flutterNoise * uFlutterStrength * vHeight;

    // Combined sway in local X direction
    float totalSway = windDisplace + flutterDisplace;

    // ─── CAR INTERACTION ──────────────────────────────────
    vec3 toCar = worldBase - uCarPosition;
    float distToCar = length(toCar.xz);
    float carInfluence = 1.0 - smoothstep(0.0, uCarBendRadius, distToCar);
    carInfluence = carInfluence * carInfluence; // quadratic falloff
    float carBend = carInfluence * uCarBendStrength * vHeight;
    // Bend away from car
    vec2 bendDir = normalize(toCar.xz + 0.001);
    totalSway += bendDir.x * carBend;

    // ─── APPLY DISPLACEMENT ───────────────────────────────
    // Rotate blade randomly around Y
    float cosR = cos(instanceRotation);
    float sinR = sin(instanceRotation);

    // Position in world space
    vec3 displaced = vec3(0.0);
    displaced.x = localWidth * cosR + totalSway * cosR;
    displaced.y = localHeight;
    displaced.z = -localWidth * sinR + totalSway * sinR;

    displaced += instanceOffset;

    // ─── LOD FADE ─────────────────────────────────────────
    float distToCamera = length(displaced.xz);
    float lodFade = 1.0 - smoothstep(uLodInner, uLodOuter, distToCamera);

    vColor = instanceColor;
    vAoFactor = vHeight; // used for fake AO in fragment
    vWorldPosition = displaced;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const grassFragmentShader = `
  precision highp float;

  varying vec3 vColor;
  varying float vHeight;
  varying float vAoFactor;
  varying vec3 vWorldPosition;

  uniform vec3 uSunDirection;
  uniform vec3 uSunColor;
  uniform vec3 uAmbientColor;
  uniform vec3 uFogColor;

  void main() {
    // ─── BASE COLOR WITH HEIGHT GRADIENT ──────────────────
    vec3 baseColorDark = vColor * vec3(0.22, 0.40, 0.18);
    vec3 baseColorMid = vColor * vec3(0.32, 0.55, 0.22);
    vec3 baseColorLight = vColor * vec3(0.48, 0.68, 0.25);
    float h = vHeight;
    vec3 baseColor = h < 0.4
      ? mix(baseColorDark, baseColorMid, h / 0.4)
      : mix(baseColorMid, baseColorLight, (h - 0.4) / 0.6);

    // ─── SUBSURFACE SCATTERING (light through thin tips) ──
    vec3 sunDir = normalize(uSunDirection);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float backLight = pow(max(dot(viewDir, -sunDir), 0.0), 2.0);
    float subsurface = backLight * h * 0.4;
    vec3 sssColor = vec3(0.35, 0.65, 0.15) * subsurface;

    // ─── FAKE AMBIENT OCCLUSION ───────────────────────────
    float ao = mix(0.25, 1.0, h);
    ao = ao * ao;

    // ─── LIGHTING ─────────────────────────────────────────
    float NdotL = dot(normalize(vec3(0.0, 1.0, 0.0)), sunDir);
    float diffuse = max(NdotL, 0.0) * 0.75 + 0.25;

    // Specular highlight on wet/glossy tips
    vec3 halfVec = normalize(sunDir + viewDir);
    float spec = pow(max(dot(normalize(vec3(0.0, 1.0, 0.0)), halfVec), 0.0), 32.0) * 0.15 * h;

    // Rim / backlight scatter
    float rimLight = pow(1.0 - max(dot(viewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
    rimLight *= max(dot(sunDir, viewDir), 0.0) * 0.35;

    // ─── FINAL COLOR ──────────────────────────────────────
    vec3 ambient = baseColor * uAmbientColor * 0.55;
    vec3 lit = baseColor * uSunColor * diffuse;
    vec3 rim = vec3(0.4, 0.7, 0.2) * rimLight;

    vec3 finalColor = (ambient + lit + rim + sssColor) * ao;
    finalColor += vec3(1.0, 1.0, 0.95) * spec;

    // ─── DISTANCE FOG (blend toward sky) ──────────────────
    float dist = length(vWorldPosition.xz);
    float fogFactor = smoothstep(30.0, 80.0, dist);
    finalColor = mix(finalColor, uFogColor, fogFactor * 0.7);

    // Tone map (ACES-ish)
    finalColor = finalColor * (2.51 * finalColor + 0.03) / (finalColor * (2.43 * finalColor + 0.59) + 0.14);
    finalColor = clamp(finalColor, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// ─── BLADE GEOMETRY ───────────────────────────────────────────────
function createBladeGeometry(): THREE.BufferGeometry {
  // Each blade: 2 segments tall, 3 vertices wide at base, tapers to 1 at tip
  // Triangle strip: 6 vertices total (2 rows of 3)
  const segments = 3;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments; // 0 to 1 (base to tip)
    const width = (1.0 - t * 0.95); // Taper: full width at base, nearly 0 at tip
    const y = t; // Height as 0-1 value
    const bend = t * t * 0.12;
    const fold = (1.0 - t) * 0.025;
    // Three vertices per row: left, center, right (with non-coplanar Z)
    positions.push(-width * 0.5, y, bend - fold); // left
    positions.push(0, y, bend); // center (ridge)
    positions.push(width * 0.5, y, bend - fold); // right
  }

  for (let i = 0; i < segments; i++) {
    const row = i * 3;
    const nextRow = (i + 1) * 3;
    // Two triangles per segment
    indices.push(row, nextRow, row + 1);
    indices.push(row + 1, nextRow, nextRow + 1);
    indices.push(row + 1, nextRow, row + 2);
    indices.push(row + 2, nextRow, nextRow + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── COMPONENT ────────────────────────────────────────────────────
export default function Grass() {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const materialRef = useRef<THREE.ShaderMaterial>(null!)
  const { camera } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Generate per-instance data
  const { offsets, rotations, scales, colors } = useMemo(() => {
    const off = new Float32Array(GRASS_COUNT * 3)
    const rot = new Float32Array(GRASS_COUNT)
    const sc = new Float32Array(GRASS_COUNT * 3)
    const col = new Float32Array(GRASS_COUNT * 3)

    const colorPalette = [
      [0.35, 0.55, 0.25],  // deep green
      [0.40, 0.60, 0.28],  // mid green
      [0.48, 0.68, 0.30],  // light green
      [0.42, 0.58, 0.22],  // olive
      [0.38, 0.52, 0.20],  // dark olive
    ]

    for (let i = 0; i < GRASS_COUNT; i++) {
      const i3 = i * 3

      // Scatter across circular field with randomization (rejection sampling: never on road)
      let x = 0
      let z = 0
      while (true) {
        const angle = Math.random() * Math.PI * 2
        const radius = Math.sqrt(Math.random()) * FIELD_SIZE
        x = Math.cos(angle) * radius
        z = Math.sin(angle) * radius
        // Road exclusion: supports multiple roads.
        const ROAD_HALF_WIDTH = 2.2
        const ROAD_BANDS = [
          { axis: 'x', center: 0 },
          { axis: 'z', center: 0 },
          // Add additional roads here, e.g.
          // { axis: 'x', center: 12 },
          // { axis: 'z', center: -8 },
        ]
        const onRoad = ROAD_BANDS.some((road) =>
          road.axis === 'x'
            ? Math.abs(x - road.center) <= ROAD_HALF_WIDTH
            : Math.abs(z - road.center) <= ROAD_HALF_WIDTH
        )
        if (!onRoad) break
      }
      off[i3] = x
      off[i3 + 1] = 0
      off[i3 + 2] = z

      // Random Y rotation
      rot[i] = Math.random() * Math.PI * 2

      // Random scale
      const heightVar = 0.7 + Math.random() * 0.6   // 0.7–1.3x
      const widthVar = 0.8 + Math.random() * 0.4    // 0.8–1.2x
      sc[i3] = widthVar
      sc[i3 + 1] = heightVar
      sc[i3 + 2] = 1.0

      // Random color from palette
      const c = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      col[i3] = c[0] + (Math.random() - 0.5) * 0.06
      col[i3 + 1] = c[1] + (Math.random() - 0.5) * 0.06
      col[i3 + 2] = c[2] + (Math.random() - 0.5) * 0.04
    }

    return { offsets: off, rotations: rot, scales: sc, colors: col }
  }, [])

  // Blade geometry
  const bladeGeo = useMemo(() => createBladeGeometry(), [])

  // Shader material
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWindSpeed: { value: WIND_SPEED },
    uWindStrength: { value: WIND_STRENGTH },
    uFlutterSpeed: { value: FLUTTER_SPEED },
    uFlutterStrength: { value: FLUTTER_STRENGTH },
    uBladeHeight: { value: BLADE_HEIGHT },
    uBladeWidth: { value: BLADE_WIDTH },
    uLodInner: { value: LOD_INNER_RADIUS },
    uLodOuter: { value: LOD_OUTER_RADIUS },
    uCarPosition: { value: new THREE.Vector3(0, 0, 0) },
    uCarBendRadius: { value: CAR_BEND_RADIUS },
    uCarBendStrength: { value: CAR_BEND_STRENGTH },
    uCameraRadius: { value: LOD_OUTER_RADIUS },
    uSunDirection: { value: new THREE.Vector3(0.4, 0.7, 0.3).normalize() },
    uSunColor: { value: new THREE.Vector3(1.0, 0.92, 0.78) },
    uAmbientColor: { value: new THREE.Vector3(0.4, 0.5, 0.55) },
    uFogColor: { value: new THREE.Vector3(0.72, 0.81, 0.88) },
  }), [])

  // Set instance attributes on first mount
  useEffect(() => {
    if (!meshRef.current) return
    const mesh = meshRef.current

    // Set instance matrices from offset/rotation/scale
    for (let i = 0; i < GRASS_COUNT; i++) {
      const i3 = i * 3
      dummy.position.set(offsets[i3], offsets[i3 + 1], offsets[i3 + 2])
      dummy.rotation.set(0, rotations[i], 0)
      dummy.scale.set(scales[i3], scales[i3 + 1], scales[i3 + 2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    // Set instance color
    const colorAttr = new Float32Array(GRASS_COUNT * 3)
    colorAttr.set(colors)
    mesh.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(colorAttr, 3)
    )

    // Set custom instance attributes
    mesh.geometry.setAttribute(
      'instanceOffset',
      new THREE.InstancedBufferAttribute(offsets, 3)
    )
    mesh.geometry.setAttribute(
      'instanceRotation',
      new THREE.InstancedBufferAttribute(rotations, 1)
    )
    mesh.geometry.setAttribute(
      'instanceScale',
      new THREE.InstancedBufferAttribute(scales, 3)
    )
    mesh.geometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(colors, 3)
    )
  }, [offsets, rotations, scales, colors, dummy])

  // Animation loop
  useFrame((state, delta) => {
    if (!materialRef.current) return

    const t = state.clock.elapsedTime
    materialRef.current.uniforms.uTime.value = t

    // Update car position for interaction
    materialRef.current.uniforms.uCarPosition.value.set(
      carStore.position.x,
      0,
      carStore.position.z
    )
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[bladeGeo, undefined, GRASS_COUNT]}
      frustumCulled={false}
      receiveShadow
    >
      <shaderMaterial
        ref={materialRef}
        vertexShader={grassVertexShader}
        fragmentShader={grassFragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        depthWrite={true}
      />
    </instancedMesh>
  )
}
