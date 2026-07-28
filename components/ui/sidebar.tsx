'use client'

import { useState, useCallback } from 'react'

interface SidebarProps {
  discoveredProjects: string[]
  totalProjects: number
  onRespawn?: () => void
}

export default function Sidebar({ discoveredProjects, totalProjects, onRespawn }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'controls' | 'about' | 'achievements'>('controls')

  const toggle = useCallback(() => setOpen((v) => !v), [])

  return (
    <>
      <button className="sidebar-toggle" onClick={toggle} aria-label="Toggle menu">
        <div className={`sidebar-toggle__bar ${open ? 'is-open' : ''}`}>
          <span />
          <span />
          <span />
        </div>
      </button>

      <div className={`sidebar-backdrop ${open ? 'is-visible' : ''}`} onClick={toggle} />

      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__logo">JB</div>
          <div>
            <div className="sidebar__name">Jyoti Bhattarai</div>
            <div className="sidebar__role">Developer &amp; Designer</div>
          </div>
        </div>

        <div className="sidebar__tabs">
          <button
            className={`sidebar__tab ${activeTab === 'controls' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('controls')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01" />
            </svg>
            Controls
          </button>
          <button
            className={`sidebar__tab ${activeTab === 'about' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            About
          </button>
          <button
            className={`sidebar__tab ${activeTab === 'achievements' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 21l4-4 4 4" />
              <path d="M12 17V3" />
              <path d="M20 8a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2Z" />
              <path d="M4 8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
            </svg>
            Medals
          </button>
        </div>

        <div className="sidebar__content">
          {activeTab === 'controls' && (
            <div className="sidebar__controls">
              <div className="sidebar__control-row"><kbd>W A S D</kbd><span>Move around</span></div>
              <div className="sidebar__control-row"><kbd>SHIFT</kbd><span>Boost speed</span></div>
              <div className="sidebar__control-row"><kbd>S / DOWN</kbd><span>Reverse</span></div>
              <div className="sidebar__control-row"><kbd>ENTER</kbd><span>Interact with projects</span></div>
              <div className="sidebar__control-row"><kbd>R</kbd><span>Respawn if stuck</span></div>
              <div className="sidebar__control-row"><kbd>M</kbd><span>Toggle minimap</span></div>
              <div className="sidebar__control-row"><kbd>ESC</kbd><span>Close panels</span></div>
              <div className="sidebar__control-row"><kbd>1 2 3</kbd><span>Teleport to project</span></div>
              <div className="sidebar__divider" />
              <button className="sidebar__respawn-btn" onClick={onRespawn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Respawn
              </button>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="sidebar__about">
              <p className="sidebar__bio">
                I design and build digital products that feel simple and work beautifully.
                Focused on clean interfaces, thoughtful interactions, and real-world impact.
              </p>
              <div className="sidebar__skills">
                <div className="sidebar__skill-group">
                  <span className="sidebar__skill-label">Development</span>
                  <span className="sidebar__skill-text">React / Next.js / TypeScript / Three.js</span>
                </div>
                <div className="sidebar__skill-group">
                  <span className="sidebar__skill-label">Design</span>
                  <span className="sidebar__skill-text">UI / UX / Figma / Interaction Design</span>
                </div>
                <div className="sidebar__skill-group">
                  <span className="sidebar__skill-label">Focus</span>
                  <span className="sidebar__skill-text">Product Design / Frontend / Creative Dev</span>
                </div>
              </div>
              <div className="sidebar__links">
                <a href="mailto:jyotibhattarai010@gmail.com" className="sidebar__link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  Email
                </a>
                <a href="https://github.com/jyotibhattarai" target="_blank" rel="noopener noreferrer" className="sidebar__link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                  GitHub
                </a>
                <a href="https://linkedin.com/in/jyotibhattarai" target="_blank" rel="noopener noreferrer" className="sidebar__link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                  LinkedIn
                </a>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="sidebar__achievements">
              <div className="sidebar__achievement-header">
                <span>{discoveredProjects.length} / {totalProjects} discovered</span>
              </div>
              {['Treatss', 'Tech Club', 'Tulsipur Dang'].map((name) => {
                const found = discoveredProjects.includes(name)
                return (
                  <div key={name} className={`sidebar__medal ${found ? 'is-unlocked' : ''}`}>
                    <div className="sidebar__medal-icon">
                      {found ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21l4-4 4 4" /><path d="M12 17V3" /><path d="M20 8a2 2 0 0 0-2-2h-3a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h3a2 2 0 0 0 2-2Z" /><path d="M4 8a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" /></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      )}
                    </div>
                    <div className="sidebar__medal-info">
                      <span className="sidebar__medal-name">{name}</span>
                      <span className="sidebar__medal-status">{found ? 'Unlocked' : 'Locked'}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
