import { useEffect, useRef, useState } from "react"

import { Pause, Play, RotateCcw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { VideoEffect } from "@/features/effects/types"

import { generateCSSFilterForEffect, getPlaybackRate } from "../utils/css-effects"

interface EffectComparisonProps {
  effect: VideoEffect
  videoPath?: string
  customParams?: Record<string, number>
  width?: number
  height?: number
}

/**
 * Компонент для сравнения видео до и после применения эффекта
 * Показывает разделенный экран с возможностью перемещения разделителя
 */
export function EffectComparison({
  effect,
  videoPath = "/t1.mp4",
  customParams,
  width = 600,
  height = 400,
}: EffectComparisonProps) {
  const { t } = useTranslation()
  const [splitPosition, setSplitPosition] = useState(50)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const originalVideoRef = useRef<HTMLVideoElement>(null)
  const effectVideoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Синхронизация воспроизведения видео
  useEffect(() => {
    const originalVideo = originalVideoRef.current
    const effectVideo = effectVideoRef.current
    
    if (!originalVideo || !effectVideo) return
    
    // Синхронизируем currentTime при изменении
    const syncTime = () => {
      if (Math.abs(originalVideo.currentTime - effectVideo.currentTime) > 0.1) {
        effectVideo.currentTime = originalVideo.currentTime
      }
    }
    
    originalVideo.addEventListener('timeupdate', syncTime)
    
    return () => {
      originalVideo.removeEventListener('timeupdate', syncTime)
    }
  }, [])
  
  // Применение эффекта к видео
  useEffect(() => {
    const effectVideo = effectVideoRef.current
    if (!effectVideo || !effect) return
    
    // Применяем CSS фильтры
    const cssFilter = generateCSSFilterForEffect(effect, customParams)
    effectVideo.style.filter = cssFilter
    
    // Применяем скорость воспроизведения для эффектов движения
    const playbackRate = getPlaybackRate(effect.type, customParams)
    effectVideo.playbackRate = playbackRate
  }, [effect, customParams])
  
  // Обработчик воспроизведения/паузы
  const handlePlayPause = () => {
    const originalVideo = originalVideoRef.current
    const effectVideo = effectVideoRef.current
    
    if (!originalVideo || !effectVideo) return
    
    if (isPlaying) {
      originalVideo.pause()
      effectVideo.pause()
    } else {
      void originalVideo.play()
      void effectVideo.play()
    }
    
    setIsPlaying(!isPlaying)
  }
  
  // Обработчик сброса
  const handleReset = () => {
    const originalVideo = originalVideoRef.current
    const effectVideo = effectVideoRef.current
    
    if (!originalVideo || !effectVideo) return
    
    originalVideo.currentTime = 0
    effectVideo.currentTime = 0
    originalVideo.pause()
    effectVideo.pause()
    setIsPlaying(false)
    setSplitPosition(50)
  }
  
  // Обработчик перемещения разделителя
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSplitPosition(Math.max(0, Math.min(100, percentage)))
  }
  
  // Обработчики мыши для перетаскивания
  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false)
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])
  
  return (
    <div className="space-y-4">
      {/* Контейнер для видео */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-black cursor-ew-resize"
        style={{ width: `${width}px`, height: `${height}px` }}
        onMouseDown={() => setIsDragging(true)}
      >
        {/* Оригинальное видео (левая часть) */}
        <div className="absolute inset-0">
          <video
            ref={originalVideoRef}
            src={videoPath}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
          />
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {t("effects.comparison.original", "Оригинал")}
          </div>
        </div>
        
        {/* Видео с эффектом (правая часть) */}
        <div 
          className="absolute inset-0"
          style={{
            clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)`,
          }}
        >
          <video
            ref={effectVideoRef}
            src={videoPath}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
          />
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded text-sm">
            {t("effects.comparison.withEffect", "С эффектом")}
          </div>
        </div>
        
        {/* Разделитель */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
          style={{ left: `${splitPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-gray-400" />
              <div className="w-0.5 h-4 bg-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Контролы */}
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? t("common.pause", "Пауза") : t("common.play", "Воспроизвести")}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={handleReset}
        >
          <RotateCcw size={16} />
          {t("common.reset", "Сброс")}
        </Button>
        
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("effects.comparison.position", "Позиция")}:
          </span>
          <Slider
            value={[splitPosition]}
            onValueChange={([value]) => setSplitPosition(value)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-mono text-muted-foreground w-12">
            {Math.round(splitPosition)}%
          </span>
        </div>
      </div>
    </div>
  )
}