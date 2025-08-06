# WebGL2 Migration Examples

This document provides practical examples of migrating from the old WebGL implementations to the new unified WebGL2 library.

## Example 1: Migrating Preview Renderer

### Before (WebGL1 implementation)

```typescript
// src/features/preview/services/preview-renderer.ts
import { createProgram, createShader } from "../utils/webgl-utils"

export class PreviewRenderer {
  private gl: WebGLRenderingContext
  
  constructor(config: PreviewConfig) {
    const gl = this.canvas.getContext("webgl")
    // Manual shader compilation
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
    const program = createProgram(gl, vertexShader, fragmentShader)
  }
}
```

### After (WebGL2 with unified library)

```typescript
// src/features/preview/services/webgl2-preview-renderer.ts
import { BaseRenderer, shaderPool, vaoManager } from "@/lib/webgl"

export class WebGL2PreviewRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Shaders are managed by shaderPool
    const program = shaderPool.getProgram("copy")
    
    // VAO for optimal performance
    this.quadVAO = vaoManager.createQuadVAO(program)
  }
}
```

## Example 2: Migrating Effects Processor

### Before (Manual WebGL setup)

```typescript
// src/features/effects/services/unified-renderer.ts
export class UnifiedEffectsRenderer {
  private gl: WebGLRenderingContext | null = null
  
  private initializeWebGL(): void {
    this.canvas = document.createElement("canvas")
    this.gl = this.canvas.getContext("webgl")
    // Manual state setup
    this.gl.disable(this.gl.DEPTH_TEST)
    this.gl.enable(this.gl.BLEND)
  }
  
  private compileShaderProgram(effectId: string, processor: WebGLProcessor): WebGLProgram {
    // Manual shader compilation
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource)
    // ... linking and error handling
  }
}
```

### After (Using WebGL2 library)

```typescript
// src/features/effects/services/webgl2-effect-processor.ts
import { BaseRenderer, shaderPool } from "@/lib/webgl"

export class WebGL2EffectProcessor extends BaseRenderer {
  async compileEffect(effectId: string, shader: EffectShader): Promise<boolean> {
    // Automatic shader compilation with caching
    const program = shaderPool.getProgram(effectId, {
      vertex: shader.vertexShader,
      fragment: shader.fragmentShader,
    })
    return program !== null
  }
}
```

## Example 3: Using the New Hook

### Before (Direct WebGL1 usage)

```typescript
// Component using old preview
export function PreviewPanel() {
  const { canvasRef, isInitialized } = useRealtimePreview({
    cacheSize: 100,
  })
  
  // Manual WebGL1 context
  const gl = canvas.getContext("webgl")
}
```

### After (WebGL2 hook)

```typescript
// Component using new WebGL2 preview
export function PreviewPanel() {
  const { canvasRef, isInitialized, gpuTier } = useWebGL2Preview({
    cacheSize: 100,
  })
  
  // GPU tier automatically detected
  console.log(`Running on ${gpuTier} GPU`)
}
```

## Example 4: Shader Migration

### Before (GLSL ES 1.0)

```glsl
// Vertex shader
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}

// Fragment shader
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_texture;

void main() {
  gl_FragColor = texture2D(u_texture, v_texCoord);
}
```

### After (GLSL ES 3.0)

```glsl
// Vertex shader
#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}

// Fragment shader
#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 fragColor;

void main() {
  fragColor = texture(u_texture, v_texCoord);
}
```

## Example 5: Resource Management

### Before (Manual management)

```typescript
export class PreviewRenderer {
  private textures: WebGLTexture[] = []
  private frameBuffers: WebGLFramebuffer[] = []
  
  private createRenderTargets(): void {
    for (let i = 0; i < 3; i++) {
      const texture = createTexture(this.gl, width, height)
      this.textures.push(texture)
      
      const framebuffer = createFramebuffer(this.gl, texture)
      this.frameBuffers.push(framebuffer)
    }
  }
  
  dispose(): void {
    // Manual cleanup
    for (const texture of this.textures) {
      this.gl.deleteTexture(texture)
    }
  }
}
```

### After (Automatic management)

```typescript
export class WebGL2PreviewRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Automatic resource management
    this.createFramebuffer("effect_ping", 1920, 1080)
    this.createFramebuffer("effect_pong", 1920, 1080)
  }
  
  // Cleanup is automatic in BaseRenderer
}
```

## Example 6: Performance Optimizations

### Before (No VAO)

```typescript
// Drawing without VAO
private renderFullscreenQuad(): void {
  const quadBuffer = this.gl.createBuffer()
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, quadBuffer)
  
  // Set up attributes every frame
  const positionLocation = this.gl.getAttribLocation(program, "a_position")
  this.gl.enableVertexAttribArray(positionLocation)
  this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)
  
  const texCoordLocation = this.gl.getAttribLocation(program, "a_texCoord")
  this.gl.enableVertexAttribArray(texCoordLocation)
  this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)
  
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
}
```

### After (With VAO)

```typescript
// Drawing with VAO
private renderWithVAO(): void {
  // VAO setup happens once
  vaoManager.bindVAO(this.quadVAO)
  this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  vaoManager.unbindVAO()
}
```

## Migration Checklist

- [ ] Replace `WebGLRenderingContext` with `WebGL2RenderingContext`
- [ ] Update all shaders to GLSL ES 3.0
- [ ] Replace manual shader compilation with `shaderPool`
- [ ] Use `BaseRenderer` for common functionality
- [ ] Implement VAOs using `vaoManager`
- [ ] Update texture/framebuffer creation to use base class methods
- [ ] Remove manual resource cleanup (handled by BaseRenderer)
- [ ] Test on different GPU tiers (low/medium/high)

## Common Pitfalls

1. **Forgetting shader version**: Always add `#version 300 es` at the top
2. **Old texture functions**: Replace `texture2D()` with `texture()`
3. **Missing output variable**: Add `out vec4 fragColor` in fragment shaders
4. **Context loss handling**: BaseRenderer handles this automatically
5. **Resource leaks**: Use the provided resource management methods

## Performance Benefits

After migration, you should see:
- 20-30% reduction in draw call overhead (VAOs)
- Better texture memory usage (unified management)
- Faster shader compilation (caching)
- Automatic GPU tier detection and optimization
- Improved stability with context loss handling