import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PillLinkProps {
  href: string
  active: boolean
  /** "page" para pestañas de navegación, "true" para filtros de una lista. */
  current?: "page" | "true"
  size?: "default" | "lg"
  children: React.ReactNode
}

/** Enlace en forma de píldora: oscuro cuando está activo (pestañas y filtros). */
export function PillLink({ href, active, current = "page", size = "default", children }: PillLinkProps) {
  return (
    <Button
      asChild
      variant="outline"
      size={size}
      className={cn(
        "rounded-full px-4",
        active &&
          "border-foreground bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:border-foreground dark:bg-foreground dark:hover:bg-foreground/90",
      )}
    >
      <Link href={href} aria-current={active ? current : undefined}>
        {children}
      </Link>
    </Button>
  )
}
