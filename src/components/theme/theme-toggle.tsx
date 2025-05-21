"use client"

import { useEffect, useState } from "react"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useTheme } from "./theme-context"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => mounted && setTheme(theme === "dark" ? "light" : "dark")}
      className="h-7 w-7 cursor-pointer p-0"
    >
      <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
