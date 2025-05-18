"use client"

import { useState } from "react"

import { TopBar } from "@/features/browser/components/layout/top-bar"
import { ModalContainer } from "@/features/dialogs/components"

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
    <div className="flex flex-col h-screen w-screen m-0 p-0">
      <TopBar layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
      <div className="flex-1">
        {layoutMode === "default" && <DefaultMediaEditor />}
        {layoutMode === "options" && <OptionsMediaEditor />}
        {layoutMode === "vertical" && <VerticalMediaEditor />}
        {layoutMode === "dual" && <DualMediaEditor />}
      </div>

      {/* Контейнер для модальных окон */}
      <ModalContainer />
    </div>
  )
}
