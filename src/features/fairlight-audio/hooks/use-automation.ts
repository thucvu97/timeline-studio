import { useCallback, useEffect, useRef } from "react"

import { useAudioEngine } from "./use-audio-engine"
import { AutomationEngine, AutomationMode } from "../services/automation-engine"

export function useAutomation() {
  const { engine: audioEngine } = useAudioEngine()
  const automationEngineRef = useRef<AutomationEngine | null>(null)

  // Инициализируем automation engine
  useEffect(() => {
    if (!automationEngineRef.current) {
      automationEngineRef.current = new AutomationEngine()
    }
  }, [])

  // Регистрируем callback'и для параметров
  const registerParameter = useCallback((channelId: string, parameterId: string, callback: (value: number) => void) => {
    const automation = automationEngineRef.current
    if (!automation) return

    const laneId = `${channelId}.${parameterId}`
    automation.registerParameterCallback(laneId, callback)
  }, [])

  // Автоматическая регистрация основных параметров микшера
  useEffect(() => {
    const automation = automationEngineRef.current
    if (!automation || !audioEngine) return

    // Регистрируем volume для всех каналов
    const channels = audioEngine.getChannels()
    channels.forEach((_channel, channelId) => {
      // Volume
      registerParameter(channelId, "volume", (value) => {
        audioEngine.updateChannelVolume(channelId, value)
      })

      // Pan
      registerParameter(channelId, "pan", (value) => {
        audioEngine.updateChannelPan(channelId, (value - 0.5) * 2) // -1 to 1
      })

      // Mute
      registerParameter(channelId, "mute", (value) => {
        audioEngine.muteChannel(channelId, value > 0.5)
      })

      // Solo
      registerParameter(channelId, "solo", (value) => {
        audioEngine.soloChannel(channelId, value > 0.5)
      })
    })
  }, [audioEngine, registerParameter])

  // Запись параметра
  const writeParameter = useCallback((channelId: string, parameterId: string, value: number) => {
    const automation = automationEngineRef.current
    if (!automation) return

    const laneId = `${channelId}.${parameterId}`
    automation.writeParameter(laneId, value)
  }, [])

  // Touch/Release для touch и latch режимов
  const touchParameter = useCallback((channelId: string, parameterId: string) => {
    const automation = automationEngineRef.current
    if (!automation) return

    const laneId = `${channelId}.${parameterId}`
    automation.touchParameter(laneId)
  }, [])

  const releaseParameter = useCallback((channelId: string, parameterId: string) => {
    const automation = automationEngineRef.current
    if (!automation) return

    const laneId = `${channelId}.${parameterId}`
    automation.releaseParameter(laneId)
  }, [])

  // Управление режимом
  const setMode = useCallback((mode: AutomationMode) => {
    const automation = automationEngineRef.current
    if (!automation) return

    automation.setMode(mode)
  }, [])

  const startRecording = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation) return

    automation.startRecording()
  }, [])

  const stopRecording = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation) return

    automation.stopRecording()
  }, [])

  // Обновление времени
  const updateTime = useCallback((time: number) => {
    const automation = automationEngineRef.current
    if (!automation) return

    automation.updateTime(time)
  }, [])

  // Создание линии автоматизации
  const createLane = useCallback((channelId: string, parameterId: string, initialValue = 0.5) => {
    const automation = automationEngineRef.current
    if (!automation) return

    return automation.createLane(channelId, parameterId, initialValue)
  }, [])

  // Получение состояния
  const getState = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation) return null

    return automation.getState()
  }, [])

  // Экспорт/импорт
  const exportAutomation = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation) return null

    return automation.exportAutomation()
  }, [])

  const importAutomation = useCallback((data: any) => {
    const automation = automationEngineRef.current
    if (!automation) return

    automation.importAutomation(data)
  }, [])

  return {
    automationEngine: automationEngineRef.current,
    registerParameter,
    writeParameter,
    touchParameter,
    releaseParameter,
    setMode,
    startRecording,
    stopRecording,
    updateTime,
    createLane,
    getState,
    exportAutomation,
    importAutomation,
  }
}
