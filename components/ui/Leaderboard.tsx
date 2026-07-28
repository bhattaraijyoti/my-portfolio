'use client'

import { useState, useEffect } from 'react'

interface LeaderboardEntry {
  name: string
  flag: string
  time: number
  date: string
}

const FLAGS: Record<string, string> = {
  np: '🇳🇵', us: '🇺🇸', gb: '🇬🇧', in: '🇮🇳', jp: '🇯🇵',
  de: '🇩🇪', fr: '🇫🇷', br: '🇧🇷', kr: '🇰🇷', au: '🇦🇺',
  ca: '🇨🇦', mx: '🇲🇽', it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱',
}

function formatTime(ms: number) {
  const s = ms / 1000
  const min = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms3 = Math.floor((s % 1) * 1000)
  return `${min}:${String(sec).padStart(2, '0')}.${String(ms3).padStart(3, '0')}`
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setEntries(data.leaderboard || [])
        setDate(data.date || '')
      } catch {}
    }
    fetch()
    const interval = setInterval(fetch, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="leaderboard">
      <button className="leaderboard__toggle" onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 21h8m-4-4v4m-3-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm6 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 11l2 4h8l2-4" />
        </svg>
        Leaderboard
      </button>

      {open && (
        <div className="leaderboard__panel">
          <div className="leaderboard__header">
            <span>Daily Race — {date}</span>
            <button onClick={() => setOpen(false)}>&times;</button>
          </div>
          {entries.length === 0 ? (
            <div className="leaderboard__empty">No laps recorded yet today</div>
          ) : (
            <div className="leaderboard__list">
              {entries.map((e, i) => (
                <div key={i} className={`leaderboard__row ${i < 3 ? 'leaderboard__row--top' : ''}`}>
                  <span className="leaderboard__rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                  <span className="leaderboard__flag">{FLAGS[e.flag] || e.flag}</span>
                  <span className="leaderboard__name">{e.name}</span>
                  <span className="leaderboard__time">{formatTime(e.time)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
