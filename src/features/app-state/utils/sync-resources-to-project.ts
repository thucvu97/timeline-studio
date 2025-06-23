/**
 * Утилиты для синхронизации ресурсов с проектом
 */

import { convertMediaFileToPoolItem } from "@/features/media/utils/media-pool-utils"
import { TimelineStudioProject } from "@/features/project-settings/types/timeline-studio-project"
import { MediaResource, MusicResource } from "@/features/resources/types"

/**
 * Синхронизирует ресурсы из ResourcesProvider с MediaPool проекта
 */
export function syncResourcesToProject(
  project: TimelineStudioProject,
  mediaResources: MediaResource[],
  musicResources: MusicResource[],
): TimelineStudioProject {
  // Создаем копию проекта чтобы не мутировать оригинал
  const updatedProject = { ...project }

  // Очищаем существующие медиа в проекте
  updatedProject.mediaPool.items.clear()

  // Добавляем медиа ресурсы
  mediaResources.forEach((resource) => {
    if (resource.file) {
      const poolItem = convertMediaFileToPoolItem(resource.file)
      updatedProject.mediaPool.items.set(poolItem.id, poolItem)
    }
  })

  // Добавляем музыкальные ресурсы в отдельную папку
  musicResources.forEach((resource) => {
    if (resource.file) {
      const poolItem = convertMediaFileToPoolItem(resource.file, "music")
      updatedProject.mediaPool.items.set(poolItem.id, poolItem)
    }
  })

  // Обновляем статистику
  updatedProject.mediaPool.stats = {
    totalItems: updatedProject.mediaPool.items.size,
    totalSize: Array.from(updatedProject.mediaPool.items.values()).reduce(
      (sum, item) => sum + item.metadata.fileSize,
      0,
    ),
    onlineItems: Array.from(updatedProject.mediaPool.items.values()).filter((item) => item.status === "online")
      .length,
    offlineItems: Array.from(updatedProject.mediaPool.items.values()).filter(
      (item) => item.status === "offline" || item.status === "missing",
    ).length,
    proxyItems: 0,
    unusedItems: updatedProject.mediaPool.items.size, // Все элементы изначально неиспользуемые
  }

  // Обновляем дату модификации
  updatedProject.metadata.modified = new Date()

  return updatedProject
}

/**
 * Получает ресурсы из localStorage
 */
export function getResourcesFromStorage(): {
  mediaResources: MediaResource[]
  musicResources: MusicResource[]
} {
  // Check if we're on the client side
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {
      mediaResources: [],
      musicResources: [],
    }
  }
  
  try {
    const stored = localStorage.getItem("timeline-studio-resources")
    if (stored) {
      const data = JSON.parse(stored)
      return {
        mediaResources: data.mediaResources || [],
        musicResources: data.musicResources || [],
      }
    }
  } catch (error) {
    console.warn("Failed to get resources from localStorage:", error)
  }

  return {
    mediaResources: [],
    musicResources: [],
  }
}