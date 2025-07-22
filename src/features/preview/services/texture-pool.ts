/**
 * WebGL Texture Pool for efficient GPU memory management
 */

export class TexturePool {
  private gl: WebGLRenderingContext
  private available: WebGLTexture[] = []
  private inUse = new Map<WebGLTexture, { width: number; height: number }>()
  private maxTextures = 20

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
  }

  /**
   * Acquire a texture from pool or create new
   */
  acquire(width: number, height: number): WebGLTexture {
    // Try to find matching size in available pool
    for (let i = 0; i < this.available.length; i++) {
      const texture = this.available[i]
      const info = this.inUse.get(texture)

      if (info && info.width === width && info.height === height) {
        this.available.splice(i, 1)
        this.inUse.set(texture, { width, height })
        return texture
      }
    }

    // No matching texture, create new or reuse any available
    if (this.available.length > 0) {
      const texture = this.available.pop()!
      this.resizeTexture(texture, width, height)
      this.inUse.set(texture, { width, height })
      return texture
    }

    // Create new texture
    if (this.inUse.size < this.maxTextures) {
      const texture = this.createTexture(width, height)
      this.inUse.set(texture, { width, height })
      return texture
    }

    // Pool is full, forcibly reuse oldest texture
    const [oldestTexture] = this.inUse.keys()
    this.resizeTexture(oldestTexture, width, height)
    this.inUse.delete(oldestTexture)
    this.inUse.set(oldestTexture, { width, height })
    return oldestTexture
  }

  /**
   * Release texture back to pool
   */
  release(texture: WebGLTexture): void {
    if (this.inUse.has(texture)) {
      this.available.push(texture)
    }
  }

  /**
   * Create new texture
   */
  private createTexture(width: number, height: number): WebGLTexture {
    const texture = this.gl.createTexture()
    if (!texture) {
      throw new Error("Failed to create texture")
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    return texture
  }

  /**
   * Resize existing texture
   */
  private resizeTexture(texture: WebGLTexture, width: number, height: number): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null)
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size,
      maxTextures: this.maxTextures,
    }
  }

  /**
   * Clean up all textures
   */
  dispose(): void {
    // Delete all textures
    for (const texture of this.available) {
      this.gl.deleteTexture(texture)
    }
    for (const texture of this.inUse.keys()) {
      this.gl.deleteTexture(texture)
    }

    this.available = []
    this.inUse.clear()
  }
}
