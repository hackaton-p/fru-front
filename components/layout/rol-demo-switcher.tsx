"use client"

import { useTransition } from "react"
import { UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { cambiarRolDemoAction } from "@/lib/auth/actions"
import type { Usuario } from "@/lib/domain"
import { ROL_LABEL } from "./nav-items"

/** "Ver como": cambia el rol de la demo hasta que exista el login. */
export function RolDemoSwitcher({ user }: { user: Usuario }) {
  const [isPending, startTransition] = useTransition()

  const cambiar = (rol: string) => {
    if (rol === user.rol) return
    startTransition(() => cambiarRolDemoAction(rol))
  }

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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ver como (demo)</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={user.rol} onValueChange={cambiar}>
          {Object.entries(ROL_LABEL).map(([rol, label]) => (
            <DropdownMenuRadioItem key={rol} value={rol}>
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
