'use client'

import { useEffect, useState, useRef } from 'react'
import { carStore } from '../3d/store'

interface Project {
  title: string
  position: [number, number, number]
}

interface ProximityIndicatorProps {
  projects: Project[]
  activeProject: string | null
}

export default function ProximityIndicator({ projects, activeProject }: ProximityIndicatorProps) {
  const [nearest, setNearest] = useState<{ title: string; angle: number; distance: number } | null>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const update = () => {
      const carPos = carStore.position
      let closest: { title: string; angle: number; distance: number } | null = null

      for (const project of projects) {
        if (project.title === activeProject) continue
        const dx = project.position[0] - carPos.x
        const dz = project.position[2] - carPos.z
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance > 6) {
          const angle = Math.atan2(dx, dz) - carStore.rotation
          if (!closest || distance < closest.distance) {
            closest = { title: project.title, angle, distance }
          }
        }
      }

      setNearest(closest)
      rafRef.current = requestAnimationFrame(update)
    }

    rafRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafRef.current)
  }, [projects, activeProject])

  if (!nearest || activeProject) return null

  const angleDeg = (nearest.angle * 180) / Math.PI
  const opacity = Math.min(1, Math.max(0.15, 1 - nearest.distance / 30))

  return (
    <div className="proximity-indicator" style={{ opacity }}>
      <div
        className="proximity-indicator__arrow"
        style={{ transform: `rotate(${angleDeg}deg)` }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </div>
      <span className="proximity-indicator__label">{nearest.title}</span>
      <span className="proximity-indicator__distance">{Math.round(nearest.distance)}m</span>
    </div>
  )
}
