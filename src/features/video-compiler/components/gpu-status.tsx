import React from "react"

import { Activity, Cpu, HardDrive, Info, Settings, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import {
  formatGpuMemory,
  formatGpuUtilization,
  getGpuEncoderDisplayName,
  getGpuRecommendations,
  getGpuStatusColor,
  useGpuCapabilities,
} from "../hooks/use-gpu-capabilities"

interface GpuStatusProps {
  className?: string
  showDetails?: boolean
  onSettingsClick?: () => void
}

export function GpuStatus({ className, showDetails = true, onSettingsClick }: GpuStatusProps) {
  const {
    gpuCapabilities,
    currentGpu,
    systemInfo,
    compilerSettings,
    isLoading,
    error,
    updateSettings,
    refreshCapabilities,
  } = useGpuCapabilities()

  // Обработчик переключения GPU ускорения
  const handleToggleGpuAcceleration = async (enabled: boolean) => {
    if (!compilerSettings) return

    await updateSettings({
      ...compilerSettings,
      hardware_acceleration: enabled,
    })
  }

  if (isLoading) {
    return <GpuStatusSkeleton className={className} />
  }

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="text-destructive">Ошибка GPU</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={refreshCapabilities}>
            Повторить
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const isGpuAvailable = gpuCapabilities?.hardware_acceleration_supported || false
  const recommendations = getGpuRecommendations(gpuCapabilities)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className={cn("h-5 w-5", getGpuStatusColor(isGpuAvailable))} />
            <CardTitle>GPU Ускорение</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={compilerSettings?.hardware_acceleration || false}
              onCheckedChange={handleToggleGpuAcceleration}
              disabled={!isGpuAvailable}
            />
            {onSettingsClick && (
              <Button variant="ghost" size="icon" onClick={onSettingsClick}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>{isGpuAvailable ? "GPU ускорение доступно" : "GPU ускорение недоступно"}</CardDescription>
      </CardHeader>

      {showDetails && (
        <>
          <CardContent className="space-y-4">
            {/* Информация о GPU */}
            {currentGpu && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Cpu className="h-4 w-4" />
                  Видеокарта
                </div>
                <div className="ml-6 space-y-1">
                  <p className="text-sm">{currentGpu.name}</p>
                  {currentGpu.driver_version && (
                    <p className="text-xs text-muted-foreground">Драйвер: {currentGpu.driver_version}</p>
                  )}
                </div>
              </div>
            )}

            {/* Память GPU */}
            {currentGpu?.memory_total && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <HardDrive className="h-4 w-4" />
                  Видеопамять
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Используется</span>
                    <span>
                      {formatGpuMemory(currentGpu.memory_used)} / {formatGpuMemory(currentGpu.memory_total)}
                    </span>
                  </div>
                  {currentGpu.memory_used && currentGpu.memory_total && (
                    <Progress value={(currentGpu.memory_used / currentGpu.memory_total) * 100} className="h-2" />
                  )}
                </div>
              </div>
            )}

            {/* Загрузка GPU */}
            {currentGpu?.utilization !== undefined && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Activity className="h-4 w-4" />
                  Загрузка GPU
                </div>
                <div className="ml-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Использование</span>
                    <span>{formatGpuUtilization(currentGpu.utilization)}</span>
                  </div>
                  <Progress value={currentGpu.utilization} className="h-2" />
                </div>
              </div>
            )}

            <Separator />

            {/* Доступные кодировщики */}
            {gpuCapabilities && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Cpu className="h-4 w-4" />
                  Кодировщики
                </div>
                <div className="ml-6 flex flex-wrap gap-2">
                  {gpuCapabilities.available_encoders.map((encoder) => (
                    <Badge
                      key={encoder}
                      variant={encoder === gpuCapabilities.recommended_encoder ? "default" : "secondary"}
                    >
                      {getGpuEncoderDisplayName(encoder)}
                    </Badge>
                  ))}
                  {gpuCapabilities.available_encoders.length === 0 && <Badge variant="outline">Только CPU</Badge>}
                </div>
              </div>
            )}

            {/* Системная информация */}
            {systemInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Info className="h-4 w-4" />
                  Система
                </div>
                <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                  <p>
                    ОС: {systemInfo.os} ({systemInfo.arch})
                  </p>
                  <p>CPU: {systemInfo.cpu_cores} ядер</p>
                  {systemInfo.available_memory && <p>Память: {formatGpuMemory(systemInfo.available_memory)}</p>}
                </div>
              </div>
            )}

            {/* Рекомендации */}
            {recommendations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Рекомендации</p>
                  <ul className="ml-2 space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={refreshCapabilities}>
                    Обновить
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Обновить информацию о GPU</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {compilerSettings && (
              <div className="text-xs text-muted-foreground">Макс. задач: {compilerSettings.max_concurrent_jobs}</div>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  )
}

// Скелетон для загрузки
function GpuStatusSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}

// Компактная версия для панели инструментов
export function GpuStatusBadge({ className }: { className?: string }) {
  const { gpuCapabilities, isLoading } = useGpuCapabilities()

  if (isLoading) {
    return <Skeleton className={cn("h-5 w-20", className)} />
  }

  const isGpuAvailable = gpuCapabilities?.hardware_acceleration_supported || false
  const encoder = gpuCapabilities?.recommended_encoder

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={isGpuAvailable ? "default" : "secondary"} className={cn("gap-1", className)}>
            <Zap className="h-3 w-3" />
            {encoder ? getGpuEncoderDisplayName(encoder) : "CPU"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isGpuAvailable ? `GPU ускорение: ${encoder}` : "GPU ускорение недоступно"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
