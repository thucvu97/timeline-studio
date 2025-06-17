import { invoke } from "@tauri-apps/api/core"

import { VideoEffect } from "../types"

/**
 * Интерфейс для пользовательского эффекта с метаданными
 */
export interface UserEffect {
  effect: VideoEffect
  createdAt: string
  updatedAt: string
  author?: string
  tags?: string[]
  isCustom: boolean
}

/**
 * Интерфейс для коллекции пользовательских эффектов
 */
export interface UserEffectsCollection {
  version: string
  name: string
  description?: string
  effects: UserEffect[]
  createdAt: string
  updatedAt: string
}

/**
 * Сохраняет пользовательский эффект в файловую систему
 * @param effect Эффект для сохранения
 * @param fileName Имя файла (без расширения)
 * @returns Путь к сохраненному файлу
 */
export async function saveUserEffect(effect: VideoEffect, fileName: string): Promise<string> {
  try {
    const userEffect: UserEffect = {
      effect,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCustom: true
    }
    
    const filePath = await invoke<string>("save_user_effect", {
      fileName,
      effect: JSON.stringify(userEffect)
    })
    
    return filePath
  } catch (error) {
    console.error("Error saving user effect:", error)
    throw error
  }
}

/**
 * Загружает пользовательский эффект из файла
 * @param filePath Путь к файлу эффекта
 * @returns Пользовательский эффект
 */
export async function loadUserEffect(filePath: string): Promise<UserEffect> {
  try {
    const effectData = await invoke<string>("load_user_effect", { filePath })
    return JSON.parse(effectData) as UserEffect
  } catch (error) {
    console.error("Error loading user effect:", error)
    throw error
  }
}

/**
 * Сохраняет коллекцию эффектов в файл
 * @param collection Коллекция эффектов
 * @param fileName Имя файла (без расширения)
 * @returns Путь к сохраненному файлу
 */
export async function saveEffectsCollection(
  collection: UserEffectsCollection,
  fileName: string
): Promise<string> {
  try {
    const filePath = await invoke<string>("save_effects_collection", {
      fileName,
      collection: JSON.stringify(collection)
    })
    
    return filePath
  } catch (error) {
    console.error("Error saving effects collection:", error)
    throw error
  }
}

/**
 * Загружает коллекцию эффектов из файла
 * @param filePath Путь к файлу коллекции
 * @returns Коллекция эффектов
 */
export async function loadEffectsCollection(filePath: string): Promise<UserEffectsCollection> {
  try {
    const collectionData = await invoke<string>("load_effects_collection", { filePath })
    return JSON.parse(collectionData) as UserEffectsCollection
  } catch (error) {
    console.error("Error loading effects collection:", error)
    throw error
  }
}

/**
 * Экспортирует эффект с пользовательскими настройками
 * @param effect Базовый эффект
 * @param customParams Пользовательские параметры
 * @param presetName Имя пресета
 * @returns Эффект для экспорта
 */
export function prepareEffectForExport(
  effect: VideoEffect,
  customParams?: Record<string, number>,
  presetName?: string
): VideoEffect {
  const exportEffect = { ...effect }
  
  // Если есть пользовательские параметры, создаем новый пресет
  if (customParams && presetName) {
    const customPresetId = `custom_${Date.now()}`
    
    exportEffect.presets = {
      ...exportEffect.presets,
      [customPresetId]: {
        name: {
          ru: presetName,
          en: presetName
        },
        params: customParams,
        description: {
          ru: "Пользовательская настройка",
          en: "Custom configuration"
        }
      }
    }
  }
  
  return exportEffect
}

/**
 * Получает список всех пользовательских эффектов
 * @returns Список путей к файлам пользовательских эффектов
 */
export async function getUserEffectsList(): Promise<string[]> {
  try {
    const files = await invoke<string[]>("get_user_effects_list")
    return files
  } catch (error) {
    console.error("Error getting user effects list:", error)
    return []
  }
}

/**
 * Удаляет пользовательский эффект
 * @param filePath Путь к файлу для удаления
 */
export async function deleteUserEffect(filePath: string): Promise<void> {
  try {
    await invoke("delete_user_effect", { filePath })
  } catch (error) {
    console.error("Error deleting user effect:", error)
    throw error
  }
}