# Browser API Mocks

This directory contains comprehensive mocks for browser APIs used in testing environment.

## Available Mocks

### Canvas API (`canvas.ts`)

**Purpose**: Mocks HTML5 Canvas API for JSDOM test environment where Canvas is not natively supported.

**Features**:
- Full 2D Canvas rendering context mock
- Basic WebGL context mock
- Canvas element methods (toDataURL, toBlob, captureStream)
- ImageData creation and manipulation
- Gradient and pattern creation
- All drawing operations (fill, stroke, paths, etc.)

**Usage**:
```typescript
import { canvasTestHelpers } from '@/test/mocks/browser/canvas'

// Canvas API is automatically mocked when imported
// No additional setup required in most cases

// Helper functions for testing
const mockImageData = canvasTestHelpers.createMockImageData(100, 100)
const mockCanvas = canvasTestHelpers.createMockCanvas(300, 150)

// Check if canvas operations were called
canvasTestHelpers.expectCanvasOperations(canvas, ['clearRect', 'drawImage'])
```

**Covered APIs**:
- `HTMLCanvasElement.prototype.getContext()`
- `CanvasRenderingContext2D` (complete)
- `WebGLRenderingContext` (basic)
- `ImageData` creation
- Canvas to blob/data URL conversion

### DOM API (`dom.ts`)

Mocks for DOM-related browser APIs:
- ResizeObserver
- IntersectionObserver
- matchMedia
- localStorage
- clipboard API
- URL object methods

### Media API (`media.ts`)

Mocks for HTML5 media APIs:
- HTMLVideoElement
- HTMLAudioElement
- MediaStream
- AudioContext (basic)

## Setup

All browser mocks are automatically configured when the test setup imports `@/test/mocks/browser`.

```typescript
// In src/test/setup.ts
import "@/test/mocks/browser"  // Automatically sets up all browser mocks
```

## Testing Canvas Components

### Example: Testing a Canvas Drawing Component

```typescript
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { canvasTestHelpers } from '@/test/mocks/browser/canvas'

test('should draw on canvas', () => {
  const { container } = render(<MyCanvasComponent />)
  
  const canvas = container.querySelector('canvas')
  const ctx = canvas?.getContext('2d')
  
  // Verify canvas operations
  expect(ctx?.clearRect).toHaveBeenCalled()
  expect(ctx?.drawImage).toHaveBeenCalled()
  
  // Check operation count
  const clearCount = canvasTestHelpers.getCanvasCallCount(canvas, 'clearRect')
  expect(clearCount).toBe(1)
})
```

### Example: Testing Image Data Operations

```typescript
test('should process image data', () => {
  const canvas = canvasTestHelpers.createMockCanvas()
  const ctx = canvas.getContext('2d')
  
  // Create mock image data
  const imageData = canvasTestHelpers.createMockImageData(50, 50)
  
  // Test image data operations
  ctx?.putImageData(imageData, 0, 0)
  expect(ctx?.putImageData).toHaveBeenCalledWith(imageData, 0, 0)
})
```

## Architecture

### Mock Organization

```
src/test/mocks/browser/
├── canvas.ts          # Canvas API mocks
├── dom.ts            # DOM API mocks  
├── media.ts          # Media API mocks
├── index.ts          # Main export file
└── README.md         # This documentation
```

### Canvas Mock Structure

```typescript
// Mock Context with all Canvas 2D methods
mockCanvasContext2D: {
  // State properties
  fillStyle, strokeStyle, lineWidth, etc.
  
  // Drawing methods
  clearRect, fillRect, strokeRect, etc.
  
  // Path methods
  beginPath, moveTo, lineTo, arc, etc.
  
  // Image methods
  drawImage, getImageData, putImageData, etc.
  
  // Text methods
  fillText, strokeText, measureText, etc.
  
  // Transform methods
  scale, rotate, translate, etc.
}
```

## Troubleshooting

### Common Issues

1. **Canvas context returns null**
   - Ensure the mock is imported before the component under test
   - Check that `setupCanvasMocks()` has been called

2. **Missing Canvas methods**
   - Check if the method is included in the mock
   - Add missing methods to `mockCanvasContext2D` if needed

3. **ImageData type errors**
   - Ensure `colorSpace` property is included in mock ImageData
   - Use `canvasTestHelpers.createMockImageData()` for type-safe creation

### Error: "Not implemented: HTMLCanvasElement.prototype.getContext"

This error indicates Canvas mocks are not properly loaded. Solutions:

1. **Ensure proper import order**:
```typescript
// In test file
import '@/test/mocks/browser'  // Must be before component imports
import { MyCanvasComponent } from './my-component'
```

2. **Manual setup in specific tests**:
```typescript
import { setupCanvasMocks } from '@/test/mocks/browser/canvas'

beforeEach(() => {
  setupCanvasMocks()
})
```

## Browser Compatibility

These mocks are designed for JSDOM test environment and provide:

- ✅ Canvas 2D API (complete)
- ✅ WebGL API (basic operations)
- ✅ ImageData creation and manipulation
- ✅ Canvas element methods
- ✅ Gradient and pattern creation
- ⚠️  Advanced WebGL features (limited)
- ❌ Hardware acceleration (not applicable in tests)

## Contributing

When adding new Canvas functionality:

1. Add the method to `mockCanvasContext2D`
2. Ensure proper TypeScript typing
3. Add helper functions to `canvasTestHelpers` if needed
4. Include tests for the new mock functionality
5. Update this documentation

## Files That Use Canvas API

Current components and services that rely on Canvas API:

- `src/features/timeline/components/speed-ramping/speed-curve-editor.tsx`
- `src/features/color-grading/components/color-wheels/color-wheel.tsx`
- `src/features/video-compiler/services/frame-extraction-service.ts`
- `src/features/video-player/services/frame-capture-service.ts`

All these components now work seamlessly with the Canvas mocks in test environment.