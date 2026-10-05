import { BrandPanel } from '@/components/auth/brand-panel'
import { AuthFlow } from '@/components/auth/auth-flow'

export default function Page() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <BrandPanel />
      <AuthFlow />
    </main>
  )
}
