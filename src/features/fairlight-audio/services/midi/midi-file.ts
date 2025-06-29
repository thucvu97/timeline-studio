/**
 * MIDI File Service
 * Обрабатывает импорт и экспорт MIDI файлов (формат SMF)
 */

import type { MidiMessage } from "./midi-engine"
import type { MidiEvent, MidiTrack } from "./midi-sequencer"

export interface MidiFileHeader {
  format: 0 | 1 | 2 // Type 0, 1, or 2
  trackCount: number
  ticksPerQuarterNote: number
}

export interface MidiFileTrack {
  name?: string
  events: MidiFileEvent[]
}

export interface MidiFileEvent {
  deltaTime: number // Дельта время от предыдущего события
  absoluteTime: number // Абсолютное время в тиках
  type: string
  data: Uint8Array
}

export class MidiFile {
  private header: MidiFileHeader = {
    format: 1,
    trackCount: 0,
    ticksPerQuarterNote: 480, // Стандартное разрешение
  }

  private tracks: MidiFileTrack[] = []

  // Парсинг MIDI файла
  async parse(buffer: ArrayBuffer): Promise<void> {
    const view = new DataView(buffer)
    let offset = 0

    // Читаем заголовок
    const headerChunk = this.readChunk(view, offset)
    if (headerChunk.type !== "MThd") {
      throw new Error("Invalid MIDI file: missing header")
    }
    offset += 8 + headerChunk.length

    this.parseHeader(headerChunk.data)

    // Читаем треки
    this.tracks = []
    for (let i = 0; i < this.header.trackCount; i++) {
      if (offset >= view.byteLength) break

      const trackChunk = this.readChunk(view, offset)
      if (trackChunk.type !== "MTrk") {
        throw new Error(`Invalid track chunk at position ${offset}`)
      }
      offset += 8 + trackChunk.length

      const track = this.parseTrack(trackChunk.data)
      this.tracks.push(track)
    }
  }

  private readChunk(view: DataView, offset: number): { type: string; length: number; data: DataView } {
    const type = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    )
    const length = view.getUint32(offset + 4, false) // Big-endian
    const data = new DataView(view.buffer, offset + 8, length)

    return { type, length, data }
  }

  private parseHeader(data: DataView): void {
    this.header.format = data.getUint16(0, false) as 0 | 1 | 2
    this.header.trackCount = data.getUint16(2, false)
    this.header.ticksPerQuarterNote = data.getUint16(4, false)
  }

  private parseTrack(data: DataView): MidiFileTrack {
    const track: MidiFileTrack = {
      events: [],
    }

    let offset = 0
    let absoluteTime = 0
    let runningStatus: number | null = null

    while (offset < data.byteLength) {
      // Читаем дельта время
      const deltaTimeResult = this.readVariableLength(data, offset)
      offset += deltaTimeResult.bytesRead
      absoluteTime += deltaTimeResult.value

      // Читаем статус байт
      let statusByte = data.getUint8(offset)
      let dataOffset = offset + 1

      // Running status
      if (statusByte < 0x80) {
        if (runningStatus === null) {
          throw new Error("Invalid MIDI data: no running status")
        }
        statusByte = runningStatus
        dataOffset = offset
      } else {
        runningStatus = statusByte
      }

      // Определяем тип события и размер данных
      let eventData: Uint8Array
      let eventType: string

      if (statusByte === 0xff) {
        // Meta событие
        const metaType = data.getUint8(dataOffset)
        dataOffset++
        const lengthResult = this.readVariableLength(data, dataOffset)
        dataOffset += lengthResult.bytesRead

        eventData = new Uint8Array(data.buffer, data.byteOffset + dataOffset, lengthResult.value)
        dataOffset += lengthResult.value

        eventType = `meta_${metaType.toString(16).padStart(2, "0")}`

        // Обработка имени трека
        if (metaType === 0x03 && !track.name) {
          track.name = new TextDecoder().decode(eventData)
        }
      } else if (statusByte === 0xf0 || statusByte === 0xf7) {
        // SysEx событие
        const lengthResult = this.readVariableLength(data, dataOffset)
        dataOffset += lengthResult.bytesRead

        eventData = new Uint8Array(data.buffer, data.byteOffset + dataOffset, lengthResult.value)
        dataOffset += lengthResult.value

        eventType = "sysex"
      } else {
        // Обычное MIDI событие
        const eventSize = this.getEventDataSize(statusByte)
        eventData = new Uint8Array(data.buffer, data.byteOffset + dataOffset, eventSize)
        dataOffset += eventSize

        eventType = this.getEventTypeName(statusByte)
      }

      track.events.push({
        deltaTime: deltaTimeResult.value,
        absoluteTime,
        type: eventType,
        data: eventData,
      })

      offset = dataOffset
    }

    return track
  }

  private readVariableLength(data: DataView, offset: number): { value: number; bytesRead: number } {
    let value = 0
    let bytesRead = 0

    while (offset + bytesRead < data.byteLength) {
      const byte = data.getUint8(offset + bytesRead)
      value = (value << 7) | (byte & 0x7f)
      bytesRead++

      if ((byte & 0x80) === 0) break
    }

    return { value, bytesRead }
  }

  private getEventDataSize(statusByte: number): number {
    const status = statusByte & 0xf0

    switch (status) {
      case 0x80: // Note Off
      case 0x90: // Note On
      case 0xa0: // Aftertouch
      case 0xb0: // Control Change
      case 0xe0: // Pitch Bend
        return 2
      case 0xc0: // Program Change
      case 0xd0: // Channel Pressure
        return 1
      default:
        return 0
    }
  }

  private getEventTypeName(statusByte: number): string {
    const status = statusByte & 0xf0

    switch (status) {
      case 0x80:
        return "noteoff"
      case 0x90:
        return "noteon"
      case 0xa0:
        return "aftertouch"
      case 0xb0:
        return "cc"
      case 0xc0:
        return "programchange"
      case 0xd0:
        return "channelpressure"
      case 0xe0:
        return "pitchbend"
      default:
        return "unknown"
    }
  }

  // Конвертация в формат Timeline Studio
  toSequencerTracks(): MidiTrack[] {
    const sequencerTracks: MidiTrack[] = []
    const ticksPerBeat = this.header.ticksPerQuarterNote

    for (let i = 0; i < this.tracks.length; i++) {
      const midiTrack = this.tracks[i]
      const trackId = `imported_${Date.now()}_${i}`

      const sequencerTrack: MidiTrack = {
        id: trackId,
        name: midiTrack.name || `Track ${i + 1}`,
        channel: 1, // Будет определен из событий
        events: [],
        muted: false,
        solo: false,
      }

      // Конвертируем события
      for (const fileEvent of midiTrack.events) {
        if (fileEvent.type.startsWith("meta_")) continue // Пропускаем мета-события
        if (fileEvent.type === "sysex") continue // Пропускаем SysEx

        const midiEvent = this.convertFileEvent(fileEvent, ticksPerBeat)
        if (midiEvent) {
          sequencerTrack.events.push(midiEvent)

          // Определяем канал из первого события
          if (sequencerTrack.channel === 1 && midiEvent.channel) {
            sequencerTrack.channel = midiEvent.channel
          }
        }
      }

      if (sequencerTrack.events.length > 0) {
        sequencerTracks.push(sequencerTrack)
      }
    }

    return sequencerTracks
  }

  private convertFileEvent(fileEvent: MidiFileEvent, ticksPerBeat: number): MidiEvent | null {
    const timestamp = fileEvent.absoluteTime / ticksPerBeat // Конвертируем в биты

    const message: MidiMessage = {
      type: fileEvent.type as MidiMessage["type"],
      channel: 1,
      timestamp: performance.now(),
      data: {},
    }

    // Извлекаем данные в зависимости от типа
    switch (fileEvent.type) {
      case "noteon":
      case "noteoff":
        message.data.note = fileEvent.data[0]
        message.data.velocity = fileEvent.data[1]
        break
      case "cc":
        message.data.controller = fileEvent.data[0]
        message.data.value = fileEvent.data[1]
        break
      case "pitchbend":
        message.data.value = fileEvent.data[0] | (fileEvent.data[1] << 7)
        break
      case "programchange":
        message.data.program = fileEvent.data[0]
        break
      case "channelpressure":
      case "aftertouch":
        message.data.value = fileEvent.data[0]
        break
      default:
        return null
    }

    return {
      id: `event_${Math.random().toString(36).substring(2, 9)}`,
      timestamp,
      message,
      channel: ((fileEvent.data[0] ?? 0) & 0x0f) + 1,
      velocity: message.data.velocity,
    }
  }

  // Создание MIDI файла из треков
  static fromSequencerTracks(tracks: MidiTrack[], ticksPerQuarterNote = 480): ArrayBuffer {
    const file = new MidiFile()
    file.header = {
      format: 1,
      trackCount: tracks.length,
      ticksPerQuarterNote,
    }

    // Конвертируем треки
    file.tracks = tracks.map((track) => file.createFileTrack(track, ticksPerQuarterNote))

    // Генерируем бинарные данные
    return file.generate()
  }

  private createFileTrack(track: MidiTrack, ticksPerQuarterNote: number): MidiFileTrack {
    const fileTrack: MidiFileTrack = {
      name: track.name,
      events: [],
    }

    // Добавляем имя трека
    if (track.name) {
      const nameBytes = new TextEncoder().encode(track.name)
      fileTrack.events.push({
        deltaTime: 0,
        absoluteTime: 0,
        type: "meta_03",
        data: nameBytes,
      })
    }

    // Конвертируем события
    let lastTime = 0
    for (const event of track.events) {
      const absoluteTime = Math.round(event.timestamp * ticksPerQuarterNote)
      const deltaTime = absoluteTime - lastTime
      lastTime = absoluteTime

      const data = this.createEventData(event)
      if (data) {
        fileTrack.events.push({
          deltaTime,
          absoluteTime,
          type: event.message.type,
          data,
        })
      }
    }

    // Добавляем End of Track
    fileTrack.events.push({
      deltaTime: 0,
      absoluteTime: lastTime,
      type: "meta_2f",
      data: new Uint8Array(0),
    })

    return fileTrack
  }

  private createEventData(event: MidiEvent): Uint8Array | null {
    const channel = (event.channel - 1) & 0x0f

    switch (event.message.type) {
      case "noteon":
        return new Uint8Array([0x90 | channel, event.message.data.note || 60, event.message.data.velocity || 64])
      case "noteoff":
        return new Uint8Array([0x80 | channel, event.message.data.note || 60, event.message.data.velocity || 0])
      case "cc":
        return new Uint8Array([0xb0 | channel, event.message.data.controller || 0, event.message.data.value || 0])
      case "pitchbend": {
        const value = event.message.data.value || 8192
        return new Uint8Array([0xe0 | channel, value & 0x7f, (value >> 7) & 0x7f])
      }
      case "programchange":
        return new Uint8Array([0xc0 | channel, event.message.data.program || 0])
      case "aftertouch":
        return new Uint8Array([0xd0 | channel, event.message.data.value || 0])
      default:
        return null
    }
  }

  private generate(): ArrayBuffer {
    const chunks: Uint8Array[] = []

    // Генерируем заголовок
    chunks.push(this.generateHeader())

    // Генерируем треки
    for (const track of this.tracks) {
      chunks.push(this.generateTrack(track))
    }

    // Объединяем все чанки
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  }

  private generateHeader(): Uint8Array {
    const data = new ArrayBuffer(6)
    const view = new DataView(data)

    view.setUint16(0, this.header.format, false)
    view.setUint16(2, this.header.trackCount, false)
    view.setUint16(4, this.header.ticksPerQuarterNote, false)

    return this.createChunk("MThd", new Uint8Array(data))
  }

  private generateTrack(track: MidiFileTrack): Uint8Array {
    const events: Uint8Array[] = []

    for (const event of track.events) {
      const deltaTimeBytes = this.encodeVariableLength(event.deltaTime)

      if (event.type.startsWith("meta_")) {
        // Meta событие
        const metaType = Number.parseInt(event.type.substring(5), 16)
        const lengthBytes = this.encodeVariableLength(event.data.length)

        const eventBytes = new Uint8Array(1 + 1 + lengthBytes.length + event.data.length)
        eventBytes[0] = 0xff
        eventBytes[1] = metaType
        eventBytes.set(lengthBytes, 2)
        eventBytes.set(event.data, 2 + lengthBytes.length)

        events.push(deltaTimeBytes, eventBytes)
      } else {
        // Обычное MIDI событие
        events.push(deltaTimeBytes, event.data)
      }
    }

    // Объединяем все события
    const totalLength = events.reduce((sum, event) => sum + event.length, 0)
    const trackData = new Uint8Array(totalLength)
    let offset = 0

    for (const event of events) {
      trackData.set(event, offset)
      offset += event.length
    }

    return this.createChunk("MTrk", trackData)
  }

  private createChunk(type: string, data: Uint8Array): Uint8Array {
    const chunk = new Uint8Array(8 + data.length)

    // Тип чанка (4 байта)
    for (let i = 0; i < 4; i++) {
      chunk[i] = type.charCodeAt(i)
    }

    // Размер данных (4 байта, big-endian)
    const view = new DataView(chunk.buffer)
    view.setUint32(4, data.length, false)

    // Данные
    chunk.set(data, 8)

    return chunk
  }

  private encodeVariableLength(value: number): Uint8Array {
    const bytes: number[] = []

    do {
      let byte = value & 0x7f
      value >>= 7

      if (bytes.length > 0) {
        byte |= 0x80
      }

      bytes.unshift(byte)
    } while (value > 0)

    return new Uint8Array(bytes)
  }
}
