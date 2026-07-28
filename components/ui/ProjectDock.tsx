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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`dock ${visible ? 'dock--visible' : ''}`}>
      {projects.map((project, i) => (
        <button
          key={project.title}
          className={`dock__item ${activeProject === project.title ? 'dock__item--active' : ''}`}
          onClick={() => onSelect(project.title)}
          aria-label={project.title}
          title={project.title}
        >
          <div className="dock__thumb">
            <img src={project.image} alt="" draggable={false} />
          </div>
          <div className="dock__label">{project.title}</div>
          <div className="dock__tag">{project.tags.split(' / ')[0]}</div>
        </button>
      ))}
    </div>
  )
}
