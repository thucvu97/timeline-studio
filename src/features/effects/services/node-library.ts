import * as colorNodes from "./nodes/color-nodes"
// Import all node processors
import * as maskNodes from "./nodes/mask-nodes"
import * as mathNodes from "./nodes/math-nodes"
import * as timeNodes from "./nodes/time-nodes"
import * as transformNodes from "./nodes/transform-nodes"

import type { CompositeNode, NodeLibraryItem, NodeProcessor } from "../types/node-compositing"

/**
 * Base node processors
 */

// Source Nodes
const videoSourceProcessor: NodeProcessor = {
  type: "video_source",
  category: "source",

  getDefaultOutputs: () => [
    {
      id: "video",
      name: "Video",
      type: "video",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "source",
      name: "Source",
      type: "text",
      value: "",
    },
    {
      id: "loop",
      name: "Loop",
      type: "boolean",
      value: true,
    },
  ],

  process: async (node, _inputs, context) => {
    // In real implementation, this would load and decode video
    return {
      video: {
        type: "video",
        source: node.parameters.find((p) => p.id === "source")?.value,
        frame: context.frameNumber,
      },
    }
  },
}

const colorSourceProcessor: NodeProcessor = {
  type: "color_source",
  category: "source",

  getDefaultOutputs: () => [
    {
      id: "image",
      name: "Image",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "color",
      name: "Color",
      type: "color",
      value: "#000000",
    },
  ],

  process: async (node, _inputs, context) => {
    return {
      image: {
        type: "image",
        color: node.parameters.find((p) => p.id === "color")?.value,
        width: context.resolution.width,
        height: context.resolution.height,
      },
    }
  },
}

// Filter Nodes
const blurProcessor: NodeProcessor = {
  type: "blur_filter",
  category: "filter",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "image",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "radius",
      name: "Blur Radius",
      type: "number",
      value: 5,
      min: 0,
      max: 100,
      step: 0.1,
    },
    {
      id: "method",
      name: "Method",
      type: "select",
      value: "gaussian",
      options: [
        { value: "gaussian", label: "Gaussian" },
        { value: "box", label: "Box" },
        { value: "motion", label: "Motion" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const radius = node.parameters.find((p) => p.id === "radius")?.value || 5

    // Apply blur effect
    return {
      output: {
        ...input,
        effects: [...(input.effects || []), { type: "blur", radius }],
      },
    }
  },
}

// Composite Nodes
const blendProcessor: NodeProcessor = {
  type: "blend",
  category: "composite",

  getDefaultInputs: () => [
    {
      id: "background",
      name: "Background",
      type: "image",
      direction: "input",
      required: true,
    },
    {
      id: "foreground",
      name: "Foreground",
      type: "image",
      direction: "input",
      required: true,
    },
    {
      id: "mask",
      name: "Mask",
      type: "mask",
      direction: "input",
      required: false,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "mode",
      name: "Blend Mode",
      type: "select",
      value: "normal",
      options: [
        { value: "normal", label: "Normal" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
        { value: "overlay", label: "Overlay" },
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
      ],
    },
    {
      id: "opacity",
      name: "Opacity",
      type: "number",
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const { background, foreground, mask } = inputs
    const mode = node.parameters.find((p) => p.id === "mode")?.value || "normal"
    const opacity = node.parameters.find((p) => p.id === "opacity")?.value || 1

    return {
      output: {
        type: "image",
        composite: {
          background,
          foreground,
          mask,
          mode,
          opacity,
        },
      },
    }
  },
}

// Transform Nodes
const transformProcessor: NodeProcessor = {
  type: "transform",
  category: "transform",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "image",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "position_x",
      name: "Position X",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      animatable: true,
    },
    {
      id: "position_y",
      name: "Position Y",
      type: "number",
      value: 0,
      min: -1000,
      max: 1000,
      animatable: true,
    },
    {
      id: "scale",
      name: "Scale",
      type: "number",
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "rotation",
      name: "Rotation",
      type: "number",
      value: 0,
      min: -360,
      max: 360,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const transform = {
      x: node.parameters.find((p) => p.id === "position_x")?.value || 0,
      y: node.parameters.find((p) => p.id === "position_y")?.value || 0,
      scale: node.parameters.find((p) => p.id === "scale")?.value || 1,
      rotation: node.parameters.find((p) => p.id === "rotation")?.value || 0,
    }

    return {
      output: {
        ...input,
        transform,
      },
    }
  },
}

// Output Nodes
const outputProcessor: NodeProcessor = {
  type: "output",
  category: "output",

  getDefaultInputs: () => [
    {
      id: "input",
      name: "Input",
      type: "image",
      direction: "input",
      required: true,
    },
  ],

  getDefaultParameters: () => [
    {
      id: "format",
      name: "Format",
      type: "select",
      value: "rgba",
      options: [
        { value: "rgba", label: "RGBA" },
        { value: "rgb", label: "RGB" },
        { value: "yuv", label: "YUV" },
      ],
    },
  ],

  process: async (_node, inputs, _context) => {
    return {
      final: inputs.input,
    }
  },
}

/**
 * Node Library
 */
export const nodeLibrary: NodeLibraryItem[] = [
  // Sources
  {
    type: "video_source",
    name: "Video Source",
    description: "Load video from file or URL",
    category: "source",
    icon: "video",
    tags: ["video", "input", "media"],
    processor: videoSourceProcessor,
  },
  {
    type: "color_source",
    name: "Color",
    description: "Solid color generator",
    category: "source",
    icon: "palette",
    tags: ["color", "solid", "generator"],
    processor: colorSourceProcessor,
  },

  // Filters
  {
    type: "blur_filter",
    name: "Blur",
    description: "Apply blur effect",
    category: "filter",
    icon: "blur",
    tags: ["blur", "filter", "effect"],
    processor: blurProcessor,
  },

  // Composite
  {
    type: "blend",
    name: "Blend",
    description: "Blend two images together",
    category: "composite",
    icon: "layers",
    tags: ["blend", "composite", "merge"],
    processor: blendProcessor,
  },

  // Transform
  {
    type: "transform",
    name: "Transform",
    description: "Position, scale and rotate",
    category: "transform",
    icon: "transform",
    tags: ["transform", "position", "scale", "rotate"],
    processor: transformProcessor,
  },

  // Mask Nodes
  {
    type: "luma_key",
    name: "Luma Key",
    description: "Create mask from luminance",
    category: "mask",
    icon: "mask",
    tags: ["mask", "luma", "key"],
    processor: maskNodes.lumaKeyProcessor,
  },
  {
    type: "alpha_extract",
    name: "Alpha Extract",
    description: "Extract alpha channel as mask",
    category: "mask",
    icon: "alpha",
    tags: ["alpha", "mask", "extract"],
    processor: maskNodes.alphaExtractProcessor,
  },
  {
    type: "mask_combine",
    name: "Mask Combine",
    description: "Combine multiple masks",
    category: "mask",
    icon: "merge",
    tags: ["mask", "combine", "merge"],
    processor: maskNodes.maskCombineProcessor,
  },
  {
    type: "mask_blur",
    name: "Mask Blur",
    description: "Blur mask edges",
    category: "mask",
    icon: "blur",
    tags: ["mask", "blur", "soften"],
    processor: maskNodes.maskBlurProcessor,
  },
  {
    type: "edge_detect",
    name: "Edge Detect",
    description: "Create mask from edges",
    category: "mask",
    icon: "edges",
    tags: ["edge", "detection", "mask"],
    processor: maskNodes.edgeDetectProcessor,
  },
  {
    type: "garbage_matte",
    name: "Garbage Matte",
    description: "Manual mask drawing",
    category: "mask",
    icon: "draw",
    tags: ["garbage", "matte", "manual"],
    processor: maskNodes.garbageMatteProcessor,
  },
  {
    type: "mask_morphology",
    name: "Mask Morphology",
    description: "Erode or dilate mask",
    category: "mask",
    icon: "expand",
    tags: ["erode", "dilate", "morphology"],
    processor: maskNodes.maskMorphologyProcessor,
  },

  // Math Nodes
  {
    type: "math_operation",
    name: "Math",
    description: "Basic math operations",
    category: "utility",
    icon: "calculator",
    tags: ["math", "calculate", "operation"],
    processor: mathNodes.mathOperationProcessor,
  },
  {
    type: "compare",
    name: "Compare",
    description: "Comparison operations",
    category: "utility",
    icon: "compare",
    tags: ["compare", "logic", "condition"],
    processor: mathNodes.compareProcessor,
  },
  {
    type: "logic_gate",
    name: "Logic Gate",
    description: "Boolean operations",
    category: "utility",
    icon: "logic",
    tags: ["logic", "boolean", "gate"],
    processor: mathNodes.logicGateProcessor,
  },
  {
    type: "clamp",
    name: "Clamp",
    description: "Limit value to range",
    category: "utility",
    icon: "clamp",
    tags: ["clamp", "limit", "range"],
    processor: mathNodes.clampProcessor,
  },
  {
    type: "remap",
    name: "Remap",
    description: "Map value from one range to another",
    category: "utility",
    icon: "remap",
    tags: ["remap", "map", "range"],
    processor: mathNodes.remapProcessor,
  },
  {
    type: "random",
    name: "Random",
    description: "Generate random values",
    category: "utility",
    icon: "random",
    tags: ["random", "noise", "generate"],
    processor: mathNodes.randomProcessor,
  },
  {
    type: "switch",
    name: "Switch",
    description: "Select between inputs",
    category: "utility",
    icon: "switch",
    tags: ["switch", "select", "condition"],
    processor: mathNodes.switchProcessor,
  },

  // Color Nodes
  {
    type: "color_wheels",
    name: "Color Wheels",
    description: "Professional 3-way color correction",
    category: "color",
    icon: "color-wheel",
    tags: ["color", "wheels", "grading"],
    processor: colorNodes.colorWheelsProcessor,
  },
  {
    type: "hsl_adjust",
    name: "HSL Adjust",
    description: "Hue, Saturation, Lightness adjustment",
    category: "color",
    icon: "hsl",
    tags: ["hsl", "hue", "saturation"],
    processor: colorNodes.hslAdjustProcessor,
  },
  {
    type: "curves",
    name: "Curves",
    description: "RGB and Luma curves",
    category: "color",
    icon: "curves",
    tags: ["curves", "rgb", "luma"],
    processor: colorNodes.curvesProcessor,
  },
  {
    type: "color_replace",
    name: "Color Replace",
    description: "Replace specific colors",
    category: "color",
    icon: "replace",
    tags: ["color", "replace", "change"],
    processor: colorNodes.colorReplaceProcessor,
  },
  {
    type: "lut_apply",
    name: "LUT Apply",
    description: "Apply color lookup table",
    category: "color",
    icon: "lut",
    tags: ["lut", "lookup", "table"],
    processor: colorNodes.lutApplyProcessor,
  },
  {
    type: "selective_color",
    name: "Selective Color",
    description: "Adjust specific color ranges",
    category: "color",
    icon: "selective",
    tags: ["selective", "color", "range"],
    processor: colorNodes.selectiveColorProcessor,
  },
  {
    type: "channel_mixer",
    name: "Channel Mixer",
    description: "Mix RGB channels",
    category: "color",
    icon: "mixer",
    tags: ["channel", "mixer", "rgb"],
    processor: colorNodes.channelMixerProcessor,
  },

  // Time Nodes
  {
    type: "time_remap",
    name: "Time Remap",
    description: "Control playback speed and direction",
    category: "time",
    icon: "time",
    tags: ["time", "remap", "speed"],
    processor: timeNodes.timeRemapProcessor,
  },
  {
    type: "echo",
    name: "Echo",
    description: "Create trailing echoes/ghosts",
    category: "time",
    icon: "echo",
    tags: ["echo", "trail", "ghost"],
    processor: timeNodes.echoProcessor,
  },
  {
    type: "frame_hold",
    name: "Frame Hold",
    description: "Freeze frame",
    category: "time",
    icon: "freeze",
    tags: ["frame", "hold", "freeze"],
    processor: timeNodes.frameHoldProcessor,
  },
  {
    type: "strobe",
    name: "Strobe",
    description: "Strobe/flash effect",
    category: "time",
    icon: "strobe",
    tags: ["strobe", "flash", "blink"],
    processor: timeNodes.strobeProcessor,
  },
  {
    type: "time_expression",
    name: "Time Expression",
    description: "Custom time-based expressions",
    category: "time",
    icon: "expression",
    tags: ["time", "expression", "animate"],
    processor: timeNodes.timeExpressionProcessor,
  },
  {
    type: "posterize_time",
    name: "Posterize Time",
    description: "Reduce frame rate",
    category: "time",
    icon: "posterize",
    tags: ["posterize", "framerate", "reduce"],
    processor: timeNodes.posterizeTimeProcessor,
  },

  // Transform Nodes
  {
    type: "transform_3d",
    name: "Transform 3D",
    description: "Advanced 3D transformation",
    category: "transform",
    icon: "3d",
    tags: ["3d", "transform", "perspective"],
    processor: transformNodes.transform3DProcessor,
  },
  {
    type: "lens_distortion",
    name: "Lens Distortion",
    description: "Barrel/Pincushion distortion",
    category: "transform",
    icon: "lens",
    tags: ["lens", "distortion", "barrel"],
    processor: transformNodes.lensDistortionProcessor,
  },
  {
    type: "turbulent_displace",
    name: "Turbulent Displace",
    description: "Organic distortion",
    category: "transform",
    icon: "turbulent",
    tags: ["turbulent", "displace", "organic"],
    processor: transformNodes.turbulentDisplaceProcessor,
  },
  {
    type: "wave_warp",
    name: "Wave Warp",
    description: "Wave distortion",
    category: "transform",
    icon: "wave",
    tags: ["wave", "warp", "distort"],
    processor: transformNodes.waveWarpProcessor,
  },
  {
    type: "mirror",
    name: "Mirror",
    description: "Mirror and kaleidoscope effects",
    category: "transform",
    icon: "mirror",
    tags: ["mirror", "kaleidoscope", "reflect"],
    processor: transformNodes.mirrorProcessor,
  },
  {
    type: "polar_coordinates",
    name: "Polar Coordinates",
    description: "Rectangular to polar conversion",
    category: "transform",
    icon: "polar",
    tags: ["polar", "coordinates", "convert"],
    processor: transformNodes.polarCoordinatesProcessor,
  },

  // Output
  {
    type: "output",
    name: "Output",
    description: "Final render output",
    category: "output",
    icon: "output",
    tags: ["output", "render", "final"],
    processor: outputProcessor,
  },
]

/**
 * Get node processor by type
 */
export function getNodeProcessor(type: string): NodeProcessor | null {
  const item = nodeLibrary.find((item) => item.type === type)
  return item?.processor || null
}

/**
 * Create node from library item
 */
export function createNodeFromLibrary(type: string, position: { x: number; y: number }): CompositeNode | null {
  const processor = getNodeProcessor(type)
  const item = nodeLibrary.find((item) => item.type === type)

  if (!processor || !item) return null

  return {
    id: `${type}_${Date.now()}`,
    type,
    name: item.name,
    category: item.category,
    position,
    inputs: processor.getDefaultInputs?.() || [],
    outputs: processor.getDefaultOutputs?.() || [],
    parameters: processor.getDefaultParameters?.() || [],
    preview: true,
    cached: false,
  }
}
