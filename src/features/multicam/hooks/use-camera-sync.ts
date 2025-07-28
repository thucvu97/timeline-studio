/**
 * Хук для управления синхронизацией камер
 * Предоставляет унифицированный интерфейс для всех методов синхронизации
 */

import { useState, useCallback, useRef } from "react"
import { useLinkedClips } from "@/features/timeline/hooks/use-linked-clips"
import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import { syncByTimecode } from "../services/timecode-sync"
import { syncByAudio } from "../services/audio-sync"
import type { TimelineClip } from "@/features/timeline/types/timeline"
import type { SyncResult, SyncMethod, SyncStatus } from "../types/multicam"

export interface UseCameraSyncProps {
  baseClipId: string
}

export interface UseCameraSyncReturn {
  // Состояние синхронизации
  syncStatus: SyncStatus
  syncResults: SyncResult[]
  syncProgress: number
  syncError: string | null
  
  // Методы синхронизации
  syncByTimecode: () => Promise<void>
  syncByAudio: () => Promise<void>
  syncManual: (clipId: string, offset: number) => void
  
  // Управление синхронизацией
  applySyncResults: () => void
  clearSyncResults: () => void
  cancelSync: () => void
  
  // Утилиты
  getSyncOffset: (clipId: string) => number
  isSynced: (clipId: string) => boolean
  getSyncMethod: (clipId: string) => SyncMethod | null
}

export function useCameraSync({ baseClipId }: UseCameraSyncProps): UseCameraSyncReturn {
  const { getMulticamGroup, updateClipStartTime, getClipById } = useLinkedClips()
  const { getMediaFileById } = useMediaFiles()
  
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [syncResults, setSyncResults] = useState<SyncResult[]>([])
  const [syncProgress, setSyncProgress] = useState(0)
  const [syncError, setSyncError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  /**
   * Синхронизация по таймкоду
   */
  const handleSyncByTimecode = useCallback(async () => {
    try {
      setSyncStatus("syncing")
      setSyncError(null)
      setSyncProgress(0)
      
      const baseClip = getClipById(baseClipId)
      if (!baseClip) {
        throw new Error("Базовый клип не найден")
      }
      
      // Получаем все клипы группы
      const multicamGroup = getMulticamGroup(baseClipId)
      if (!multicamGroup.length) {
        throw new Error("Нет связанных клипов для синхронизации")
      }
      
      const clips: TimelineClip[] = multicamGroup
        .map(pair => [
          getClipById(pair.clipId1),
          getClipById(pair.clipId2)
        ])
        .flat()
        .filter((clip): clip is TimelineClip => clip !== null)
        .filter((clip, index, self) => 
          self.findIndex(c => c.id === clip.id) === index
        )
      
      // Получаем медиафайлы
      const mediaFiles = clips
        .map(clip => getMediaFileById(clip.mediaId))
        .filter(file => file !== null)
      
      setSyncProgress(50)
      
      // Выполняем синхронизацию
      const results = syncByTimecode(baseClip, clips, mediaFiles)
      
      setSyncResults(results)
      setSyncProgress(100)
      setSyncStatus("success")
      
      console.log("[useCameraSync] Timecode sync completed:", results)
    } catch (error) {
      console.error("[useCameraSync] Timecode sync failed:", error)
      setSyncError(error instanceof Error ? error.message : "Ошибка синхронизации")
      setSyncStatus("error")
    }
  }, [baseClipId, getClipById, getMulticamGroup, getMediaFileById])
  
  /**
   * Синхронизация по аудио
   */
  const handleSyncByAudio = useCallback(async () => {
    try {
      setSyncStatus("syncing")
      setSyncError(null)
      setSyncProgress(0)
      
      // Создаем новый AbortController
      abortControllerRef.current = new AbortController()
      
      const baseClip = getClipById(baseClipId)
      if (!baseClip) {
        throw new Error("Базовый клип не найден")
      }
      
      const baseMedia = getMediaFileById(baseClip.mediaId)
      if (!baseMedia) {
        throw new Error("Медиафайл базового клипа не найден")
      }
      
      // Получаем все клипы группы
      const multicamGroup = getMulticamGroup(baseClipId)
      if (!multicamGroup.length) {
        throw new Error("Нет связанных клипов для синхронизации")
      }
      
      const otherClips: TimelineClip[] = multicamGroup
        .map(pair => [
          getClipById(pair.clipId1),
          getClipById(pair.clipId2)
        ])
        .flat()
        .filter((clip): clip is TimelineClip => clip !== null && clip.id !== baseClipId)
        .filter((clip, index, self) => 
          self.findIndex(c => c.id === clip.id) === index
        )
      
      const results: SyncResult[] = []
      
      // Синхронизируем каждый клип с базовым
      for (let i = 0; i < otherClips.length; i++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error("Синхронизация отменена")
        }
        
        const clip = otherClips[i]
        const media = getMediaFileById(clip.mediaId)
        
        if (!media) {
          console.warn(`[useCameraSync] Media not found for clip ${clip.id}`)
          continue
        }
        
        // Обновляем прогресс
        const progress = ((i + 1) / otherClips.length) * 100
        setSyncProgress(progress)
        
        try {
          // Вызываем функцию синхронизации по аудио
          const result = await syncByAudio(
            baseMedia.path,
            media.path,
            {
              onProgress: (audioProgress) => {
                // Комбинируем общий прогресс и прогресс текущего файла
                const totalProgress = (i / otherClips.length + audioProgress / otherClips.length) * 100
                setSyncProgress(totalProgress)
              },
              signal: abortControllerRef.current.signal
            }
          )
          
          results.push({
            clipId: clip.id,
            offset: result.offset,
            confidence: result.confidence,
            method: "audio" as SyncMethod
          })
        } catch (audioError) {
          console.error(`[useCameraSync] Audio sync failed for clip ${clip.id}:`, audioError)
          // Продолжаем с другими клипами
        }
      }
      
      setSyncResults(results)
      setSyncProgress(100)
      setSyncStatus("success")
      
      console.log("[useCameraSync] Audio sync completed:", results)
    } catch (error) {
      console.error("[useCameraSync] Audio sync failed:", error)
      setSyncError(error instanceof Error ? error.message : "Ошибка синхронизации")
      setSyncStatus("error")
    } finally {
      abortControllerRef.current = null
    }
  }, [baseClipId, getClipById, getMulticamGroup, getMediaFileById])
  
  /**
   * Ручная синхронизация
   */
  const syncManual = useCallback((clipId: string, offset: number) => {
    setSyncResults(prev => {
      const existing = prev.find(r => r.clipId === clipId)
      if (existing) {
        return prev.map(r => 
          r.clipId === clipId 
            ? { ...r, offset, method: "manual" as SyncMethod }
            : r
        )
      }
      return [...prev, {
        clipId,
        offset,
        confidence: 1.0,
        method: "manual" as SyncMethod
      }]
    })
    setSyncStatus("success")
  }, [])
  
  /**
   * Применение результатов синхронизации
   */
  const applySyncResults = useCallback(() => {
    syncResults.forEach(result => {
      const clip = getClipById(result.clipId)
      if (clip) {
        // Применяем смещение к startTime клипа
        const newStartTime = clip.startTime + result.offset
        updateClipStartTime(result.clipId, newStartTime)
      }
    })
    
    console.log("[useCameraSync] Sync results applied")
  }, [syncResults, getClipById, updateClipStartTime])
  
  /**
   * Очистка результатов синхронизации
   */
  const clearSyncResults = useCallback(() => {
    setSyncResults([])
    setSyncStatus("idle")
    setSyncProgress(0)
    setSyncError(null)
  }, [])
  
  /**
   * Отмена синхронизации
   */
  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSyncStatus("idle")
    setSyncProgress(0)
  }, [])
  
  /**
   * Получение смещения для клипа
   */
  const getSyncOffset = useCallback((clipId: string): number => {
    const result = syncResults.find(r => r.clipId === clipId)
    return result?.offset ?? 0
  }, [syncResults])
  
  /**
   * Проверка синхронизации клипа
   */
  const isSynced = useCallback((clipId: string): boolean => {
    return syncResults.some(r => r.clipId === clipId)
  }, [syncResults])
  
  /**
   * Получение метода синхронизации для клипа
   */
  const getSyncMethod = useCallback((clipId: string): SyncMethod | null => {
    const result = syncResults.find(r => r.clipId === clipId)
    return result?.method ?? null
  }, [syncResults])
  
  return {
    // Состояние
    syncStatus,
    syncResults,
    syncProgress,
    syncError,
    
    // Методы
    syncByTimecode: handleSyncByTimecode,
    syncByAudio: handleSyncByAudio,
    syncManual,
    
    // Управление
    applySyncResults,
    clearSyncResults,
    cancelSync,
    
    // Утилиты
    getSyncOffset,
    isSynced,
    getSyncMethod,
  }
}