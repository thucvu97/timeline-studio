/**
 * Хук для управления мультикамерным монтажом
 * Обертка над useLinkedClips с дополнительной логикой для работы с несколькими камерами
 */

import { useCallback, useEffect, useMemo, useState } from "react"
import { useLinkedClips } from "@/features/timeline/hooks/use-linked-clips"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { usePlayer } from "@/features/video-player/services/player-provider"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import { multicamManager } from "../services/multicam-manager"
import { useMulticamShortcuts } from "./use-multicam-shortcuts"

export interface MulticamAngle {
  id: string
  name: string
  clipId: string
  clip: TimelineClip
  mediaPath?: string
  preview?: string
  syncOffset: number
  isActive: boolean
}

export interface MulticamState {
  angles: MulticamAngle[]
  activeAngleIndex: number
  activeAngle: MulticamAngle | null
  isSync: boolean
  syncOffsets: number[]
}

export interface UseMulticamReturn extends MulticamState {
  // Переключение камер
  switchToAngle: (angleIndex: number) => void
  switchToNextAngle: () => void
  switchToPreviousAngle: () => void
  switchToAngleByClipId: (clipId: string) => void
  
  // Синхронизация
  syncAngles: () => void
  setSyncOffset: (angleIndex: number, offset: number) => void
  autoSyncByAudio: () => Promise<void>
  autoSyncByTimecode: () => void
  
  // Управление группой
  addAngle: (clipId: string) => void
  removeAngle: (angleIndex: number) => void
  reorderAngles: (fromIndex: number, toIndex: number) => void
  
  // Информация
  getAngleByClipId: (clipId: string) => MulticamAngle | null
  isMulticamClip: (clipId: string) => boolean
  hasMulticamSupport: boolean
}

export function useMulticam(baseClipId?: string): UseMulticamReturn {
  const { 
    getMulticamPairs, 
    getMulticamGroup,
    syncLinkedClips,
    linkClips,
    unlinkClips,
  } = useLinkedClips()
  
  const { currentTime, updateClip, getClipById, project } = useTimeline()
  const { playerSelectClip } = usePlayer()
  
  // Регистрируем горячие клавиши
  useMulticamShortcuts()
  
  // Состояние активного угла
  const [activeAngleIndex, setActiveAngleIndex] = useState(0)
  const [syncOffsets, setSyncOffsets] = useState<number[]>([])
  
  // Синхронизируем состояние с менеджером
  useEffect(() => {
    if (baseClipId) {
      multicamManager.setBaseClip(baseClipId)
    }
    
    // Слушаем события переключения камер
    const handleCameraSwitch = (angleIndex: number) => {
      // Проверяем, что индекс в пределах доступных углов
      if (angleIndex >= 0 && angleIndex < angles.length) {
        setActiveAngleIndex(angleIndex)
        
        // Автоматически переключаем плеер на выбранный клип
        const angle = angles[angleIndex]
        if (angle) {
          playerSelectClip(angle.clipId).catch(error => {
            console.error('[useMulticam] Failed to switch player clip:', error)
          })
        }
      } else {
        console.warn(`[useMulticam] Camera ${angleIndex + 1} not available (only ${angles.length} cameras in group)`)
      }
    }
    
    multicamManager.on("camera-switched", handleCameraSwitch)
    
    return () => {
      multicamManager.removeListener("camera-switched", handleCameraSwitch)
    }
  }, [baseClipId, angles, playerSelectClip])
  
  // Получаем все клипы мультикамерной группы
  const multicamClips = useMemo(() => {
    if (!baseClipId) return []
    return getMulticamGroup(baseClipId)
  }, [baseClipId, getMulticamGroup])
  
  // Преобразуем клипы в углы камер
  const angles = useMemo((): MulticamAngle[] => {
    return multicamClips.map((clip, index) => {
      // Находим медиафайл для клипа
      const mediaFile = project?.resources.media.find(m => m.id === clip.mediaId)
      
      return {
        id: `angle-${clip.id}`,
        name: clip.name || `Camera ${index + 1}`,
        clipId: clip.id,
        clip,
        mediaPath: mediaFile?.path,
        syncOffset: syncOffsets[index] || 0,
        isActive: index === activeAngleIndex,
      }
    })
  }, [multicamClips, activeAngleIndex, syncOffsets, project])
  
  const activeAngle = angles[activeAngleIndex] || null
  const hasMulticamSupport = angles.length > 1
  
  // Переключение на конкретный угол
  const switchToAngle = useCallback((angleIndex: number) => {
    if (angleIndex >= 0 && angleIndex < angles.length) {
      // Используем менеджер для переключения (он вызовет событие и обновит состояние)
      multicamManager.switchToCamera(angleIndex)
      
      // Переключаем плеер на выбранный клип
      const angle = angles[angleIndex]
      if (angle) {
        console.log(`[useMulticam] Switching to angle ${angleIndex + 1}:`, angle.name)
        // Вызываем API плеера для переключения на другой клип
        playerSelectClip(angle.clipId).catch(error => {
          console.error('[useMulticam] Failed to switch player clip:', error)
        })
      }
    }
  }, [angles, playerSelectClip])
  
  // Переключение на следующий угол
  const switchToNextAngle = useCallback(() => {
    const nextIndex = (activeAngleIndex + 1) % angles.length
    switchToAngle(nextIndex)
  }, [activeAngleIndex, angles.length, switchToAngle])
  
  // Переключение на предыдущий угол
  const switchToPreviousAngle = useCallback(() => {
    const prevIndex = activeAngleIndex === 0 ? angles.length - 1 : activeAngleIndex - 1
    switchToAngle(prevIndex)
  }, [activeAngleIndex, angles.length, switchToAngle])
  
  // Переключение по ID клипа
  const switchToAngleByClipId = useCallback((clipId: string) => {
    const angleIndex = angles.findIndex(angle => angle.clipId === clipId)
    if (angleIndex !== -1) {
      switchToAngle(angleIndex)
    }
  }, [angles, switchToAngle])
  
  // Синхронизация всех углов
  const syncAngles = useCallback(() => {
    if (!activeAngle) return
    
    // Синхронизируем все углы относительно активного
    angles.forEach((angle, index) => {
      if (index !== activeAngleIndex) {
        const offset = syncOffsets[index] || 0
        const syncTime = currentTime + offset
        
        syncLinkedClips(angle.clipId, {
          startTime: angle.clip.startTime + (syncTime - currentTime),
        })
      }
    })
  }, [angles, activeAngle, activeAngleIndex, currentTime, syncOffsets, syncLinkedClips])
  
  // Установка смещения синхронизации для угла
  const setSyncOffset = useCallback((angleIndex: number, offset: number) => {
    setSyncOffsets(prev => {
      const newOffsets = [...prev]
      newOffsets[angleIndex] = offset
      return newOffsets
    })
  }, [])
  
  // Автоматическая синхронизация по аудио
  const autoSyncByAudio = useCallback(async () => {
    // TODO: Реализовать анализ аудиодорожек для синхронизации
    console.log("[useMulticam] Auto-sync by audio - not implemented yet")
  }, [])
  
  // Автоматическая синхронизация по таймкоду
  const autoSyncByTimecode = useCallback(() => {
    if (!activeAngle || angles.length < 2) {
      console.warn("[useMulticam] Need at least 2 angles for sync")
      return
    }
    
    // Импортируем функцию синхронизации
    import("../services/timecode-sync").then(({ syncByTimecode }) => {
      // Получаем все клипы и медиафайлы
      const clips = angles.map(angle => angle.clip)
      const mediaFiles = project?.resources.media || []
      
      // Используем активный угол как базовый
      const baseClip = activeAngle.clip
      const syncResults = syncByTimecode(baseClip, clips, mediaFiles)
      
      // Применяем смещения
      syncResults.forEach(result => {
        const angleIndex = angles.findIndex(a => a.clipId === result.clipId)
        if (angleIndex !== -1 && result.confidence > 0) {
          setSyncOffset(angleIndex, result.offset)
          console.log(`[useMulticam] Synced angle ${angleIndex + 1} with offset ${result.offset}s (${result.method})`)
        }
      })
      
      // Применяем синхронизацию к клипам
      syncAngles()
    })
  }, [activeAngle, angles, project, setSyncOffset, syncAngles])
  
  // Добавление нового угла
  const addAngle = useCallback((clipId: string) => {
    if (!baseClipId || !hasMulticamSupport) return
    
    // Связываем новый клип с существующими
    linkClips(baseClipId, clipId)
  }, [baseClipId, hasMulticamSupport, linkClips])
  
  // Удаление угла
  const removeAngle = useCallback((angleIndex: number) => {
    const angle = angles[angleIndex]
    if (!angle) return
    
    // Разрываем связи для этого клипа
    angles.forEach((otherAngle, index) => {
      if (index !== angleIndex) {
        unlinkClips(angle.clipId, otherAngle.clipId)
      }
    })
  }, [angles, unlinkClips])
  
  // Изменение порядка углов
  const reorderAngles = useCallback((fromIndex: number, toIndex: number) => {
    // TODO: Реализовать изменение порядка углов
    console.log("[useMulticam] Reorder angles - not implemented yet")
  }, [])
  
  // Получение угла по ID клипа
  const getAngleByClipId = useCallback((clipId: string): MulticamAngle | null => {
    return angles.find(angle => angle.clipId === clipId) || null
  }, [angles])
  
  // Проверка, является ли клип частью мультикамерной группы
  const isMulticamClip = useCallback((clipId: string): boolean => {
    return angles.some(angle => angle.clipId === clipId)
  }, [angles])
  
  return {
    // Состояние
    angles,
    activeAngleIndex,
    activeAngle,
    isSync: true, // TODO: Определять реальное состояние синхронизации
    syncOffsets,
    
    // Методы переключения
    switchToAngle,
    switchToNextAngle,
    switchToPreviousAngle,
    switchToAngleByClipId,
    
    // Методы синхронизации
    syncAngles,
    setSyncOffset,
    autoSyncByAudio,
    autoSyncByTimecode,
    
    // Управление группой
    addAngle,
    removeAngle,
    reorderAngles,
    
    // Информация
    getAngleByClipId,
    isMulticamClip,
    hasMulticamSupport,
  }
}