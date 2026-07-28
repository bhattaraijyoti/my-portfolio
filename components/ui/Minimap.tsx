'use client'

import { useRef, useEffect, useCallback } from 'react'
import { carStore } from '../3d/store'

const WORLD_BOUNDS = 22
const MAP_SIZE = 180
const PROJECTS = [
  { title: 'Treatss', position: [-14, -4] as [number, number], color: '#00e86a' },
  { title: 'Tech Club', position: [12, -18] as [number, number], color: '#60a5fa' },
  { title: 'Tulsipur Dang', position: [-5, -26] as [number, number], color: '#f472b6' },
]

const ROADS: [number, number, number, number][] = [
  [0, 5, 0, -32],
  [-8, 5, -8, -28],
  [8, 5, 8, -28],
  [0, -4, -18, -4],
  [0, -18, 14, -18],
  [0, -26, -8, -26],
]

export default function Minimap({ visible = true }: { visible?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef<number>(0)

  const worldToMap = useCallback((wx: number, wz: number): [number, number] => {
    const scale = MAP_SIZE / (WORLD_BOUNDS * 2)
    return [
      (wx + WORLD_BOUNDS) * scale,
      (wz + WORLD_BOUNDS) * scale,
    ]
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, MAP_SIZE, MAP_SIZE)

      // Background
      ctx.fillStyle = 'rgba(15, 12, 20, 0.92)'
      ctx.beginPath()
      ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 12)
      ctx.fill()

      // Grid dots
      ctx.fillStyle = 'rgba(255,255,255,0.04)'
      for (let x = 0; x < MAP_SIZE; x += 12) {
        for (let y = 0; y < MAP_SIZE; y += 12) {
          ctx.fillRect(x, y, 1, 1)
        }
      }

      // Roads
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      for (const [x1, z1, x2, z2] of ROADS) {
        const [mx1, mz1] = worldToMap(x1, z1)
        const [mx2, mz2] = worldToMap(x2, z2)
        ctx.beginPath()
        ctx.moveTo(mx1, mz1)
        ctx.lineTo(mx2, mz2)
        ctx.stroke()
      }

      // Projects
      for (const p of PROJECTS) {
        const [mx, mz] = worldToMap(p.position[0], p.position[1])
        // Glow
        ctx.beginPath()
        ctx.arc(mx, mz, 6, 0, Math.PI * 2)
        ctx.fillStyle = p.color + '30'
        ctx.fill()
        // Dot
        ctx.beginPath()
        ctx.arc(mx, mz, 3, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.font = '8px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.title, mx, mz - 8)
      }

      // Car
      const pos = carStore.position
      const rot = carStore.rotation
      const [cx, cz] = worldToMap(pos.x, pos.z)

      // Car trail dot
      ctx.beginPath()
      ctx.arc(cx, cz, 4, 0, Math.PI * 2)
      ctx.fillStyle = '#fbbf24'
      ctx.shadowColor = '#fbbf24'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0

      // Car heading triangle
      ctx.save()
      ctx.translate(cx, cz)
      ctx.rotate(rot)
      ctx.beginPath()
      ctx.moveTo(0, -6)
      ctx.lineTo(-3, 4)
      ctx.lineTo(3, 4)
      ctx.closePath()
      ctx.fillStyle = '#fbbf24'
      ctx.fill()
      ctx.restore()

      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(0, 0, MAP_SIZE, MAP_SIZE, 12)
      ctx.stroke()

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [worldToMap])

  return (
    <div className={`minimap ${visible ? '' : 'is-hidden'}`}>
      <canvas
        ref={canvasRef}
        width={MAP_SIZE}
        height={MAP_SIZE}
        style={{ width: MAP_SIZE, height: MAP_SIZE, borderRadius: 12 }}
      />
      <div className="minimap__label">MAP</div>
    </div>
  )
}
