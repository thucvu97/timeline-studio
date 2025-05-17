import { useTranslation } from "react-i18next"

import {
  DefaultLayout,
  DualLayout,
  OptionsLayout,
  VerticalLayout,
} from "./layouts-markup"

// Создаем тип для макетов
export type LayoutMode = "default" | "options" | "vertical" | "dual"

interface LayoutPreviewsProps {
  onLayoutChange: (mode: LayoutMode) => void
  layoutMode: LayoutMode
  hasExternalDisplay: boolean
}

export function LayoutPreviews({
  onLayoutChange,
  layoutMode,
  hasExternalDisplay,
}: LayoutPreviewsProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-around gap-2">
        <DefaultLayout
          isActive={layoutMode === "default"}
          onClick={() => {
            onLayoutChange("default")
          }}
        />
        <OptionsLayout
          isActive={layoutMode === "options"}
          onClick={() => {
            onLayoutChange("options")
          }}
        />
      </div>
      <div className="flex justify-around gap-2">
        <VerticalLayout
          isActive={layoutMode === "vertical"}
          onClick={() => {
            onLayoutChange("vertical")
          }}
        />
        <DualLayout
          isActive={layoutMode === "dual"}
          hasExternalDisplay={hasExternalDisplay}
          onClick={() => {
            if (hasExternalDisplay) {
              console.log("Calling onLayoutChange with 'dual'")
              onLayoutChange("dual")
            }
          }}
        />
      </div>
    </div>
  )
}
