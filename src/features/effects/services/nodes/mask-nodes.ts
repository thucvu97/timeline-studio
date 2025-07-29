import type { NodeProcessor } from "../../types/node-compositing"

/**
 * Mask and Alpha Channel Nodes
 */

// Luma Key - Create mask from luminance
export const lumaKeyProcessor: NodeProcessor = {
  type: "luma_key",
  category: "mask",

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
    {
      id: "mask",
      name: "Mask",
      type: "mask",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "threshold",
      name: "Threshold",
      type: "number",
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "softness",
      name: "Softness",
      type: "number",
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "invert",
      name: "Invert",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const threshold = node.parameters.find((p) => p.id === "threshold")?.value || 0.5
    const softness = node.parameters.find((p) => p.id === "softness")?.value || 0.1
    const invert = node.parameters.find((p) => p.id === "invert")?.value || false

    return {
      output: {
        ...input,
        mask: {
          type: "luma_key",
          threshold,
          softness,
          invert,
        },
      },
      mask: {
        type: "mask",
        source: "luma",
        threshold,
        softness,
        invert,
      },
    }
  },
}

// Alpha Extract - Extract alpha channel as mask
export const alphaExtractProcessor: NodeProcessor = {
  type: "alpha_extract",
  category: "mask",

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
      id: "alpha",
      name: "Alpha",
      type: "mask",
      direction: "output",
    },
    {
      id: "rgb",
      name: "RGB",
      type: "image",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "premultiply",
      name: "Premultiply",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const premultiply = node.parameters.find((p) => p.id === "premultiply")?.value || false

    return {
      alpha: {
        type: "mask",
        source: "alpha",
        channel: "a",
      },
      rgb: {
        ...input,
        alpha: premultiply ? "premultiplied" : "straight",
      },
    }
  },
}

// Mask Combine - Combine multiple masks
export const maskCombineProcessor: NodeProcessor = {
  type: "mask_combine",
  category: "mask",

  getDefaultInputs: () => [
    {
      id: "mask1",
      name: "Mask 1",
      type: "mask",
      direction: "input",
      required: true,
    },
    {
      id: "mask2",
      name: "Mask 2",
      type: "mask",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "mask",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "operation",
      name: "Operation",
      type: "select",
      value: "add",
      options: [
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
        { value: "multiply", label: "Multiply" },
        { value: "screen", label: "Screen" },
        { value: "min", label: "Minimum" },
        { value: "max", label: "Maximum" },
        { value: "difference", label: "Difference" },
      ],
    },
    {
      id: "mix",
      name: "Mix",
      type: "number",
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const { mask1, mask2 } = inputs
    const operation = node.parameters.find((p) => p.id === "operation")?.value || "add"
    const mix = node.parameters.find((p) => p.id === "mix")?.value || 1

    return {
      output: {
        type: "mask",
        combine: {
          mask1,
          mask2,
          operation,
          mix,
        },
      },
    }
  },
}

// Mask Blur - Blur mask edges
export const maskBlurProcessor: NodeProcessor = {
  type: "mask_blur",
  category: "mask",

  getDefaultInputs: () => [
    {
      id: "mask",
      name: "Mask",
      type: "mask",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "mask",
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
      animatable: true,
    },
    {
      id: "iterations",
      name: "Iterations",
      type: "number",
      value: 1,
      min: 1,
      max: 10,
      step: 1,
    },
  ],

  process: async (node, inputs, _context) => {
    const mask = inputs.mask
    const radius = node.parameters.find((p) => p.id === "radius")?.value || 5
    const iterations = node.parameters.find((p) => p.id === "iterations")?.value || 1

    return {
      output: {
        ...mask,
        effects: [
          ...(mask.effects || []),
          {
            type: "blur",
            radius,
            iterations,
          },
        ],
      },
    }
  },
}

// Edge Detect - Create mask from edges
export const edgeDetectProcessor: NodeProcessor = {
  type: "edge_detect",
  category: "mask",

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
      id: "edges",
      name: "Edges",
      type: "mask",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "method",
      name: "Method",
      type: "select",
      value: "sobel",
      options: [
        { value: "sobel", label: "Sobel" },
        { value: "canny", label: "Canny" },
        { value: "laplacian", label: "Laplacian" },
        { value: "roberts", label: "Roberts Cross" },
      ],
    },
    {
      id: "threshold",
      name: "Threshold",
      type: "number",
      value: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "blur_pre",
      name: "Pre-blur",
      type: "number",
      value: 0,
      min: 0,
      max: 10,
      step: 0.1,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const method = node.parameters.find((p) => p.id === "method")?.value || "sobel"
    const threshold = node.parameters.find((p) => p.id === "threshold")?.value || 0.1
    const blurPre = node.parameters.find((p) => p.id === "blur_pre")?.value || 0

    return {
      edges: {
        type: "mask",
        edgeDetection: {
          method,
          threshold,
          preBlur: blurPre,
        },
      },
    }
  },
}

// Garbage Matte - Manual mask drawing
export const garbageMatteProcessor: NodeProcessor = {
  type: "garbage_matte",
  category: "mask",

  getDefaultInputs: () => [],

  getDefaultOutputs: () => [
    {
      id: "mask",
      name: "Mask",
      type: "mask",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "shape",
      name: "Shape",
      type: "select",
      value: "rectangle",
      options: [
        { value: "rectangle", label: "Rectangle" },
        { value: "ellipse", label: "Ellipse" },
        { value: "polygon", label: "Polygon" },
        { value: "bezier", label: "Bezier" },
      ],
    },
    {
      id: "feather",
      name: "Feather",
      type: "number",
      value: 0,
      min: 0,
      max: 100,
      step: 0.1,
      animatable: true,
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
    {
      id: "invert",
      name: "Invert",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, _inputs, _context) => {
    const shape = node.parameters.find((p) => p.id === "shape")?.value || "rectangle"
    const feather = node.parameters.find((p) => p.id === "feather")?.value || 0
    const opacity = node.parameters.find((p) => p.id === "opacity")?.value || 1
    const invert = node.parameters.find((p) => p.id === "invert")?.value || false

    return {
      mask: {
        type: "mask",
        shape: {
          type: shape,
          feather,
          opacity,
          invert,
          // Shape data would be stored in node metadata
          points: [],
        },
      },
    }
  },
}

// Mask Erode/Dilate
export const maskMorphologyProcessor: NodeProcessor = {
  type: "mask_morphology",
  category: "mask",

  getDefaultInputs: () => [
    {
      id: "mask",
      name: "Mask",
      type: "mask",
      direction: "input",
      required: true,
    },
  ],

  getDefaultOutputs: () => [
    {
      id: "output",
      name: "Output",
      type: "mask",
      direction: "output",
    },
  ],

  getDefaultParameters: () => [
    {
      id: "operation",
      name: "Operation",
      type: "select",
      value: "dilate",
      options: [
        { value: "dilate", label: "Dilate (Expand)" },
        { value: "erode", label: "Erode (Contract)" },
        { value: "open", label: "Open" },
        { value: "close", label: "Close" },
      ],
    },
    {
      id: "radius",
      name: "Radius",
      type: "number",
      value: 1,
      min: 0,
      max: 50,
      step: 0.1,
      animatable: true,
    },
    {
      id: "shape",
      name: "Kernel Shape",
      type: "select",
      value: "circle",
      options: [
        { value: "circle", label: "Circle" },
        { value: "square", label: "Square" },
        { value: "diamond", label: "Diamond" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const mask = inputs.mask
    const operation = node.parameters.find((p) => p.id === "operation")?.value || "dilate"
    const radius = node.parameters.find((p) => p.id === "radius")?.value || 1
    const shape = node.parameters.find((p) => p.id === "shape")?.value || "circle"

    return {
      output: {
        ...mask,
        morphology: {
          operation,
          radius,
          shape,
        },
      },
    }
  },
}
