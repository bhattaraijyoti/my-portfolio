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
    <div ref={panelRef} className={`project-panel ${visible ? 'is-visible' : ''}`}>
      {/* Close button */}
      <button className="project-panel__close" onClick={onClose} aria-label="Close panel">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Image with overlay */}
      <div className="project-panel__image">
        <img src={project.image} alt={project.title} draggable={false} />
        <div className="project-panel__image-overlay" />
      </div>

      {/* Content */}
      <div className="project-panel__content">
        {/* Tags + counter row */}
        <div className="project-panel__meta">
          <div className="project-panel__tags">
            <span className="project-panel__tag-dot" />
            {project.tags}
          </div>
          {currentIndex !== undefined && totalCount !== undefined && (
            <div className="project-panel__counter">
              {String(currentIndex + 1).padStart(2, '0')}&thinsp;/&thinsp;{String(totalCount).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Title */}
        <h2 className="project-panel__title">{project.title}</h2>

        {/* Separator */}
        <div className="project-panel__separator" />

        {/* Description */}
        <p className="project-panel__desc">{project.description}</p>

        {/* Actions */}
        <div className="project-panel__actions">
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="project-panel__cta"
          >
            View Project
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>

          {onNavigate && (
            <div className="project-panel__nav">
              <button className="project-panel__nav-btn" onClick={() => onNavigate('prev')} aria-label="Previous project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button className="project-panel__nav-btn" onClick={() => onNavigate('next')} aria-label="Next project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
