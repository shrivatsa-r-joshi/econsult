"use client"

import * as React from "react"

type MenuContextType = {
  open: boolean
  setOpen: (v: boolean) => void
}

const MenuContext = React.createContext<MenuContextType | null>(null)

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </MenuContext.Provider>
  )
}

type TriggerProps = {
  children: React.ReactElement
  asChild?: boolean
}

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ children, asChild }, ref) => {
    const ctx = React.useContext(MenuContext)
    if (!ctx) return null

    const onToggle = (e: React.MouseEvent) => {
      e.preventDefault()
      ctx.setOpen(!ctx.open)
    }

    if (asChild && React.isValidElement(children)) {
      // preserve existing props and attach an onClick that toggles the menu
      const existingOnClick = (children.props as any).onClick
      // use any to avoid strict prop typing complaints in this small helper
      const cloned = React.cloneElement(children as any, {
        onClick: (e: any) => {
          existingOnClick?.(e)
          onToggle(e)
        },
      } as any)

      return React.cloneElement(cloned as any, {
        ref: (node: any) => {
          if (typeof ref === "function") ref(node)
          else if (ref && typeof (ref as any) === "object") (ref as any).current = node
        },
      } as any)
    }

    return (
      <button ref={ref} onClick={onToggle} className="inline-flex items-center">
        {children}
      </button>
    )
  }
)

DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export function DropdownMenuContent({
  children,
  align = "start",
}: {
  children: React.ReactNode
  align?: "start" | "end"
}) {
  const ctx = React.useContext(MenuContext)
  if (!ctx) return null

  if (!ctx.open) return null

  return (
    <div
      className={`absolute z-50 mt-2 min-w-[160px] rounded-md border bg-popover p-1 shadow-lg ${
        align === "end" ? "right-0" : "left-0"
      }`}
      role="menu"
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}) {
  const ctx = React.useContext(MenuContext)
  const handle = (e: React.MouseEvent) => {
    onClick?.(e)
    // close menu after click
    ctx?.setOpen(false)
  }

  return (
    <button
      onClick={handle}
      className="w-full px-3 py-2 text-left text-sm hover:bg-accent/60 rounded-md"
      role="menuitem"
    >
      {children}
    </button>
  )
}

export default DropdownMenu
