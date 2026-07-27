'use client'

import { Suspense, useCallback, useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import Experience from './Experience'
import ProjectPanel from '../ui/ProjectPanel'
import GameUI from '../ui/GameUI'
import ProjectDock from '../ui/ProjectDock'
import ProximityIndicator from '../ui/ProximityIndicator'

const PROJECTS = [
  {
    title: 'Treatss',
    position: [-8, 0, -5] as [number, number, number],
    tags: 'Product Design / Frontend / Local Commerce',
    description: 'A calmer ordering experience for a growing food-delivery market in Tulsipur. Designed and built from concept to launch.',
    link: 'https://treatss.com',
    image: '/treatss.png',
  },
  {
    title: 'Tech Club',
    position: [6, 0, -10] as [number, number, number],
    tags: 'Community Platform / Interface Design',
    description: 'A focused hub for students and creators to learn, share, and collaborate. Built to replace scattered groups with one clean interface.',
    link: 'https://techclubb.vercel.app',
    image: '/tech.png',
  },
  {
    title: 'Tulsipur Dang',
    position: [-3, 0, -12] as [number, number, number],
    tags: 'Civic Tech / Content System',
    description: 'A digital home for local events, news, and technology initiatives. Community-driven, built to support Tulsipur as a growing tech hub.',
    link: 'https://tulsipurdang.com',
    image: '/tulsipurdang.png',
  },
]

export default function Scene() {
  const [activeProject, setActiveProject] = useState<string | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [discovered, setDiscovered] = useState<Set<string>>(new Set())
  const teleportRef = useRef<((pos: [number, number, number]) => void) | null>(null)

  const handleProjectProximity = useCallback((title: string | null, isNear: boolean) => {
    if (isNear && title) {
      setActiveProject(title)
      setDiscovered((prev) => new Set(prev).add(title))
    } else if (!isNear) {
      setActiveProject(null)
    }
  }, [])

  const handleTeleport = useCallback((title: string) => {
    const project = PROJECTS.find((p) => p.title === title)
    if (project && teleportRef.current) {
      const offsetPos: [number, number, number] = [
        project.position[0] + 4,
        0.35,
        project.position[2] + 6,
      ]
      teleportRef.current(offsetPos)
      setActiveProject(title)
      setShowPanel(true)
      setDiscovered((prev) => new Set(prev).add(title))
    }
  }, [])

  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!activeProject) return
    const idx = PROJECTS.findIndex((p) => p.title === activeProject)
    const nextIdx = direction === 'next'
      ? (idx + 1) % PROJECTS.length
      : (idx - 1 + PROJECTS.length) % PROJECTS.length
    handleTeleport(PROJECTS[nextIdx].title)
  }, [activeProject, handleTeleport])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '1') handleTeleport(PROJECTS[0].title)
      if (e.key === '2') handleTeleport(PROJECTS[1].title)
      if (e.key === '3') handleTeleport(PROJECTS[2].title)
      if (e.key === 'Enter' && activeProject) {
        setShowPanel(true)
        setDiscovered((prev) => new Set(prev).add(activeProject))
      }
      if (e.key === 'Escape') {
        setShowPanel(false)
        setTimeout(() => setActiveProject(null), 500)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleTeleport, activeProject])

  const project = PROJECTS.find((p) => p.title === activeProject)
  const projectIndex = activeProject ? PROJECTS.findIndex((p) => p.title === activeProject) : -1

  return (
    <div className="scene-container">
      <Canvas
        shadows
        camera={{ position: [0, 7, 10], fov: 45, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 1.5]}
        style={{ background: '#000' }}
      >
        <color attach="background" args={['#000']} />

        <Suspense fallback={null}>
          <Experience
            onProjectProximity={handleProjectProximity}
            onTeleportReady={(fn) => { teleportRef.current = fn }}
          />

          <Environment preset="sunset" environmentIntensity={0.4} />
        </Suspense>

        <EffectComposer multisampling={2}>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.9}
            luminanceSmoothing={0.5}
            mipmapBlur
          />
          <Vignette
            offset={0.25}
            darkness={0.35}
          />
        </EffectComposer>
      </Canvas>

      <GameUI projectCount={PROJECTS.length} discoveredCount={discovered.size} />

      <ProjectDock
        projects={PROJECTS}
        activeProject={activeProject}
        onSelect={handleTeleport}
      />

      <ProximityIndicator
        projects={PROJECTS}
        activeProject={activeProject}
      />

      <ProjectPanel
        project={project || null}
        visible={showPanel}
        onClose={() => {
          setShowPanel(false)
          setTimeout(() => setActiveProject(null), 500)
        }}
        onNavigate={handleNavigate}
        currentIndex={projectIndex >= 0 ? projectIndex : undefined}
        totalCount={PROJECTS.length}
      />
    </div>
  )
}