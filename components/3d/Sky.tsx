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

    // Overcast winter sky — soft grey gradient
    vec3 zenithColor   = vec3(0.55, 0.58, 0.65);
    vec3 midColor      = vec3(0.62, 0.65, 0.72);
    vec3 horizonColor  = vec3(0.72, 0.75, 0.80);
    vec3 groundHaze    = vec3(0.50, 0.52, 0.58);

    vec3 skyColor;
    if (elevation < 0.15) {
      skyColor = mix(horizonColor, midColor, smoothstep(0.0, 0.15, elevation));
    } else if (elevation < 0.5) {
      skyColor = mix(midColor, zenithColor, smoothstep(0.15, 0.5, elevation));
    } else {
      skyColor = zenithColor;
    }

    if (elevation < 0.0) {
      skyColor = mix(horizonColor, groundHaze, min(-elevation * 4.0, 1.0));
    }

    // Subtle sun glow through clouds
    float sunDot = dot(dir, normalize(uSunDir));
    float sunWideGlow = pow(max(sunDot, 0.0), 3.0) * 0.25;
    skyColor += vec3(0.85, 0.82, 0.75) * sunWideGlow;

    float sunHalo = pow(max(sunDot, 0.0), 12.0) * 0.2;
    skyColor += vec3(0.9, 0.88, 0.82) * sunHalo;

    // Clouds — heavy overcast layer
    if (elevation > -0.05) {
      vec3 cloudPos = dir * 40.0;
      float scroll = uTime * 0.005;

      float n1 = snoise(vec3(cloudPos.x * 0.005 + scroll, cloudPos.z * 0.005, scroll * 0.1));
      float n2 = snoise(vec3(cloudPos.x * 0.012 + scroll * 0.8, cloudPos.z * 0.01, scroll * 0.2));
      float n3 = snoise(vec3(cloudPos.x * 0.025 + scroll * 1.2, cloudPos.z * 0.02, scroll * 0.3));
      float cloudShape = n1 * 0.5 + n2 * 0.35 + n3 * 0.15;

      // Heavy coverage
      float coverage = smoothstep(-0.15, 0.6, cloudShape);
      float elevMask = smoothstep(-0.05, 0.05, elevation) * (1.0 - smoothstep(0.6, 1.0, elevation) * 0.3);
      coverage *= elevMask;

      // Muted winter cloud colors
      vec3 cloudHighColor = vec3(0.78, 0.80, 0.85);
      vec3 cloudLowColor  = vec3(0.52, 0.55, 0.62);
      vec3 cloudColor = mix(cloudLowColor, cloudHighColor, 0.5);

      float underside = smoothstep(0.0, 0.2, elevation) * (1.0 - smoothstep(0.2, 0.5, elevation));
      cloudColor = mix(cloudColor, vec3(0.45, 0.48, 0.55), underside * 0.3);

      skyColor = mix(skyColor, cloudColor, coverage * 0.8);
    }

    gl_FragColor = vec4(skyColor, 1.0);
  }
`

export default function Sky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null!)

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSunDir: { value: new THREE.Vector3(0.4, 0.25, 0.3).normalize() },
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh>
      <sphereGeometry args={[90, 24, 24]} />
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
