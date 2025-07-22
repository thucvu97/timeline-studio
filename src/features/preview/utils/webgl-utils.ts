/**
 * WebGL utility functions
 */

export function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null

  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compilation error:", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) return null

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program linking error:", gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }

  return program
}

export function createTexture(
  gl: WebGLRenderingContext,
  width: number,
  height: number,
  data?: Uint8Array | null,
): WebGLTexture | null {
  const texture = gl.createTexture()
  if (!texture) return null

  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data || null)

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  return texture
}

export function createFramebuffer(gl: WebGLRenderingContext, texture: WebGLTexture): WebGLFramebuffer | null {
  const framebuffer = gl.createFramebuffer()
  if (!framebuffer) return null

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer is not complete")
    gl.deleteFramebuffer(framebuffer)
    return null
  }

  return framebuffer
}

export function createQuadBuffer(gl: WebGLRenderingContext): WebGLBuffer | null {
  const buffer = gl.createBuffer()
  if (!buffer) return null

  const vertices = new Float32Array([
    -1,
    -1,
    0,
    0, // bottom left
    1,
    -1,
    1,
    0, // bottom right
    -1,
    1,
    0,
    1, // top left
    1,
    1,
    1,
    1, // top right
  ])

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  return buffer
}

export function setupQuadAttributes(gl: WebGLRenderingContext, program: WebGLProgram, buffer: WebGLBuffer) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

  const positionLocation = gl.getAttribLocation(program, "a_position")
  const texCoordLocation = gl.getAttribLocation(program, "a_texCoord")

  gl.enableVertexAttribArray(positionLocation)
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)

  gl.enableVertexAttribArray(texCoordLocation)
  gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8)
}

export function uploadImageToTexture(
  gl: WebGLRenderingContext,
  texture: WebGLTexture,
  image: ImageBitmap | HTMLVideoElement | HTMLCanvasElement,
) {
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
}

export function detectGPUTier(gl: WebGLRenderingContext): "high" | "medium" | "low" {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info")

  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)

    // Простая эвристика на основе названия GPU
    if (renderer.includes("NVIDIA") || renderer.includes("AMD")) {
      if (renderer.match(/RTX|RX [67]/)) return "high"
      if (renderer.match(/GTX|RX [45]/)) return "medium"
    }

    if (renderer.includes("Intel")) {
      if (renderer.includes("Iris")) return "medium"
      return "low"
    }

    if (renderer.includes("Apple")) {
      if (renderer.match(/M[12] (Pro|Max)/)) return "high"
      if (renderer.match(/M[12]/)) return "medium"
    }
  }

  // Fallback: проверка максимального размера текстуры
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
  if (maxTextureSize >= 16384) return "high"
  if (maxTextureSize >= 8192) return "medium"

  return "low"
}
