"use client"

import { ModalContainer } from "@/features/modals/components"
import { TopBar } from "@/features/top-bar/components/top-bar"
import { useUserSettings } from "@/features/user-settings"
import { useAutoLoadUserData } from "@/hooks/use-auto-load-user-data"

import { DefaultLayout, DualLayout, OptionsLayout, VerticalLayout } from "./layout"

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
  if (loadedData && Object.values(loadedData).some((arr) => arr.length > 0)) {
    console.log("Загружены пользовательские данные:", loadedData)
  }

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
