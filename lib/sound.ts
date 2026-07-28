// ═══════════════════════════════════════════════════════════════
// SOUND ENGINE — Pure Web Audio API synthesis
// Engine hum, discovery chime, boost rumble, UI clicks
// ═══════════════════════════════════════════════════════════════

let ctx: AudioContext | null = null
let masterGain: GainNode | null = null
let engineOsc1: OscillatorNode | null = null
let engineOsc2: OscillatorNode | null = null
let engineGain: GainNode | null = null
let engineFilter: BiquadFilterNode | null = null
let engineRunning = false

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
  if (!engineOsc1 || !engineOsc2 || !engineGain || !engineFilter) return

  const absSpeed = Math.abs(speed)
  const ratio = Math.min(absSpeed / maxSpeed, 1)

  // Pitch rises with speed
  const freq = ENGINE_BASE_FREQ + ratio * 120 + (boost ? 30 : 0)
  const subFreq = ENGINE_SUB_FREQ + ratio * 40
  engineOsc1.frequency.setTargetAtTime(freq, ctx!.currentTime, 0.05)
  engineOsc2.frequency.setTargetAtTime(subFreq, ctx!.currentTime, 0.05)

  // Volume rises with speed
  const vol = 0.05 + ratio * 0.25 + (boost ? 0.08 : 0)
  engineGain.gain.setTargetAtTime(Math.min(vol, 0.35), ctx!.currentTime, 0.05)

  // Filter opens with speed
  engineFilter.frequency.setTargetAtTime(150 + ratio * 600, ctx!.currentTime, 0.05)
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
