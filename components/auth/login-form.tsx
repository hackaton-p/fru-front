"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Grape } from "lucide-react"
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
  const [showPassword, setShowPassword] = useState(false)
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
      className="flex flex-col gap-6 rounded-xl bg-card p-6 ring-1 ring-foreground/10 sm:p-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <Grape className="size-8 text-primary" aria-hidden />
        <h1 className="font-heading text-2xl font-bold">Plan de Packing</h1>
        <p className="text-sm text-muted-foreground">Inicia sesión para continuar</p>
      </div>

      {error ? (
        <p
          role="alert"
          id="login-error"
          className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          required
          disabled={pending}
          value={email}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "login-error" : undefined}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          className="h-11"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            disabled={pending}
            value={password}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError(null)
            }}
            className="h-11 pr-12"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-1 flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
            disabled={pending}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="h-11 rounded-full" disabled={pending}>
        {pending ? <Spinner data-icon="inline-start" aria-label="Ingresando" /> : null}
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  )
}
