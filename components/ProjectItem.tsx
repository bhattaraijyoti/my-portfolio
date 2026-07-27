'use client'

import { useRef, useEffect, useState } from 'react'

interface ProjectRowProps {
  title: string
  tags: string
  image: string
  link: string
  index: number
  description: string
}

export default function ProjectRow({ title, tags, image, link, index, description }: ProjectRowProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`project-row reveal ${visible ? 'is-visible' : ''}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div className="project-row__info">
        <div>
          <div className="project-row__num">Project {String(index + 1).padStart(2, '0')}</div>
          <h3 className="project-row__title">{title}</h3>
          <div className="project-row__tags">{tags}</div>
          <p className="project-row__desc">{description}</p>
        </div>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="project-row__cta"
        >
          View Project
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </div>
      <div className="project-row__image">
        <img src={image} alt={`${title} preview`} draggable={false} loading="lazy" />
      </div>
    </div>
  )
}
