import { useEffect, useRef, useState } from "react"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

import { HistogramScope } from "./histogram-scope"
import { VectorscopeScope } from "./vectorscope-scope"
import { WaveformScope } from "./waveform-scope"

interface ScopeViewerProps {
  type: "waveform" | "vectorscope" | "histogram"
  refreshRate: number
  isFullscreen?: boolean
  onClose?: () => void
}

export function ScopeViewer({ type, refreshRate, isFullscreen = false, onClose }: ScopeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 320, height: 240 })

  // Обновление размеров при изменении контейнера
  useEffect(() => {
    if (!containerRef.current) return

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(320, width),
          height: isFullscreen ? Math.max(480, height - 60) : 240,
        })
      }
    }

    updateDimensions()

    const resizeObserver = new ResizeObserver(updateDimensions)
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [isFullscreen])

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${isFullscreen ? "w-full h-full" : "w-full"}`}
    >
      {/* Кнопка закрытия для полноэкранного режима */}
      {isFullscreen && onClose && (
        <div className="absolute top-4 right-4 z-10">
          <Button variant="ghost" size="sm" onClick={onClose} className="bg-black/50 hover:bg-black/70">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Рендер соответствующего скопа */}
      <div className={isFullscreen ? "p-8" : ""}>
        {type === "waveform" && (
          <WaveformScope width={dimensions.width} height={dimensions.height} refreshRate={refreshRate} />
        )}
        {type === "vectorscope" && (
          <VectorscopeScope width={dimensions.width} height={dimensions.height} refreshRate={refreshRate} />
        )}
        {type === "histogram" && (
          <HistogramScope width={dimensions.width} height={dimensions.height} refreshRate={refreshRate} />
        )}
      </div>
    </div>
  )
}
