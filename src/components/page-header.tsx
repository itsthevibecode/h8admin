export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header>
      {eyebrow && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
      {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
    </header>
  )
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-medium text-muted-foreground">{children}</h2>
}
