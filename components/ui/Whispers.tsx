'use client'

import { useState, useEffect, useCallback } from 'react'

interface Whisper {
  id: string
  message: string
  flag: string
  author: string
  createdAt: number
}

const FLAGS: Record<string, string> = {
  np: '🇳🇵', us: '🇺🇸', gb: '🇬🇧', in: '🇮🇳', jp: '🇯🇵',
  de: '🇩🇪', fr: '🇫🇷', br: '🇧🇷', kr: '🇰🇷', au: '🇦🇺',
  ca: '🇨🇦', mx: '🇲🇽', it: '🇮🇹', es: '🇪🇸', nl: '🇳🇱',
  se: '🇸🇪', no: '🇳🇴', pl: '🇵🇱', th: '🇹🇭', vn: '🇻🇳',
}

export default function Whispers() {
  const [whispers, setWhispers] = useState<Whisper[]>([])
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [flag, setFlag] = useState('np')
  const [sending, setSending] = useState(false)

  // Poll whispers
  useEffect(() => {
    const fetchWhispers = async () => {
      try {
        const res = await fetch('/api/whispers')
        const data = await res.json()
        setWhispers(data.whispers || [])
      } catch {}
    }
    fetchWhispers()
    const interval = setInterval(fetchWhispers, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = useCallback(async () => {
    if (!message.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch('/api/whispers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), flag, author: 'visitor' }),
      })
      if (res.ok) {
        setMessage('')
        setOpen(false)
        // Refresh
        const data = await (await fetch('/api/whispers')).json()
        setWhispers(data.whispers || [])
      }
    } catch {}
    setSending(false)
  }, [message, flag, sending])

  return (
    <div className="whispers">
      {/* Floating whispers in the world (top-left) */}
      <div className="whispers__list">
        {whispers.slice(-5).map((w) => (
          <div key={w.id} className="whispers__item">
            <span className="whispers__flag">{FLAGS[w.flag] || w.flag}</span>
            <span className="whispers__msg">{w.message}</span>
          </div>
        ))}
      </div>

      {/* Toggle button */}
      <button className="whispers__toggle" onClick={() => setOpen(!open)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Whisper
      </button>

      {/* Compose panel */}
      {open && (
        <div className="whispers__compose">
          <div className="whispers__compose-header">
            <span>Leave a whisper</span>
            <button onClick={() => setOpen(false)}>&times;</button>
          </div>
          <input
            type="text"
            maxLength={30}
            placeholder="Your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="whispers__input"
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <div className="whispers__compose-footer">
            <select value={flag} onChange={(e) => setFlag(e.target.value)} className="whispers__flag-select">
              {Object.entries(FLAGS).map(([code, emoji]) => (
                <option key={code} value={code}>{emoji} {code.toUpperCase()}</option>
              ))}
            </select>
            <button
              className="whispers__send"
              onClick={handleSend}
              disabled={!message.trim() || sending}
            >
              {sending ? '...' : 'Send'}
            </button>
          </div>
          <span className="whispers__charcount">{message.length}/30</span>
        </div>
      )}
    </div>
  )
}
