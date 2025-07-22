/**
 * WebGL-based real-time preview renderer
 */

import {
  cartoonFragmentShader,
  colorGradingFragmentShader,
  depthOfFieldFragmentShader,
  filmEmulationFragmentShader,
  glitchFragmentShader,
  glowFragmentShader,
} from "../shaders/advanced-effects"
import {
  baseVertexShader,
  blurFragmentShader,
  chromaKeyFragmentShader,
  chromaticAberrationFragmentShader,
  colorCorrectionFragmentShader,
  grainFragmentShader,
  lensDistortionFragmentShader,
  passthroughFragmentShader,
  sharpenFragmentShader,
  transformFragmentShader,
  vignetteFragmentShader,
} from "../shaders/base"
import {
  createFramebuffer,
  createProgram,
  createQuadBuffer,
  createShader,
  createTexture,
  detectGPUTier,
  setupQuadAttributes,
  uploadImageToTexture,
} from "../utils/webgl-utils"

import type { Effect, GPUTier, PreviewConfig, RenderPass, ShaderProgram, TextureInfo } from "../types"

export class PreviewRenderer {
  private gl: WebGLRenderingContext
  private canvas: HTMLCanvasElement
  private shaderPrograms = new Map<string, ShaderProgram>()
  private quadBuffer: WebGLBuffer | null = null
  private frameBuffers: WebGLFramebuffer[] = []
  private textures: WebGLTexture[] = []
  private gpuTier: GPUTier
  private isInitialized = false

  constructor(config: PreviewConfig) {
    this.canvas = config.canvas
    const gl = this.canvas.getContext("webgl", {
      antialias: config.quality.antialiasing,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    })

    if (!gl) {
      throw new Error("WebGL not supported")
    }

    this.gl = gl
    this.gpuTier = config.gpuTier || detectGPUTier(gl)
  }

  /**
   * Initialize renderer resources
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    // Create quad buffer for rendering
    this.quadBuffer = createQuadBuffer(this.gl)
    if (!this.quadBuffer) {
      throw new Error("Failed to create quad buffer")
    }

    // Compile shaders
    await this.compileShaders()

    // Create framebuffers and textures for multi-pass rendering
    this.createRenderTargets()

    // Set up WebGL state
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    this.isInitialized = true
  }

  /**
   * Render a frame with effects
   */
  async renderFrame(
    source: ImageBitmap | HTMLVideoElement | HTMLCanvasElement,
    effects: Effect[],
    _timestamp: number,
  ): Promise<ImageBitmap> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    // Upload source to texture
    const sourceTexture = this.textures[0]
    if (!sourceTexture) {
      throw new Error("No source texture available")
    }
    uploadImageToTexture(this.gl, sourceTexture, source)

    // Create render passes for effects
    const renderPasses = this.createRenderPasses(effects)

    // Execute render passes
    let currentInput: TextureInfo = {
      texture: sourceTexture,
      width: source.width,
      height: source.height,
      format: this.gl.RGBA,
    }

    for (const pass of renderPasses) {
      this.executeRenderPass(pass, currentInput)
      if (pass.output) {
        currentInput = pass.output
      }
    }

    // Read pixels and create ImageBitmap
    return this.readPixelsAsBitmap()
  }

  /**
   * Compile all shader programs
   */
  private async compileShaders(): Promise<void> {
    const shaders = [
      { name: "passthrough", fragment: passthroughFragmentShader },
      { name: "colorCorrection", fragment: colorCorrectionFragmentShader },
      { name: "colorGrading", fragment: colorGradingFragmentShader },
      { name: "blur", fragment: blurFragmentShader },
      { name: "vignette", fragment: vignetteFragmentShader },
      { name: "transform", fragment: transformFragmentShader },
      { name: "grain", fragment: grainFragmentShader },
      { name: "chromaticAberration", fragment: chromaticAberrationFragmentShader },
      { name: "lensDistortion", fragment: lensDistortionFragmentShader },
      { name: "sharpen", fragment: sharpenFragmentShader },
      { name: "chromaKey", fragment: chromaKeyFragmentShader },
      { name: "glow", fragment: glowFragmentShader },
      { name: "glitch", fragment: glitchFragmentShader },
      { name: "filmEmulation", fragment: filmEmulationFragmentShader },
      { name: "depthOfField", fragment: depthOfFieldFragmentShader },
      { name: "cartoon", fragment: cartoonFragmentShader },
    ]

    for (const shader of shaders) {
      const vertexShader = createShader(this.gl, this.gl.VERTEX_SHADER, baseVertexShader)
      const fragmentShader = createShader(this.gl, this.gl.FRAGMENT_SHADER, shader.fragment)

      if (!vertexShader || !fragmentShader) {
        throw new Error(`Failed to compile ${shader.name} shader`)
      }

      const program = createProgram(this.gl, vertexShader, fragmentShader)
      if (!program) {
        throw new Error(`Failed to link ${shader.name} program`)
      }

      // Get uniform locations
      const uniforms = new Map<string, WebGLUniformLocation>()
      const uniformNames = this.getUniformNames(shader.fragment)

      for (const name of uniformNames) {
        const location = this.gl.getUniformLocation(program, name)
        if (location) {
          uniforms.set(name, location)
        }
      }

      this.shaderPrograms.set(shader.name, {
        vertex: vertexShader,
        fragment: fragmentShader,
        program,
        uniforms,
        attributes: new Map(),
      })
    }
  }

  /**
   * Extract uniform names from shader source
   */
  private getUniformNames(shaderSource: string): string[] {
    const uniformRegex = /uniform\s+\w+\s+(\w+);/g
    const names: string[] = []
    let match

    while ((match = uniformRegex.exec(shaderSource)) !== null) {
      names.push(match[1])
    }

    return names
  }

  /**
   * Create framebuffers and textures for multi-pass rendering
   */
  private createRenderTargets(): void {
    const width = this.canvas.width
    const height = this.canvas.height

    // Create textures and framebuffers for ping-pong rendering
    for (let i = 0; i < 3; i++) {
      const texture = createTexture(this.gl, width, height)
      if (!texture) {
        throw new Error("Failed to create render texture")
      }
      this.textures.push(texture)

      if (i > 0) {
        // First texture is for source, others for render targets
        const framebuffer = createFramebuffer(this.gl, texture)
        if (!framebuffer) {
          throw new Error("Failed to create framebuffer")
        }
        this.frameBuffers.push(framebuffer)
      }
    }
  }

  /**
   * Create render passes from effects
   */
  private createRenderPasses(effects: Effect[]): RenderPass[] {
    const passes: RenderPass[] = []
    const enabledEffects = effects.filter((e) => e.enabled)

    let textureIndex = 1
    for (let i = 0; i < enabledEffects.length; i++) {
      const effect = enabledEffects[i]
      const isLastPass = i === enabledEffects.length - 1

      const pass = this.createRenderPassForEffect(
        effect,
        isLastPass ? null : this.textures[textureIndex],
        isLastPass ? null : this.frameBuffers[textureIndex - 1],
      )

      if (pass) {
        passes.push(pass)
        textureIndex = textureIndex === 1 ? 2 : 1 // Ping-pong between textures
      }
    }

    // If no effects, add passthrough
    if (passes.length === 0) {
      const passthroughProgram = this.shaderPrograms.get("passthrough")
      if (passthroughProgram) {
        passes.push({
          input: {
            texture: this.textures[0],
            width: this.canvas.width,
            height: this.canvas.height,
            format: this.gl.RGBA,
          },
          output: null,
          shader: passthroughProgram,
          uniforms: {},
        })
      }
    }

    return passes
  }

  /**
   * Create render pass for specific effect
   */
  private createRenderPassForEffect(
    effect: Effect,
    outputTexture: WebGLTexture | null,
    _outputFramebuffer: WebGLFramebuffer | null,
  ): RenderPass | null {
    let shaderName: string
    let uniforms: Record<string, any> = {}

    switch (effect.type) {
      case "color_correction":
        shaderName = "colorCorrection"
        uniforms = {
          u_brightness: effect.parameters.brightness || 0,
          u_contrast: effect.parameters.contrast || 1,
          u_saturation: effect.parameters.saturation || 1,
          u_hue: effect.parameters.hue || 0,
          u_temperature: effect.parameters.temperature || 0,
          u_tint: effect.parameters.tint || 0,
        }
        break

      case "blur":
        shaderName = "blur"
        uniforms = {
          u_radius: effect.parameters.radius || 5,
          u_resolution: [this.canvas.width, this.canvas.height],
          u_direction: effect.parameters.direction || [1, 0],
        }
        break

      case "vignette":
        shaderName = "vignette"
        uniforms = {
          u_intensity: effect.parameters.intensity || 0.5,
          u_smoothness: effect.parameters.smoothness || 0.5,
        }
        break

      case "transform":
        shaderName = "transform"
        uniforms = {
          u_transform: this.createTransformMatrix(effect.parameters),
        }
        break

      case "grain":
        shaderName = "grain"
        uniforms = {
          u_amount: effect.parameters.amount || 0.1,
          u_size: effect.parameters.size || 1.0,
          u_time: performance.now() * 0.001, // Animated grain
        }
        break

      case "chromatic_aberration":
        shaderName = "chromaticAberration"
        uniforms = {
          u_intensity: effect.parameters.intensity || 1.0,
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "lens_distortion":
        shaderName = "lensDistortion"
        uniforms = {
          u_distortion: effect.parameters.distortion || 0.1,
          u_scale: effect.parameters.scale || 1.0,
        }
        break

      case "sharpen":
        shaderName = "sharpen"
        uniforms = {
          u_intensity: effect.parameters.intensity || 1.0,
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "chroma_key":
        shaderName = "chromaKey"
        const keyColor = effect.parameters.keyColor || [0, 1, 0] // Default green
        uniforms = {
          u_keyColor: keyColor,
          u_threshold: effect.parameters.threshold || 0.4,
          u_smoothness: effect.parameters.smoothness || 0.1,
        }
        break

      case "color_grading":
        shaderName = "colorGrading"
        const params = effect.parameters
        uniforms = {
          u_lift: [params.lift?.r || 0, params.lift?.g || 0, params.lift?.b || 0],
          u_gamma: [params.gamma?.r || 1, params.gamma?.g || 1, params.gamma?.b || 1],
          u_gain: [params.gain?.r || 1, params.gain?.g || 1, params.gain?.b || 1],
          u_offset: [params.offset?.r || 0, params.offset?.g || 0, params.offset?.b || 0],
          u_liftLum: params.lift?.luminance || 0,
          u_gammaLum: params.gamma?.luminance || 1,
          u_gainLum: params.gain?.luminance || 1,
        }
        break

      case "glow":
        shaderName = "glow"
        uniforms = {
          u_intensity: effect.parameters.intensity || 0.5,
          u_radius: effect.parameters.radius || 20,
          u_threshold: effect.parameters.threshold || 0.5,
          u_color: effect.parameters.color || [1, 1, 1],
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "glitch":
        shaderName = "glitch"
        uniforms = {
          u_time: performance.now() * 0.001,
          u_intensity: effect.parameters.intensity || 0.5,
          u_frequency: effect.parameters.frequency || 0.1,
          u_blockSize: effect.parameters.blockSize || 10,
          u_type: effect.parameters.type === "analog" ? 1 : effect.parameters.type === "chromatic" ? 2 : 0,
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "film_emulation":
        shaderName = "filmEmulation"
        uniforms = {
          u_grain: effect.parameters.grain || 0.3,
          u_vignette: effect.parameters.vignette || 0.2,
          u_colorShift: effect.parameters.colorShift || 0.5,
          u_filmType:
            effect.parameters.type === "fuji"
              ? 1
              : effect.parameters.type === "polaroid"
                ? 2
                : effect.parameters.type === "blackwhite"
                  ? 3
                  : 0,
          u_time: performance.now() * 0.001,
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "cartoon":
        shaderName = "cartoon"
        uniforms = {
          u_edgeThreshold: effect.parameters.edgeThreshold || 0.1,
          u_quantizeLevels: effect.parameters.quantizeLevels || 5,
          u_outlineColor: effect.parameters.outlineColor || [0, 0, 0],
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      case "depth_of_field":
        shaderName = "depthOfField"
        uniforms = {
          u_focusDistance: effect.parameters.focusDistance || 0.5,
          u_focusRange: effect.parameters.focusRange || 0.3,
          u_bokehRadius: effect.parameters.bokehRadius || 20,
          u_bokehSamples: effect.parameters.bokehSamples || 16,
          u_resolution: [this.canvas.width, this.canvas.height],
        }
        break

      default:
        return null
    }

    const shader = this.shaderPrograms.get(shaderName)
    if (!shader) return null

    // Apply effect intensity
    if (effect.intensity < 1) {
      // Mix with original based on intensity
      for (const key in uniforms) {
        if (typeof uniforms[key] === "number" && key !== "u_intensity") {
          uniforms[key] *= effect.intensity
        }
      }
    }

    return {
      input: {
        texture: this.textures[0], // Will be set properly in execute
        width: this.canvas.width,
        height: this.canvas.height,
        format: this.gl.RGBA,
      },
      output: outputTexture
        ? {
          texture: outputTexture,
          width: this.canvas.width,
          height: this.canvas.height,
          format: this.gl.RGBA,
        }
        : null,
      shader,
      uniforms,
    }
  }

  /**
   * Create 3x3 transform matrix
   */
  private createTransformMatrix(params: any): Float32Array {
    const { scaleX = 1, scaleY = 1, rotation = 0, translateX = 0, translateY = 0, skewX = 0, skewY = 0 } = params

    const rad = (rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    // Build transformation matrix
    const matrix = new Float32Array([
      scaleX * cos - skewY * sin,
      scaleX * sin + skewY * cos,
      translateX,
      skewX * cos - scaleY * sin,
      skewX * sin + scaleY * cos,
      translateY,
      0,
      0,
      1,
    ])

    return matrix
  }

  /**
   * Execute a render pass
   */
  private executeRenderPass(pass: RenderPass, input: TextureInfo): void {
    const gl = this.gl

    // Set up framebuffer
    if (pass.output) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[0])
      gl.viewport(0, 0, pass.output.width, pass.output.height)
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    }

    // Clear
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Use shader program
    gl.useProgram(pass.shader.program)

    // Bind texture
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, input.texture)

    const textureLocation = pass.shader.uniforms.get("u_texture")
    if (textureLocation) {
      gl.uniform1i(textureLocation, 0)
    }

    // Set uniforms
    for (const [name, value] of Object.entries(pass.uniforms)) {
      const location = pass.shader.uniforms.get(name)
      if (!location) continue

      if (typeof value === "number") {
        gl.uniform1f(location, value)
      } else if (Array.isArray(value)) {
        if (value.length === 2) {
          gl.uniform2fv(location, value)
        } else if (value.length === 3) {
          gl.uniform3fv(location, value)
        } else if (value.length === 4) {
          gl.uniform4fv(location, value)
        } else if (value.length === 9) {
          gl.uniformMatrix3fv(location, false, value)
        }
      }
    }

    // Set up geometry
    if (this.quadBuffer) {
      setupQuadAttributes(gl, pass.shader.program, this.quadBuffer)
    }

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  /**
   * Read pixels from canvas and create ImageBitmap
   */
  private async readPixelsAsBitmap(): Promise<ImageBitmap> {
    const width = this.canvas.width
    const height = this.canvas.height
    const pixels = new Uint8ClampedArray(width * height * 4)

    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels)

    // Flip vertically (WebGL renders upside down)
    const flipped = new Uint8ClampedArray(width * height * 4)
    for (let y = 0; y < height; y++) {
      const srcRow = y * width * 4
      const dstRow = (height - y - 1) * width * 4
      flipped.set(pixels.slice(srcRow, srcRow + width * 4), dstRow)
    }

    const imageData = new ImageData(flipped, width, height)
    return createImageBitmap(imageData)
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Delete shaders and programs
    for (const shader of this.shaderPrograms.values()) {
      this.gl.deleteShader(shader.vertex)
      this.gl.deleteShader(shader.fragment)
      this.gl.deleteProgram(shader.program)
    }
    this.shaderPrograms.clear()

    // Delete buffers
    if (this.quadBuffer) {
      this.gl.deleteBuffer(this.quadBuffer)
    }

    // Delete textures
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture)
    }
    this.textures = []

    // Delete framebuffers
    for (const framebuffer of this.frameBuffers) {
      this.gl.deleteFramebuffer(framebuffer)
    }
    this.frameBuffers = []

    this.isInitialized = false
  }
}
