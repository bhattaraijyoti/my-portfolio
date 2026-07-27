'use client'

import { useState, useEffect } from 'react'

interface Project {
  title: string
  tags: string
  description: string
  link: string
  image: string
}

interface ProjectDockProps {
  projects: Project[]
  activeProject: string | null
  onSelect: (title: string) => void
}

export default function ProjectDock({ projects, activeProject, onSelect }: ProjectDockProps) {
  const [expanded, setExpanded] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`project-dock ${visible ? 'is-visible' : ''} ${expanded ? 'is-expanded' : ''}`}>
      <button
        className="project-dock__toggle"
        onClick={() => setExpanded(!expanded)}
        aria-label="Toggle project list"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <span className="project-dock__toggle-label">Projects</span>
        <span className="project-dock__count">{projects.length}</span>
      </button>

      <div className="project-dock__list">
        {projects.map((project, i) => (
          <button
            key={project.title}
            className={`project-dock__item ${activeProject === project.title ? 'is-active' : ''}`}
            onClick={() => onSelect(project.title)}
          >
            <span className="project-dock__item-index">{String(i + 1).padStart(2, '0')}</span>
            <div className="project-dock__item-info">
              <span className="project-dock__item-title">{project.title}</span>
              <span className="project-dock__item-tags">{project.tags.split(' / ')[0]}</span>
            </div>
            <svg className="project-dock__item-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        ))}
      </div>

      <div className="project-dock__hint">
        Press <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> to teleport
      </div>
    </div>
  )
}
