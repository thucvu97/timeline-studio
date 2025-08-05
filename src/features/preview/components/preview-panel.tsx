/**
 * Preview Panel - Main UI for real-time preview
 */

import { Eye, EyeOff, Layers, Monitor, Settings, Zap } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useWebGL2Preview } from "../hooks/use-webgl2-preview"
import { EffectChainList } from "./effect-chain-list"
import { PresetGallery } from "./preset-gallery"
import { QualityControls } from "./quality-controls"

interface PreviewPanelProps {
  className?: string
}

export function PreviewPanel({ className }: PreviewPanelProps) {
  const [showEffects, setShowEffects] = useState(true)
  const [showPresets, setShowPresets] = useState(false)
  const [showQuality, setShowQuality] = useState(false)
  const [previewEnabled, setPreviewEnabled] = useState(true)

  const { canvasRef, videoRef, previewFrame, isInitialized, gpuTier, quality, setQuality, cacheStats } =
    useWebGL2Preview({
      cacheSize: 100,
      prefetchRange: 2,
      updateInterval: 33,
    })

  const canvasContainerRef = useRef<HTMLDivElement>(null)

  // Update canvas size when container resizes
  useEffect(() => {
    if (!canvasContainerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      const { width, height } = entry.contentRect

      if (canvasRef && typeof canvasRef === "function") {
        // Canvas size will be handled by the hook
      }
    })

    resizeObserver.observe(canvasContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [canvasRef])

  const getGPUTierBadge = () => {
    const variants = {
      high: "default",
      medium: "secondary",
      low: "destructive",
    } as const

    return (
      <Badge variant={variants[gpuTier]}>
        <Monitor className="w-3 h-3 mr-1" />
        GPU: {gpuTier.toUpperCase()}
      </Badge>
    )
  }

  const getCacheStats = () => {
    if (!cacheStats) return null

    return (
      <div className="text-xs text-muted-foreground">
        Cache: {cacheStats.entries} frames ({cacheStats.sizeMB.toFixed(1)}MB)
      </div>
    )
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Real-time Preview</h3>
          <div className="flex items-center gap-2">
            {getGPUTierBadge()}
            <Button variant="ghost" size="sm" onClick={() => setPreviewEnabled(!previewEnabled)}>
              {previewEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant={showEffects ? "default" : "outline"} size="sm" onClick={() => setShowEffects(!showEffects)}>
            <Layers className="w-4 h-4 mr-1" />
            Effects
          </Button>

          <Button variant={showPresets ? "default" : "outline"} size="sm" onClick={() => setShowPresets(!showPresets)}>
            <Zap className="w-4 h-4 mr-1" />
            Presets
          </Button>

          <Button variant={showQuality ? "default" : "outline"} size="sm" onClick={() => setShowQuality(!showQuality)}>
            <Settings className="w-4 h-4 mr-1" />
            Quality
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={canvasContainerRef} className="flex-1 relative bg-black min-h-0 flex items-center justify-center">
        {previewEnabled ? (
          <>
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
              style={{
                imageRendering: quality.antialiasing ? "auto" : "pixelated",
              }}
            />

            {/* Hidden video element for frame extraction */}
            <video ref={videoRef} className="hidden" crossOrigin="anonymous" preload="metadata" />

            {/* Loading overlay */}
            {!isInitialized && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="text-white">Initializing preview renderer...</div>
              </div>
            )}

            {/* Status overlay */}
            {isInitialized && (
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {previewFrame ? "Live" : "Updating..."}
              </div>
            )}
          </>
        ) : (
          <div className="text-muted-foreground">Preview disabled - Click the eye icon to enable</div>
        )}
      </div>

      {/* Controls Panel */}
      {previewEnabled && (
        <div className="border-t">
          {/* Cache Stats */}
          <div className="p-2 border-b bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span>Performance</span>
              <div className="flex gap-4">
                {getCacheStats()}
                <span>FPS: {quality.fps}</span>
                <span>Resolution: {(quality.resolution * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Effect Chain List */}
          {showEffects && (
            <div className="p-4">
              <EffectChainList />
            </div>
          )}

          {/* Preset Gallery */}
          {showPresets && (
            <div className="p-4">
              <PresetGallery />
            </div>
          )}

          {/* Quality Controls */}
          {showQuality && (
            <div className="p-4">
              <QualityControls quality={quality} gpuTier={gpuTier} onChange={setQuality} />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
