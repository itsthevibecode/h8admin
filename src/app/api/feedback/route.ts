import { NextResponse } from 'next/server'
import { SuggestionCategory } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getSupabaseUser } from '@/lib/supabase-server'

const CATEGORIES = new Set<string>(Object.values(SuggestionCategory))

export async function GET() {
  const { user } = await getSupabaseUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const suggestions = await prisma.adminSuggestion.findMany({
      include: {
        user: { select: { name: true, email: true } },
        upvotes: { select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const ranked = suggestions
      .map((suggestion) => ({
        id: suggestion.id,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        status: suggestion.status,
        createdAt: suggestion.createdAt,
        authorName: suggestion.user.name || suggestion.user.email.split('@')[0],
        upvoteCount: suggestion.upvotes.length,
        hasUpvoted: suggestion.upvotes.some((vote) => vote.userId === user.id),
        isOwner: suggestion.userId === user.id,
      }))
      .sort((a, b) => {
        if (b.upvoteCount !== a.upvoteCount) return b.upvoteCount - a.upvoteCount
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

    return NextResponse.json({ suggestions: ranked })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { user } = await getSupabaseUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const category =
      typeof body.category === 'string' && CATEGORIES.has(body.category)
        ? (body.category as SuggestionCategory)
        : SuggestionCategory.BILLING

    if (title.length < 4) {
      return NextResponse.json({ error: 'Title must be at least 4 characters' }, { status: 400 })
    }
    if (description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const suggestion = await prisma.adminSuggestion.create({
      data: {
        userId: user.id,
        title,
        description,
        category,
      },
    })

    return NextResponse.json({ suggestion }, { status: 201 })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
