/**
 * Компонент для выбора активной камеры в мультикамерном режиме
 */

import { Camera, Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import type { MulticamAngle } from "../hooks/use-multicam"

interface CameraSelectorProps {
  /**
   * Список углов камер
   */
  angles: MulticamAngle[]

  /**
   * Индекс активного угла
   */
  activeAngleIndex: number

  /**
   * Обработчик выбора камеры
   */
  onSelectAngle: (angleIndex: number) => void

  /**
   * Отключен ли селектор
   */
  disabled?: boolean

  /**
   * Класс для кнопки
   */
  className?: string
}

export function CameraSelector({
  angles,
  activeAngleIndex,
  onSelectAngle,
  disabled = false,
  className,
}: CameraSelectorProps) {
  const activeAngle = angles[activeAngleIndex]

  if (angles.length <= 1) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className={cn("gap-2", className)}>
          <Camera className="w-4 h-4" />
          <span className="font-mono">
            {activeAngleIndex + 1}/{angles.length}
          </span>
          {activeAngle?.name && <span className="text-muted-foreground ml-1">{activeAngle.name}</span>}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Выберите камеру</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {angles.map((angle, index) => (
          <DropdownMenuItem key={angle.id} onClick={() => onSelectAngle(index)} className="gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Badge variant="outline" className="w-6 h-6 p-0 justify-center">
                {index + 1}
              </Badge>
              <span className="flex-1">{angle.name}</span>
              {angle.syncOffset !== 0 && (
                <span className="text-xs text-muted-foreground">
                  {angle.syncOffset > 0 ? "+" : ""}
                  {angle.syncOffset.toFixed(1)}s
                </span>
              )}
            </div>
            {index === activeAngleIndex && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
