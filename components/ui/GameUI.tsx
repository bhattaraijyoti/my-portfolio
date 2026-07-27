'use client'

import { useState, useEffect } from 'react'
import { useFPS } from '@/hooks/useFPS'

interface GameUIProps {
  projectCount?: number
  discoveredCount?: number
}

export default function GameUI({ projectCount = 3, discoveredCount = 0 }: GameUIProps) {
  const [showHint, setShowHint] = useState(true)
  const [hintFading, setHintFading] = useState(false)
  const fps = useFPS()

  useEffect(() => {
    const fadeTimer = setTimeout(() => setHintFading(true), 5000)
    const hideTimer = setTimeout(() => setShowHint(false), 6000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  return (
    <>
      {/* Vignette overlay */}
      <div className="vignette" />

      {/* Controls hint */}
      {showHint && (
        <div className={`game-hint ${!hintFading ? 'is-visible' : ''}`}>
          <div className="game-hint__inner">
            <div className="game-hint__keys">
              <span className="game-hint__key">W</span>
              <div className="game-hint__row">
                <span className="game-hint__key">A</span>
                <span className="game-hint__key">S</span>
                <span className="game-hint__key">D</span>
              </div>
            </div>
            <div className="game-hint__text">
              Drive around to explore
              <br />
              <span className="game-hint__sub">Reach the glowing markers to view projects</span>
            </div>
            <div className="game-hint__separator" />
            <div className="game-hint__text">
              <span className="game-hint__sub">Press <kbd className="game-hint__kbd">1</kbd> <kbd className="game-hint__kbd">2</kbd> <kbd className="game-hint__kbd">3</kbd> to teleport</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="game-header">
        <div className="game-header__left">
          <div className="game-header__name">Jyoti Bhattarai</div>
          <div className="game-header__sub">Portfolio 2026</div>
        </div>
        <div className="game-header__right">
          <a href="mailto:jyotibhattarai010@gmail.com" className="game-header__contact">
            <span className="game-header__contact-dot" />
            Contact
          </a>
        </div>
      </div>

      {/* Bottom status */}
      <div className="game-status">
        <div className="game-status__item">
          <span className="game-status__dot" />
          Available for work
        </div>
        {projectCount > 0 && (
          <div className="game-status__item game-status__projects">
            {discoveredCount}/{projectCount} discovered
          </div>
        )}
        <div className="game-status__item">
          <span className="game-status__dot" style={{ background: fps >= 55 ? '#00c853' : fps >= 30 ? '#ffaa00' : '#ff4444' }} />
          {fps} FPS
        </div>
      </div>

      {/* Scroll hint for mobile */}
      <div className="game-scroll-hint">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="game-scroll-hint__icon">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </>
  )
}
