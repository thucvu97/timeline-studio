"use client"

import { useState } from "react"

import { ModalContainer } from "@/features/modals/components"
import { TopBar } from "@/features/top-bar/components/top-bar"

import {
  DefaultLayout,
  DualLayout,
  LayoutMode,
  OptionsLayout,
  VerticalLayout,
} from "./layouts"

export function MediaStudio() {
  const [layoutMode, setLayoutMode] = useState("default" as LayoutMode)

  return (
    <div className="flex flex-col h-screen w-screen m-0 p-0">
      <TopBar layoutMode={layoutMode} onLayoutChange={setLayoutMode} />
      <div className="flex-1">
        {layoutMode === "default" && <DefaultLayout />}
        {layoutMode === "options" && <OptionsLayout />}
        {layoutMode === "vertical" && <VerticalLayout />}
        {layoutMode === "dual" && <DualLayout />}
      </div>

      {/* Контейнер для модальных окон */}
      <ModalContainer />
    </div>
  )
}
