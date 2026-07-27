'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only on devices with fine pointer
    if (window.matchMedia('(pointer: coarse)').matches) return

    const dot = dotRef.current
    if (!dot) return

    let mouseX = 0, mouseY = 0
    let dotX = 0, dotY = 0
    let animFrame: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-hover], .project-row')) {
        dot.classList.add('is-hovering')
      }
    }

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('a, button, [data-hover], .project-row')) {
        dot.classList.remove('is-hovering')
      }
    }

    const loop = () => {
      dotX += (mouseX - dotX) * 0.12
      dotY += (mouseY - dotY) * 0.12
      dot.style.left = `${dotX}px`
      dot.style.top = `${dotY}px`
      animFrame = requestAnimationFrame(loop)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseover', onOver, { passive: true })
    document.addEventListener('mouseout', onOut, { passive: true })
    loop()

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      cancelAnimationFrame(animFrame)
    }
  }, [])

  return <div ref={dotRef} className="cursor-dot" />
}
