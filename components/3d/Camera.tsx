'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

const BASE_OFFSET = new THREE.Vector3(0, 8, 12)
const LOOK_OFFSET = new THREE.Vector3(0, 0.5, -5)
const SPEED_OFFSET = new THREE.Vector3(0, 1.5, 3)
const _dynamicOffset = new THREE.Vector3()
const _speedContrib = new THREE.Vector3()

// Frame-rate independent smooth damp (each axis independent)
function smoothDamp(
  current: number, target: number,
  vel: { value: number }, smoothTime: number, dt: number
): number {
  const omega = 2 / Math.max(smoothTime, 0.0001)
  const x = omega * dt
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x)
  const change = current - target
  const temp = (vel.value + omega * change) * dt
  vel.value = (vel.value - omega * temp) * exp
  return target + (change + temp) * exp
}

// Per-axis velocity accumulators
const posVelX = { value: 0 }
const posVelY = { value: 0 }
const posVelZ = { value: 0 }
const lookVelX = { value: 0 }
const lookVelY = { value: 0 }
const lookVelZ = { value: 0 }

export default function ChaseCamera() {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3(0, 8, 12))
  const currentLook = useRef(new THREE.Vector3(0, 0.5, -5))
  const shakeOffset = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = state.clock.elapsedTime
    const carPos = carStore.position
    const speed = carStore.velocity.length()

    const speedFactor = Math.min(speed / 20, 1)
    _speedContrib.copy(SPEED_OFFSET).multiplyScalar(speedFactor * 0.4)
    _dynamicOffset.copy(BASE_OFFSET).add(_speedContrib)
    _dynamicOffset.y += speedFactor * 2

    targetPos.current.copy(carPos).add(_dynamicOffset)
    targetLook.current.copy(carPos).add(LOOK_OFFSET)

    const angle = carStore.rotation
    const lookAhead = speedFactor * 3
    targetLook.current.x += Math.sin(angle) * lookAhead
    targetLook.current.z += Math.cos(angle) * lookAhead

    // Frame-rate independent smooth damp — each axis has its own velocity
    const smoothTime = THREE.MathUtils.lerp(0.18, 0.35, speedFactor)

    currentPos.current.x = smoothDamp(currentPos.current.x, targetPos.current.x, posVelX, smoothTime, dt)
    currentPos.current.y = smoothDamp(currentPos.current.y, targetPos.current.y, posVelY, smoothTime, dt)
    currentPos.current.z = smoothDamp(currentPos.current.z, targetPos.current.z, posVelZ, smoothTime, dt)

    const lookSmooth = smoothTime * 0.8
    currentLook.current.x = smoothDamp(currentLook.current.x, targetLook.current.x, lookVelX, lookSmooth, dt)
    currentLook.current.y = smoothDamp(currentLook.current.y, targetLook.current.y, lookVelY, lookSmooth, dt)
    currentLook.current.z = smoothDamp(currentLook.current.z, targetLook.current.z, lookVelZ, lookSmooth, dt)

    if (speed > 5) {
      const shakeIntensity = (speed - 5) / 25
      shakeOffset.current.x = Math.sin(t * 14) * shakeIntensity * 0.02
      shakeOffset.current.y = Math.sin(t * 18) * shakeIntensity * 0.015
      shakeOffset.current.z = Math.cos(t * 12) * shakeIntensity * 0.008
    } else {
      shakeOffset.current.multiplyScalar(0.92)
    }

    camera.position.copy(currentPos.current).add(shakeOffset.current)
    camera.lookAt(currentLook.current)
  })

  return null
}
