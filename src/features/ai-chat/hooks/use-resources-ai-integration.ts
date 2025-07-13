import { useCallback, useEffect } from "react"

import { useResources } from "@/features/resources/services/resources-provider"

import { setResourcesStateAccess } from "../tools/resource-tools"

/**
 * Хук для интеграции ResourcesProvider с AI инструментами
 *
 * Устанавливает доступ к состоянию ресурсов для AI инструментов,
 * позволяя им управлять ресурсами проекта через естественный язык
 */
export function useResourcesAIIntegration() {
  const resources = useResources()

  // Функция для получения статистики ресурсов
  const getResourceStats = useCallback(() => {
    const totalMedia = resources.mediaResources.length
    const totalMusic = resources.musicResources.length
    const totalEffects = resources.effectResources.length
    const totalFilters = resources.filterResources.length

    const totalSize = [...resources.mediaResources, ...resources.musicResources].reduce(
      (sum, r) => sum + (r.file.size || 0),
      0,
    )

    const totalDuration = [...resources.mediaResources, ...resources.musicResources].reduce(
      (sum, r) => sum + (r.file.duration || 0),
      0,
    )

    return {
      totalMedia,
      totalEffects,
      totalFilters,
      totalSize,
      totalDuration,
    }
  }, [resources])

  // Функция для добавления медиафайла
  const addMediaFile = useCallback(
    async (file: any) => {
      return resources.addMedia(file)
    },
    [resources],
  )

  // Функция для добавления эффекта
  const addEffect = useCallback(
    async (effect: any) => {
      return resources.addEffect(effect)
    },
    [resources],
  )

  // Функция для добавления фильтра
  const addFilter = useCallback(
    async (filter: any) => {
      return resources.addFilter(filter)
    },
    [resources],
  )

  // Функция для добавления любого ресурса
  const addResource = useCallback(
    async (resourceType: string, resource: any) => {
      return resources.addResource(resourceType, resource)
    },
    [resources],
  )

  // Функция для удаления ресурса
  const removeResource = useCallback(
    async (resourceId: string, _type: string) => {
      return resources.removeResource(resourceId)
    },
    [resources],
  )

  // Функция для обновления ресурса
  const updateResource = useCallback(
    async (resourceId: string, params: Record<string, any>) => {
      return resources.updateResource(resourceId, params)
    },
    [resources],
  )

  // Устанавливаем доступ к ресурсам для AI инструментов
  useEffect(() => {
    const resourcesAccess = {
      getResourcesProvider: () => resources,
      addMediaFile,
      addEffect,
      addFilter,
      addResource,
      removeResource,
      updateResource,
      getResourceStats,
    }

    setResourcesStateAccess(resourcesAccess)

    // Очищаем при размонтировании
    return () => {
      setResourcesStateAccess(null)
    }
  }, [resources, addMediaFile, addEffect, addFilter, addResource, removeResource, updateResource, getResourceStats])

  return {
    isIntegrated: true,
    resourceStats: getResourceStats(),
  }
}
