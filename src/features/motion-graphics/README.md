# Motion Graphics Module

## Overview

The Motion Graphics module provides a professional keyframe-based animation system for Timeline Studio. It enables creation of complex animations for object properties over time, similar to After Effects or other professional motion design tools.

## Key Features

### 🎯 Core Capabilities
- **Keyframe Animation** - Full keyframe-based animation system
- **Multiple Interpolation Types** - Linear, Bezier, Ease, Bounce, Elastic, and more
- **Expression Engine** - JavaScript expressions for procedural animation
- **Motion Presets** - Ready-to-use animation presets
- **Layer System** - Hierarchical animation layers with blending modes
- **Timeline Integration** - Seamless integration with main timeline

### 🔧 Technical Features
- Animate any numeric, vector, color, or text property
- Visual curve editor for precise control
- Real-time preview and playback
- Copy/paste animations between clips
- Import/export animation data
- Performance optimized for smooth playback

## Architecture

### Module Structure
```
src/features/motion-graphics/
├── components/
│   ├── motion-graphics-panel.tsx  # Main control panel
│   └── curve-editor.tsx          # Visual curve editor
├── services/
│   ├── keyframe-manager.ts       # Keyframe CRUD operations
│   ├── interpolation.ts          # Interpolation algorithms
│   ├── expression-engine.ts      # JavaScript expression evaluator
│   ├── animation-layers.ts       # Layer management system
│   ├── preset-manager.ts         # Preset loading and management
│   └── timeline-integration.ts   # Timeline clip integration
├── types/
│   └── keyframe.ts              # TypeScript definitions
├── data/
│   └── motion-presets.json      # Built-in animation presets
└── hooks/
    └── use-motion-graphics.ts   # React hook for components
```

### Core Types

#### Keyframe
```typescript
interface Keyframe<T = KeyframeValue> {
  id: string
  time: number                    // Time in seconds
  value: T                        // Animated value
  interpolation: InterpolationType
  easeIn?: [number, number]       // Bezier control points
  easeOut?: [number, number]      // Bezier control points
  temporalEaseIn?: number         // Temporal easing (0-1)
  temporalEaseOut?: number        // Temporal easing (0-1)
}
```

#### Animated Property
```typescript
interface AnimatedProperty {
  id: string
  name: string
  path: string                    // e.g., "transform.position.x"
  type: "number" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "text"
  keyframes: Keyframe[]
  enabled: boolean
  expression?: string             // JavaScript expression
  expressionEnabled?: boolean
}
```

#### Animation Layer
```typescript
interface AnimationLayer {
  id: string
  name: string
  properties: AnimatedProperty[]
  enabled: boolean
  solo: boolean
  locked: boolean
  opacity: number                 // 0-1, for blending
  blendMode: "normal" | "add" | "multiply" | "screen" | "overlay"
}
```

## Interpolation Types

The module supports various interpolation types for different animation styles:

- **Linear** - Constant speed between keyframes
- **Bezier** - Smooth curves with customizable handles
- **Hold** - No interpolation (instant change)
- **Ease** - Smooth acceleration/deceleration
- **Ease In** - Start slow, end fast
- **Ease Out** - Start fast, end slow
- **Ease In Out** - Slow at both ends
- **Bounce** - Bouncing ball physics
- **Elastic** - Spring-like overshoot
- **Back** - Anticipation and overshoot
- **Expo** - Exponential acceleration

## Expression Engine

### Built-in Functions
```javascript
// Math functions
sin(x), cos(x), tan(x), abs(x), sqrt(x), pow(x,y)
min(...), max(...), floor(x), ceil(x), round(x), random()

// Interpolation
linear(a, b, t)

// Easing
easeIn(t), easeOut(t), easeInOut(t)

// Noise
noise(x, seed)

// Waves
sawtooth(t, period), triangle(t, period), square(t, period)

// Utilities
clamp(value, min, max)
map(value, inMin, inMax, outMin, outMax)
smoothstep(edge0, edge1, x)

// Vector operations
vec2(x, y), vec3(x, y, z), vec4(x, y, z, w)
length(v), normalize(v), dot(a, b)

// Color
rgb(r, g, b), hsl(h, s, l)

// Animation helpers
wiggle(freq, amp, octaves, ampMult, time)
loopIn(type, numKeyframes)
loopOut(type, numKeyframes)
```

### Expression Context
```javascript
// Available variables in expressions:
time        // Current time in seconds
frame       // Current frame number
fps         // Frames per second
value       // Current property value
velocity    // Current velocity
index       // Layer index
comp        // Composition info {width, height, duration}
```

### Expression Examples
```javascript
// Wiggle effect
value + wiggle(2, 50)

// Sine wave oscillation
value + sin(time * 2 * Math.PI) * 50

// Fade in over 0.5 seconds
value * clamp(time * 2, 0, 1)

// Typewriter text reveal
Math.floor(time * 10)

// Damped pendulum
45 * Math.exp(-0.1 * time) * sin(2 * Math.PI * time / 1.5)
```

## Motion Presets

### Categories
- **Text Animations** - Typewriter, scramble, wave text
- **Transitions** - Fades, slides, zooms
- **Transforms** - Scale, rotate, position animations
- **Effects** - Blur, glow, shadows
- **Behaviors** - Wiggle, pulse, pendulum

### Using Presets
```typescript
import { applyPreset, getPresetById } from './services/preset-manager'

// Apply a preset to create animation layer
const preset = getPresetById('typewriter')
const animationLayer = applyPreset(preset, {
  startTime: 0,
  duration: 2,
  customizations: {
    'opacity': { min: 0, max: 1 }
  }
})
```

## Timeline Integration

### Extending Timeline Clips
```typescript
import { applyMotionToClip } from './services/timeline-integration'

// Add animation to a clip
const animatedClip = applyMotionToClip(clip, animationTrack)

// Evaluate animation at specific time
const values = evaluateClipMotionAtTime(animatedClip, 1.5)
// Returns: { opacity: 0.75, position: [100, 200], ... }
```

### Animation Data in Clips
```typescript
interface AnimatedTimelineClip extends TimelineClip {
  motion?: {
    tracks: AnimationTrack[]
    enabled: boolean
  }
}
```

## Usage Examples

### Basic Animation
```typescript
import { createKeyframe, addKeyframeToProperty } from './services/keyframe-manager'

// Create opacity animation
const property: AnimatedProperty = {
  id: 'opacity',
  name: 'Opacity',
  path: 'opacity',
  type: 'number',
  keyframes: [],
  enabled: true
}

// Add keyframes
property = addKeyframeToProperty(property, createKeyframe(0, 0, 'ease-out'))
property = addKeyframeToProperty(property, createKeyframe(1, 1, 'linear'))
```

### Using Expressions
```typescript
import { ExpressionEvaluator } from './services/expression-engine'

const evaluator = new ExpressionEvaluator()
const context: ExpressionContext = {
  time: 1.5,
  frame: 45,
  fps: 30,
  value: 100,
  // ... other context
}

const result = evaluator.evaluate(
  'value + sin(time * 2 * Math.PI) * 50',
  context
)
```

### Creating Custom Presets
```typescript
import { createPresetFromLayer } from './services/preset-manager'

const customPreset = createPresetFromLayer(animationLayer, {
  name: 'My Custom Animation',
  description: 'Custom bounce effect',
  category: 'effects',
  tags: ['bounce', 'custom']
})
```

## Performance Optimization

- Expressions are compiled and cached for performance
- Keyframe interpolation uses optimized algorithms
- Layer compositing is done efficiently
- Only visible properties are evaluated
- Smart caching of computed values

## Best Practices

1. **Keyframe Density** - Use minimum keyframes needed for smooth animation
2. **Expression Complexity** - Keep expressions simple for better performance
3. **Layer Organization** - Group related properties in layers
4. **Preset Usage** - Start with presets and customize as needed
5. **Timeline Integration** - Ensure animation duration matches clip duration

## Testing

```bash
# Run motion graphics tests
bun run test src/features/motion-graphics

# Test specific components
bun run test src/features/motion-graphics/__tests__/keyframe-manager.test.ts
bun run test src/features/motion-graphics/__tests__/interpolation.test.ts
```

## Dependencies

- React 19+ for UI components
- XState for state management (if used)
- Canvas API for curve editor
- No external animation libraries required

## Future Enhancements

- [ ] Motion blur simulation
- [ ] Advanced easing curve editor
- [ ] Expression autocomplete
- [ ] Animation templates marketplace
- [ ] GPU acceleration for complex animations
- [ ] Motion capture data import

## License

Part of Timeline Studio project - see main project license.