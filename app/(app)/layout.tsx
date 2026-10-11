import { AppHeader } from "@/components/layout/app-header"
import { getCurrentUser } from "@/lib/auth/session"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await getCurrentUser()
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
