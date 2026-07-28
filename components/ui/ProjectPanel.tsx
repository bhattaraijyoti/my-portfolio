'use client'

import { useEffect, useRef } from 'react'

interface Project {
  title: string
  tags: string
  description: string
  link: string
  image: string
}

interface ProjectPanelProps {
  project: Project | null
  visible: boolean
  onClose: () => void
  onNavigate?: (direction: 'prev' | 'next') => void
  currentIndex?: number
  totalCount?: number
}

export default function ProjectPanel({ project, visible, onClose, onNavigate, currentIndex, totalCount }: ProjectPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible && panelRef.current) {
      panelRef.current.scrollTop = 0
    }
  }, [visible, project?.title])

  if (!project) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`pp-backdrop ${visible ? 'is-visible' : ''}`}
        onClick={onClose}
      />

      <div ref={panelRef} className={`pp ${visible ? 'is-visible' : ''}`}>
        {/* Close button */}
        <button className="pp__close" onClick={onClose} aria-label="Close panel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Hero image */}
        <div className="pp__hero">
          <img src={project.image} alt={project.title} draggable={false} />
          <div className="pp__hero-gradient" />
          <div className="pp__hero-content">
            <div className="pp__counter">
              {currentIndex !== undefined && totalCount !== undefined && (
                <span>{String(currentIndex + 1).padStart(2, '0')} / {String(totalCount).padStart(2, '0')}</span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="pp__body">
          {/* Tags */}
          <div className="pp__tags">{project.tags}</div>

          {/* Title */}
          <h2 className="pp__title">{project.title}</h2>

          {/* Accent line */}
          <div className="pp__line" />

          {/* Description */}
          <p className="pp__desc">{project.description}</p>

          {/* Actions */}
          <div className="pp__actions">
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="pp__cta">
              View Project
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </a>

            {onNavigate && (
              <div className="pp__nav">
                <button className="pp__nav-btn" onClick={() => onNavigate('prev')} aria-label="Previous">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button className="pp__nav-btn" onClick={() => onNavigate('next')} aria-label="Next">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Dots */}
          {totalCount !== undefined && totalCount > 1 && (
            <div className="pp__dots">
              {Array.from({ length: totalCount }, (_, i) => (
                <span key={i} className={`pp__dot ${i === currentIndex ? 'is-active' : ''}`} />
              ))}
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="pp__hint">
          <kbd>Esc</kbd> close
          {onNavigate && <><kbd>&larr;</kbd><kbd>&rarr;</kbd> browse</>}
        </div>
      </div>
    </>
  )
}
