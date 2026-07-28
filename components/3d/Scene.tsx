'use client'

import { Suspense, useCallback, useState, useEffect, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'
import Experience from './Experience'
import ProjectPanel from '../ui/ProjectPanel'
import GameUI from '../ui/GameUI'
import ProjectDock from '../ui/ProjectDock'
import ProximityIndicator from '../ui/ProximityIndicator'
import Sidebar from '../ui/Sidebar'
import Minimap from '../ui/Minimap'
import ToastContainer, { useToasts } from '../ui/DiscoveryToast'
import Whispers from '../ui/Whispers'
import Leaderboard from '../ui/Leaderboard'
import Achievements from '../ui/Achievements'
import { playDiscoveryChime, playWhoosh } from '../../lib/sound'

const PROJECTS = [
  {
    title: 'Treatss',
    position: [-14, 0, -4] as [number, number, number],
    tags: 'Product Design / Frontend / Local Commerce',
    description: 'A calmer ordering experience for a growing food-delivery market in Tulsipur. Designed and built from concept to launch.',
    link: 'https://treatss.com',
    image: '/treatss.png',
  },
  {
    title: 'Tech Club',
    position: [12, 0, -18] as [number, number, number],
    tags: 'Community Platform / Interface Design',
    description: 'A focused hub for students and creators to learn, share, and collaborate. Built to replace scattered groups with one clean interface.',
    link: 'https://techclubb.vercel.app',
    image: '/tech.png',
  },
  {
    title: 'Tulsipur Dang',
    position: [-5, 0, -26] as [number, number, number],
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
  const [showMinimap, setShowMinimap] = useState(true)
  const { toasts, addToast, dismissToast } = useToasts()

  const handleProjectProximity = useCallback((title: string | null, isNear: boolean) => {
    if (isNear && title) {
      setActiveProject(title)
      setDiscovered((prev) => {
        if (prev.has(title)) return prev
        const next = new Set(prev).add(title)
        const idx = PROJECTS.findIndex((p) => p.title === title)
        addToast(
          'New project discovered!',
          title,
          idx >= 0 ? idx : 0
        )
        playDiscoveryChime()
        return next
      })
    } else if (!isNear) {
      setActiveProject(null)
    }
  }, [addToast])

  const handleTeleport = useCallback((title: string) => {
    const project = PROJECTS.find((p) => p.title === title)
    if (project && teleportRef.current) {
      const offsetPos: [number, number, number] = [
        project.position[0] + 4,
        0.35,
        project.position[2] + 6,
      ]
      teleportRef.current(offsetPos)
      playWhoosh()
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
      if (e.key === 'r' || e.key === 'R') {
        if (teleportRef.current) {
          teleportRef.current([0, 0.35, 5])
        }
      }
      if (e.key === 'm' || e.key === 'M') {
        setShowMinimap((v) => !v)
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
          stencil: false,
          depth: true,
        }}
        dpr={[1, 2]}
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
          <SMAA />
          <Bloom
            intensity={0.35}
            luminanceThreshold={0.85}
            luminanceSmoothing={0.6}
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

      <Sidebar
        discoveredProjects={Array.from(discovered)}
        totalProjects={PROJECTS.length}
        onRespawn={() => {
          if (teleportRef.current) {
            teleportRef.current([0, 0.35, 5])
          }
        }}
      />

      <Minimap visible={showMinimap} />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Whispers />
      <Leaderboard />
      <Achievements />

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