'use client'

import { useState, useEffect } from 'react'

interface GameUIProps {
  projectCount?: number
  discoveredCount?: number
}

export default function GameUI({ projectCount = 3, discoveredCount = 0 }: GameUIProps) {
  const [phase, setPhase] = useState<'welcome' | 'controls' | 'done'>('welcome')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('controls'), 2500)
    const t2 = setTimeout(() => setPhase('done'), 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <>
      <div className="vignette" />

      {/* Welcome splash */}
      {phase === 'welcome' && (
        <div className="welcome-splash">
          <div className="welcome-splash__inner">
            <div className="welcome-splash__greeting">Welcome!</div>
            <div className="welcome-splash__text">
              Drive around to discover my projects.
              <br />
              Have fun!
            </div>
          </div>
        </div>
      )}

      {/* Controls hint */}
      {phase === 'controls' && (
        <div className="controls-hint">
          <div className="controls-hint__inner">
            <div className="controls-hint__left">
              <div className="controls-hint__arrows">
                <span className="controls-hint__key controls-hint__key--wide">W</span>
                <div className="controls-hint__arow-row">
                  <span className="controls-hint__key">A</span>
                  <span className="controls-hint__key">S</span>
                  <span className="controls-hint__key">D</span>
                </div>
              </div>
            </div>
            <div className="controls-hint__sep" />
            <div className="controls-hint__right">
              <span className="controls-hint__label">Move around</span>
              <span className="controls-hint__sub">Drive to the glowing markers</span>
              <span className="controls-hint__sub">Press <kbd>Enter</kbd> to interact</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="topbar">
        <div className="topbar__left">
          <span className="topbar__name">Jyoti Bhattarai</span>
          <span className="topbar__sep">&mdash;</span>
          <span className="topbar__sub">Portfolio 2026</span>
        </div>
        <div className="topbar__right">
          <a href="mailto:jyotibhattarai010@gmail.com" className="topbar__contact">
            Contact
          </a>
        </div>
      </header>

      {/* Bottom-right status */}
      <div className="status-pill">
        <span className="status-pill__dot" />
        <span>Available for work</span>
        {projectCount > 0 && (
          <span className="status-pill__sep" />
        )}
        {projectCount > 0 && (
          <span>{discoveredCount}/{projectCount} discovered</span>
        )}
      </div>
    </>
  )
}
