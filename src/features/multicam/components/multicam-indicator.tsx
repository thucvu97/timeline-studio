/**
 * Индикатор мультикамерного режима для плеера
 */

import { Camera } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MulticamIndicatorProps {
  /**
   * Текущий индекс камеры
   */
  currentAngle: number
  
  /**
   * Общее количество углов
   */
  totalAngles: number
  
  /**
   * Имя текущей камеры
   */
  angleName?: string
  
  /**
   * Класс для стилизации
   */
  className?: string
}

export function MulticamIndicator({
  currentAngle,
  totalAngles,
  angleName,
  className,
}: MulticamIndicatorProps) {
  if (totalAngles <= 1) {
    return null
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Camera className="w-4 h-4 text-muted-foreground" />
      <Badge variant="secondary" className="gap-1">
        <span className="font-bold">{currentAngle + 1}</span>
        <span className="text-muted-foreground">/</span>
        <span>{totalAngles}</span>
      </Badge>
      {angleName && (
        <span className="text-sm text-muted-foreground">{angleName}</span>
      )}
    </div>
  )
}