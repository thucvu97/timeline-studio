/**
 * WebGL2 Video Renderer для видеоплеера
 * Использует унифицированную WebGL2 библиотеку
 */

import { BaseRenderer, contextManager, type RendererOptions, shaderPool, vaoManager } from "@/lib/webgl"

export interface VideoFrame {
  texture: WebGLTexture
  width: number
  height: number
  timestamp: number
}

export class WebGLVideoRenderer extends BaseRenderer {
  private videoElement: HTMLVideoElement | null = null
  private videoTexture: WebGLTexture | null = null
  private quadVAO: WebGLVertexArrayObject | null = null
  private frameCallback: ((frame: VideoFrame) => void) | null = null

  constructor(options: RendererOptions) {
    super({
      ...options,
      name: options.name || "video-renderer",
    })
  }

  /**
   * Инициализация специфичная для видео
   */
  protected async onInitialize(): Promise<void> {
    if (!this.gl) return

    // Создаем VAO для полноэкранного квада
    const copyProgram = shaderPool.getProgram("copy")
    if (copyProgram) {
      this.quadVAO = vaoManager.createQuadVAO(copyProgram)
    }

    // Создаем текстуру для видео
    this.videoTexture = this.gl.createTexture()
    if (this.videoTexture) {
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    }
  }

  /**
   * Установить видео элемент
   */
  public setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video

    if (this.gl && video.videoWidth && video.videoHeight) {
      // Обновляем размеры
      this.resize(video.videoWidth, video.videoHeight)
    }
  }

  /**
   * Установить колбэк для обработки кадров
   */
  public setFrameCallback(callback: (frame: VideoFrame) => void): void {
    this.frameCallback = callback
  }

  /**
   * Рендеринг кадра
   */
  public render(_deltaTime: number): void {
    if (!this.gl || !this.videoElement || !this.videoTexture || !this.quadVAO) return

    // Проверяем готовность видео
    if (this.videoElement.readyState < 2) return

    // Обновляем текстуру видео
    this.updateVideoTexture()

    // Рендерим в основной фреймбуфер
    this.bindFramebuffer(null)

    // Используем программу копирования
    const program = this.useProgram("copy")
    if (!program) return

    // Привязываем VAO
    vaoManager.bindVAO(this.quadVAO)

    // Привязываем текстуру
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture)
    this.setUniform("u_texture", 0)

    // Рисуем квад
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)

    vaoManager.unbindVAO()

    // Вызываем колбэк если установлен
    if (this.frameCallback && this.videoTexture) {
      this.frameCallback({
        texture: this.videoTexture,
        width: this.videoElement.videoWidth,
        height: this.videoElement.videoHeight,
        timestamp: this.videoElement.currentTime,
      })
    }
  }

  /**
   * Обновить текстуру видео
   */
  private updateVideoTexture(): void {
    if (!this.gl || !this.videoElement || !this.videoTexture) return

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.videoTexture)

    // Загружаем текущий кадр видео в текстуру
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.videoElement)
  }

  /**
   * Захватить текущий кадр как ImageBitmap
   */
  public async captureFrame(): Promise<ImageBitmap | null> {
    if (!this.gl || !this.canvas) return null

    const width = this.canvas.width
    const height = this.canvas.height

    // Читаем пиксели
    const pixels = new Uint8Array(width * height * 4)
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

    // Создаем ImageData
    const imageData = new ImageData(new Uint8ClampedArray(pixels), width, height)

    // Создаем bitmap
    return createImageBitmap(imageData)
  }

  /**
   * Применить эффект к видео
   */
  public applyEffect(effectName: string, params: Record<string, any>): void {
    if (!this.gl || !this.videoTexture || !this.quadVAO) return

    // Получаем программу эффекта
    const program = this.useProgram(effectName)
    if (!program) return

    // Устанавливаем униформы эффекта
    for (const [name, value] of Object.entries(params)) {
      this.setUniform(name, value)
    }
  }

  /**
   * Очистка ресурсов
   */
  protected onDispose(): void {
    if (this.gl) {
      if (this.videoTexture) {
        this.gl.deleteTexture(this.videoTexture)
      }
    }

    if (this.quadVAO) {
      vaoManager.releaseVAO("quad")
    }

    this.videoTexture = null
    this.videoElement = null
    this.quadVAO = null
    this.frameCallback = null
  }

  /**
   * Обработка изменения размера
   */
  protected onResize(width: number, height: number): void {
    // Обновляем viewport
    if (this.gl) {
      this.gl.viewport(0, 0, width, height)
    }
  }

  /**
   * Получить информацию о производительности
   */
  public getPerformanceInfo(): {
    fps: number
    frameTime: number
    gpuTier: string
  } {
    const capabilities = contextManager.getCapabilities()

    return {
      fps: 0, // TODO: Implement FPS counter
      frameTime: 0, // TODO: Implement frame time measurement
      gpuTier: capabilities?.tier || "unknown",
    }
  }
}
