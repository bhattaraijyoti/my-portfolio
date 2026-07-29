// ═══════════════════════════════════════════════════════════════
// SOUND ENGINE — Pure Web Audio API synthesis
// Engine hum, discovery chime, boost rumble, ambient layers,
// wind, birds, rain, spatial SFX, UI clicks
// ═══════════════════════════════════════════════════════════════

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let engineOsc1: OscillatorNode | null = null
let engineOsc2: OscillatorNode | null = null
let engineGain: GainNode | null = null
let engineFilter: BiquadFilterNode | null = null
let engineRunning = false
let muted = false

// Ambient layer nodes
let ambientNodes: AudioNode[] = []
let windNode: GainNode | null = null
let birdNode: GainNode | null = null
let rainNode: GainNode | null = null
let ambientRunning = false

const ENGINE_BASE_FREQ = 55
const ENGINE_SUB_FREQ = 30

function ensureContext() {
  if (!ctx) {
    ctx = new AudioContext()
    masterGain = ctx.createGain()
    masterGain.gain.value = 0.35
    masterGain.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return { ctx, master: masterGain! }
}

export function toggleMute() {
  muted = !muted
  if (masterGain) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, ctx!.currentTime, 0.05)
  }
  return muted
}

export function isMuted() {
  return muted
}

// ─── ENGINE ─────────────────────────────────────────────────────

export function startEngine() {
  if (engineRunning) return
  const { ctx: c, master } = ensureContext()

  engineGain = c.createGain()
  engineGain.gain.value = 0

  engineFilter = c.createBiquadFilter()
  engineFilter.type = 'lowpass'
  engineFilter.frequency.value = 200
  engineFilter.Q.value = 2

  engineOsc1 = c.createOscillator()
  engineOsc1.type = 'sawtooth'
  engineOsc1.frequency.value = ENGINE_BASE_FREQ

  engineOsc2 = c.createOscillator()
  engineOsc2.type = 'sine'
  engineOsc2.frequency.value = ENGINE_SUB_FREQ

  engineOsc1.connect(engineFilter)
  engineOsc2.connect(engineGain!)
  engineGain!.connect(engineFilter)
  engineFilter.connect(master)

  engineOsc1.start()
  engineOsc2.start()
  engineRunning = true
}

export function updateEngine(speed: number, maxSpeed: number, boost: boolean) {
  if (!engineOsc1 || !engineOsc2 || !engineGain || !engineFilter || !ctx) return

  const absSpeed = Math.abs(speed)
  const ratio = Math.min(absSpeed / maxSpeed, 1)

  // Pitch rises with speed
  const freq = ENGINE_BASE_FREQ + ratio * 120 + (boost ? 30 : 0)
  const subFreq = ENGINE_SUB_FREQ + ratio * 40
  engineOsc1.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05)
  engineOsc2.frequency.setTargetAtTime(subFreq, ctx.currentTime, 0.05)

  // Volume rises with speed
  const vol = 0.05 + ratio * 0.25 + (boost ? 0.08 : 0)
  engineGain.gain.setTargetAtTime(Math.min(vol, 0.35), ctx.currentTime, 0.05)

  // Filter opens with speed
  engineFilter.frequency.setTargetAtTime(150 + ratio * 600, ctx.currentTime, 0.05)
}

export function stopEngine() {
  if (!engineRunning) return
  try {
    engineOsc1?.stop()
    engineOsc2?.stop()
    engineOsc1?.disconnect()
    engineOsc2?.disconnect()
    engineGain?.disconnect()
    engineFilter?.disconnect()
  } catch {}
  engineOsc1 = null
  engineOsc2 = null
  engineGain = null
  engineFilter = null
  engineRunning = false
}

// ─── AMBIENT LAYERS ────────────────────────────────────────────

export function startAmbient() {
  if (ambientRunning) return
  const { ctx: c, master } = ensureContext()
  ambientRunning = true

  // ─── WIND ──────────────────────────────────────────
  const windBuffer = c.createBuffer(1, c.sampleRate * 4, c.sampleRate)
  const windData = windBuffer.getChannelData(0)
  // Brown noise (low-frequency wind)
  let lastVal = 0
  for (let i = 0; i < windData.length; i++) {
    const white = Math.random() * 2 - 1
    lastVal = (lastVal + 0.02 * white) / 1.02
    windData[i] = lastVal * 3.5
  }
  const windSource = c.createBufferSource()
  windSource.buffer = windBuffer
  windSource.loop = true

  const windFilter = c.createBiquadFilter()
  windFilter.type = 'lowpass'
  windFilter.frequency.value = 400
  windFilter.Q.value = 0.5

  windNode = c.createGain()
  windNode.gain.value = 0.08

  windSource.connect(windFilter)
  windFilter.connect(windNode)
  windNode.connect(master)
  windSource.start()
  ambientNodes.push(windSource, windFilter, windNode)

  // ─── BIRDS (sparse random chirps) ──────────────────
  function scheduleBird(species: number) {
    if (!ctx || !master || !ambientRunning) return
    const now = ctx.currentTime

    const patterns = [
      { delayRange: [8, 25], freqRange: [2500, 4000], vol: 0.04, type: 'quick' },
      { delayRange: [12, 30], freqRange: [1800, 3000], vol: 0.035, type: 'trill' },
      { delayRange: [10, 20], freqRange: [3000, 5000], vol: 0.03, type: 'high' },
    ]

    const p = patterns[species % patterns.length]
    const delay = p.delayRange[0] + Math.random() * (p.delayRange[1] - p.delayRange[0])
    const baseFreq = p.freqRange[0] + Math.random() * (p.freqRange[1] - p.freqRange[0])

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(baseFreq, now + delay)

    if (p.type === 'trill') {
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.3, now + delay + 0.03)
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.85, now + delay + 0.06)
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + delay + 0.09)
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + delay + 0.12)
    } else {
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + delay + 0.05)
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + delay + 0.1)
      osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + delay + 0.15)
    }

    const birdGain = ctx.createGain()
    birdGain.gain.setValueAtTime(0, now + delay)
    birdGain.gain.linearRampToValueAtTime(p.vol, now + delay + 0.02)
    birdGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25)

    const birdFilter = ctx.createBiquadFilter()
    birdFilter.type = 'lowpass'
    birdFilter.frequency.value = baseFreq * 2.5

    osc.connect(birdFilter)
    birdFilter.connect(birdGain)
    birdGain.connect(master)
    osc.start(now + delay)
    osc.stop(now + delay + 0.3)

    setTimeout(() => scheduleBird(species), (delay + 0.3) * 1000)
  }
  for (let i = 0; i < 3; i++) scheduleBird(i)

  // ─── RAIN (noise-based) ────────────────────────────
  const rainBuffer = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
  const rainData = rainBuffer.getChannelData(0)
  for (let i = 0; i < rainData.length; i++) {
    rainData[i] = (Math.random() * 2 - 1) * 0.15
  }
  const rainSource = c.createBufferSource()
  rainSource.buffer = rainBuffer
  rainSource.loop = true

  const rainFilter = c.createBiquadFilter()
  rainFilter.type = 'highpass'
  rainFilter.frequency.value = 3000
  rainFilter.Q.value = 0.3

  rainNode = c.createGain()
  rainNode.gain.value = 0 // starts silent, weather system controls it

  rainSource.connect(rainFilter)
  rainFilter.connect(rainNode)
  rainNode.connect(master)
  rainSource.start()
  ambientNodes.push(rainSource, rainFilter, rainNode)
}

export function stopAmbient() {
  ambientRunning = false
  ambientNodes.forEach((node) => {
    try { node.disconnect() } catch {}
  })
  ambientNodes = []
  windNode = null
  birdNode = null
  rainNode = null
}

export function updateAmbientWind(strength: number) {
  if (windNode && ctx) {
    windNode.gain.setTargetAtTime(0.03 + strength * 0.12, ctx.currentTime, 0.1)
  }
}

export function updateAmbientRain(raining: boolean, intensity = 0.5) {
  if (rainNode && ctx) {
    rainNode.gain.setTargetAtTime(raining ? intensity * 0.15 : 0, ctx.currentTime, 0.3)
  }
}

// ─── DISCOVERY CHIME ────────────────────────────────────────────

export function playDiscoveryChime() {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  const notes = [523.25, 659.25, 783.99, 1046.5] // C5 E5 G5 C6
  const noteLen = 0.12

  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    gain.gain.setValueAtTime(0, now + i * noteLen)
    gain.gain.linearRampToValueAtTime(0.18, now + i * noteLen + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + 0.4)

    osc.connect(gain)
    gain.connect(master)
    osc.start(now + i * noteLen)
    osc.stop(now + i * noteLen + 0.45)
  })
}

// ─── UI CLICK ───────────────────────────────────────────────────

export function playClick() {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.value = 800
  gain.gain.setValueAtTime(0.12, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
  osc.connect(gain)
  gain.connect(master)
  osc.start(now)
  osc.stop(now + 0.1)
}

// ─── TELEPORT WHOOSH ────────────────────────────────────────────

export function playWhoosh() {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  const noise = c.createBufferSource()
  const bufferSize = c.sampleRate * 0.3
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.3
  }
  noise.buffer = buffer

  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(2000, now)
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.3)
  filter.Q.value = 3

  const gain = c.createGain()
  gain.gain.setValueAtTime(0.2, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  noise.start(now)
  noise.stop(now + 0.35)
}

// ─── ACHIEVEMENT UNLOCK ─────────────────────────────────────────

export function playAchievementUnlock() {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  // Triumphant ascending arpeggio
  const notes = [392, 523.25, 659.25, 783.99, 1046.5] // G4 C5 E5 G5 C6
  notes.forEach((freq, i) => {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const t = now + i * 0.08
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.15, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5)

    osc.connect(gain)
    gain.connect(master)
    osc.start(t)
    osc.stop(t + 0.55)
  })
}

// ─── HONK ───────────────────────────────────────────────────────

export function playHonk() {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'square'
  osc.frequency.setValueAtTime(320, now)
  osc.frequency.setValueAtTime(280, now + 0.05)

  gain.gain.setValueAtTime(0.08, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)

  osc.connect(gain)
  gain.connect(master)
  osc.start(now)
  osc.stop(now + 0.3)
}

// ─── COLLISION THUD ─────────────────────────────────────────────

export function playCollision(intensity: number) {
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150 * intensity, now)
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.15)

  gain.gain.setValueAtTime(0.2 * Math.min(intensity, 1), now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)

  osc.connect(gain)
  gain.connect(master)
  osc.start(now)
  osc.stop(now + 0.25)
}

// ─── BACKGROUND MUSIC (upbeat chill wave) ────────

let musicRunning = false
let musicTimeout: ReturnType<typeof setTimeout> | null = null

const BPM = 110
const BEAT = 60 / BPM

function playMelodyNote(ctx: AudioContext, master: GainNode, freq: number, startTime: number, duration: number, vol: number) {
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, startTime)

  const osc2 = ctx.createOscillator()
  osc2.type = 'sine'
  osc2.frequency.value = freq * 2

  const osc3 = ctx.createOscillator()
  osc3.type = 'sine'
  osc3.frequency.value = freq * 3

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(vol, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(vol * 0.6, startTime + 0.1)
  gain.gain.exponentialRampToValueAtTime(vol * 0.25, startTime + duration * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)

  const gain2 = ctx.createGain()
  gain2.gain.setValueAtTime(0, startTime)
  gain2.gain.linearRampToValueAtTime(vol * 0.4, startTime + 0.01)
  gain2.gain.exponentialRampToValueAtTime(vol * 0.15, startTime + duration * 0.2)
  gain2.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.6)

  const gain3 = ctx.createGain()
  gain3.gain.setValueAtTime(0, startTime)
  gain3.gain.linearRampToValueAtTime(vol * 0.15, startTime + 0.01)
  gain3.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.4)

  osc.connect(gain)
  osc2.connect(gain2)
  osc3.connect(gain3)
  gain.connect(master)
  gain2.connect(master)
  gain3.connect(master)
  osc.start(startTime)
  osc2.start(startTime)
  osc3.start(startTime)
  osc.stop(startTime + duration + 0.05)
  osc2.stop(startTime + duration + 0.05)
  osc3.stop(startTime + duration + 0.05)
}

function playChord(ctx: AudioContext, master: GainNode, freqs: number[], startTime: number, duration: number, vol: number) {
  freqs.forEach((f, i) => {
    const delay = i * 0.015

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(f, startTime + delay)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = f * 2

    const osc3 = ctx.createOscillator()
    osc3.type = 'sine'
    osc3.frequency.value = f * 4

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, startTime + delay)
    gain.gain.linearRampToValueAtTime(vol * 0.8, startTime + delay + 0.02)
    gain.gain.exponentialRampToValueAtTime(vol * 0.3, startTime + delay + duration * 0.15)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0, startTime + delay)
    gain2.gain.linearRampToValueAtTime(vol * 0.3, startTime + delay + 0.02)
    gain2.gain.exponentialRampToValueAtTime(vol * 0.1, startTime + delay + duration * 0.1)
    gain2.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration * 0.5)

    const gain3 = ctx.createGain()
    gain3.gain.setValueAtTime(0, startTime + delay)
    gain3.gain.linearRampToValueAtTime(vol * 0.1, startTime + delay + 0.02)
    gain3.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration * 0.35)

    osc.connect(gain)
    osc2.connect(gain2)
    osc3.connect(gain3)
    gain.connect(master)
    gain2.connect(master)
    gain3.connect(master)
    osc.start(startTime + delay)
    osc2.start(startTime + delay)
    osc3.start(startTime + delay)
    osc.stop(startTime + delay + duration + 0.05)
    osc2.stop(startTime + delay + duration + 0.05)
    osc3.stop(startTime + delay + duration + 0.05)
  })
}

const CHORDS: [number[], number, number][] = [
  [[174.61, 220.0, 261.63, 349.23], 0, 4],
  [[220.0, 277.18, 329.63, 440.0], 4, 4],
  [[196.0, 246.94, 293.66, 392.0], 8, 4],
  [[246.94, 311.13, 369.99, 493.88], 12, 4],
]

const MELODY: [number, number, number, number][] = [
  [349.23, 0, 1.5, 0.07],
  [440.0, 1.5, 0.5, 0.07],
  [349.23, 2, 1.5, 0.07],
  [329.63, 3.5, 0.5, 0.06],
  [349.23, 4, 1, 0.07],
  [392.0, 5, 0.5, 0.07],
  [440.0, 5.5, 0.5, 0.07],
  [523.25, 6, 1.5, 0.07],
  [493.88, 7.5, 0.5, 0.06],
  [440.0, 8, 1, 0.07],
  [392.0, 9, 0.5, 0.06],
  [349.23, 9.5, 0.5, 0.06],
  [329.63, 10, 1.5, 0.07],
  [293.66, 11.5, 0.5, 0.06],
  [329.63, 12, 2, 0.08],
  [440.0, 14, 1, 0.07],
  [523.25, 15, 1, 0.07],
  [587.33, 16, 2, 0.08],
  [523.25, 18, 0.5, 0.06],
  [493.88, 18.5, 0.5, 0.06],
  [440.0, 19, 1.5, 0.07],
  [392.0, 20.5, 0.5, 0.06],
  [349.23, 21, 1.5, 0.07],
  [329.63, 22.5, 0.5, 0.06],
  [349.23, 23, 1, 0.07],
  [349.23, 24, 0.5, 0.07],
  [440.0, 24.5, 0.5, 0.07],
  [523.25, 25, 1.5, 0.08],
  [493.88, 26.5, 0.5, 0.06],
  [440.0, 27, 1.5, 0.07],
  [392.0, 28.5, 0.5, 0.06],
  [349.23, 29, 1, 0.07],
  [329.63, 30, 1.5, 0.07],
  [349.23, 31.5, 0.5, 0.06],
  [440.0, 32, 1.5, 0.08],
  [523.25, 33.5, 0.5, 0.07],
  [587.33, 34, 1.5, 0.08],
  [523.25, 35.5, 0.5, 0.06],
  [493.88, 36, 1, 0.07],
  [440.0, 37, 1.5, 0.07],
  [392.0, 38.5, 0.5, 0.06],
  [349.23, 39, 1.5, 0.07],
  [329.63, 40.5, 0.5, 0.06],
  [349.23, 41, 1.5, 0.07],
  [440.0, 42.5, 0.5, 0.06],
  [523.25, 43, 1, 0.08],
  [587.33, 44, 1.5, 0.08],
  [523.25, 45.5, 0.5, 0.06],
  [493.88, 46, 0.5, 0.06],
  [440.0, 46.5, 2, 0.07],
]

function scheduleMusicSection(ctx: AudioContext, master: GainNode, startTime: number) {
  CHORDS.forEach(([freqs, offset, dur]) => {
    playChord(ctx, master, freqs, startTime + offset, dur, 0.03)
  })
  MELODY.forEach(([freq, t, dur, vol]) => {
    playMelodyNote(ctx, master, freq, startTime + t * BEAT, dur * BEAT, vol)
  })
}

function scheduleNextMusic() {
  if (!musicRunning) return
  const { ctx: c, master } = ensureContext()
  const now = c.currentTime

  scheduleMusicSection(c, master, now + 0.2)

  musicTimeout = setTimeout(scheduleNextMusic, 48 * BEAT * 1000)
}

export function startMusic() {
  if (musicRunning) return
  musicRunning = true
  scheduleNextMusic()
}

export function stopMusic() {
  musicRunning = false
  if (musicTimeout) {
    clearTimeout(musicTimeout)
    musicTimeout = null
  }
}
