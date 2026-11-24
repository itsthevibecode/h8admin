import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NotificationType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { allowsNotification } from '@/lib/notification-prefs'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

function cardLabel(card: {
  nickname: string | null
  cardName: string | null
  brand: string
  last4: string
}) {
  return card.nickname || card.cardName || `${card.brand} ••${card.last4}`
}

async function generateConciergeAlerts(userId: string) {
  const now = new Date()
  const inFourteenDays = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const closingCards = await prisma.fundingSource.findMany({
    where: {
      userId,
      isCancelled: false,
      bonusDeadline: {
        gte: now,
        lte: inFourteenDays,
      },
    },
    select: {
      id: true,
      nickname: true,
      cardName: true,
      brand: true,
      last4: true,
      bonusDeadline: true,
    },
  })

  const recentBonusAlerts = await prisma.notification.findMany({
    where: {
      userId,
      type: NotificationType.BONUS_DEADLINE,
      createdAt: { gte: sevenDaysAgo },
    },
    select: { message: true },
  })

  const bonusCreates = closingCards.flatMap((card) => {
    if (!card.bonusDeadline) return []
    const label = cardLabel(card)
    const alreadyAlerted = recentBonusAlerts.some((alert) => alert.message.includes(label))
    if (alreadyAlerted) return []

    const daysRemaining = Math.max(
      0,
      Math.ceil((card.bonusDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )

    return [
      {
        userId,
        title: 'Bonus Spend Window Closing',
        message: `You have ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left to hit your spend target on ${label}.`,
        type: NotificationType.BONUS_DEADLINE,
        link: '/cards',
        isRead: false,
      },
    ]
  })

  const maturedLockouts = await prisma.cardLockout.findMany({
    where: {
      userId,
      eligibleAgainAt: { lte: now },
    },
    select: {
      bankGroup: true,
    },
  })

  const existingLockoutAlerts = await prisma.notification.findMany({
    where: {
      userId,
      type: NotificationType.BANK_LOCKOUT,
    },
    select: { message: true },
  })

  const seenBankGroups = new Set<string>()
  const lockoutCreates = maturedLockouts.flatMap((lockout) => {
    if (seenBankGroups.has(lockout.bankGroup)) return []
    seenBankGroups.add(lockout.bankGroup)

    const alreadyAlerted = existingLockoutAlerts.some((alert) =>
      alert.message.includes(lockout.bankGroup)
    )
    if (alreadyAlerted) return []

    return [
      {
        userId,
        title: 'Bank Exclusion Period Ended',
        message: `Your exclusion window with ${lockout.bankGroup} has completed. You are now eligible to re-apply for welcome bonuses!`,
        type: NotificationType.BANK_LOCKOUT,
        link: '/cards#cancelled',
        isRead: false,
      },
    ]
  })

  const toCreate = [...bonusCreates, ...lockoutCreates]
  if (toCreate.length > 0 && (await allowsNotification(userId, 'rewards'))) {
    await prisma.notification.createMany({ data: toCreate })
  }
}

export async function GET() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await generateConciergeAlerts(user.id)

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = notifications.filter((notification) => !notification.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await req.json()) as {
      notificationId?: string
      markAllRead?: boolean
    }

    if (body.markAllRead === true) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    if (!body.notificationId || typeof body.notificationId !== 'string') {
      return NextResponse.json(
        { error: 'notificationId or markAllRead is required' },
        { status: 400 }
      )
    }

    const updated = await prisma.notification.updateMany({
      where: { id: body.notificationId, userId: user.id },
      data: { isRead: true },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
