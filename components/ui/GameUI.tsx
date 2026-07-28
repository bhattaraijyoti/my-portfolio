'use client'

import { useState, useEffect } from 'react'

interface GameUIProps {
  projectCount?: number
  discoveredCount?: number
}

export default function GameUI({ projectCount = 3, discoveredCount = 0 }: GameUIProps) {
  const [phase, setPhase] = useState<'welcome' | 'controls' | 'done'>('welcome')
  const [showAbout, setShowAbout] = useState(false)

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
          <button className="topbar__about" onClick={() => setShowAbout(!showAbout)}>
            About
          </button>
          <a href="mailto:jyotibhattarai010@gmail.com" className="topbar__contact">
            Contact
          </a>
        </div>
      </header>

      {/* About panel */}
      <div className={`about-panel ${showAbout ? 'is-visible' : ''}`}>
        <button className="about-panel__close" onClick={() => setShowAbout(false)} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="about-panel__header">
          <div className="about-panel__avatar">JB</div>
          <div>
            <h2 className="about-panel__name">Jyoti Bhattarai</h2>
            <p className="about-panel__role">Developer &amp; Designer</p>
          </div>
        </div>

        <div className="about-panel__line" />

        <p className="about-panel__bio">
          I design and build digital products that feel simple and work beautifully.
          Focused on clean interfaces, thoughtful interactions, and real-world impact.
        </p>

        <div className="about-panel__skills">
          <div className="about-panel__skill">
            <span className="about-panel__skill-label">Development</span>
            <span className="about-panel__skill-items">React / Next.js / TypeScript / Node.js / Three.js</span>
          </div>
          <div className="about-panel__skill">
            <span className="about-panel__skill-label">Design</span>
            <span className="about-panel__skill-items">UI / UX / Figma / Interaction Design / Prototyping</span>
          </div>
          <div className="about-panel__skill">
            <span className="about-panel__skill-label">Focus</span>
            <span className="about-panel__skill-items">Product Design / Frontend Engineering / Creative Dev</span>
          </div>
        </div>

        <div className="about-panel__links">
          <a href="mailto:jyotibhattarai010@gmail.com" className="about-panel__link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Email
          </a>
          <a href="https://github.com/jyotibhattarai" target="_blank" rel="noopener noreferrer" className="about-panel__link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            GitHub
          </a>
          <a href="https://linkedin.com/in/jyotibhattarai" target="_blank" rel="noopener noreferrer" className="about-panel__link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            LinkedIn
          </a>
        </div>
      </div>

      {/* About backdrop */}
      <div
        className={`about-backdrop ${showAbout ? 'is-visible' : ''}`}
        onClick={() => setShowAbout(false)}
      />

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
