import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User as AuthUser } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { hasVerifiedFactor } from '@/lib/session-mfa'
import { cleanNamePart, legalName } from '@/lib/legal-name'
import { syncStripeCustomerName } from '@/lib/stripe'

async function getUser() {
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

const profileSelect = {
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  referralCode: true,
  notifyDebits: true,
  notifyBilling: true,
  notifyRewards: true,
} as const

async function privacyFor(userId: string) {
  const membership = await prisma.householdMember.findFirst({
    where: { userId },
    include: { household: { select: { id: true, name: true } } },
  })
  const householdVisibility = membership
    ? await prisma.householdVisibility.findUnique({
        where: {
          userId_householdId: { userId, householdId: membership.householdId },
        },
      })
    : null

  const [owned, memberships] = await Promise.all([
    prisma.virtualAccount.findMany({
      where: { userId, accountType: 'INVESTMENT' },
      orderBy: { createdAt: 'asc' },
      select: { id: true, accountNumber: true },
    }),
    prisma.propertyMember.findMany({
      where: { userId },
      include: {
        virtualAccount: { select: { id: true, accountNumber: true, accountType: true } },
      },
    }),
  ])

  const labels = new Map<string, string>()
  owned.forEach((account, index) => {
    labels.set(
      account.id,
      `Investment property${owned.length > 1 ? ` ${index + 1}` : ''} ••${account.accountNumber.slice(-4)}`
    )
  })
  for (const member of memberships) {
    if (member.virtualAccount.accountType !== 'INVESTMENT' || labels.has(member.virtualAccount.id)) continue
    labels.set(
      member.virtualAccount.id,
      `Investment property ••${member.virtualAccount.accountNumber.slice(-4)}`
    )
  }

  const visibility = await prisma.propertyVisibility.findMany({
    where: { userId, virtualAccountId: { in: [...labels.keys()] } },
  })
  const shareById = new Map(visibility.map((row) => [row.virtualAccountId, row.shareBills]))

  return {
    household: membership
      ? {
          id: membership.householdId,
          name: membership.household.name,
          sharePersonalBills: householdVisibility?.sharePersonalBills ?? false,
        }
      : null,
    properties: [...labels.entries()].map(([id, label]) => ({
      id,
      label,
      shareBills: shareById.get(id) ?? false,
    })),
  }
}

function accountFor(user: AuthUser) {
  return {
    pendingEmail: user.new_email ?? null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
  }
}

async function syncAccount(user: AuthUser, email: string) {
  if (user.email && user.email !== email) {
    await prisma.user
      .update({ where: { id: user.id }, data: { email: user.email } })
      .catch(() => undefined)
  }
  const twoFactorEnabled = hasVerifiedFactor(user)
  const existing = await prisma.userSecurity.findUnique({
    where: { userId: user.id },
    select: { twoFactorEnabled: true },
  })
  if (!existing || existing.twoFactorEnabled !== twoFactorEnabled) {
    await prisma.userSecurity.upsert({
      where: { userId: user.id },
      update: { twoFactorEnabled, ...(twoFactorEnabled ? { twoFactorType: 'TOTP' } : {}) },
      create: { userId: user.id, twoFactorEnabled, twoFactorType: 'TOTP' },
    })
  }
}

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: profileSelect,
  })
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  await syncAccount(user, profile.email)
  const privacy = await privacyFor(user.id)
  return NextResponse.json({
    profile: { ...profile, email: user.email || profile.email, privacy },
    account: accountFor(user),
  })
}

export async function PATCH(req: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    firstName?: string
    lastName?: string
    notifyDebits?: boolean
    notifyBilling?: boolean
    notifyRewards?: boolean
    householdPrivacy?: { householdId?: string; sharePersonalBills?: boolean }
    propertyPrivacy?: { virtualAccountId?: string; shareBills?: boolean }
  }
  const updatingName = body.firstName !== undefined || body.lastName !== undefined
  const firstName = updatingName ? cleanNamePart(body.firstName) : undefined
  const lastName = updatingName ? cleanNamePart(body.lastName) : undefined
  if (updatingName && (!firstName || !lastName)) {
    return NextResponse.json(
      { error: 'Enter a first and last name using letters, spaces, hyphens, or apostrophes.' },
      { status: 400 }
    )
  }

  if (body.householdPrivacy && typeof body.householdPrivacy.sharePersonalBills === 'boolean') {
    const householdId = body.householdPrivacy.householdId
    if (!householdId) {
      return NextResponse.json({ error: 'Household is required' }, { status: 400 })
    }
    const member = await prisma.householdMember.findUnique({
      where: { userId_householdId: { userId: user.id, householdId } },
    })
    if (!member) return NextResponse.json({ error: 'Not a household member' }, { status: 403 })
    await prisma.householdVisibility.upsert({
      where: { userId_householdId: { userId: user.id, householdId } },
      update: { sharePersonalBills: body.householdPrivacy.sharePersonalBills },
      create: {
        userId: user.id,
        householdId,
        sharePersonalBills: body.householdPrivacy.sharePersonalBills,
      },
    })
  }

  if (body.propertyPrivacy && typeof body.propertyPrivacy.shareBills === 'boolean') {
    const virtualAccountId = body.propertyPrivacy.virtualAccountId
    if (!virtualAccountId) {
      return NextResponse.json({ error: 'Property is required' }, { status: 400 })
    }
    const [owned, partner] = await Promise.all([
      prisma.virtualAccount.findFirst({
        where: { id: virtualAccountId, userId: user.id, accountType: 'INVESTMENT' },
        select: { id: true },
      }),
      prisma.propertyMember.findUnique({
        where: { virtualAccountId_userId: { virtualAccountId, userId: user.id } },
        select: { id: true },
      }),
    ])
    if (!owned && !partner) {
      return NextResponse.json({ error: 'You do not have access to this property' }, { status: 403 })
    }
    await prisma.propertyVisibility.upsert({
      where: { userId_virtualAccountId: { userId: user.id, virtualAccountId } },
      update: { shareBills: body.propertyPrivacy.shareBills },
      create: {
        userId: user.id,
        virtualAccountId,
        shareBills: body.propertyPrivacy.shareBills,
      },
    })
  }

  const data = {
    ...(firstName && lastName
      ? { firstName, lastName, name: `${firstName} ${lastName}` }
      : {}),
    ...(typeof body.notifyDebits === 'boolean' ? { notifyDebits: body.notifyDebits } : {}),
    ...(typeof body.notifyBilling === 'boolean' ? { notifyBilling: body.notifyBilling } : {}),
    ...(typeof body.notifyRewards === 'boolean' ? { notifyRewards: body.notifyRewards } : {}),
  }
  const updated =
    Object.keys(data).length > 0
      ? await prisma.user.update({ where: { id: user.id }, data, select: profileSelect })
      : await prisma.user.findUnique({ where: { id: user.id }, select: profileSelect })
  if (!updated) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const fullName = legalName(updated)
  if (fullName && user.email) {
    try {
      await syncStripeCustomerName(user.email, fullName)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update the billing name'
      return NextResponse.json(
        { error: `Name saved. Stripe billing name was not updated: ${message}` },
        { status: 502 }
      )
    }
  }

  const privacy = await privacyFor(user.id)
  return NextResponse.json({
    profile: { ...updated, email: user.email || updated.email, privacy },
    account: accountFor(user),
  })
}
