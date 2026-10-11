"use client"

import { useTransition } from "react"
import { ChevronDown, LogOut, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { logoutAction } from "@/lib/auth/actions"
import type { Usuario } from "@/lib/domain"
import { ROL_LABEL } from "./nav-items"

/** Sesión real: nombre, rol y cerrar sesión. */
export function UserMenu({ user }: { user: Usuario }) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isPending}
          aria-label={`${user.nombre} · ${ROL_LABEL[user.rol]}`}
        >
          {isPending ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <UserRound data-icon="inline-start" aria-hidden />
          )}
          <span className="hidden sm:inline">{user.nombre}</span>
          <ChevronDown data-icon="inline-end" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{ROL_LABEL[user.rol]}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => logoutAction())}>
          <LogOut data-icon="inline-start" aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
