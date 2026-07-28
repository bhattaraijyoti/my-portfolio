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

    // ── SUNSET SKY GRADIENT ─────────────────────────────
    vec3 zenithColor   = vec3(0.08, 0.05, 0.22);  // deep indigo/navy
    vec3 upperColor    = vec3(0.22, 0.08, 0.32);  // purple
    vec3 midColor      = vec3(0.72, 0.18, 0.28);  // deep rose/crimson
    vec3 horizonColor  = vec3(0.98, 0.48, 0.15);  // hot orange
    vec3 sunGlowColor  = vec3(1.0, 0.65, 0.15);   // golden orange
    vec3 groundHaze    = vec3(0.35, 0.15, 0.18);  // warm dark

    float t = pow(max(elevation, 0.0), 0.5);
    vec3 skyColor;
    if (elevation < 0.15) {
      skyColor = mix(horizonColor, midColor, smoothstep(0.0, 0.15, elevation));
    } else if (elevation < 0.45) {
      skyColor = mix(midColor, upperColor, smoothstep(0.15, 0.45, elevation));
    } else {
      skyColor = mix(upperColor, zenithColor, smoothstep(0.45, 0.9, elevation));
    }

    if (elevation < 0.0) {
      skyColor = mix(horizonColor, groundHaze, min(-elevation * 4.0, 1.0));
    }

    // ── SUN (low on horizon) ────────────────────────────
    float sunDot = dot(dir, normalize(uSunDir));

    // Large warm glow around sun
    float sunWideGlow = pow(max(sunDot, 0.0), 2.0) * 0.6;
    skyColor += sunGlowColor * sunWideGlow;

    // Medium halo
    float sunHalo = pow(max(sunDot, 0.0), 8.0) * 0.5;
    skyColor += vec3(1.0, 0.55, 0.1) * sunHalo;

    // Inner glow
    float sunInner = pow(max(sunDot, 0.0), 32.0) * 0.8;
    skyColor += vec3(1.0, 0.85, 0.4) * sunInner;

    // Sun disc — large and soft for sunset
    float sunDisc = smoothstep(0.9965, 0.9995, sunDot);
    vec3 sunColor = vec3(1.0, 0.78, 0.35);
    skyColor = mix(skyColor, sunColor, sunDisc);

    // ── CLOUDS ──────────────────────────────────────────
    if (elevation > -0.05) {
      vec3 cloudPos = dir * 40.0;
      float scroll = uTime * 0.008;

      float n1 = snoise(vec3(cloudPos.x * 0.007 + scroll, cloudPos.z * 0.007, scroll * 0.15));
      float n2 = snoise(vec3(cloudPos.x * 0.016 + scroll * 1.2, cloudPos.z * 0.013, scroll * 0.3));
      float n3 = snoise(vec3(cloudPos.x * 0.035 + scroll * 1.8, cloudPos.z * 0.03, scroll * 0.5));
      float cloudShape = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

      float coverage = smoothstep(-0.05, 0.5, cloudShape);
      float elevMask = smoothstep(-0.05, 0.08, elevation) * (1.0 - smoothstep(0.65, 1.0, elevation) * 0.4);
      coverage *= elevMask;

      // Sunset cloud colors: warm pinks, oranges, purples
      vec3 cloudHighColor = vec3(0.95, 0.42, 0.32);  // warm pink/salmon
      vec3 cloudLowColor  = vec3(0.55, 0.15, 0.35);  // deep purple shadow
      vec3 cloudEdgeColor = vec3(1.0, 0.6, 0.18);    // golden rim

      // Blend based on sun-facing direction
      float sunFacing = pow(max(sunDot, 0.0), 3.0);
      vec3 cloudColor = mix(cloudLowColor, cloudHighColor, sunFacing * 0.7 + 0.3);

      // Golden rim light on sun-facing edges
      float edgeLight = pow(max(sunDot, 0.0), 10.0) * 0.6;
      cloudColor += cloudEdgeColor * edgeLight;

      // Underside darkening — deeper purple for sunset drama
      float underside = smoothstep(0.0, 0.25, elevation) * (1.0 - smoothstep(0.25, 0.55, elevation));
      cloudColor = mix(cloudColor, vec3(0.3, 0.08, 0.2), underside * 0.35);

      skyColor = mix(skyColor, cloudColor, coverage * 0.85);
    }

    // ── HORIZON GLOW BAND ──────────────────────────────
    float horizonBand = exp(-abs(elevation - 0.02) * 12.0) * 0.25;
    skyColor += vec3(1.0, 0.55, 0.15) * horizonBand;

    // Extra warm haze just below horizon
    float belowHaze = exp(-abs(elevation + 0.03) * 15.0) * 0.12;
    skyColor += vec3(0.9, 0.35, 0.1) * belowHaze;

    gl_FragColor = vec4(skyColor, 1.0);
  }
`

export default function Sky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.5, 0.12, 0.35).normalize() },
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
