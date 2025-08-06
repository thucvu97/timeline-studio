# WebGL Migration Guide

This guide explains how to migrate existing WebGL implementations to the new unified WebGL2 library.

## Overview

Timeline Studio now has a unified WebGL2 library located at `/src/lib/webgl/` that provides:

- Centralized context management
- Shader pooling to avoid duplication
- VAO (Vertex Array Objects) support for performance
- Base renderer class for consistent implementations
- Comprehensive utilities

## Key Components

### 1. Context Manager (`contextManager`)

Manages a single WebGL2 context for the entire application:

```typescript
import { contextManager } from "@/lib/webgl"

// Initialize context
const success = contextManager.initialize({
  canvas: myCanvas,
  attributes: {
    powerPreference: "high-performance",
  },
})

// Get context
const gl = contextManager.getContext()

// Get GPU capabilities
const capabilities = contextManager.getCapabilities()
console.log(`GPU Tier: ${capabilities.tier}`) // "low" | "medium" | "high"
```

### 2. Shader Pool (`shaderPool`)

Manages shader compilation and reuse:

```typescript
import { shaderPool, type ShaderSource } from "@/lib/webgl"

// Use built-in shader
const copyProgram = shaderPool.getProgram("copy")

// Add custom shader
const myShader: ShaderSource = {
  vertex: `...`,
  fragment: `...`,
}
const myProgram = shaderPool.getProgram("myEffect", myShader)
```

### 3. VAO Manager (`vaoManager`)

Optimizes vertex attribute setup:

```typescript
import { vaoManager } from "@/lib/webgl"

// Create quad VAO for fullscreen effects
const quadVAO = vaoManager.createQuadVAO(program)

// Use VAO
vaoManager.bindVAO(quadVAO)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
vaoManager.unbindVAO()
```

### 4. Base Renderer

Provides common functionality for all renderers:

```typescript
import { BaseRenderer } from "@/lib/webgl"

export class MyRenderer extends BaseRenderer {
  protected async onInitialize(): Promise<void> {
    // Initialize your renderer
  }
  
  public render(deltaTime: number): void {
    // Render frame
  }
}
```

## Migration Steps

### Step 1: Update Preview Module

Replace the existing WebGL1 renderer with the new WebGL2 renderer:

```typescript
// Before (WebGL1)
import { PreviewRenderer } from "./services/preview-renderer"

// After (WebGL2)
import { WebGL2PreviewRenderer } from "./services/webgl2-preview-renderer"

const renderer = new WebGL2PreviewRenderer({
  name: "preview",
  canvas: previewCanvas,
})
await renderer.initialize()
```

### Step 2: Update Effects Module

Use the new unified effect processor:

```typescript
// Before
import { ShaderCompiler } from "./services/shader-compiler"
import { UnifiedRenderer } from "./services/unified-renderer"

// After
import { WebGL2EffectProcessor } from "./services/webgl2-effect-processor"

const processor = new WebGL2EffectProcessor()
await processor.initialize()

// Compile custom effect
await processor.compileEffect("myEffect", {
  fragmentShader: `...`,
  uniforms: { ... },
})

// Process image
const result = await processor.processImage(image, effect)
```

### Step 3: Update Video Player Module

The video player already uses WebGL2, but should switch to the unified library:

```typescript
// Remove local WebGL context manager
// import { WebGLContextManager } from "./services/webgl-context-manager"

// Use unified library
import { contextManager, BaseRenderer } from "@/lib/webgl"
```

## Shader Migration

### WebGL1 to WebGL2 Shader Updates

1. Add version directive:
```glsl
#version 300 es
```

2. Update attribute/varying syntax:
```glsl
// WebGL1
attribute vec2 a_position;
varying vec2 v_texCoord;

// WebGL2
in vec2 a_position;
out vec2 v_texCoord;
```

3. Update texture sampling:
```glsl
// WebGL1
vec4 color = texture2D(u_texture, v_texCoord);

// WebGL2
vec4 color = texture(u_texture, v_texCoord);
```

4. Add output variable in fragment shader:
```glsl
// WebGL2 fragment shader
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0);
}
```

## Performance Optimizations

### 1. Use VAOs

Vertex Array Objects significantly reduce draw call overhead:

```typescript
// Create VAO once
const vao = vaoManager.createQuadVAO(program)

// Use many times
vaoManager.bindVAO(vao)
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
```

### 2. Pool Shaders

Never compile the same shader twice:

```typescript
// Shaders are automatically cached
const program1 = shaderPool.getProgram("blur")
const program2 = shaderPool.getProgram("blur") // Returns cached version
```

### 3. Reuse Framebuffers

The base renderer provides framebuffer management:

```typescript
// Create once
this.createFramebuffer("ping", width, height)
this.createFramebuffer("pong", width, height)

// Use for ping-pong rendering
this.bindFramebuffer("ping")
// render...
this.bindFramebuffer("pong")
// render...
```

## Common Issues and Solutions

### Issue: "WebGL2 not supported"

**Solution**: WebGL2 is supported in all modern browsers. Update your browser or check if hardware acceleration is enabled.

### Issue: Shader compilation errors

**Solution**: Ensure shaders use WebGL2 syntax. Check the browser console for detailed error messages.

### Issue: Black screen after migration

**Solution**: 
1. Check that textures are properly bound
2. Verify shader uniforms are set
3. Ensure VAOs are properly configured
4. Check framebuffer completeness

### Issue: Performance degradation

**Solution**:
1. Profile using browser DevTools
2. Ensure VAOs are being used
3. Check texture formats (prefer RGBA8)
4. Verify GPU tier detection is working

## Testing Migration

1. **Unit Tests**: Update tests to mock the new WebGL2 library
2. **Visual Tests**: Compare output before/after migration
3. **Performance Tests**: Measure FPS and frame times
4. **Compatibility Tests**: Test on different GPUs/browsers

## Rollback Plan

If issues arise during migration:

1. Keep the old implementations alongside new ones
2. Use feature flags to switch between implementations
3. Gradually migrate one module at a time
4. Monitor performance metrics

## Future Improvements

After migration, consider implementing:

1. **Compute Shaders** (when WebGPU becomes available)
2. **Texture Arrays** for batch processing
3. **Instanced Rendering** for particles
4. **Transform Feedback** for GPU-based animations
5. **Multiple Render Targets** for advanced effects