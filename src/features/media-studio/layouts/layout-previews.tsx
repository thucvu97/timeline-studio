import { useTranslation } from "react-i18next"

import { useUserSettings } from "@/features/modals/features/user-settings/user-settings-provider"

import { DefaultLayout, DualLayout, OptionsLayout, VerticalLayout } from "./layouts-markup"

// Создаем тип для макетов
export type LayoutMode = "default" | "options" | "vertical" | "dual"

export function LayoutPreviews() {
  const { layoutMode, handleLayoutChange } = useUserSettings()
  const { t } = useTranslation()

  console.log("LayoutPreviews rendered with layoutMode:", layoutMode)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => {
            console.log("Clicking on DefaultLayout")
            handleLayoutChange("default")
          }}
        />
        <OptionsLayout
          isActive={layoutMode === "options"}
          onClick={() => {
            console.log("Clicking on OptionsLayout")
            handleLayoutChange("options")
          }}
        />
      </div>
      <div className="flex justify-around gap-2">
        <VerticalLayout
          isActive={layoutMode === "vertical"}
          onClick={() => {
            console.log("Clicking on VerticalLayout")
            handleLayoutChange("vertical")
          }}
        />
        <DualLayout
          isActive={layoutMode === "dual"}
          hasExternalDisplay={false}
          onClick={() => {
            console.log("Clicking on DualLayout")
            handleLayoutChange("dual")
          }}
        />
      </div>
    </div>
  )
}
