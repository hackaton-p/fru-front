"use client"

import { useId } from "react"
import { Info, X } from "lucide-react"
import { Popover } from "radix-ui"
import { Button } from "@/components/ui/button"

export function FieldHelp({ label, help }: { label: string; help: string }) {
  const titleId = useId()
  const descriptionId = useId()

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11 rounded-full text-muted-foreground hover:text-primary"
          aria-label={`Ayuda: ${label}`}
        >
          <Info className="size-4" aria-hidden />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={8}
          collisionPadding={16}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="z-50 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <p id={titleId} className="text-sm font-semibold">{label}</p>
            <Popover.Close asChild>
              <Button type="button" variant="ghost" size="icon" className="size-11 shrink-0 rounded-full" aria-label="Cerrar ayuda">
                <X className="size-4" aria-hidden />
              </Button>
            </Popover.Close>
          </div>
          <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-muted-foreground">{help}</p>
          <Popover.Arrow className="fill-popover" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
