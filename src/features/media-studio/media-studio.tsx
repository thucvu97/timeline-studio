"use client"

import { ModalContainer } from "@/features/modals/components"
import { useUserSettings } from "@/features/modals/features/user-settings/user-settings-provider"
import { TopBar } from "@/features/top-bar/components/top-bar"

import {
  DefaultLayout,
  DualLayout,
  OptionsLayout,
  VerticalLayout,
} from "./layouts"

export function MediaStudio() {
  const { layoutMode } = useUserSettings()

  return (
    <div className="flex flex-col h-screen w-screen m-0 p-0">
      <TopBar />
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
