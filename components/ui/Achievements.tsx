'use client'

import { useState, useEffect, useCallback } from 'react'
import { ACHIEVEMENTS, loadAchievements, Achievement, AchievementState } from '../../lib/achievements'

export default function Achievements() {
  const [open, setOpen] = useState(false)
  const [states, setStates] = useState<AchievementState[]>([])
  const [recentUnlock, setRecentUnlock] = useState<string | null>(null)

  useEffect(() => {
    setStates(loadAchievements())
    const interval = setInterval(() => {
      setStates(loadAchievements())
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Listen for custom achievement unlock events
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setRecentUnlock(e.detail.id)
      setTimeout(() => setRecentUnlock(null), 3000)
    }
    window.addEventListener('achievement-unlocked' as any, handler)
    return () => window.removeEventListener('achievement-unlocked' as any, handler)
  }, [])

  const unlockedCount = states.filter((s) => s.unlocked).length
  const totalCount = ACHIEVEMENTS.length

  const isUnlocked = useCallback((id: string) => {
    return states.some((s) => s.id === id && s.unlocked)
  }, [states])

  return (
    <div className="achievements">
      <button className="achievements__toggle" onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="6" />
          <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
        </svg>
        {unlockedCount}/{totalCount}
      </button>

      {/* Recent unlock toast */}
      {recentUnlock && (
        <div className="achievements__toast">
          <span className="achievements__toast-icon">
            {ACHIEVEMENTS.find((a) => a.id === recentUnlock)?.icon}
          </span>
          <div>
            <div className="achievements__toast-title">Achievement Unlocked!</div>
            <div className="achievements__toast-name">
              {ACHIEVEMENTS.find((a) => a.id === recentUnlock)?.name}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="achievements__panel">
          <div className="achievements__header">
            <span>Achievements ({unlockedCount}/{totalCount})</span>
            <button onClick={() => setOpen(false)}>&times;</button>
          </div>
          <div className="achievements__list">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = isUnlocked(a.id)
              return (
                <div
                  key={a.id}
                  className={`achievements__item ${unlocked ? 'achievements__item--unlocked' : ''} ${a.hidden && !unlocked ? 'achievements__item--hidden' : ''}`}
                >
                  <span className="achievements__icon">
                    {a.hidden && !unlocked ? '❓' : a.icon}
                  </span>
                  <div className="achievements__info">
                    <div className="achievements__name">
                      {a.hidden && !unlocked ? '???' : a.name}
                    </div>
                    <div className="achievements__desc">
                      {a.hidden && !unlocked ? 'Secret achievement' : a.description}
                    </div>
                    {a.reward && unlocked && (
                      <div className="achievements__reward">
                        Reward: {a.reward}
                      </div>
                    )}
                  </div>
                  {unlocked && <span className="achievements__check">✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
