'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import GameLoader from '@/components/ui/GameLoader'

const Scene = dynamic(() => import('@/components/3d/Scene'), { ssr: false })

export default function Home() {
  const [ready, setReady] = useState(false)

  const handleReady = useCallback(() => {
    setReady(true)
  }, [])

  return (
    <>
      {!ready && <GameLoader onComplete={handleReady} />}
      {ready && <Scene />}
    </>
  )
}
