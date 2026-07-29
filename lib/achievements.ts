'use client'

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS SYSTEM
// Track player accomplishments with cosmetic unlocks
// ═══════════════════════════════════════════════════════════════

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string       // emoji or SVG path
  reward?: string    // cosmetic unlock name
  hidden: boolean    // cryptic/secret achievement
  category: 'explore' | 'skill' | 'secret' | 'social'
}

export interface AchievementState {
  id: string
  unlocked: boolean
  unlockedAt: number | null
}

export const ACHIEVEMENTS: Achievement[] = [
  // ─── EXPLORE ────────────────────────────────────────
  {
    id: 'first_project',
    name: 'Explorer',
    description: 'Discover your first project',
    icon: '🔍',
    category: 'explore',
    hidden: false,
  },
  {
    id: 'all_projects',
    name: 'Completionist',
    description: 'Discover all projects',
    icon: '🏆',
    reward: 'Chrome Skin',
    category: 'explore',
    hidden: false,
  },
  {
    id: 'full_map',
    name: 'Cartographer',
    description: 'Drive to every corner of the world',
    icon: '🗺️',
    category: 'explore',
    hidden: false,
  },
  {
    id: 'find_secret',
    name: 'What Was That?',
    description: 'Find the hidden area behind the waterfall',
    icon: '🤫',
    reward: 'Ghost Skin',
    category: 'secret',
    hidden: true,
  },

  // ─── SKILL ──────────────────────────────────────────
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Reach maximum speed',
    icon: '⚡',
    reward: 'Flame Skin',
    category: 'skill',
    hidden: false,
  },
  {
    id: 'drift_master',
    name: 'Drift Master',
    description: 'Drift for 3 seconds continuously',
    icon: '🎿',
    category: 'skill',
    hidden: false,
  },
  {
    id: 'lap_10',
    name: 'Quick Lapper',
    description: 'Complete a lap in under 10 seconds',
    icon: '⏱️',
    reward: 'Carbon Skin',
    category: 'skill',
    hidden: false,
  },
  {
    id: 'lap_8',
    name: 'Track Legend',
    description: 'Complete a lap in under 8 seconds',
    icon: '🏅',
    reward: 'Gold Skin',
    category: 'skill',
    hidden: false,
  },
  {
    id: 'no_crash',
    name: 'Precision Driver',
    description: 'Drive 500 units without hitting anything',
    icon: '🎯',
    category: 'skill',
    hidden: false,
  },

  // ─── SECRET ─────────────────────────────────────────
  {
    id: 'honk_50',
    name: 'The Honker',
    description: 'Honk 50 times',
    icon: '📯',
    reward: 'Musical Skin',
    category: 'secret',
    hidden: true,
  },
  {
    id: 'reverse_king',
    name: 'Wrong Way',
    description: 'Drive in reverse for 10 seconds total',
    icon: '🔄',
    category: 'secret',
    hidden: true,
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play between midnight and 4 AM',
    icon: '🦉',
    reward: 'Midnight Skin',
    category: 'secret',
    hidden: true,
  },
  {
    id: 'easter_egg',
    name: 'Easter Egg',
    description: 'You found something special',
    icon: '🥚',
    reward: 'Rainbow Skin',
    category: 'secret',
    hidden: true,
  },

   // ─── SOCIAL ─────────────────────────────────────────
   {
    id: 'cookie_counter',
    name: 'Cookie Monster',
    description: 'Click the cookie counter 10 times',
    icon: '🍪',
    reward: 'Cookie Skin',
    category: 'social',
    hidden: true,
  },
]

// ─── LOCAL STORAGE MANAGER ─────────────────────────────────────
const STORAGE_KEY = 'portfolio_achievements'

export function loadAchievements(): AchievementState[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveAchievements(states: AchievementState[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states))
}

export function unlockAchievement(id: string): boolean {
  const states = loadAchievements()
  const existing = states.find((s) => s.id === id)
  if (existing?.unlocked) return false

  const state: AchievementState = {
    id,
    unlocked: true,
    unlockedAt: Date.now(),
  }

  // Remove old entry if exists and add new
  const filtered = states.filter((s) => s.id !== id)
  filtered.push(state)
  saveAchievements(filtered)
  return true
}

export function isUnlocked(id: string): boolean {
  return loadAchievements().some((s) => s.id === id && s.unlocked)
}

export function getUnlockedCount(): number {
  return loadAchievements().filter((s) => s.unlocked).length
}

// ─── ACHIEVEMENT TRACKER (call from useFrame) ───────────────
let lastSpeedCheck = 0
let driftTime = 0
let distanceSinceNoHit = 0
let lastPosition = { x: 0, z: 0 }

export function trackAchievements(carSpeed: number, isDrifting: boolean) {
  const now = Date.now()

  // Speed demon
  if (carSpeed > 20 && now - lastSpeedCheck > 500) {
    unlockAchievement('speed_demon')
    lastSpeedCheck = now
  }

  // Drift master
  if (isDrifting) {
    driftTime += 1 / 60
    if (driftTime > 3) {
      unlockAchievement('drift_master')
    }
  } else {
    driftTime = Math.max(0, driftTime - 1 / 60)
  }

  // Distance tracking
  const dx = lastPosition.x - 0 // carStore.position
  const dz = lastPosition.z - 0
  distanceSinceNoHit += Math.sqrt(dx * dx + dz * dz)
  if (distanceSinceNoHit > 500) {
    unlockAchievement('no_crash')
  }

  // Night owl
  const hour = new Date().getHours()
  if (hour >= 0 && hour < 4) {
    unlockAchievement('night_owl')
  }
}

// ─── VEHICLE SKINS (cosmetic rewards) ──────────────────────────
export const VEHICLE_SKINS: Record<string, { color: string; emissive?: string; metalness?: number; roughness?: number }> = {
  default: { color: '#1a1a2e', metalness: 0.4, roughness: 0.12 },
  chrome: { color: '#888888', metalness: 0.95, roughness: 0.02 },
  ghost: { color: '#334455', emissive: '#112233', metalness: 0.5, roughness: 0.1 },
  flame: { color: '#cc2200', emissive: '#ff4400', metalness: 0.3, roughness: 0.15 },
  carbon: { color: '#222222', metalness: 0.2, roughness: 0.4 },
  gold: { color: '#ccaa33', metalness: 0.9, roughness: 0.05 },
  midnight: { color: '#0a0a1a', emissive: '#000033', metalness: 0.6, roughness: 0.08 },
  rainbow: { color: '#ff6688', emissive: '#44aaff', metalness: 0.5, roughness: 0.1 },
  musical: { color: '#8844cc', emissive: '#aa66ff', metalness: 0.4, roughness: 0.12 },
  cookie: { color: '#8B6914', metalness: 0.1, roughness: 0.7 },
}
