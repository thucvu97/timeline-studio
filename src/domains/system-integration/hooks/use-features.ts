/**
 * Hook для работы с feature flags
 */

import { useCallback, useEffect, useState } from "react"
import { getSystemIntegrationOrchestrator } from "../services/system-integration-orchestrator"

export function useFeatures() {
  const [orchestrator] = useState(() => getSystemIntegrationOrchestrator())
  const [features, setFeatures] = useState<Record<string, boolean>>({})

  // Обновление списка фич
  const updateFeatures = useCallback(() => {
    // Получаем список всех известных фич
    const knownFeatures = [
      "aiAnalysis",
      "smartMontage",
      "visionService",
      "multiCamera",
      "cloudSync",
      "collaboration",
      "advancedColorGrading",
      "aiVoiceGeneration",
      "motionTracking",
      "3dEffects",
      "neuralFilters",
      "remoteControl",
    ]

    const currentFeatures: Record<string, boolean> = {}
    knownFeatures.forEach((feature) => {
      currentFeatures[feature] = orchestrator.isFeatureEnabled(feature)
    })

    setFeatures(currentFeatures)
  }, [orchestrator])

  // Инициализация и периодическое обновление
  useEffect(() => {
    updateFeatures()

    // Обновляем при изменениях (можно заменить на подписку если добавим events)
    const interval = setInterval(updateFeatures, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [updateFeatures])

  // Переключение фичи
  const toggleFeature = useCallback(
    (feature: string, enabled?: boolean) => {
      const newState = enabled ?? !orchestrator.isFeatureEnabled(feature)
      orchestrator.toggleFeature(feature, newState)
      updateFeatures()
    },
    [orchestrator, updateFeatures],
  )

  // Проверка доступности фичи
  const isFeatureEnabled = useCallback(
    (feature: string): boolean => {
      return orchestrator.isFeatureEnabled(feature)
    },
    [orchestrator],
  )

  // Включение фичи
  const enableFeature = useCallback(
    (feature: string) => {
      toggleFeature(feature, true)
    },
    [toggleFeature],
  )

  // Отключение фичи
  const disableFeature = useCallback(
    (feature: string) => {
      toggleFeature(feature, false)
    },
    [toggleFeature],
  )

  // Включение/отключение группы фич
  const _setFeatures = useCallback(
    (featureMap: Record<string, boolean>) => {
      Object.entries(featureMap).forEach(([feature, enabled]) => {
        orchestrator.toggleFeature(feature, enabled)
      })
      updateFeatures()
    },
    [orchestrator, updateFeatures],
  )

  return {
    // Состояние
    features,

    // Методы
    toggleFeature,
    isFeatureEnabled,
    enableFeature,
    disableFeature,
    setFeatures: _setFeatures,

    // Удобные геттеры для популярных фич
    aiAnalysisEnabled: features.aiAnalysis ?? false,
    smartMontageEnabled: features.smartMontage ?? false,
    visionServiceEnabled: features.visionService ?? false,
    multiCameraEnabled: features.multiCamera ?? false,
    cloudSyncEnabled: features.cloudSync ?? false,
    collaborationEnabled: features.collaboration ?? false,
    advancedColorGradingEnabled: features.advancedColorGrading ?? false,
  }
}
