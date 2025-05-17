"use client"

import { useState } from "react"

import { TopBar } from "@/features/browser/components/layout/top-bar"

import {
  DefaultMediaEditor,
  DualMediaEditor,
  LayoutMode,
  OptionsMediaEditor,
  VerticalMediaEditor,
} from "./layouts"

export function MediaStudio() {
  const [layoutMode, setLayoutMode] = useState("default" as LayoutMode)

  return (
    <div className="m-0 flex h-screen flex-col p-0">
      <TopBar layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
      {layoutMode === "default" && <DefaultMediaEditor />}
      {layoutMode === "options" && <OptionsMediaEditor />}
      {layoutMode === "vertical" && <VerticalMediaEditor />}
      {layoutMode === "dual" && <DualMediaEditor />}
    </div>
  )
}
