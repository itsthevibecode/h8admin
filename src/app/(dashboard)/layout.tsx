import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardFrame } from '@/components/dashboard-frame'
import { prisma } from '@/lib/prisma'
import { legalName } from '@/lib/legal-name'
import { investmentLabel } from '@/lib/billing-labels'
import { hasVerifiedFactor } from '@/lib/session-mfa'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll from a Server Component can throw; middleware refreshes the session.
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  if (!hasVerifiedFactor(user)) {
    redirect('/login/enroll')
  }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (assurance?.currentLevel !== 'aal2') {
    redirect('/login/verify')
  }

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, isAdmin: true },
  })

  const personal = await prisma.virtualAccount.findFirst({
    where: { userId: user.id, accountType: 'INDIVIDUAL' },
    orderBy: { createdAt: 'asc' },
    select: { displayName: true },
  })
  const membership = await prisma.householdMember.findFirst({
    where: { userId: user.id },
    select: { household: { select: { name: true } } },
    orderBy: { household: { createdAt: 'asc' } },
  })
  const investmentAccounts = await prisma.virtualAccount.findMany({
    where: {
      accountType: 'INVESTMENT',
      OR: [{ userId: user.id }, { propertyMembers: { some: { userId: user.id } } }],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, displayName: true },
  })

  return (
    <DashboardFrame
      email={user.email || ''}
      displayName={profile ? legalName(profile) ?? '' : ''}
      isAdmin={profile?.isAdmin ?? false}
      personalLabel={personal?.displayName?.trim() || 'Personal'}
      householdLabel={membership?.household.name?.trim() || 'Household'}
      investments={investmentAccounts.map((account, index) => ({
        id: account.id,
        label: investmentLabel(account.displayName, index, investmentAccounts.length),
      }))}
    >
      {children}
    </DashboardFrame>
  )
}
