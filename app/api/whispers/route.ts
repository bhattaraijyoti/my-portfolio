import { NextRequest, NextResponse } from 'next/server'

// In-memory store (resets on server restart — use a DB for production)
let whispers: Array<{
  id: string
  message: string
  flag: string
  author: string
  createdAt: number
}> = []

const MAX_WHISPERS = 30
const MAX_MESSAGE_LENGTH = 30
const FLAG_REGEX = /^[a-z]{2}$/i

// Simple profanity filter (extend with a real API in production)
const BLOCKED = ['slur', 'hate', 'spam']
function isClean(msg: string): boolean {
  const lower = msg.toLowerCase()
  return !BLOCKED.some((w) => lower.includes(w))
}

export async function GET() {
  return NextResponse.json({ whispers: whispers.slice(-MAX_WHISPERS) })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { message, flag, author } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Max ${MAX_MESSAGE_LENGTH} chars` }, { status: 400 })
  }
  if (!flag || !FLAG_REGEX.test(flag)) {
    return NextResponse.json({ error: 'Valid 2-letter flag code required' }, { status: 400 })
  }
  if (!isClean(message)) {
    return NextResponse.json({ error: 'Message contains blocked content' }, { status: 400 })
  }

  const whisper = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    message: message.slice(0, MAX_MESSAGE_LENGTH),
    flag: flag.toLowerCase(),
    author: author || 'Anonymous',
    createdAt: Date.now(),
  }

  // One per author — evict old one
  whispers = whispers.filter((w) => w.author !== whisper.author)
  whispers.push(whisper)

  // Cap at MAX, evict oldest
  if (whispers.length > MAX_WHISPERS) {
    whispers = whispers.slice(-MAX_WHISPERS)
  }

  return NextResponse.json({ whisper })
}
