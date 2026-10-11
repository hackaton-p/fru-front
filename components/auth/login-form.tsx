"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Grape } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { loginAction } from "@/lib/auth/actions"

export function LoginForm({ mockMode = false }: { mockMode?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await loginAction({ email, password })
      if (res.ok) router.push(res.data.redirectTo)
      else setError(res.error)
    })
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-6 rounded-xl border bg-card p-8 shadow-sm"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Grape className="size-8 text-primary" aria-hidden />
        <h1 className="font-heading text-2xl font-bold">Plan de Packing</h1>
        <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      {mockMode ? (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Demo: contraseña <span className="font-mono">password123</span>. Planificador: <span className="font-mono">planificador@piura.com</span>; Subgerente: <span className="font-mono">subgerente@example.com</span>; Jefe de turno: <span className="font-mono">jefe.turno@piura.com</span>.
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="h-11 rounded-full" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" /> : null}
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  )
}
