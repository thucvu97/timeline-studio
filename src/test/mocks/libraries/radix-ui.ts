import React from "react"

import { vi } from "vitest"

// Dropdown Menu mocks
const DropdownMenuContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
})

export const MockDropdownMenu = {
  Root: ({ children, open: controlledOpen }: { children: React.ReactNode; open?: boolean }) => {
    const [open, setOpen] = React.useState(controlledOpen ?? false)
    return React.createElement(
      DropdownMenuContext.Provider,
      { value: { open, setOpen } },
      React.createElement("div", { "data-testid": "dropdown-menu-root", "data-open": open }, children),
    )
  },

  Trigger: React.forwardRef<HTMLButtonElement, any>(function DropdownMenuTrigger({ children, asChild, ...props }, ref) {
    const context = React.useContext(DropdownMenuContext)
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
        onClick: (e: React.MouseEvent) => {
          context.setOpen(!context.open)
          ;(children as React.ReactElement<any>).props.onClick?.(e)
        },
        "data-testid": "dropdown-menu-trigger",
      })
    }
    return React.createElement(
      "button",
      {
        ...props,
        ref,
        onClick: () => context.setOpen(!context.open),
        "data-testid": "dropdown-menu-trigger",
      },
      children,
    )
  }),

  Portal: ({ children }: { children: React.ReactNode }) => {
    const context = React.useContext(DropdownMenuContext)
    return context.open ? children : null
  },

  Content: React.forwardRef<HTMLDivElement, any>(function DropdownMenuContent({ children, sideOffset, ...props }, ref) {
    const context = React.useContext(DropdownMenuContext)
    if (!context.open) return null
    const { align, className, ...restProps } = props
    return React.createElement(
      "div",
      { ...restProps, ref, className, "data-testid": "dropdown-menu-content", "data-align": align },
      children,
    )
  }),

  Item: React.forwardRef<HTMLDivElement, any>(function DropdownMenuItem({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dropdown-menu-item" }, children)
  }),

  CheckboxItem: React.forwardRef<HTMLDivElement, any>(function DropdownMenuCheckboxItem({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dropdown-menu-checkbox-item" }, children)
  }),

  RadioGroup: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dropdown-menu-radio-group" }, children),

  RadioItem: React.forwardRef<HTMLDivElement, any>(function DropdownMenuRadioItem({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dropdown-menu-radio-item" }, children)
  }),

  Label: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dropdown-menu-label" }, children),

  Separator: () => React.createElement("hr", { "data-testid": "dropdown-menu-separator" }),

  Sub: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dropdown-menu-sub" }, children),

  SubTrigger: React.forwardRef<HTMLDivElement, any>(function DropdownMenuSubTrigger({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dropdown-menu-sub-trigger" }, children)
  }),

  SubContent: React.forwardRef<HTMLDivElement, any>(function DropdownMenuSubContent({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dropdown-menu-sub-content" }, children)
  }),

  Group: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dropdown-menu-group" }, children),

  Shortcut: ({ children }: { children: React.ReactNode }) =>
    React.createElement("span", { "data-testid": "dropdown-menu-shortcut" }, children),

  ItemIndicator: ({ children }: { children: React.ReactNode }) =>
    React.createElement("span", { "data-testid": "dropdown-menu-item-indicator" }, children),
}

// Mock Radix UI Dropdown Menu
vi.mock("@radix-ui/react-dropdown-menu", () => MockDropdownMenu)

// Additional Radix UI component mocks can be added here
export const MockDialog = {
  Root: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dialog-root" }, children),

  Portal: ({ children }: { children: React.ReactNode }) => children,

  Overlay: React.forwardRef<HTMLDivElement, any>(function DialogOverlay(props, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dialog-overlay" })
  }),

  Content: React.forwardRef<HTMLDivElement, any>(function DialogContent({ children, ...props }, ref) {
    return React.createElement("div", { ...props, ref, "data-testid": "dialog-content" }, children)
  }),

  Title: React.forwardRef<HTMLHeadingElement, any>(function DialogTitle({ children, ...props }, ref) {
    return React.createElement("h2", { ...props, ref, "data-testid": "dialog-title" }, children)
  }),

  Description: React.forwardRef<HTMLParagraphElement, any>(function DialogDescription({ children, ...props }, ref) {
    return React.createElement("p", { ...props, ref, "data-testid": "dialog-description" }, children)
  }),

  Trigger: React.forwardRef<HTMLButtonElement, any>(function DialogTrigger({ children, ...props }, ref) {
    return React.createElement("button", { ...props, ref, "data-testid": "dialog-trigger" }, children)
  }),

  Close: React.forwardRef<HTMLButtonElement, any>(function DialogClose({ children, ...props }, ref) {
    return React.createElement("button", { ...props, ref, "data-testid": "dialog-close" }, children)
  }),
}

// All exports are already handled above
