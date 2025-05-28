import React from "react"

import { TimelineMarks } from "./timeline-marks"
import { useTimelineScale } from "../../hooks/use-timeline-scale"

interface TimeRange {
  startTime: number
  endTime: number
  duration: number
}

interface TimelineScaleProps {
  // Старый интерфейс
  timeStep?: number
  subStep?: number
  adjustedRange?: TimeRange
  isActive?: boolean
  timeToPosition?: (time: number) => number

  // Новый интерфейс
  startTime?: number
  endTime?: number
  duration?: number
  sectorDate?: string
  sectorZoomLevel?: number
}

export function TimelineScale({
  // Поддержка старого интерфейса
  timeStep: propTimeStep,
  subStep: propSubStep,
  adjustedRange: propAdjustedRange,
  isActive = true,
  timeToPosition,

  // Поддержка нового интерфейса
  startTime,
  endTime,
  duration,
  sectorZoomLevel = 1,
}: TimelineScaleProps) {
  // Создаем объект adjustedRange из новых параметров, если они переданы
  const adjustedRange = propAdjustedRange || {
    startTime: startTime || 0,
    endTime: endTime || 0,
    duration: duration || 0,
  }

  // Используем переданный масштаб сектора
  const effectiveSectorZoomLevel = sectorZoomLevel

  // Используем хук для расчета шагов шкалы времени
  const { timeStep: calculatedTimeStep, subStep: calculatedSubStep } = useTimelineScale(
    adjustedRange.duration,
    adjustedRange.startTime,
    adjustedRange.endTime,
    effectiveSectorZoomLevel,
  )

  // Используем переданные значения или рассчитанные
  const timeStep = propTimeStep || calculatedTimeStep
  const subStep = propSubStep || calculatedSubStep

  // Если функция timeToPosition не передана, создаем ее локально
  const calculatePosition =
    timeToPosition ||
    ((time: number) => {
      return ((time - adjustedRange.startTime) / adjustedRange.duration) * 100
    })

  return (
    <div className="flex w-full flex-col">
      {/* Линия времени с метками */}
      <div className="flex w-full">
        <div className="relative w-full">
          {/* Горизонтальная линия */}
          <div
            className="h-[1px] w-full"
            style={{
              background: "rgb(47, 61, 62)",
            }}
          />

          {/* Метки времени */}
          <TimelineMarks
            startTime={adjustedRange.startTime}
            endTime={adjustedRange.endTime}
            duration={adjustedRange.duration}
            timeStep={timeStep}
            subStep={subStep}
            isActive={isActive}
            timeToPosition={calculatePosition}
            sectionId={`section-${startTime?.toFixed(0) || "0"}-${endTime?.toFixed(0) || "0"}`}
          />
        </div>
      </div>
    </div>
  )
}
