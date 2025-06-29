/**
 * MIDI Sequencer Service
 * Обрабатывает запись и воспроизведение MIDI последовательностей
 */

import { EventEmitter } from "events"

import { MidiClock } from "./midi-clock"
import { MidiMessage } from "./midi-engine"

export interface MidiEvent {
  id: string
  timestamp: number // Время в битах
  message: MidiMessage
  channel: number
  velocity?: number
  duration?: number // Для нот - длительность в битах
}

export interface MidiTrack {
  id: string
  name: string
  channel: number
  events: MidiEvent[]
  muted: boolean
  solo: boolean
  outputDevice?: string
}

export interface SequencerState {
  isRecording: boolean
  isPlaying: boolean
  tracks: Map<string, MidiTrack>
  currentPosition: number
  loopStart: number
  loopEnd: number
  loopEnabled: boolean
  recordingTrackId?: string
}

export class MidiSequencer extends EventEmitter {
  private state: SequencerState = {
    isRecording: false,
    isPlaying: false,
    tracks: new Map(),
    currentPosition: 0,
    loopStart: 0,
    loopEnd: 16, // 16 битов по умолчанию
    loopEnabled: false,
  }

  private clock: MidiClock
  private playbackEvents = new Map<string, NodeJS.Timeout>()
  private recordBuffer: MidiEvent[] = []
  private nextEventId = 0

  constructor(clock: MidiClock) {
    super()
    this.clock = clock
    this.setupClockHandlers()
  }

  private setupClockHandlers(): void {
    // Синхронизация с MIDI clock
    this.clock.on("tick", (position: number) => {
      this.state.currentPosition = position

      if (this.state.isPlaying) {
        this.processPlayback(position)
      }

      // Обработка луп
      if (this.state.loopEnabled && position >= this.state.loopEnd) {
        this.setPosition(this.state.loopStart)
      }
    })

    this.clock.on("start", () => {
      if (this.state.isPlaying) {
        this.startPlayback()
      }
    })

    this.clock.on("stop", () => {
      this.stopPlayback()
      this.stopRecording()
    })
  }

  // Управление треками
  createTrack(name: string, channel = 1): string {
    const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const track: MidiTrack = {
      id,
      name,
      channel,
      events: [],
      muted: false,
      solo: false,
    }

    this.state.tracks.set(id, track)
    this.emit("trackCreated", track)

    return id
  }

  deleteTrack(trackId: string): void {
    if (this.state.tracks.delete(trackId)) {
      this.emit("trackDeleted", trackId)
    }
  }

  updateTrack(trackId: string, updates: Partial<MidiTrack>): void {
    const track = this.state.tracks.get(trackId)
    if (track) {
      Object.assign(track, updates)
      this.emit("trackUpdated", track)
    }
  }

  // Запись
  startRecording(trackId: string, countIn = 0): void {
    if (this.state.isRecording) {
      this.stopRecording()
    }

    const track = this.state.tracks.get(trackId)
    if (!track) {
      throw new Error(`Track ${trackId} not found`)
    }

    this.state.isRecording = true
    this.state.recordingTrackId = trackId
    this.recordBuffer = []

    // Count-in (предварительный отсчет)
    if (countIn > 0) {
      const startPosition = Math.max(0, this.state.currentPosition - countIn)
      this.setPosition(startPosition)

      setTimeout(() => {
        this.clock.start()
      }, 100)
    }

    this.emit("recordingStarted", trackId)
  }

  stopRecording(): void {
    if (!this.state.isRecording || !this.state.recordingTrackId) return

    const track = this.state.tracks.get(this.state.recordingTrackId)
    if (track) {
      // Добавляем записанные события в трек
      track.events.push(...this.recordBuffer)

      // Сортируем события по времени
      track.events.sort((a, b) => a.timestamp - b.timestamp)

      this.emit("trackUpdated", track)
    }

    this.state.isRecording = false
    this.state.recordingTrackId = undefined
    this.recordBuffer = []

    this.emit("recordingStopped")
  }

  recordMidiMessage(message: MidiMessage): void {
    if (!this.state.isRecording || !this.state.recordingTrackId) return

    const track = this.state.tracks.get(this.state.recordingTrackId)
    if (!track) return

    const event: MidiEvent = {
      id: `event_${this.nextEventId++}`,
      timestamp: this.state.currentPosition,
      message: { ...message },
      channel: track.channel,
    }

    // Для нот сохраняем velocity
    if (message.type === "noteon" || message.type === "noteoff") {
      event.velocity = message.data.velocity
    }

    // Добавляем в буфер записи
    this.recordBuffer.push(event)

    // Обработка note on/off для расчета длительности
    if (message.type === "noteon" && message.data.velocity && message.data.velocity > 0) {
      // Сохраняем для последующего сопоставления с note off
      this.emit("noteRecorded", event)
    }

    this.emit("eventRecorded", event)
  }

  // Воспроизведение
  startPlayback(): void {
    if (this.state.isPlaying) return

    this.state.isPlaying = true
    this.emit("playbackStarted")

    // Запускаем clock если он не запущен
    if (!this.clock.isRunning()) {
      this.clock.start()
    }
  }

  stopPlayback(): void {
    if (!this.state.isPlaying) return

    this.state.isPlaying = false

    // Очищаем все запланированные события
    for (const timeout of this.playbackEvents.values()) {
      clearTimeout(timeout)
    }
    this.playbackEvents.clear()

    this.emit("playbackStopped")
  }

  private processPlayback(position: number): void {
    const lookAhead = 0.1 // Смотрим вперед на 0.1 бита

    for (const track of this.state.tracks.values()) {
      if (track.muted) continue

      // Проверяем solo режим
      const hasSolo = Array.from(this.state.tracks.values()).some((t) => t.solo)
      if (hasSolo && !track.solo) continue

      for (const event of track.events) {
        // Проигрываем события в диапазоне
        if (event.timestamp >= position && event.timestamp < position + lookAhead) {
          this.scheduleEvent(event, track)
        }
      }
    }
  }

  private scheduleEvent(event: MidiEvent, track: MidiTrack): void {
    const delay = this.clock.beatsToMs(event.timestamp - this.state.currentPosition)

    if (delay < 0) return // Событие в прошлом

    const timeoutId = setTimeout(() => {
      this.playEvent(event, track)
      this.playbackEvents.delete(event.id)
    }, delay)

    this.playbackEvents.set(event.id, timeoutId)
  }

  private playEvent(event: MidiEvent, track: MidiTrack): void {
    // Преобразуем в MIDI сообщение
    const midiData = this.eventToMidiData(event, track.channel)

    this.emit("midiOut", {
      deviceId: track.outputDevice,
      message: midiData,
      timestamp: performance.now(),
    })

    this.emit("eventPlayed", event)
  }

  private eventToMidiData(event: MidiEvent, channel: number): number[] {
    const channelByte = (channel - 1) & 0x0f

    switch (event.message.type) {
      case "noteon":
        return [0x90 | channelByte, event.message.data.note || 60, event.message.data.velocity || 64]

      case "noteoff":
        return [0x80 | channelByte, event.message.data.note || 60, event.message.data.velocity || 0]

      case "cc":
        return [0xb0 | channelByte, event.message.data.controller || 0, event.message.data.value || 0]

      case "pitchbend": {
        const value = event.message.data.value || 8192
        return [0xe0 | channelByte, value & 0x7f, (value >> 7) & 0x7f]
      }

      case "programchange":
        return [0xc0 | channelByte, event.message.data.program || 0]

      case "aftertouch":
        return [0xd0 | channelByte, event.message.data.value || 0]

      default:
        return []
    }
  }

  // Позиционирование
  setPosition(position: number): void {
    this.state.currentPosition = position
    this.clock.setPosition(position)

    // Очищаем запланированные события
    for (const timeout of this.playbackEvents.values()) {
      clearTimeout(timeout)
    }
    this.playbackEvents.clear()

    this.emit("positionChanged", position)
  }

  // Луп
  setLoop(start: number, end: number, enabled: boolean): void {
    this.state.loopStart = Math.max(0, start)
    this.state.loopEnd = Math.max(start + 0.25, end) // Минимум четверть бита
    this.state.loopEnabled = enabled

    this.emit("loopChanged", {
      start: this.state.loopStart,
      end: this.state.loopEnd,
      enabled: this.state.loopEnabled,
    })
  }

  // Квантизация
  quantizeTrack(trackId: string, quantizeValue: number): void {
    const track = this.state.tracks.get(trackId)
    if (!track) return

    const quantized = track.events.map((event) => ({
      ...event,
      timestamp: Math.round(event.timestamp / quantizeValue) * quantizeValue,
    }))

    track.events = quantized
    this.emit("trackUpdated", track)
  }

  // Редактирование событий
  addEvent(trackId: string, event: Omit<MidiEvent, "id">): string {
    const track = this.state.tracks.get(trackId)
    if (!track) throw new Error(`Track ${trackId} not found`)

    const newEvent: MidiEvent = {
      ...event,
      id: `event_${this.nextEventId++}`,
    }

    track.events.push(newEvent)
    track.events.sort((a, b) => a.timestamp - b.timestamp)

    this.emit("eventAdded", { trackId, event: newEvent })
    return newEvent.id
  }

  updateEvent(trackId: string, eventId: string, updates: Partial<MidiEvent>): void {
    const track = this.state.tracks.get(trackId)
    if (!track) return

    const eventIndex = track.events.findIndex((e) => e.id === eventId)
    if (eventIndex === -1) return

    Object.assign(track.events[eventIndex], updates)
    track.events.sort((a, b) => a.timestamp - b.timestamp)

    this.emit("eventUpdated", { trackId, event: track.events[eventIndex] })
  }

  deleteEvent(trackId: string, eventId: string): void {
    const track = this.state.tracks.get(trackId)
    if (!track) return

    const index = track.events.findIndex((e) => e.id === eventId)
    if (index !== -1) {
      const [deleted] = track.events.splice(index, 1)
      this.emit("eventDeleted", { trackId, eventId, event: deleted })
    }
  }

  // Получение данных
  getTracks(): MidiTrack[] {
    return Array.from(this.state.tracks.values())
  }

  getTrack(trackId: string): MidiTrack | undefined {
    return this.state.tracks.get(trackId)
  }

  getState(): SequencerState {
    return {
      ...this.state,
      tracks: new Map(this.state.tracks), // Копия
    }
  }

  // Очистка
  clear(): void {
    this.stopPlayback()
    this.stopRecording()
    this.state.tracks.clear()
    this.playbackEvents.clear()
    this.emit("cleared")
  }

  dispose(): void {
    this.clear()
    this.removeAllListeners()
  }
}
