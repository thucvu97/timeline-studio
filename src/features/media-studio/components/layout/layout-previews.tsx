import { useTranslation } from "react-i18next"

import { useUserSettings } from "@/features/user-settings"

import { ChatLayout, DefaultLayout, OptionsLayout, VerticalLayout } from "./layouts-markup"

export function LayoutPreviews() {
  const { layoutMode, handleLayoutChange } = useUserSettings()
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => {
            handleLayoutChange("default")
          }}
        />
        <OptionsLayout
          isActive={layoutMode === "options"}
          onClick={() => {
            handleLayoutChange("options")
          }}
        />
      </div>
      <div className="flex justify-around gap-2">
        <VerticalLayout
          isActive={layoutMode === "vertical"}
          onClick={() => {
            handleLayoutChange("vertical")
          }}
        />
        <ChatLayout
          isActive={layoutMode === "chat"}
          onClick={() => {
            handleLayoutChange("chat")
          }}
        />
      </div>
    </div>
  )
}
