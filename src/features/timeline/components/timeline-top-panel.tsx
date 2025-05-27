import {
  LayoutTemplate,
  Minus,
  MoveHorizontal,
  Plus,
  Redo2,
  Scissors,
  SquareMousePointer,
  Trash2,
  Undo2,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useTimeline } from "../timeline-provider"

const ICON_STYLE =
  "flex rounded-sm items-center justify-center w-7 h-7 hover:bg-[#dddbdd] dark:hover:bg-[#45444b] cursor-pointer dark:bg-[#45444b] text-gray-200 hover:bg-[#45444b]"

export function TimelineTopPanel() {
  const { t } = useTranslation()

  // Получаем данные и методы из Timeline
  const {
    project,
    uiState,
    undo,
    redo,
    setTimeScale,
    setEditMode,
    clearSelection
  } = useTimeline()

  // Состояние для UI
  const isTrashActive = project !== null
  const isCutActive = project !== null
  const isAbleToScale = project !== null
  const isAbleToScaleUp = project !== null && uiState.timeScale < 200
  const isAbleToScaleDown = project !== null && uiState.timeScale > 10
  const isAbleToFitToTracks = project !== null

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
    const value = parseInt(e.target.value)
    setTimeScale(value)
  }

  const sliderValue = uiState.timeScale
  const maxScale = 200

  return (
    <div className="sticky top-0 flex-shrink-0 dark:bg-[#2D2D2D]">
      <div className="border-border flex items-center justify-between border-t px-2">
        <div className="flex items-center gap-1">
          {/* Layout */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.layout")}
          >
            <LayoutTemplate size={12} />
          </Button>

          {/* Mouse pointer */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.pointer")}
          >
            <SquareMousePointer size={12} />
          </Button>

          {/* Back */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.undo")}
          >
            <Undo2 size={12} />
          </Button>

          {/* Forward */}
          <Button
            onClick={() => {}}
            className={cn(ICON_STYLE, "pointer-events-none")}
            title={t("timeline.toolbar.redo")}
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
          >
            <Scissors size={16} className="rotate-270" />
          </Button>
        </div>
        <div className="flex items-center gap-2 px-2 py-1">
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
          <Button
            onClick={handleScaleDecrease}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-[#45444b]",
              !isAbleToScaleDown && "pointer-events-none",
            )}
            title={t("timeline.toolbar.zoomOut")}
          >
            <Minus size={12} />
          </Button>

          {/* Scale slider */}
          <div
            className={cn(
              "relative h-1 w-24 rounded-full border border-white bg-gray-800",
              !isAbleToScale && "pointer-events-none opacity-50",
            )}
          >
            <div className="absolute top-0 left-0 h-full rounded-full bg-white" style={{ width: `${sliderValue}%` }} />
            <input
              type="range"
              min={2}
              max={maxScale}
              value={String(sliderValue)}
              onChange={handleSliderChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              aria-label={t("timeline.zoom.fitToScreen")}
            />
          </div>

          <Button
            onClick={handleScaleIncrease}
            className={cn(
              "flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border-1 border-white bg-gray-800 text-gray-200 hover:bg-[#45444b]",
              !isAbleToScaleUp && "pointer-events-none opacity-50",
            )}
            title={t("timeline.toolbar.zoomIn")}
          >
            <Plus size={12} />
          </Button>
        </div>
      </div>
    </div>
  )
}
