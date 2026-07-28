import { NextRequest, NextResponse } from 'next/server'

// Global counters — visible to everyone in real time
const counters: Record<string, number> = {
  cookies: 0,
  jumps: 0,
  discoveries: 0,
  boost_seconds: 0,
  honks: 0,
}

export async function GET() {
  return NextResponse.json({ counters })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { counter, amount = 1 } = body

  if (!counter || typeof counter !== 'string') {
    return NextResponse.json({ error: 'Counter name required' }, { status: 400 })
  }

  if (!(counter in counters)) {
    counters[counter] = 0
  }

  counters[counter] += amount
  return NextResponse.json({ counter, value: counters[counter] })
}
