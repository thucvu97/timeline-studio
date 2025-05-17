"use client"

import { ThemeToggle } from "@/components/theme/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { MediaStudio } from "@/features/media-studio/media-studio"

import "@/lib/dayjs"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f7f8f9] font-[family-name:var(--font-geist-sans)] dark:bg-[#1b1a1f]">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      <MediaStudio />
    </div>
  )
}
