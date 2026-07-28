'use client'

import { useRef, createContext, useContext, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as CANNON from 'cannon-es'

const PhysicsContext = createContext<CANNON.World | null>(null)
export const usePhysicsWorld = () => useContext(PhysicsContext)

export function PhysicsWorld({ children }: { children: React.ReactNode }) {
  const world = useMemo(() => {
    const w = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    })
    w.broadphase = new CANNON.SAPBroadphase(w)
    w.solver.iterations = 8
    w.defaultContactMaterial.friction = 0.3
    w.defaultContactMaterial.restitution = 0.2

    // Ground
    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      position: new CANNON.Vec3(0, 0, 0),
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
    w.addBody(groundBody)

    return w
  }, [])

  useFrame((_, delta) => {
    world.step(1 / 60, Math.min(delta, 1 / 30), 3)
  })

  return (
    <PhysicsContext.Provider value={world}>
      {children}
    </PhysicsContext.Provider>
  )
}
