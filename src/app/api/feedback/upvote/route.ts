import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSupabaseUser } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { user } = await getSupabaseUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { suggestionId } = await req.json()
    if (!suggestionId || typeof suggestionId !== 'string') {
      return NextResponse.json({ error: 'suggestionId is required' }, { status: 400 })
    }

    const suggestion = await prisma.adminSuggestion.findUnique({
      where: { id: suggestionId },
      select: { id: true },
    })
    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    const existing = await prisma.suggestionUpvote.findUnique({
      where: {
        userId_suggestionId: {
          userId: user.id,
          suggestionId,
        },
      },
    })

    if (existing) {
      await prisma.suggestionUpvote.delete({ where: { id: existing.id } })
      return NextResponse.json({ upvoted: false })
    }

    await prisma.suggestionUpvote.create({
      data: {
        userId: user.id,
        suggestionId,
      },
    })

    return NextResponse.json({ upvoted: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
