import { useCallback, useEffect, useRef, useState } from "react"

import { useAudioEngine } from "./use-audio-engine"
import { AudioBus, BusRouter, ChannelGroup, ChannelSend } from "../services/bus-router"

export function useBusRouting() {
  const { engine: audioEngine } = useAudioEngine()
  const routerRef = useRef<BusRouter | null>(null)
  const [buses, setBuses] = useState<AudioBus[]>([])
  const [groups, setGroups] = useState<ChannelGroup[]>([])
  const [sends, setSends] = useState<ChannelSend[]>([])
  const [channelAssignments, setChannelAssignments] = useState<Map<string, string>>(new Map())

  // Инициализация роутера
  useEffect(() => {
    if (audioEngine?.audioContext && !routerRef.current) {
      routerRef.current = new BusRouter(audioEngine.audioContext)

      // Подписываемся на изменения роутинга
      const callbackId = routerRef.current.onRoutingChange(() => {
        updateRoutingState()
      })

      updateRoutingState()

      return () => {
        if (routerRef.current) {
          routerRef.current.removeRoutingCallback(callbackId)
        }
      }
    }
  }, [audioEngine])

  // Обновление состояния роутинга
  const updateRoutingState = useCallback(() => {
    if (!routerRef.current) return

    const matrix = routerRef.current.getRoutingMatrix()
    setBuses(Array.from(matrix.buses.values()))
    setGroups(Array.from(matrix.groups.values()))
    setSends(Array.from(matrix.sends.values()))
    setChannelAssignments(new Map(matrix.channelBusAssignments))
  }, [])

  // Создание шины
  const createBus = useCallback(
    (name: string, type: AudioBus["type"]) => {
      if (!routerRef.current) return

      const id = `bus_${Date.now()}`
      routerRef.current.createBus(id, name, type)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Создание группы
  const createGroup = useCallback(
    (name: string, channelIds: string[], color: string) => {
      if (!routerRef.current) return

      const id = `group_${Date.now()}`
      routerRef.current.createGroup(id, name, channelIds, color)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Создание send
  const createSend = useCallback(
    (sourceChannelId: string, destinationBusId: string, level: number, isPre = false) => {
      if (!routerRef.current) return

      const id = `send_${sourceChannelId}_${destinationBusId}_${Date.now()}`
      routerRef.current.createSend(id, sourceChannelId, destinationBusId, level, isPre)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Назначение канала на шину
  const assignChannelToBus = useCallback(
    (channelId: string, busId: string) => {
      if (!routerRef.current) return

      routerRef.current.assignChannelToBus(channelId, busId)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Обновление уровня send
  const updateSendLevel = useCallback(
    (sendId: string, level: number) => {
      if (!routerRef.current) return

      routerRef.current.updateSendLevel(sendId, level)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Управление шинами
  const setBusMute = useCallback(
    (busId: string, muted: boolean) => {
      if (!routerRef.current) return

      routerRef.current.setBusMute(busId, muted)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const setBusSolo = useCallback(
    (busId: string, solo: boolean) => {
      if (!routerRef.current) return

      routerRef.current.setBusSolo(busId, solo)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Управление группами
  const setGroupMute = useCallback(
    (groupId: string, muted: boolean) => {
      if (!routerRef.current) return

      routerRef.current.setGroupMute(groupId, muted)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const setGroupSolo = useCallback(
    (groupId: string, solo: boolean) => {
      if (!routerRef.current) return

      routerRef.current.setGroupSolo(groupId, solo)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const setGroupGain = useCallback(
    (groupId: string, gain: number) => {
      if (!routerRef.current) return

      routerRef.current.setGroupGain(groupId, gain)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Добавление/удаление каналов в/из группы
  const addChannelToGroup = useCallback(
    (groupId: string, channelId: string) => {
      if (!routerRef.current) return

      routerRef.current.addChannelToGroup(groupId, channelId)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const removeChannelFromGroup = useCallback(
    (groupId: string, channelId: string) => {
      if (!routerRef.current) return

      routerRef.current.removeChannelFromGroup(groupId, channelId)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  // Удаление
  const deleteBus = useCallback(
    (busId: string) => {
      if (!routerRef.current) return

      routerRef.current.deleteBus(busId)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const deleteGroup = useCallback(
    (groupId: string) => {
      if (!routerRef.current) return

      routerRef.current.deleteGroup(groupId)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  const deleteSend = useCallback(
    (sendId: string) => {
      if (!routerRef.current) return

      const send = sends.find((s) => s.id === sendId)
      if (send) {
        // Удаляем send из матрицы
        const matrix = routerRef.current.getRoutingMatrix()
        matrix.sends.delete(sendId)
        updateRoutingState()
      }
    },
    [sends, updateRoutingState],
  )

  // Управление sends
  const toggleSendEnabled = useCallback(
    (sendId: string, enabled: boolean) => {
      if (!routerRef.current) return

      const matrix = routerRef.current.getRoutingMatrix()
      const send = matrix.sends.get(sendId)
      if (send) {
        send.isEnabled = enabled
        updateRoutingState()
      }
    },
    [updateRoutingState],
  )

  const toggleSendPre = useCallback(
    (sendId: string, isPre: boolean) => {
      if (!routerRef.current) return

      const matrix = routerRef.current.getRoutingMatrix()
      const send = matrix.sends.get(sendId)
      if (send) {
        send.isPre = isPre
        updateRoutingState()
      }
    },
    [updateRoutingState],
  )

  // Получение sends для канала
  const getChannelSends = useCallback(
    (channelId: string): ChannelSend[] => {
      return sends.filter((send) => send.sourceChannelId === channelId)
    },
    [sends],
  )

  // Получение назначенной шины для канала
  const getChannelBus = useCallback(
    (channelId: string): AudioBus | null => {
      const busId = channelAssignments.get(channelId)
      return busId ? buses.find((bus) => bus.id === busId) || null : null
    },
    [buses, channelAssignments],
  )

  // Подключение канала к роутингу
  const connectChannel = useCallback((channelId: string, sourceNode: AudioNode): GainNode | null => {
    if (!routerRef.current) return null

    return routerRef.current.connectChannel(channelId, sourceNode)
  }, [])

  // Экспорт/импорт конфигурации
  const exportConfiguration = useCallback(() => {
    if (!routerRef.current) return null

    return routerRef.current.exportConfiguration()
  }, [])

  const importConfiguration = useCallback(
    (config: any) => {
      if (!routerRef.current) return

      routerRef.current.importConfiguration(config)
      updateRoutingState()
    },
    [updateRoutingState],
  )

  return {
    router: routerRef.current,
    buses,
    groups,
    sends,
    channelAssignments,

    // CRUD операции
    createBus,
    createGroup,
    createSend,
    deleteBus,
    deleteGroup,
    deleteSend,

    // Назначения и роутинг
    assignChannelToBus,
    connectChannel,

    // Управление уровнями
    updateSendLevel,
    setGroupGain,

    // Mute/Solo
    setBusMute,
    setBusSolo,
    setGroupMute,
    setGroupSolo,

    // Управление группами
    addChannelToGroup,
    removeChannelFromGroup,

    // Управление sends
    toggleSendEnabled,
    toggleSendPre,

    // Запросы данных
    getChannelSends,
    getChannelBus,

    // Конфигурация
    exportConfiguration,
    importConfiguration,
  }
}
