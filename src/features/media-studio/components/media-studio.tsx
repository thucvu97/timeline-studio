"use client"

import { AppStateGuard } from "@/features/app-state/components/app-state-guard"
import { ProjectLoadingOverlay } from "@/features/app-state/components/project-loading-overlay"
import { useAutoLoadUserData } from "@/features/media-studio/hooks"
import { ModalContainer } from "@/features/modals/components"
import { TopBar } from "@/features/top-bar/components/top-bar"
import { useUserSettings } from "@/features/user-settings"

import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layout"

export function MediaStudio() {
  const { layoutMode } = useUserSettings()

  // Автозагрузка пользовательских данных при старте приложения
  const { isLoading: isLoadingUserData, loadedData, error: userDataError } = useAutoLoadUserData()

  // Логирование для отладки
  if (userDataError) {
    console.error("Ошибка автозагрузки пользовательских данных:", userDataError)
  }
  if (isLoadingUserData) {
    console.log("Загружаем пользовательские данные...")
  }
  if (loadedData && Object.values(loadedData).some((count) => count > 0)) {
    console.log("Загружены пользовательские данные:", loadedData)
  }

  return (
    <AppStateGuard>
      <div className="flex flex-col h-screen w-screen m-0 p-0">
        <TopBar />
        <div className="flex-1">
          {layoutMode === "default" && <DefaultLayout />}
          {layoutMode === "options" && <OptionsLayout />}
          {layoutMode === "vertical" && <VerticalLayout />}
          {layoutMode === "chat" && <ChatLayout />}
        </div>

        {/* Контейнер для модальных окон */}
        <ModalContainer />

        {/* Оверлей загрузки проекта */}
        <ProjectLoadingOverlay />
      </div>
    </AppStateGuard>
  )
}
