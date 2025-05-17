import React from "react"
import { ThemeProvider as NextThemeProvider } from "next-themes"

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </NextThemeProvider>
  )
}
// Реэкспортируем useTheme из next-themes для обратной совместимости
export { useTheme } from "next-themes"
