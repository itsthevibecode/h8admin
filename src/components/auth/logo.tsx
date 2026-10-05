import { cn } from '@/lib/utils'

export function Logo({ inverted = false, className }: { inverted?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-lg font-mono text-sm font-bold tracking-tight',
          inverted ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-primary text-primary-foreground',
        )}
        aria-hidden="true"
      >
        H8
      </span>
      <span
        className={cn(
          'text-lg font-semibold tracking-tight',
          inverted ? 'text-sidebar-foreground' : 'text-foreground',
        )}
      >
        H8Admin
      </span>
    </div>
  )
}
