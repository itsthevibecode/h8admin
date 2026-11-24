import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { DashboardFrame } from '@/components/dashboard-frame'
import { prisma } from '@/lib/prisma'
import { legalName } from '@/lib/legal-name'
import { getLegalDocument, LEGAL_DOCUMENTS } from '@/lib/legal-content'

export function generateStaticParams() {
  return LEGAL_DOCUMENTS.map((document) => ({ slug: document.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const document = getLegalDocument(slug)
  if (!document) {
    return { title: 'Legal | H8Admin' }
  }
  return {
    title: `${document.title} | H8Admin`,
    description: document.summary,
  }
}

export default async function LegalDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const document = getLegalDocument(slug)
  if (!document) {
    notFound()
  }

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

  const profile = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true },
      })
    : null

  return (
    <DashboardFrame email={user?.email || ''} displayName={profile ? legalName(profile) ?? '' : ''}>
      <article className="mx-auto max-w-3xl space-y-8 px-8 py-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
              Version {document.version}
            </span>
            <span className="text-xs text-slate-500">Effective {document.effectiveDate}</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-950">{document.title}</h1>
          <p className="text-sm leading-relaxed text-slate-600">{document.summary}</p>
        </div>

        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="text-lg font-bold text-slate-950">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>
    </DashboardFrame>
  )
}
