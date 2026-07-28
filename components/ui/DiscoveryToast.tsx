'use client'

import { useEffect, useState } from 'react'

export interface Toast {
  id: number
  title: string
  subtitle: string
  color: string
}

const COLORS = ['#00e86a', '#60a5fa', '#f472b6']

let toastId = 0

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (title: string, subtitle: string, colorIndex: number = 0) => {
    const id = ++toastId
    const toast: Toast = { id, title, subtitle, color: COLORS[colorIndex % COLORS.length] }
    setToasts((prev) => [...prev, toast])
  }

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}

export default function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: number) => void
}) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div className="toast" style={{ '--toast-color': toast.color } as React.CSSProperties}>
      <div className="toast__icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={toast.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <div className="toast__body">
        <div className="toast__title">{toast.title}</div>
        <div className="toast__subtitle">{toast.subtitle}</div>
      </div>
      <button className="toast__close" onClick={() => onDismiss(toast.id)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div className="toast__progress" style={{ backgroundColor: toast.color }} />
    </div>
  )
}
