"use client"

import { MediaStudio } from "@/features/media-studio/components/media-studio"

import "@/lib/dayjs"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f7f8f9] dark:bg-[#252526]">
      <MediaStudio />
    </div>
  )
}
