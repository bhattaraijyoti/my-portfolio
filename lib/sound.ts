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

  // ─── BIRDS (procedural chirps) ─────────────────────
  function scheduleBird() {
    if (!ctx || !master || !ambientRunning) return
    const now = ctx.currentTime
    const delay = 2 + Math.random() * 8

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const baseFreq = 2000 + Math.random() * 2000
    osc.frequency.setValueAtTime(baseFreq, now + delay)
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.2, now + delay + 0.05)
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.9, now + delay + 0.1)
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + delay + 0.15)

    const birdGain = ctx.createGain()
    birdGain.gain.setValueAtTime(0, now + delay)
    birdGain.gain.linearRampToValueAtTime(0.03, now + delay + 0.02)
    birdGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2)

    osc.connect(birdGain)
    birdGain.connect(master)
    osc.start(now + delay)
    osc.stop(now + delay + 0.25)

    setTimeout(scheduleBird, (delay + 0.3) * 1000)
  }
  scheduleBird()
  scheduleBird()
  scheduleBird()

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
