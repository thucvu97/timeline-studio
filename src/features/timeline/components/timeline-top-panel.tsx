import { useState } from "react"

import {
  LayoutTemplate,
  MoveHorizontal,
  Redo2,
  Scissors,
  SquareMousePointer,
  Trash2,
  Undo2,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import { useTimeline } from "../hooks/use-timeline"

const ICON_STYLE =
  "flex cursor-pointer items-center gap-1 bg-[#DDDDDD] px-1 h-6 w-6 ml-1 text-xs hover:bg-[#D1D1D1] dark:bg-[#45444b] dark:hover:bg-[#dddbdd]/25 dark:text-white rounded-sm"

export function TimelineTopPanel() {
  const { t } = useTranslation()

  // Получаем данные и методы из Timeline
  const { project, uiState, undo, redo, setTimeScale, setEditMode, clearSelection } = useTimeline()

  // Состояние для слайдера
  const [sliderValue, setSliderValue] = useState([uiState.timeScale])

  // Состояние для UI
  const isTrashActive = false
  const isCutActive = false
  const isAbleToScale = false
  const isAbleToScaleUp = false
  const isAbleToScaleDown = false
  const isAbleToFitToTracks = false

  // Обработчики
  const deleteTrack = () => {
    clearSelection()
  }

  const cutTrack = () => {
    setEditMode("cut")
  }

  const handleScaleDecrease = () => {
    if (isAbleToScaleDown) {
      setTimeScale(Math.max(10, uiState.timeScale - 10))
    }
  }

  const handleScaleIncrease = () => {
    if (isAbleToScaleUp) {
      setTimeScale(Math.min(200, uiState.timeScale + 10))
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    setTimeScale(value)
  }

  const maxScale = 200

  return (
    <div className="sticky top-0 flex-shrink-0 dark:bg-background border-b">
      <div className="border-border flex items-center justify-between px-1">
        <div className="flex items-center gap-1">
          {/* Layout */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.layout")}
            disabled={true}
          >
            <LayoutTemplate size={12} />
          </Button>

          {/* Mouse pointer */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.pointer")}
            disabled={true}
          >
            <SquareMousePointer size={12} />
          </Button>

          {/* Back */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.undo")}
            disabled={false}
          >
            <Undo2 size={12} />
          </Button>

          {/* Forward */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.redo")}
            disabled={false}
          >
            <Redo2 size={12} />
          </Button>

          {/* Delete track */}
          <Button
            onClick={() => {
              // delete track
              deleteTrack()
            }}
            className={cn(ICON_STYLE, !isTrashActive && "pointer-events-none")}
            title={t("timeline.toolbar.delete")}
            disabled={!isTrashActive}
          >
            <Trash2 size={16} />
          </Button>

          {/* Cut track */}
          <Button
            onClick={() => {
              cutTrack()
            }}
            className={cn(ICON_STYLE, !isCutActive && "pointer-events-none")}
            title={t("timeline.toolbar.cut")}
            disabled={!isCutActive}
          >
            <Scissors size={16} className="rotate-270" />
          </Button>
        </div>
        <div className="flex items-center gap-2 px-0 py-1">
          {/* Scale slider */}
          <div
            className={cn(
              "relative h-1 w-24 rounded-full border border-white bg-gray-800",
              !isAbleToScale && "pointer-events-none opacity-50",
            )}
          >
            {/* <div className="absolute top-0 left-0 h-full rounded-full bg-black" style={{ width: `${sliderValue}%` }} /> */}
            <Slider
              value={sliderValue}
              onValueChange={setSliderValue}
              min={2}
              max={maxScale}
              step={1}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-100 hover:ring-0 focus-visible:ring-0"
              aria-label={t("timeline.zoom.fitToScreen")}
            />
          </div>

          {/* Двунаправленная стрелка */}
          <Button
            onClick={() => {
              // Вызываем функцию fitToScreen через родительский компонент
              if (isAbleToFitToTracks) {
                // Получаем контейнер таймлайна
                const timelineContainer = document.querySelector(".timeline-container")
                if (timelineContainer) {
                  // Получаем ширину контейнера
                  const width = timelineContainer.clientWidth
                  console.log(`MoveHorizontal Button clicked, container width: ${width}px`)

                  // Отправляем событие FIT_TO_SCREEN с шириной контейнера
                  window.dispatchEvent(
                    new CustomEvent("fit-to-screen", {
                      detail: { width },
                    }),
                  )
                }
              }
            }}
            className={cn(
              ICON_STYLE,
              "relative flex items-center justify-center",
              !isAbleToFitToTracks && "pointer-events-none",
            )}
            title={t("timeline.toolbar.fitToScreen")}
          >
            <MoveHorizontal size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
