'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { carStore } from './store'

const BASE_OFFSET = new THREE.Vector3(0, 8, 12)
const LOOK_OFFSET = new THREE.Vector3(0, 0.5, -5)
const SPEED_OFFSET = new THREE.Vector3(0, 1.5, 3)

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
    const dynamicOffset = BASE_OFFSET.clone().add(
      SPEED_OFFSET.clone().multiplyScalar(speedFactor * 0.4)
    )

    dynamicOffset.y += speedFactor * 2

    targetPos.current.copy(carPos).add(dynamicOffset)
    targetLook.current.copy(carPos).add(LOOK_OFFSET)

    const angle = carStore.rotation
    const lookAhead = speedFactor * 3
    targetLook.current.x += Math.sin(angle) * lookAhead
    targetLook.current.z += Math.cos(angle) * lookAhead

    const lerpSpeed = THREE.MathUtils.lerp(4, 2.5, speedFactor)
    currentPos.current.lerp(targetPos.current, lerpSpeed * dt)
    currentLook.current.lerp(targetLook.current, lerpSpeed * dt)

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