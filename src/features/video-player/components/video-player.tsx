import React from "react"

import { AspectRatio } from "@/components/ui/aspect-ratio"

/**
 * Компонент медиа-плеера для воспроизведения видео
 */
export function VideoPlayer() {
  // Рендерим компонент
  return (
    <div className="relative h-full w-full">
      <AspectRatio ratio={16 / 9}>
        <div className="relative h-full w-full"></div>
      </AspectRatio>
    </div>
  )
}

VideoPlayer.displayName = "VideoPlayer"
