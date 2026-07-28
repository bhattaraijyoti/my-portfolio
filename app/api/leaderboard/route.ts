import { NextRequest, NextResponse } from 'next/server'

// Daily leaderboard — resets every 24h
let leaderboard: Array<{
  name: string
  flag: string
  time: number // milliseconds
  date: string // YYYY-MM-DD
}> = []

const MAX_ENTRIES = 10

function today() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  // Reset if day changed
  const now = today()
  if (leaderboard.length > 0 && leaderboard[0].date !== now) {
    leaderboard = []
  }
  return NextResponse.json({ leaderboard: leaderboard.slice(0, MAX_ENTRIES), date: now })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, flag, time } = body

  if (!name || typeof name !== 'string' || name.length > 15) {
    return NextResponse.json({ error: 'Name required (max 15 chars)' }, { status: 400 })
  }
  if (!flag || typeof flag !== 'string') {
    return NextResponse.json({ error: 'Flag code required' }, { status: 400 })
  }
  if (typeof time !== 'number' || time <= 0) {
    return NextResponse.json({ error: 'Valid time required' }, { status: 400 })
  }

  const now = today()
  // Reset if day changed
  if (leaderboard.length > 0 && leaderboard[0].date !== now) {
    leaderboard = []
  }

  leaderboard.push({ name: name.slice(0, 15), flag, time, date: now })
  leaderboard.sort((a, b) => a.time - b.time)
  leaderboard = leaderboard.slice(0, MAX_ENTRIES)

  return NextResponse.json({ leaderboard, position: leaderboard.findIndex((e) => e.time === time) + 1 })
}
