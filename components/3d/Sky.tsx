'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uSunDir;
  varying vec3 vWorldPosition;

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314*r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g, l.zxy);
    vec3 i2 = max(g, l.zxy);
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
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float elevation = dir.y;

    // ── SKY GRADIENT ──────────────────────────────────────
    vec3 zenithColor = vec3(0.15, 0.32, 0.72);
    vec3 midColor = vec3(0.40, 0.62, 0.90);
    vec3 horizonColor = vec3(0.68, 0.80, 0.92);
    vec3 groundHaze = vec3(0.72, 0.80, 0.86);

    float t = pow(max(elevation, 0.0), 0.45);
    vec3 skyColor = mix(horizonColor, zenithColor, t);
    // Add a subtle warm mid-band
    float midBand = exp(-pow((elevation - 0.15) * 4.0, 2.0)) * 0.15;
    skyColor += vec3(1.0, 0.92, 0.78) * midBand;
    if (elevation < 0.0) {
      skyColor = mix(horizonColor, groundHaze, min(-elevation * 5.0, 1.0));
    }

    // ── SUN ───────────────────────────────────────────────
    float sunDot = dot(dir, normalize(uSunDir));
    // Sun disc — slightly larger, softer edge
    float sunDisc = smoothstep(0.9978, 0.9995, sunDot);
    vec3 sunColor = vec3(1.0, 0.96, 0.82);
    skyColor = mix(skyColor, sunColor, sunDisc);
    // Inner glow
    float sunGlow = pow(max(sunDot, 0.0), 48.0) * 0.7;
    skyColor += vec3(1.0, 0.88, 0.55) * sunGlow;
    // Mid-range warm halo
    float sunHalo = pow(max(sunDot, 0.0), 12.0) * 0.3;
    skyColor += vec3(1.0, 0.82, 0.5) * sunHalo;
    // Wide atmospheric haze near horizon
    float sunHaze = pow(max(sunDot, 0.0), 4.0) * 0.2;
    skyColor += vec3(0.92, 0.88, 0.78) * sunHaze * (1.0 - max(elevation, 0.0) * 1.5);

    // ── CLOUDS ────────────────────────────────────────────
    if (elevation > 0.0) {
      vec3 cloudPos = dir * 40.0;
      float scroll = uTime * 0.012;

      // Three octaves of noise for more natural cloud shapes
      float n1 = snoise(vec3(cloudPos.x * 0.008 + scroll, cloudPos.z * 0.008, scroll * 0.2));
      float n2 = snoise(vec3(cloudPos.x * 0.018 + scroll * 1.3, cloudPos.z * 0.015, scroll * 0.4));
      float n3 = snoise(vec3(cloudPos.x * 0.04 + scroll * 2.0, cloudPos.z * 0.035, scroll * 0.6));
      float cloudShape = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

      // Better coverage threshold with puffier shapes
      float coverage = smoothstep(-0.1, 0.45, cloudShape);

      // Thinner near horizon, thickest at 20-50 degree elevation
      float elevMask = smoothstep(0.0, 0.1, elevation) * (1.0 - smoothstep(0.6, 1.0, elevation) * 0.3);
      coverage *= elevMask;

      // Cloud lighting — warmer, more dimension
      vec3 cloudLight = vec3(1.0, 0.97, 0.93);
      vec3 cloudShadow = vec3(0.58, 0.65, 0.78);
      float sunFacing = pow(max(sunDot, 0.0), 2.5);
      vec3 cloudColor = mix(cloudShadow, cloudLight, sunFacing * 0.6 + 0.4);

      // Warm orange/gold rim on sunlit edges
      float edgeLight = pow(max(sunDot, 0.0), 12.0) * 0.35;
      cloudColor += vec3(1.0, 0.65, 0.25) * edgeLight;

      // Soft underside shadow
      float underside = smoothstep(0.0, 0.3, elevation) * (1.0 - smoothstep(0.3, 0.6, elevation));
      cloudColor = mix(cloudColor, cloudShadow * 0.9, underside * 0.2);

      skyColor = mix(skyColor, cloudColor, coverage * 0.8);
    }

    // ── HORIZON BAND ──────────────────────────────────────
    float horizonBand = exp(-abs(elevation) * 8.0) * 0.15;
    skyColor += vec3(0.95, 0.92, 0.88) * horizonBand;

    gl_FragColor = vec4(skyColor, 1.0);
  }
`

export default function Sky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.4, 0.7, 0.3).normalize() },
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[90, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  )
}
