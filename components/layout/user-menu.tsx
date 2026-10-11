"use client"

import { useTransition } from "react"
import { LogOut, UserRound } from "lucide-react"
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
import Link from "next/link"
import { logoutAction } from "@/lib/auth/actions"
import type { Usuario } from "@/lib/domain"
import { ROL_LABEL } from "./nav-items"

/** Sesión real: avatar con rol y cerrar sesión. */
export function UserMenu({ user }: { user: Usuario }) {
  const [isPending, startTransition] = useTransition()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon-lg"
          className="rounded-full"
          disabled={isPending}
          aria-label={`Perfil de ${user.nombre}`}
        >
          {isPending ? <Spinner /> : <UserRound aria-hidden />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{ROL_LABEL[user.rol]}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/perfil"><UserRound data-icon="inline-start" aria-hidden /> Perfil de usuario</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => startTransition(() => logoutAction())}>
          <LogOut data-icon="inline-start" aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
