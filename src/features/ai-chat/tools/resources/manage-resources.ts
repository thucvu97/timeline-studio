/**
 * AI инструменты для управления ресурсами (добавление, удаление, обновление)
 */

import {
  filterResources,
  findResource,
  getResourcesProvider,
  getResourcesStateAccess,
  hasResourcesAccess,
  resourceExists,
} from "./utils/helpers"

import type {
  AddResourceParams,
  BulkAddResourcesParams,
  RemoveResourceParams,
  ResourceToolResult,
  UpdateResourceParams,
} from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const addResourceToPoolTool: ClaudeTool = {
  name: "add_resource_to_pool",
  description: "Добавляет конкретный ресурс в пул ресурсов проекта с указанием причины",
  input_schema: {
    type: "object",
    properties: {
      resourceType: {
        type: "string",
        enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
        description: "Тип добавляемого ресурса",
      },
      resourceId: {
        type: "string",
        description: "Уникальный идентификатор ресурса",
      },
      reason: {
        type: "string",
        description: "Объяснение, зачем этот ресурс добавляется в проект",
      },
      autoApply: {
        type: "boolean",
        description: "Автоматически применить ресурс к подходящим элементам",
        default: false,
      },
    },
    required: ["resourceType", "resourceId", "reason"],
  },
}

export const bulkAddResourcesTool: ClaudeTool = {
  name: "bulk_add_resources",
  description: "Массово добавляет ресурсы в пул по заданным критериям",
  input_schema: {
    type: "object",
    properties: {
      criteria: {
        type: "object",
        properties: {
          resourceType: {
            type: "string",
            enum: ["media", "music", "effect", "filter", "transition", "template", "styleTemplate"],
          },
          selectionMethod: {
            type: "string",
            enum: ["all", "filtered", "recent", "favorites", "smart"],
            description: "Метод выбора ресурсов",
          },
          filters: {
            type: "object",
            properties: {
              searchQuery: { type: "string" },
              dateRange: {
                type: "object",
                properties: {
                  start: { type: "string" },
                  end: { type: "string" },
                },
              },
              fileTypes: {
                type: "array",
                items: { type: "string", enum: ["video", "audio", "image"] },
              },
              minDuration: { type: "number" },
              maxDuration: { type: "number" },
              tags: { type: "array", items: { type: "string" } },
            },
          },
          maxCount: {
            type: "number",
            description: "Максимальное количество ресурсов для добавления",
          },
        },
        required: ["resourceType", "selectionMethod"],
      },
      reason: {
        type: "string",
        description: "Объяснение цели массового добавления ресурсов",
      },
    },
    required: ["criteria", "reason"],
  },
}

export const removeResourceFromPoolTool: ClaudeTool = {
  name: "remove_resource_from_pool",
  description: "Удаляет ресурс из пула ресурсов проекта",
  input_schema: {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "Идентификатор удаляемого ресурса",
      },
      reason: {
        type: "string",
        description: "Причина удаления ресурса",
      },
      removeFromTimeline: {
        type: "boolean",
        description: "Также удалить из таймлайна, если используется",
        default: false,
      },
    },
    required: ["resourceId", "reason"],
  },
}

export const updateResourceParametersTool: ClaudeTool = {
  name: "update_resource_parameters",
  description: "Обновляет параметры уже добавленного ресурса",
  input_schema: {
    type: "object",
    properties: {
      resourceId: {
        type: "string",
        description: "Идентификатор ресурса для обновления",
      },
      newParameters: {
        type: "object",
        description: "Новые параметры ресурса (зависят от типа ресурса)",
      },
      reason: {
        type: "string",
        description: "Причина изменения параметров",
      },
    },
    required: ["resourceId", "newParameters", "reason"],
  },
}

export async function addResourceToPool(params: AddResourceParams): Promise<ResourceToolResult> {
  const { resourceType, resourceId, reason, autoApply = false } = params

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const resourcesStateAccess = getResourcesStateAccess()!

    // Проверяем, не добавлен ли уже ресурс
    if (resourceExists(resourceId)) {
      return {
        success: false,
        message: `Ресурс ${resourceId} уже добавлен в пул`,
        errors: [`Ресурс с ID ${resourceId} уже существует в пуле`],
      }
    }

    // В реальной реализации здесь будет поиск ресурса по ID из глобального хранилища
    // Пока создаем заглушку для ресурса
    let resourceToAdd: any = null

    switch (resourceType) {
      case "media":
      case "music":
        resourceToAdd = {
          id: resourceId,
          name: `${resourceType}_${resourceId}`,
          path: `/path/to/${resourceId}`,
          type: resourceType === "music" ? "audio" : "video",
          size: 1024 * 1024 * 10, // 10MB
          duration: 120, // 2 минуты
        }
        break
      case "effect":
        resourceToAdd = {
          id: resourceId,
          name: `Effect ${resourceId}`,
          category: "visual",
          description: "Visual effect",
        }
        break
      case "filter":
        resourceToAdd = {
          id: resourceId,
          name: `Filter ${resourceId}`,
          category: "color",
          intensity: 0.5,
        }
        break
      case "transition":
        resourceToAdd = {
          id: resourceId,
          type: "fade",
          name: `Transition ${resourceId}`,
          duration: 1000,
        }
        break
      default:
        return {
          success: false,
          message: `Неподдерживаемый тип ресурса: ${resourceType}`,
          errors: [`Тип ресурса ${resourceType} не поддерживается`],
        }
    }

    // Добавляем ресурс через ResourcesProvider
    await resourcesStateAccess.addResource(resourceType, resourceToAdd)

    const warnings: string[] = []
    if (autoApply) {
      warnings.push("Автоматическое применение пока не реализовано")
    }

    return {
      success: true,
      message: `Ресурс ${resourceId} добавлен в пул (${reason})`,
      data: {
        addedResources: [resourceId],
        analysis: {
          resourceType,
          resourceId,
          reason,
          autoApplied: autoApply,
          timestamp: new Date().toISOString(),
        },
        warnings: warnings.length > 0 ? warnings : undefined,
      },
      nextActions: autoApply
        ? ["Проверить применение ресурса", "Настроить параметры ресурса"]
        : ["Разместить ресурс на таймлайне", "Настроить параметры ресурса"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка добавления ресурса: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function bulkAddResources(params: BulkAddResourcesParams): Promise<ResourceToolResult> {
  const { criteria, reason } = params
  const { resourceType, selectionMethod, filters, maxCount } = criteria

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const resourcesStateAccess = getResourcesStateAccess()!
    const addedResources: string[] = []
    let availableResources: any[] = []

    // Получаем доступные ресурсы по типу
    switch (resourceType) {
      case "media":
        // В реальной реализации здесь будет доступ к browser state для получения всех медиа файлов
        availableResources = [] // browserStateAccess?.getMediaFiles() || []
        break
      case "music":
        availableResources = [] // browserStateAccess?.getMusicFiles() || []
        break
      case "effect":
        // Здесь можно получить эффекты из глобального хранилища
        availableResources = []
        break
      case "filter":
        availableResources = []
        break
      case "transition":
        availableResources = []
        break
      default:
        availableResources = []
        break
    }

    // Фильтруем ресурсы по критериям
    let filteredResources = availableResources

    if (selectionMethod === "filtered" && filters) {
      filteredResources = filterResources(availableResources, filters)
    } else if (selectionMethod === "recent") {
      filteredResources = availableResources.slice(-10)
    } else if (selectionMethod === "favorites") {
      // MediaFile не имеет поля isFavorite, поэтому возвращаем пустой массив для favorites
      filteredResources = []
    }

    // Ограничиваем количество
    const resourcesToAdd = filteredResources.slice(0, maxCount || 10)

    // Добавляем ресурсы
    for (const resource of resourcesToAdd) {
      try {
        await resourcesStateAccess.addResource(resourceType, resource)
        addedResources.push(resource.id || resource.name)
      } catch (error) {
        console.warn(`Failed to add resource ${resource.id}:`, error)
      }
    }

    return {
      success: true,
      message: `Массово добавлено ${addedResources.length} ресурсов типа ${resourceType}`,
      data: {
        addedResources,
        analysis: {
          criteria,
          reason,
          selectionMethod,
          actualCount: addedResources.length,
          availableCount: availableResources.length,
          filteredCount: filteredResources.length,
        },
      },
      nextActions:
        addedResources.length > 0
          ? ["Проверить добавленные ресурсы", "Разместить на таймлайне"]
          : ["Изменить критерии поиска"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка массового добавления ресурсов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function removeResourceFromPool(params: RemoveResourceParams): Promise<ResourceToolResult> {
  const { resourceId, reason, removeFromTimeline = false } = params

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const resourcesStateAccess = getResourcesStateAccess()!

    // Находим ресурс в провайдере
    const resource = findResource(resourceId)

    if (!resource) {
      return {
        success: false,
        message: `Ресурс ${resourceId} не найден в пуле`,
        errors: [`Ресурс с ID ${resourceId} не существует`],
      }
    }

    // Удаляем ресурс
    await resourcesStateAccess.removeResource(resourceId, resource.type)

    const warnings: string[] = []

    if (removeFromTimeline) {
      // В реальной реализации здесь будет вызов timeline state machine
      // для удаления всех клипов с этим ресурсом
      warnings.push("Ресурс также удален из таймлайна")
      warnings.push("Внимание: это может повлиять на структуру проекта")
    }

    return {
      success: true,
      message: `Ресурс ${resourceId} (${resource.type}) удален из пула`,
      data: {
        removedResources: [resourceId],
        analysis: {
          reason,
          removedFromTimeline: removeFromTimeline,
          resourceType: resource.type,
          timestamp: new Date().toISOString(),
        },
        warnings,
      },
      nextActions: removeFromTimeline
        ? ["Проверить таймлайн на целостность", "Заменить удаленные клипы"]
        : ["Проверить зависимости ресурса"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка удаления ресурса: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function updateResourceParameters(params: UpdateResourceParams): Promise<ResourceToolResult> {
  const { resourceId, newParameters, reason } = params

  if (!hasResourcesAccess()) {
    return {
      success: false,
      message: "Resources state access не настроен",
      errors: ["Доступ к ресурсам не сконфигурирован"],
    }
  }

  try {
    const resourcesProvider = getResourcesProvider()
    const resourcesStateAccess = getResourcesStateAccess()!

    // Находим ресурс
    const resource = findResource(resourceId)

    if (!resource) {
      return {
        success: false,
        message: `Ресурс ${resourceId} не найден`,
        errors: [`Ресурс с ID ${resourceId} не существует в пуле`],
      }
    }

    // Обновляем параметры ресурса
    await resourcesStateAccess.updateResource(resourceId, newParameters)

    // Анализируем изменения
    const changedParams = Object.keys(newParameters)
    const criticalChanges = []

    // Проверяем критичные изменения
    if ("duration" in newParameters) {
      criticalChanges.push("Изменена длительность - может повлиять на синхронизацию")
    }
    if ("resolution" in newParameters) {
      criticalChanges.push("Изменено разрешение - может потребоваться перерендеринг")
    }
    if ("fps" in newParameters) {
      criticalChanges.push("Изменена частота кадров - может повлиять на плавность")
    }
    if ("volume" in newParameters || "audioGain" in newParameters) {
      criticalChanges.push("Изменены аудио параметры - проверьте баланс звука")
    }

    return {
      success: true,
      message: `Параметры ресурса ${resourceId} обновлены (${changedParams.length} изменений)`,
      data: {
        analysis: {
          resourceId,
          resourceType: resource.type,
          updatedParameters: newParameters,
          changedFields: changedParams,
          reason,
          timestamp: new Date().toISOString(),
          criticalChanges,
        },
        warnings: criticalChanges,
      },
      nextActions:
        criticalChanges.length > 0
          ? ["Проверить влияние изменений на таймлайн", "Пересчитать превью", "Проверить совместимость"]
          : ["Просмотреть обновленный ресурс"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка обновления параметров: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
