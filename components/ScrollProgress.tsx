'use client'

import { useEffect, useRef } from 'react'

export default function ScrollProgress({ isDark }: { isDark: boolean }) {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollWrap = document.querySelector('.scroll-wrap')
    if (!scrollWrap || !barRef.current) return

    const onScroll = () => {
      const el = scrollWrap
      const scrollTop = el.scrollTop
      const scrollHeight = el.scrollHeight - el.clientHeight
      const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0
      if (barRef.current) {
        barRef.current.style.height = `${Math.max(progress * 100, 8)}%`
      }
    }

    scrollWrap.addEventListener('scroll', onScroll, { passive: true })
    return () => scrollWrap.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className={`scroll-indicator ${isDark ? 'is-dark' : ''}`}>
      <div ref={barRef} className="scroll-indicator__bar" style={{ height: '8%' }} />
    </div>
  )
}
