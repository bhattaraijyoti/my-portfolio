'use client'

import { useEffect, useState } from 'react'

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let frame: number
    let start: number | null = null
    const duration = 1600

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      // Smooth ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.round(eased * 100))

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      } else {
        setTimeout(() => {
          setHidden(true)
          onComplete()
        }, 350)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [onComplete])

  return (
    <div className={`preloader ${hidden ? 'is-hidden' : ''}`}>
      <div className="preloader__inner">
        <div className="preloader__name">Jyoti</div>
        <div className="preloader__counter">{String(count).padStart(2, '0')}</div>
      </div>
    </div>
  )
}
