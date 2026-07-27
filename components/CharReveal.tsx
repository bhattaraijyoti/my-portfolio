'use client'

import { useRef, useEffect } from 'react'

interface CharRevealProps {
  text: string
  className?: string
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  style?: React.CSSProperties
}

export default function CharReveal({ text, className = '', tag: Tag = 'h2', style }: CharRevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const chars = el.querySelectorAll('.char')
          chars.forEach((char, i) => {
            setTimeout(() => {
              char.classList.add('is-visible')
            }, i * 25)
          })
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const words = text.split(' ')

  return (
    // @ts-expect-error Tag is a valid HTML tag
    <Tag ref={ref} className={className} style={style}>
      {words.map((word, wi) => (
        <span key={wi} style={{ whiteSpace: 'nowrap', display: 'inline-block' }}>
          {word.split('').map((char, ci) => (
            <span key={ci} className="char-wrap">
              <span className="char">{char}</span>
            </span>
          ))}
          {wi < words.length - 1 && (
            <span className="char-wrap">
              <span className="char is-visible">&nbsp;</span>
            </span>
          )}
        </span>
      ))}
    </Tag>
  )
}
