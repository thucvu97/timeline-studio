import type { NodeProcessor } from "../../types/node-compositing"

/**
 * Transform and Distortion Nodes
 */

// Transform 3D - Advanced 3D transformation
export const transform3DProcessor: NodeProcessor = {
  type: "transform_3d",
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
      min: -2000,
      max: 2000,
      step: 1,
      animatable: true,
    },
    {
      id: "position_y",
      name: "Position Y",
      type: "number",
      value: 0,
      min: -2000,
      max: 2000,
      step: 1,
      animatable: true,
    },
    {
      id: "position_z",
      name: "Position Z",
      type: "number",
      value: 0,
      min: -2000,
      max: 2000,
      step: 1,
      animatable: true,
    },
    {
      id: "rotation_x",
      name: "Rotation X",
      type: "number",
      value: 0,
      min: -720,
      max: 720,
      step: 1,
      animatable: true,
    },
    {
      id: "rotation_y",
      name: "Rotation Y",
      type: "number",
      value: 0,
      min: -720,
      max: 720,
      step: 1,
      animatable: true,
    },
    {
      id: "rotation_z",
      name: "Rotation Z",
      type: "number",
      value: 0,
      min: -720,
      max: 720,
      step: 1,
      animatable: true,
    },
    {
      id: "scale_x",
      name: "Scale X",
      type: "number",
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "scale_y",
      name: "Scale Y",
      type: "number",
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "scale_z",
      name: "Scale Z",
      type: "number",
      value: 1,
      min: 0,
      max: 10,
      step: 0.01,
      animatable: true,
    },
    {
      id: "anchor_x",
      name: "Anchor X",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "anchor_y",
      name: "Anchor Y",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "perspective",
      name: "Perspective",
      type: "number",
      value: 1000,
      min: 100,
      max: 5000,
      step: 10,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const params = Object.fromEntries(node.parameters.map((p) => [p.id, p.value]))

    return {
      output: {
        ...input,
        transform3d: {
          position: { x: params.position_x, y: params.position_y, z: params.position_z },
          rotation: { x: params.rotation_x, y: params.rotation_y, z: params.rotation_z },
          scale: { x: params.scale_x, y: params.scale_y, z: params.scale_z },
          anchor: { x: params.anchor_x, y: params.anchor_y },
          perspective: params.perspective,
        },
      },
    }
  },
}

// Lens Distortion - Barrel/Pincushion distortion
export const lensDistortionProcessor: NodeProcessor = {
  type: "lens_distortion",
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
      id: "distortion",
      name: "Distortion",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "curvature",
      name: "Curvature",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "center_x",
      name: "Center X",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "center_y",
      name: "Center Y",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "chromatic_aberration",
      name: "Chromatic Aberration",
      type: "number",
      value: 0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "scale_to_fit",
      name: "Scale to Fit",
      type: "boolean",
      value: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const distortion = node.parameters.find((p) => p.id === "distortion")?.value || 0
    const curvature = node.parameters.find((p) => p.id === "curvature")?.value || 0
    const centerX = node.parameters.find((p) => p.id === "center_x")?.value || 0.5
    const centerY = node.parameters.find((p) => p.id === "center_y")?.value || 0.5
    const chromaticAberration = node.parameters.find((p) => p.id === "chromatic_aberration")?.value || 0
    const scaleToFit = node.parameters.find((p) => p.id === "scale_to_fit")?.value ?? true

    return {
      output: {
        ...input,
        lensDistortion: {
          distortion,
          curvature,
          center: { x: centerX, y: centerY },
          chromaticAberration,
          scaleToFit,
        },
      },
    }
  },
}

// Turbulent Displace - Organic distortion
export const turbulentDisplaceProcessor: NodeProcessor = {
  type: "turbulent_displace",
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
      id: "amount",
      name: "Amount",
      type: "number",
      value: 20,
      min: 0,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "size",
      name: "Size",
      type: "number",
      value: 50,
      min: 1,
      max: 500,
      step: 1,
      animatable: true,
    },
    {
      id: "octaves",
      name: "Octaves",
      type: "number",
      value: 3,
      min: 1,
      max: 8,
      step: 1,
    },
    {
      id: "evolution",
      name: "Evolution",
      type: "number",
      value: 0,
      min: 0,
      max: 720,
      step: 1,
      animatable: true,
    },
    {
      id: "seed",
      name: "Random Seed",
      type: "number",
      value: 0,
      min: 0,
      max: 1000,
      step: 1,
    },
    {
      id: "pinning",
      name: "Edge Pinning",
      type: "boolean",
      value: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const amount = node.parameters.find((p) => p.id === "amount")?.value || 20
    const size = node.parameters.find((p) => p.id === "size")?.value || 50
    const octaves = node.parameters.find((p) => p.id === "octaves")?.value || 3
    const evolution = node.parameters.find((p) => p.id === "evolution")?.value || 0
    const seed = node.parameters.find((p) => p.id === "seed")?.value || 0
    const pinning = node.parameters.find((p) => p.id === "pinning")?.value ?? true

    return {
      output: {
        ...input,
        turbulentDisplace: {
          amount,
          size,
          octaves,
          evolution: evolution / 360,
          seed,
          pinning,
        },
      },
    }
  },
}

// Wave Warp - Wave distortion
export const waveWarpProcessor: NodeProcessor = {
  type: "wave_warp",
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
      id: "wave_type",
      name: "Wave Type",
      type: "select",
      value: "sine",
      options: [
        { value: "sine", label: "Sine" },
        { value: "triangle", label: "Triangle" },
        { value: "square", label: "Square" },
        { value: "sawtooth", label: "Sawtooth" },
      ],
    },
    {
      id: "direction",
      name: "Direction",
      type: "number",
      value: 0,
      min: 0,
      max: 360,
      step: 1,
      animatable: true,
    },
    {
      id: "amplitude",
      name: "Amplitude",
      type: "number",
      value: 10,
      min: 0,
      max: 100,
      step: 0.1,
      animatable: true,
    },
    {
      id: "frequency",
      name: "Frequency",
      type: "number",
      value: 5,
      min: 0.1,
      max: 50,
      step: 0.1,
      animatable: true,
    },
    {
      id: "phase",
      name: "Phase",
      type: "number",
      value: 0,
      min: 0,
      max: 360,
      step: 1,
      animatable: true,
    },
    {
      id: "antialiasing",
      name: "Antialiasing",
      type: "select",
      value: "medium",
      options: [
        { value: "none", label: "None" },
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const waveType = node.parameters.find((p) => p.id === "wave_type")?.value || "sine"
    const direction = node.parameters.find((p) => p.id === "direction")?.value || 0
    const amplitude = node.parameters.find((p) => p.id === "amplitude")?.value || 10
    const frequency = node.parameters.find((p) => p.id === "frequency")?.value || 5
    const phase = node.parameters.find((p) => p.id === "phase")?.value || 0
    const antialiasing = node.parameters.find((p) => p.id === "antialiasing")?.value || "medium"

    return {
      output: {
        ...input,
        waveWarp: {
          type: waveType,
          direction: (direction * Math.PI) / 180,
          amplitude,
          frequency,
          phase: (phase * Math.PI) / 180,
          antialiasing,
        },
      },
    }
  },
}

// Mirror - Mirror and kaleidoscope effects
export const mirrorProcessor: NodeProcessor = {
  type: "mirror",
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
      id: "mode",
      name: "Mode",
      type: "select",
      value: "horizontal",
      options: [
        { value: "horizontal", label: "Horizontal" },
        { value: "vertical", label: "Vertical" },
        { value: "quad", label: "Quad" },
        { value: "kaleidoscope", label: "Kaleidoscope" },
      ],
    },
    {
      id: "center_x",
      name: "Center X",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "center_y",
      name: "Center Y",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "angle",
      name: "Angle",
      type: "number",
      value: 0,
      min: 0,
      max: 360,
      step: 1,
      animatable: true,
    },
    {
      id: "segments",
      name: "Segments",
      type: "number",
      value: 6,
      min: 2,
      max: 32,
      step: 1,
      visible: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const mode = node.parameters.find((p) => p.id === "mode")?.value || "horizontal"
    const centerX = node.parameters.find((p) => p.id === "center_x")?.value || 0.5
    const centerY = node.parameters.find((p) => p.id === "center_y")?.value || 0.5
    const angle = node.parameters.find((p) => p.id === "angle")?.value || 0
    const segments = node.parameters.find((p) => p.id === "segments")?.value || 6

    return {
      output: {
        ...input,
        mirror: {
          mode,
          center: { x: centerX, y: centerY },
          angle: (angle * Math.PI) / 180,
          segments: mode === "kaleidoscope" ? segments : 1,
        },
      },
    }
  },
}

// Polar Coordinates - Rectangular to polar conversion
export const polarCoordinatesProcessor: NodeProcessor = {
  type: "polar_coordinates",
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
      id: "type",
      name: "Type",
      type: "select",
      value: "rect_to_polar",
      options: [
        { value: "rect_to_polar", label: "Rectangular to Polar" },
        { value: "polar_to_rect", label: "Polar to Rectangular" },
      ],
    },
    {
      id: "interpolation",
      name: "Interpolation",
      type: "number",
      value: 100,
      min: 0,
      max: 100,
      step: 1,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const type = node.parameters.find((p) => p.id === "type")?.value || "rect_to_polar"
    const interpolation = node.parameters.find((p) => p.id === "interpolation")?.value || 100

    return {
      output: {
        ...input,
        polarCoordinates: {
          type,
          interpolation: interpolation / 100,
        },
      },
    }
  },
}
