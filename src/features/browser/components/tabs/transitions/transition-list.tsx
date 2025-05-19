import { useCallback, useEffect, useRef, useState } from "react"

import { Star, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useMedia } from "@/features/browser/media"
import { cn } from "@/lib/utils"
import { MediaFile } from "@/types/media"

import { TransitionPreview } from "./transition-preview"
import { transitions } from "./transitions"
import { usePreviewSize } from "../media"

export function TransitionsList({
  onSelect,
}: { onSelect?: (id: string) => void }) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const media = useMedia()

  const {
    previewSize,
    isSizeLoaded,
    handleIncreaseSize,
    handleDecreaseSize,
    canIncreaseSize,
    canDecreaseSize,
  } = usePreviewSize("TRANSITIONS")

  const handleToggleFavorites = useCallback(() => {
    setShowFavoritesOnly((prev) => !prev)
  }, [])

  const demoVideos = {
    source: { path: "t1.mp4" } as MediaFile,
    target: { path: "t2.mp4" } as MediaFile,
  }

  const filteredTransitions = transitions.filter((transition) => {
    // Фильтрация по поисковому запросу
    const searchLower = searchQuery.toLowerCase()
    const localizedName = t(
      `transitions.types.${transition.type}`,
    ).toLowerCase()
    const matchesSearch =
      localizedName.includes(searchLower) ||
      transition.id.toLowerCase().includes(searchLower)

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly ||
      media.isItemFavorite(
        { id: transition.id, path: "", name: transition.id },
        "transition",
      )

    return matchesSearch && matchesFavorites
  })

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-1">
        <Input
          type="search"
          placeholder={t("common.search")}
          className="mr-5 h-7 w-full max-w-[400px] rounded-sm border border-gray-300 text-xs outline-none focus:border-gray-400 focus:ring-0 focus-visible:ring-0 dark:border-gray-600 dark:focus:border-gray-500"
          style={{
            backgroundColor: "transparent",
          }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-1">
          {/* Кнопки изменения размера */}
          <TooltipProvider>
            <div className="mr-2 flex overflow-hidden rounded-md">
              {/* Кнопка избранного */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-0 ml-1 h-6 w-6 cursor-pointer",
                      showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                    onClick={handleToggleFavorites}
                  >
                    <Star
                      size={16}
                      className={showFavoritesOnly ? "fill-current" : ""}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 ml-2 h-6 w-6 cursor-pointer",
                      !canDecreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleDecreaseSize}
                    disabled={!canDecreaseSize}
                  >
                    <ZoomOut size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomOut")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-1 h-6 w-6 cursor-pointer",
                      !canIncreaseSize && "cursor-not-allowed opacity-50",
                    )}
                    onClick={handleIncreaseSize}
                    disabled={!canIncreaseSize}
                  >
                    <ZoomIn size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.toolbar.zoomIn")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3 dark:bg-[#1b1a1f]">
        {!isSizeLoaded ? (
          <div className="flex h-full items-center justify-center text-gray-500"></div>
        ) : filteredTransitions.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {t("browser.tabs.transitions")} {t("common.notFound")}
          </div>
        ) : (
          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
            style={
              { "--preview-size": `${previewSize}px` } as React.CSSProperties
            }
          >
            {filteredTransitions.map((transition) => (
              <TransitionPreview
                key={transition.id}
                sourceVideo={demoVideos.source}
                targetVideo={demoVideos.target}
                transitionType={transition.type}
                onClick={() => onSelect?.(transition.id)}
                size={previewSize}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
