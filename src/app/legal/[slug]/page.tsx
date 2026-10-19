import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LegalFooter } from '@/components/legal-footer'
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

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-sm font-bold text-emerald-800">
            H8Admin
          </Link>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Legal
          </span>
        </div>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-6 py-10">
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

      <LegalFooter />
    </div>
  )
}
