'use client'

import { useEffect, useState } from 'react'

interface GameLoaderProps {
  onComplete: () => void
}

export default function GameLoader({ onComplete }: GameLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    let raf: number
    let start: number | null = null
    const duration = 2600

    const tick = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const p = Math.min((elapsed / duration) * 100, 100)
      setProgress(Math.floor(p))

      if (p >= 100 && phase === 'loading') {
        setPhase('ready')
        setTimeout(() => {
          setHidden(true)
          setTimeout(onComplete, 800)
        }, 600)
        return
      }

      if (p < 100) {
        raf = requestAnimationFrame(tick)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onComplete, phase])

  return (
    <div className={`game-loader ${hidden ? 'is-hidden' : ''}`}>
      <div className="game-loader__inner">
        {/* Decorative top line */}
        <div className="game-loader__deco-line" />

        <div className="game-loader__top">
          <div className="game-loader__label">Portfolio</div>
          <div className="game-loader__counter">{String(progress).padStart(3, '0')}</div>
        </div>

        <div className="game-loader__bar-track">
          <div className="game-loader__bar-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="game-loader__bottom">
          <div className="game-loader__name">Jyoti Bhattarai</div>
          <div className="game-loader__hint">
            {phase === 'loading' ? 'Loading world...' : 'Ready to explore'}
          </div>
        </div>

        {/* Decorative dots */}
        <div className="game-loader__dots">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="game-loader__dot"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
