/**
 * Video Editing Orchestrator Service
 *
 * Координирует взаимодействие между timeline и player машинами
 * для обеспечения целостного опыта редактирования видео
 */

import {
  DOMAIN_EVENTS,
  type EffectAppliedEvent,
  eventBus,
  type PlaybackStartedEvent,
  type PlaybackStoppedEvent,
} from "@domains/shared/events"
import { type ActorRefFrom, createActor } from "xstate"
import type { MediaFile } from "@/features/media/types/media"
import { type PlayerMachine, playerMachine } from "../machines/player-machine"
import { type TimelineMachine, timelineMachine } from "../machines/timeline-machine"

export class VideoEditingOrchestrator {
  private timelineActor: ActorRefFrom<TimelineMachine>
  private playerActor: ActorRefFrom<PlayerMachine>

  constructor() {
    console.log("[Video Editing Orchestrator] Initializing...")

    // Создаем акторы для машин
    this.timelineActor = createActor(timelineMachine)
    this.playerActor = createActor(playerMachine)

    // Запускаем акторы
    this.timelineActor.start()
    this.playerActor.start()

    // Настраиваем синхронизацию между машинами
    this.setupSynchronization()

    // Настраиваем публикацию событий
    this.setupEventPublishing()

    // Настраиваем обработку входящих событий
    this.setupEventHandlers()

    console.log("[Video Editing Orchestrator] Initialized successfully")
  }

  /**
   * Настройка публикации событий
   */
  private setupEventPublishing() {
    // Публикуем события изменения состояния воспроизведения
    let wasPlaying = false
    this.playerActor.subscribe((state) => {
      const isPlaying = state.context.isPlaying
      const currentTime = state.context.currentTime

      // Публикуем событие начала воспроизведения
      if (isPlaying && !wasPlaying) {
        eventBus.publish<PlaybackStartedEvent>(DOMAIN_EVENTS.VIDEO.PLAYBACK_STARTED, "video-editing", {
          timelineId: "current", // TODO: получить реальный ID timeline
          startTime: currentTime,
          playbackRate: state.context.currentPlaybackRate || 1,
        })
      }

      // Публикуем событие остановки воспроизведения
      if (!isPlaying && wasPlaying) {
        eventBus.publish<PlaybackStoppedEvent>(DOMAIN_EVENTS.VIDEO.PLAYBACK_STOPPED, "video-editing", {
          timelineId: "current",
          stopTime: currentTime,
          duration: state.context.duration,
        })
      }

      wasPlaying = isPlaying
    })
  }

  /**
   * Настройка обработки входящих событий
   */
  private setupEventHandlers() {
    // Слушаем события из AI Services
    eventBus.subscribe(
      async (event) => {
        switch (event.type) {
          case DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_APPLIED:
            // План монтажа применен, обновляем timeline
            console.log("[Video Orchestrator] Montage plan applied, clearing selection")
            this.timelineActor.send({ type: "CLEAR_SELECTION" })
            break

          case DOMAIN_EVENTS.AI_SERVICES.CHAT_TIMELINE_CREATED:
            // AI создал новый timeline
            const { timelineId } = event.payload as any
            console.log(`[Video Orchestrator] AI created timeline: ${timelineId}`)
            // TODO: загрузить новый timeline
            break
        }
      },
      {
        filter: {
          source: "ai-services",
        },
      },
    )

    // Слушаем события из Media Management
    eventBus.subscribe(
      async (event) => {
        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Новые файлы импортированы, можем предложить добавить их на timeline
            console.log("[Video Orchestrator] New files imported, ready for timeline")
            break
        }
      },
      {
        filter: {
          source: "media-management",
        },
      },
    )
  }

  /**
   * Настройка синхронизации между timeline и player
   */
  private setupSynchronization() {
    // Синхронизация времени воспроизведения
    this.playerActor.subscribe((state) => {
      const currentTime = state.context.currentTime
      const isPlaying = state.context.isPlaying

      // Синхронизируем состояние воспроизведения с timeline
      this.timelineActor.send({
        type: "SYNC_PLAYBACK_STATE",
        isPlaying,
        currentTime,
      })
    })

    // Синхронизация операций timeline с player
    this.timelineActor.subscribe((state) => {
      // Обрабатываем изменения в timeline
      if (state.context.currentTime !== this.playerActor.getSnapshot().context.currentTime) {
        this.playerActor.send({
          type: "SEEK",
          time: state.context.currentTime,
        })
      }
    })
  }

  /**
   * Загрузка видео для редактирования
   */
  async loadVideo(video: MediaFile) {
    console.log(`[Video Editing Orchestrator] Loading video: ${video.name}`)

    // Загружаем видео в player
    this.playerActor.send({
      type: "LOAD_VIDEO",
      video,
    })

    // Обновляем UI timeline
    this.timelineActor.send({
      type: "SYNC_CURRENT_TIME",
      currentTime: 0,
    })
  }

  /**
   * Управление воспроизведением
   */
  play() {
    this.playerActor.send({ type: "PLAY" })
  }

  pause() {
    this.playerActor.send({ type: "PAUSE" })
  }

  stop() {
    this.playerActor.send({ type: "STOP" })
  }

  seek(time: number) {
    this.playerActor.send({ type: "SEEK", time })
  }

  /**
   * Управление скоростью воспроизведения
   */
  setPlaybackRate(rate: number) {
    this.playerActor.send({ type: "SET_PLAYBACK_RATE", rate })
    this.timelineActor.send({ type: "SET_PLAYBACK_RATE", rate })
  }

  /**
   * Управление громкостью
   */
  setVolume(volume: number) {
    this.playerActor.send({ type: "SET_VOLUME", volume })
  }

  /**
   * Управление эффектами
   */
  applyEffect(effect: { id: string; name: string; params: any }) {
    console.log(`[Video Editing Orchestrator] Applying effect: ${effect.name}`)
    this.playerActor.send({ type: "APPLY_EFFECT", effect })

    // Публикуем событие применения эффекта
    eventBus.publish<EffectAppliedEvent>(DOMAIN_EVENTS.VIDEO.EFFECT_APPLIED, "video-editing", {
      targetId: "current-video", // TODO: получить реальный ID
      targetType: "clip",
      effectId: effect.id,
      effectType: effect.name,
      parameters: effect.params,
    })
  }

  removeEffect(effectId: string) {
    console.log(`[Video Editing Orchestrator] Removing effect: ${effectId}`)
    this.playerActor.send({ type: "REMOVE_EFFECT", effectId })
  }

  /**
   * Управление фильтрами
   */
  applyFilter(filter: { id: string; name: string; params: any }) {
    console.log(`[Video Editing Orchestrator] Applying filter: ${filter.name}`)
    this.playerActor.send({ type: "APPLY_FILTER", filter })
  }

  removeFilter(filterId: string) {
    console.log(`[Video Editing Orchestrator] Removing filter: ${filterId}`)
    this.playerActor.send({ type: "REMOVE_FILTER", filterId })
  }

  /**
   * Управление шаблонами
   */
  applyTemplate(template: { id: string; name: string; files: MediaFile[] }) {
    console.log(`[Video Editing Orchestrator] Applying template: ${template.name}`)
    this.playerActor.send({ type: "APPLY_TEMPLATE", template })
  }

  removeTemplate() {
    console.log("[Video Editing Orchestrator] Removing template")
    this.playerActor.send({ type: "REMOVE_TEMPLATE" })
  }

  /**
   * Управление timeline UI
   */
  setTimeScale(scale: number) {
    this.timelineActor.send({ type: "SET_TIME_SCALE", scale })
  }

  setEditMode(mode: "select" | "cut" | "trim" | "move") {
    this.timelineActor.send({ type: "SET_EDIT_MODE", mode })
  }

  setSnapMode(mode: "none" | "grid" | "clips" | "markers") {
    this.timelineActor.send({ type: "SET_SNAP_MODE", mode })
  }

  /**
   * Управление выделением
   */
  selectClip(clipId: string, multiple = false) {
    this.timelineActor.send({ type: "SELECT_CLIP", clipId, multiple })
  }

  selectTrack(trackId: string, multiple = false) {
    this.timelineActor.send({ type: "SELECT_TRACK", trackId, multiple })
  }

  selectSection(sectionId: string, multiple = false) {
    this.timelineActor.send({ type: "SELECT_SECTION", sectionId, multiple })
  }

  clearSelection() {
    this.timelineActor.send({ type: "CLEAR_SELECTION" })
  }

  /**
   * Управление записью
   */
  startRecording() {
    console.log("[Video Editing Orchestrator] Starting recording")
    this.playerActor.send({ type: "START_RECORDING" })
    this.timelineActor.send({ type: "TOGGLE_RECORDING" })
  }

  stopRecording() {
    console.log("[Video Editing Orchestrator] Stopping recording")
    this.playerActor.send({ type: "STOP_RECORDING" })
    this.timelineActor.send({ type: "TOGGLE_RECORDING" })
  }

  /**
   * Получение текущего состояния
   */
  getTimelineState() {
    return this.timelineActor.getSnapshot()
  }

  getPlayerState() {
    return this.playerActor.getSnapshot()
  }

  /**
   * Получение акторов (для прямых команд)
   */
  getTimelineActor() {
    return this.timelineActor
  }

  getPlayerActor() {
    return this.playerActor
  }

  /**
   * Подписка на изменения состояния
   */
  subscribeToTimeline(callback: (state: any) => void) {
    return this.timelineActor.subscribe(callback)
  }

  subscribeToPlayer(callback: (state: any) => void) {
    return this.playerActor.subscribe(callback)
  }

  /**
   * Очистка ресурсов
   */
  dispose() {
    console.log("[Video Editing Orchestrator] Disposing...")
    this.timelineActor.stop()
    this.playerActor.stop()
  }
}

// Singleton экземпляр
let orchestratorInstance: VideoEditingOrchestrator | null = null

/**
 * Получить экземпляр Video Editing Orchestrator
 */
export function getVideoEditingOrchestrator(): VideoEditingOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new VideoEditingOrchestrator()
  }
  return orchestratorInstance
}

/**
 * Сбросить экземпляр orchestrator (для тестов)
 */
export function resetVideoEditingOrchestrator() {
  if (orchestratorInstance) {
    orchestratorInstance.dispose()
    orchestratorInstance = null
  }
}
