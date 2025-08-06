/**
 * WebGL2 рендерер для preview модуля
 * Использует унифицированную WebGL2 библиотеку
 */

import type { Effect } from "@/features/effects/types"
import type { TimelineSegment } from "@/features/timeline/types"
import { BaseRenderer, type RendererOptions, type ShaderSource, shaderPool, vaoManager } from "@/lib/webgl"

// Re-export or map to local types if needed
type PreviewEffect = Effect

/**
 * Интерфейс для рендеринга превью
 */
export interface PreviewFrame {
  bitmap: ImageBitmap
  width: number
  height: number
  timestamp: number
}

/**
 * WebGL2 рендерер превью
 */
export class WebGL2PreviewRenderer extends BaseRenderer {
  private sourceTexture: WebGLTexture | null = null
  private videoElement: HTMLVideoElement | null = null
  private segments: TimelineSegment[] = []
  private currentTime = 0
  private quadVAO: WebGLVertexArrayObject | null = null

  constructor(options: RendererOptions) {
    super({
      ...options,
      name: options.name || "preview-renderer",
    })
  }

  /**
   * Инициализация специфичная для превью
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Компилируем базовые шейдеры
    await this.compileShaders()

    // Создаем VAO для полноэкранного квада
    const copyProgram = shaderPool.getProgram("copy")
    if (copyProgram) {
      this.quadVAO = vaoManager.createQuadVAO(copyProgram)
    }

    // Создаем фреймбуферы для эффектов
    this.createFramebuffer("effect_ping", 1920, 1080)
    this.createFramebuffer("effect_pong", 1920, 1080)
  }

  /**
   * Установить видео источник
   */
  public setVideoSource(video: HTMLVideoElement): void {
    this.videoElement = video

    if (this.gl && video.videoWidth && video.videoHeight) {
      // Пересоздаем текстуру источника
      if (this.sourceTexture) {
        this.gl.deleteTexture(this.sourceTexture)
      }

      this.sourceTexture = this.createVideoTexture(video)

      // Обновляем размеры фреймбуферов
      this.resize(video.videoWidth, video.videoHeight)
    }
  }

  /**
   * Установить сегменты таймлайна
   */
  public setSegments(segments: TimelineSegment[]): void {
    this.segments = segments
  }

  /**
   * Установить текущее время
   */
  public setCurrentTime(time: number): void {
    this.currentTime = time
  }

  /**
   * Рендеринг кадра
   */
  public render(_deltaTime: number): void {
    if (!this.gl || !this.videoElement || !this.sourceTexture) return

    // Обновляем текстуру видео
    this.updateVideoTexture(this.sourceTexture, this.videoElement)

    // Получаем активные эффекты для текущего времени
    const activeEffects = this.getActiveEffects()

    if (activeEffects.length === 0) {
      // Без эффектов - просто копируем исходное видео
      this.renderCopy()
    } else {
      // Применяем эффекты последовательно
      this.renderEffects(activeEffects)
    }
  }

  /**
   * Получить текущий кадр как ImageBitmap
   */
  public async captureFrame(): Promise<PreviewFrame | null> {
    if (!this.gl || !this.canvas) return null

    const width = this.canvas.width
    const height = this.canvas.height

    // Читаем пиксели из текущего фреймбуфера
    const pixels = new Uint8Array(width * height * 4)
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

    // Создаем ImageData
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)

    // Создаем bitmap
    const bitmap = await createImageBitmap(imageData)

    return {
      bitmap,
      width,
      height,
      timestamp: this.currentTime,
    }
  }

  /**
   * Компилировать необходимые шейдеры
   */
  private async compileShaders(): Promise<void> {
    // Базовые шейдеры уже есть в shaderPool
    // Добавляем специфичные для эффектов шейдеры

    // Шейдер для размытия по Гауссу
    const gaussianBlur: ShaderSource = {
      vertex: `#version 300 es
        in vec2 a_position;
        in vec2 a_texCoord;
        out vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }`,
      fragment: `#version 300 es
        precision highp float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform vec2 u_direction;
        uniform float u_radius;
        
        in vec2 v_texCoord;
        out vec4 fragColor;
        
        void main() {
          vec2 texelSize = 1.0 / u_resolution;
          vec2 blurVector = u_direction * texelSize * u_radius;
          
          vec4 color = vec4(0.0);
          float totalWeight = 0.0;
          
          // 13-tap Gaussian blur
          float weights[7] = float[](0.0652, 0.1295, 0.1944, 0.2270, 0.1944, 0.1295, 0.0652);
          
          for (int i = -6; i <= 6; i++) {
            vec2 offset = blurVector * float(i);
            int idx = abs(i);
            if (idx < 7) {
              color += texture(u_texture, v_texCoord + offset) * weights[idx];
              totalWeight += weights[idx];
            }
          }
          
          fragColor = color / totalWeight;
        }`,
    }

    shaderPool.getProgram("gaussianBlur", gaussianBlur)

    // Добавим другие эффекты по мере необходимости
  }

  /**
   * Создать текстуру из видео
   */
  private createVideoTexture(video: HTMLVideoElement): WebGLTexture | null {
    if (!this.gl) return null

    const texture = this.gl.createTexture()
    if (!texture) return null

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    // Настройки для видео текстуры
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    // Загружаем начальный кадр
    this.updateVideoTexture(texture, video)

    return texture
  }

  /**
   * Обновить текстуру видео
   */
  private updateVideoTexture(texture: WebGLTexture, video: HTMLVideoElement): void {
    if (!this.gl) return

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, video)
  }

  /**
   * Получить активные эффекты для текущего времени
   */
  private getActiveEffects(): Effect[] {
    const effects: Effect[] = []

    for (const segment of this.segments) {
      if (this.currentTime >= segment.startTime && this.currentTime < segment.endTime) {
        // Добавляем эффекты сегмента
        if (segment.effects) {
          effects.push(...segment.effects)
        }
      }
    }

    return effects
  }

  /**
   * Рендерить копию исходного видео
   */
  private renderCopy(): void {
    if (!this.gl || !this.sourceTexture || !this.quadVAO) return

    // Рендерим в основной фреймбуфер
    this.bindFramebuffer(null)

    // Используем программу копирования
    const program = this.useProgram("copy")
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.sourceTexture)
    this.setUniform("u_texture", 0)

    // Рисуем квад
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()
  }

  /**
   * Рендерить с эффектами
   */
  private renderEffects(effects: Effect[]): void {
    if (!this.gl || !this.sourceTexture || !this.quadVAO) return

    let sourceTexture = this.sourceTexture
    let targetFramebuffer = "effect_ping"

    // Применяем эффекты последовательно
    for (let i = 0; i < effects.length; i++) {
      const effect = effects[i]
      const isLast = i === effects.length - 1

      // Выбираем целевой фреймбуфер
      if (isLast) {
        this.bindFramebuffer(null) // Последний эффект рендерим на экран
      } else {
        this.bindFramebuffer(targetFramebuffer)
      }

      // Применяем эффект
      this.renderEffect(effect, sourceTexture)

      // Меняем местами буферы для следующего прохода
      if (!isLast) {
        const fb = this.framebuffers.get(targetFramebuffer)
        if (fb && fb.colorTextures[0]) {
          sourceTexture = fb.colorTextures[0].texture
        }
        targetFramebuffer = targetFramebuffer === "effect_ping" ? "effect_pong" : "effect_ping"
      }
    }
  }

  /**
   * Рендерить один эффект
   */
  private renderEffect(effect: Effect, sourceTexture: WebGLTexture): void {
    if (!this.gl || !this.quadVAO) return

    // Выбираем программу для эффекта
    let programName = "copy" // По умолчанию

    switch (effect.type) {
      case "blur":
        programName = "gaussianBlur"
        break
      case "colorCorrection":
        programName = "colorCorrection"
        break
      // Добавить другие типы эффектов
    }

    const program = this.useProgram(programName)
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем исходную текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, sourceTexture)
    this.setUniform("u_texture", 0)

    // Устанавливаем параметры эффекта
    if (effect.type === "blur" && effect.params) {
      this.setUniform("u_resolution", [this.viewport.width, this.viewport.height])
      this.setUniform("u_direction", [1, 0]) // Горизонтальное размытие
      this.setUniform("u_radius", effect.params.radius || 5)
    } else if (effect.type === "colorCorrection" && effect.params) {
      this.setUniform("u_brightness", effect.params.brightness || 0)
      this.setUniform("u_contrast", effect.params.contrast || 0)
      this.setUniform("u_saturation", effect.params.saturation || 0)
      this.setUniform("u_hue", effect.params.hue || 0)
      this.setUniform("u_colorBalance", effect.params.colorBalance || [1, 1, 1])
    }

    // Рисуем квад
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()
  }

  /**
   * Получить возможности GPU
   */
  public getCapabilities() {
    return this.capabilities
  }

  /**
   * Очистка ресурсов
   */
  protected onDispose(): void {
    if (this.gl) {
      if (this.sourceTexture) {
        this.gl.deleteTexture(this.sourceTexture)
      }
    }

    if (this.quadVAO) {
      vaoManager.releaseVAO("quad")
    }

    this.sourceTexture = null
    this.videoElement = null
    this.quadVAO = null
  }
}
