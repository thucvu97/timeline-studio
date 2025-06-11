import { memo } from "react"

import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface VideoLoadingIndicatorProps {
  isLoading: boolean
  loadProgress: number
  bufferProgress: number
  size?: number
  className?: string
}

export const VideoLoadingIndicator = memo(function VideoLoadingIndicator({
  isLoading,
  size = 150,
  className,
}: Omit<VideoLoadingIndicatorProps, "loadProgress" | "bufferProgress">) {
  if (!isLoading) return null

  return (
    <div className={cn("absolute inset-0 flex items-center justify-center bg-black/10", className)}>
      <Loader2 className="animate-spin text-white/60" size={size > 100 ? 20 : 14} />
    </div>
  )
})
