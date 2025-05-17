"use client"

import { MediaStudio } from "@/features/media-studio/media-studio"

import "@/lib/dayjs"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f7f8f9] font-[family-name:var(--font-geist-sans)] dark:bg-[#1b1a1f]">
      <MediaStudio />
    </div>
  )
}
