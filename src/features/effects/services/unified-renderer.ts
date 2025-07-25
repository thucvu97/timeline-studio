/**
 * Unified Effects Renderer - Единый рендерер эффектов
 * Поддерживает все типы обработки: WebGL, CSS, FFmpeg, Canvas
 */

import type { AppliedEffect, BaseEffect, EffectProcessingType, WebGLProcessor } from "../types/unified-effects"

export interface RenderContext {
  // Источник
  source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | HTMLImageElement

  // Целевой контекст
  target?: HTMLCanvasElement | HTMLVideoElement

  // Размеры
  width: number
  height: number

  // Время
  currentTime: number

  // Качество рендеринга
  quality: "draft" | "preview" | "full"

  // GPU информация
  gpuTier?: "low" | "medium" | "high"
}

export interface RenderResult {
  success: boolean
  output?: HTMLCanvasElement | ImageBitmap | string // FFmpeg command
  processingTime: number
  error?: string
}

export class UnifiedEffectsRenderer {
  private gl: WebGLRenderingContext | null = null
  private canvas: HTMLCanvasElement | null = null
  private compiledShaders = new Map<string, WebGLProgram>()
  private frameBuffer: WebGLFramebuffer | null = null
  private textures: WebGLTexture[] = []

  constructor() {
    this.initializeWebGL()
  }

  // ============================================================================
  // ИНИЦИАЛИЗАЦИЯ
  // ============================================================================

  private initializeWebGL(): void {
    try {
      this.canvas = document.createElement("canvas")
      this.gl = (this.canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null

      if (this.gl) {
        this.setupWebGLState()
      }
    } catch (error) {
      console.warn("WebGL initialization failed:", error)
    }
  }

  private setupWebGLState(): void {
    if (!this.gl) return

    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    // Создаем framebuffer для рендеринга
    this.frameBuffer = this.gl.createFramebuffer()
  }

  // ============================================================================
  // ОСНОВНОЙ МЕТОД РЕНДЕРИНГА
  // ============================================================================

  async renderEffectStack(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    try {
      // Сортируем эффекты по order
      const sortedEffects = [...appliedEffects].filter((ae) => ae.enabled).sort((a, b) => a.order - b.order)

      const currentSource: any = context.source
      let processingType: EffectProcessingType = "realtime"

      // Определяем общий тип обработки
      for (const appliedEffect of sortedEffects) {
        const baseEffect = baseEffects.get(appliedEffect.effectId)
        if (baseEffect?.processingType === "render") {
          processingType = "render"
          break
        }
        if (baseEffect?.processingType === "hybrid") {
          processingType = "hybrid"
        }
      }

      // Выбираем стратегию рендеринга
      switch (processingType) {
        case "realtime":
          return await this.renderRealtimeEffects(sortedEffects, baseEffects, context, currentSource)

        case "render":
          return await this.renderFFmpegEffects(sortedEffects, baseEffects, context)

        case "hybrid":
          return await this.renderHybridEffects(sortedEffects, baseEffects, context, currentSource)

        default:
          return {
            success: false,
            error: "Unknown processing type",
            processingTime: performance.now() - startTime,
          }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime: performance.now() - startTime,
      }
    }
  }

  // ============================================================================
  // REALTIME РЕНДЕРИНГ (WebGL + CSS)
  // ============================================================================

  private async renderRealtimeEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
    currentSource: any,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    // Пытаемся использовать WebGL для максимальной производительности
    if (this.gl && this.canvas && context.quality !== "draft") {
      try {
        return await this.renderWebGLEffects(appliedEffects, baseEffects, context, currentSource)
      } catch (error) {
        console.warn("WebGL rendering failed, falling back to CSS:", error)
      }
    }

    // Fallback на CSS фильтры
    return await this.renderCSSEffects(appliedEffects, baseEffects, context, currentSource)
  }

  private async renderWebGLEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
    currentSource: any,
  ): Promise<RenderResult> {
    if (!this.gl || !this.canvas) {
      throw new Error("WebGL not available")
    }

    const startTime = performance.now()

    // Настраиваем размеры канваса
    this.canvas.width = context.width
    this.canvas.height = context.height
    this.gl.viewport(0, 0, context.width, context.height)

    // Создаем исходную текстуру
    const sourceTexture = this.createTextureFromSource(currentSource)
    let currentTexture = sourceTexture

    // Применяем эффекты последовательно
    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.webgl) continue

      // Получаем параметры с учетом анимации
      const params = this.getParametersAtTime(appliedEffect, context.currentTime)

      // Рендерим эффект
      currentTexture = await this.renderSingleWebGLEffect(baseEffect, currentTexture, params, context)
    }

    // Читаем результат в ImageBitmap
    const imageData = new ImageData(
      new Uint8ClampedArray(this.gl.canvas.width * this.gl.canvas.height * 4),
      this.gl.canvas.width,
      this.gl.canvas.height,
    )

    this.gl.readPixels(
      0,
      0,
      this.gl.canvas.width,
      this.gl.canvas.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      imageData.data,
    )

    const bitmap = await createImageBitmap(imageData)

    return {
      success: true,
      output: bitmap,
      processingTime: performance.now() - startTime,
    }
  }

  private async renderSingleWebGLEffect(
    baseEffect: BaseEffect,
    _inputTexture: WebGLTexture,
    params: Record<string, any>,
    context: RenderContext,
  ): Promise<WebGLTexture> {
    if (!this.gl || !baseEffect.processors.webgl) {
      throw new Error("WebGL processor not available")
    }

    const processor = baseEffect.processors.webgl

    // Компилируем шейдер если еще не сделали
    let program = this.compiledShaders.get(baseEffect.id)
    if (!program) {
      program = this.compileShaderProgram(baseEffect.id, processor)
      this.compiledShaders.set(baseEffect.id, program)
    }

    // Создаем выходную текстуру
    const outputTexture = this.gl.createTexture()
    if (!outputTexture) throw new Error("Failed to create output texture")

    this.gl.bindTexture(this.gl.TEXTURE_2D, outputTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      context.width,
      context.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null,
    )
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)

    // Настраиваем framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer)
    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, outputTexture, 0)

    // Используем шейдерную программу
    this.gl.useProgram(program)

    // Устанавливаем униформы
    this.setUniforms(program, processor.uniforms, params)

    // Рендерим полноэкранный квад
    this.renderFullscreenQuad()

    return outputTexture
  }

  private async renderCSSEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
    currentSource: any,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    // Создаем временный элемент для применения CSS фильтров
    let element: HTMLVideoElement | HTMLCanvasElement

    if (currentSource instanceof HTMLVideoElement) {
      element = currentSource.cloneNode() as HTMLVideoElement
    } else {
      // Конвертируем в canvas
      const canvas = document.createElement("canvas")
      canvas.width = context.width
      canvas.height = context.height
      const ctx = canvas.getContext("2d")!

      if (currentSource instanceof ImageBitmap) {
        ctx.drawImage(currentSource, 0, 0)
      } else if (currentSource instanceof HTMLImageElement) {
        ctx.drawImage(currentSource, 0, 0, context.width, context.height)
      }

      element = canvas
    }

    // Строим CSS фильтры
    const cssFilters: string[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.css) continue

      const params = this.getParametersAtTime(appliedEffect, context.currentTime)
      const filter = baseEffect.processors.css.filter(params)

      if (filter) {
        cssFilters.push(filter)
      }
    }

    // Применяем фильтры
    if (cssFilters.length > 0) {
      element.style.filter = cssFilters.join(" ")
    }

    // Рендерим в canvas
    const outputCanvas = document.createElement("canvas")
    outputCanvas.width = context.width
    outputCanvas.height = context.height
    const outputCtx = outputCanvas.getContext("2d")!

    outputCtx.drawImage(element, 0, 0, context.width, context.height)

    return {
      success: true,
      output: outputCanvas,
      processingTime: performance.now() - startTime,
    }
  }

  // ============================================================================
  // FFMPEG РЕНДЕРИНГ
  // ============================================================================

  private async renderFFmpegEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
  ): Promise<RenderResult> {
    const startTime = performance.now()

    const filters: string[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (!baseEffect?.processors.ffmpeg) continue

      const params = this.getParametersAtTime(appliedEffect, context.currentTime)
      const filter = baseEffect.processors.ffmpeg.filter(params)

      if (filter) {
        filters.push(filter)
      }
    }

    const ffmpegCommand = filters.length > 0 ? filters.join(",") : ""

    return {
      success: true,
      output: ffmpegCommand,
      processingTime: performance.now() - startTime,
    }
  }

  // ============================================================================
  // HYBRID РЕНДЕРИНГ
  // ============================================================================

  private async renderHybridEffects(
    appliedEffects: AppliedEffect[],
    baseEffects: Map<string, BaseEffect>,
    context: RenderContext,
    currentSource: any,
  ): Promise<RenderResult> {
    // Разделяем эффекты на realtime и render
    const realtimeEffects: AppliedEffect[] = []
    const renderEffects: AppliedEffect[] = []

    for (const appliedEffect of appliedEffects) {
      const baseEffect = baseEffects.get(appliedEffect.effectId)
      if (baseEffect?.processingType === "render") {
        renderEffects.push(appliedEffect)
      } else {
        realtimeEffects.push(appliedEffect)
      }
    }

    // Сначала применяем realtime эффекты
    let result: RenderResult
    if (realtimeEffects.length > 0) {
      result = await this.renderRealtimeEffects(realtimeEffects, baseEffects, context, currentSource)
      if (!result.success) return result
    } else {
      result = { success: true, output: currentSource, processingTime: 0 }
    }

    // Затем генерируем FFmpeg команды для render эффектов
    if (renderEffects.length > 0) {
      const ffmpegResult = await this.renderFFmpegEffects(renderEffects, baseEffects, context)
      if (ffmpegResult.success && ffmpegResult.output) {
        result.output = ffmpegResult.output // FFmpeg command string
      }
    }

    return result
  }

  // ============================================================================
  // УТИЛИТЫ
  // ============================================================================

  private getParametersAtTime(appliedEffect: AppliedEffect, time: number): Record<string, any> {
    const params = { ...appliedEffect.parameters }

    // Применяем ключевые кадры
    for (const [paramId, keyframes] of Object.entries(appliedEffect.keyframes)) {
      if (keyframes.length === 0) continue

      // Находим значение в момент времени time
      const value = this.interpolateKeyframes(keyframes, time)
      if (value !== undefined) {
        params[paramId] = value
      }
    }

    return params
  }

  private interpolateKeyframes(keyframes: any[], time: number): any {
    if (keyframes.length === 0) return undefined
    if (keyframes.length === 1) return keyframes[0].value

    // Сортируем по времени
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)

    // Время до первого кейфрейма
    if (time <= sorted[0].time) return sorted[0].value

    // Время после последнего кейфрейма
    if (time >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].value
    }

    // Интерполяция между кейфреймами
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i]
      const next = sorted[i + 1]

      if (time >= current.time && time <= next.time) {
        const progress = (time - current.time) / (next.time - current.time)

        // Простая линейная интерполяция
        if (typeof current.value === "number" && typeof next.value === "number") {
          return current.value + (next.value - current.value) * progress
        }

        return current.value
      }
    }

    return undefined
  }

  // WebGL утилиты
  private createTextureFromSource(source: any): WebGLTexture {
    if (!this.gl) throw new Error("WebGL not available")

    const texture = this.gl.createTexture()
    if (!texture) throw new Error("Failed to create texture")

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)

    if (
      source instanceof HTMLVideoElement ||
      source instanceof HTMLCanvasElement ||
      source instanceof HTMLImageElement
    ) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source)
    } else if (source instanceof ImageBitmap) {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, source)
    }

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    return texture
  }

  private compileShaderProgram(_effectId: string, processor: WebGLProcessor): WebGLProgram {
    if (!this.gl) throw new Error("WebGL not available")

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, this.getVertexShader())
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, processor.fragmentShader)

    const program = this.gl.createProgram()
    if (!program) throw new Error("Failed to create shader program")

    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program)
      throw new Error(`Failed to link shader program: ${error}`)
    }

    return program
  }

  private compileShader(type: number, source: string): WebGLShader {
    if (!this.gl) throw new Error("WebGL not available")

    const shader = this.gl.createShader(type)
    if (!shader) throw new Error("Failed to create shader")

    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader)
      throw new Error(`Failed to compile shader: ${error}`)
    }

    return shader
  }

  private getVertexShader(): string {
    return `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `
  }

  private setUniforms(program: WebGLProgram, uniformDefaults: Record<string, any>, params: Record<string, any>): void {
    if (!this.gl) return

    const uniforms = { ...uniformDefaults, ...params }

    for (const [name, value] of Object.entries(uniforms)) {
      const location = this.gl.getUniformLocation(program, name)
      if (!location) continue

      if (typeof value === "number") {
        this.gl.uniform1f(location, value)
      } else if (Array.isArray(value)) {
        if (value.length === 2) {
          this.gl.uniform2fv(location, value)
        } else if (value.length === 3) {
          this.gl.uniform3fv(location, value)
        } else if (value.length === 4) {
          this.gl.uniform4fv(location, value)
        }
      }
    }
  }

  private renderFullscreenQuad(): void {
    if (!this.gl) return

    // Создаем и биндим буфер для полноэкранного квада
    const quadBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer)

    const vertices = new Float32Array([-1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1])

    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)

    // Настраиваем атрибуты
    const positionLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "a_position")
    const texCoordLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), "a_texCoord")

    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)

    this.gl.enableVertexAttribArray(texCoordLocation)
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)

    // Рендерим
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  }

  // ============================================================================
  // ОЧИСТКА РЕСУРСОВ
  // ============================================================================

  dispose(): void {
    if (this.gl) {
      // Очищаем шейдеры
      for (const program of this.compiledShaders.values()) {
        this.gl.deleteProgram(program)
      }
      this.compiledShaders.clear()

      // Очищаем текстуры
      for (const texture of this.textures) {
        this.gl.deleteTexture(texture)
      }
      this.textures = []

      // Очищаем framebuffer
      if (this.frameBuffer) {
        this.gl.deleteFramebuffer(this.frameBuffer)
      }
    }
  }
}
