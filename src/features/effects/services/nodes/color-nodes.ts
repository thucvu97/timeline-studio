import type { NodeProcessor } from "../../types/node-compositing"

/**
 * Color Correction and Grading Nodes
 */

// Color Wheels - Professional 3-way color correction
export const colorWheelsProcessor: NodeProcessor = {
  type: "color_wheels",
  category: "color",

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
      id: "lift_r",
      name: "Lift Red",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "lift_g",
      name: "Lift Green",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "lift_b",
      name: "Lift Blue",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gamma_r",
      name: "Gamma Red",
      type: "number",
      value: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gamma_g",
      name: "Gamma Green",
      type: "number",
      value: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gamma_b",
      name: "Gamma Blue",
      type: "number",
      value: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gain_r",
      name: "Gain Red",
      type: "number",
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gain_g",
      name: "Gain Green",
      type: "number",
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "gain_b",
      name: "Gain Blue",
      type: "number",
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "preserve_luminosity",
      name: "Preserve Luminosity",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const params = Object.fromEntries(node.parameters.map((p) => [p.id, p.value]))

    return {
      output: {
        ...input,
        colorCorrection: {
          type: "color_wheels",
          lift: { r: params.lift_r, g: params.lift_g, b: params.lift_b },
          gamma: { r: params.gamma_r, g: params.gamma_g, b: params.gamma_b },
          gain: { r: params.gain_r, g: params.gain_g, b: params.gain_b },
          preserveLuminosity: params.preserve_luminosity,
        },
      },
    }
  },
}

// HSL Adjust - Hue, Saturation, Lightness adjustment
export const hslAdjustProcessor: NodeProcessor = {
  type: "hsl_adjust",
  category: "color",

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
      id: "hue_shift",
      name: "Hue Shift",
      type: "number",
      value: 0,
      min: -180,
      max: 180,
      step: 1,
      animatable: true,
    },
    {
      id: "saturation",
      name: "Saturation",
      type: "number",
      value: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
    },
    {
      id: "lightness",
      name: "Lightness",
      type: "number",
      value: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "colorize",
      name: "Colorize",
      type: "boolean",
      value: false,
    },
    {
      id: "colorize_hue",
      name: "Colorize Hue",
      type: "number",
      value: 0,
      min: 0,
      max: 360,
      step: 1,
      visible: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const hueShift = node.parameters.find((p) => p.id === "hue_shift")?.value || 0
    const saturation = node.parameters.find((p) => p.id === "saturation")?.value || 1
    const lightness = node.parameters.find((p) => p.id === "lightness")?.value || 0
    const colorize = node.parameters.find((p) => p.id === "colorize")?.value || false
    const colorizeHue = node.parameters.find((p) => p.id === "colorize_hue")?.value || 0

    return {
      output: {
        ...input,
        effects: [
          ...(input.effects || []),
          {
            type: "hsl_adjust",
            hue: hueShift,
            saturation,
            lightness,
            colorize,
            colorizeHue,
          },
        ],
      },
    }
  },
}

// Curves - RGB and Luma curves
export const curvesProcessor: NodeProcessor = {
  type: "curves",
  category: "color",

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
      id: "channel",
      name: "Channel",
      type: "select",
      value: "rgb",
      options: [
        { value: "rgb", label: "RGB" },
        { value: "red", label: "Red" },
        { value: "green", label: "Green" },
        { value: "blue", label: "Blue" },
        { value: "luma", label: "Luminance" },
      ],
    },
    {
      id: "curve_data",
      name: "Curve Data",
      type: "text",
      value: "0,0;1,1", // Linear by default
      visible: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const channel = node.parameters.find((p) => p.id === "channel")?.value || "rgb"
    const curveData = node.parameters.find((p) => p.id === "curve_data")?.value || "0,0;1,1"

    // Parse curve points
    const points = curveData.split(";").map((p: string) => {
      const [x, y] = p.split(",").map(Number)
      return { x, y }
    })

    return {
      output: {
        ...input,
        curves: {
          channel,
          points,
          interpolation: "cubic",
        },
      },
    }
  },
}

// Color Replace - Replace specific colors
export const colorReplaceProcessor: NodeProcessor = {
  type: "color_replace",
  category: "color",

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
      id: "source_color",
      name: "Source Color",
      type: "color",
      value: "#ff0000",
    },
    {
      id: "target_color",
      name: "Target Color",
      type: "color",
      value: "#00ff00",
    },
    {
      id: "tolerance",
      name: "Tolerance",
      type: "number",
      value: 0.1,
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
      id: "preserve_luminance",
      name: "Preserve Luminance",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const sourceColor = node.parameters.find((p) => p.id === "source_color")?.value || "#ff0000"
    const targetColor = node.parameters.find((p) => p.id === "target_color")?.value || "#00ff00"
    const tolerance = node.parameters.find((p) => p.id === "tolerance")?.value || 0.1
    const softness = node.parameters.find((p) => p.id === "softness")?.value || 0.1
    const preserveLuminance = node.parameters.find((p) => p.id === "preserve_luminance")?.value || false

    return {
      output: {
        ...input,
        colorReplace: {
          source: sourceColor,
          target: targetColor,
          tolerance,
          softness,
          preserveLuminance,
        },
      },
    }
  },
}

// LUT Apply - Apply color lookup table
export const lutApplyProcessor: NodeProcessor = {
  type: "lut_apply",
  category: "color",

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
      id: "lut_file",
      name: "LUT File",
      type: "text",
      value: "",
    },
    {
      id: "intensity",
      name: "Intensity",
      type: "number",
      value: 1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
    },
    {
      id: "preset",
      name: "Preset",
      type: "select",
      value: "none",
      options: [
        { value: "none", label: "None" },
        { value: "film_emulation", label: "Film Emulation" },
        { value: "vintage", label: "Vintage" },
        { value: "cinematic", label: "Cinematic" },
        { value: "day_for_night", label: "Day for Night" },
        { value: "bleach_bypass", label: "Bleach Bypass" },
      ],
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const lutFile = node.parameters.find((p) => p.id === "lut_file")?.value || ""
    const intensity = node.parameters.find((p) => p.id === "intensity")?.value || 1
    const preset = node.parameters.find((p) => p.id === "preset")?.value || "none"

    return {
      output: {
        ...input,
        lut: {
          file: lutFile,
          preset,
          intensity,
        },
      },
    }
  },
}

// Selective Color - Adjust specific color ranges
export const selectiveColorProcessor: NodeProcessor = {
  type: "selective_color",
  category: "color",

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
      id: "color_range",
      name: "Color Range",
      type: "select",
      value: "reds",
      options: [
        { value: "reds", label: "Reds" },
        { value: "yellows", label: "Yellows" },
        { value: "greens", label: "Greens" },
        { value: "cyans", label: "Cyans" },
        { value: "blues", label: "Blues" },
        { value: "magentas", label: "Magentas" },
        { value: "whites", label: "Whites" },
        { value: "neutrals", label: "Neutrals" },
        { value: "blacks", label: "Blacks" },
      ],
    },
    {
      id: "cyan",
      name: "Cyan",
      type: "number",
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      animatable: true,
    },
    {
      id: "magenta",
      name: "Magenta",
      type: "number",
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      animatable: true,
    },
    {
      id: "yellow",
      name: "Yellow",
      type: "number",
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      animatable: true,
    },
    {
      id: "black",
      name: "Black",
      type: "number",
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      animatable: true,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const colorRange = node.parameters.find((p) => p.id === "color_range")?.value || "reds"
    const cyan = node.parameters.find((p) => p.id === "cyan")?.value || 0
    const magenta = node.parameters.find((p) => p.id === "magenta")?.value || 0
    const yellow = node.parameters.find((p) => p.id === "yellow")?.value || 0
    const black = node.parameters.find((p) => p.id === "black")?.value || 0

    return {
      output: {
        ...input,
        selectiveColor: {
          range: colorRange,
          adjustments: { cyan, magenta, yellow, black },
        },
      },
    }
  },
}

// Channel Mixer - Mix RGB channels
export const channelMixerProcessor: NodeProcessor = {
  type: "channel_mixer",
  category: "color",

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
      id: "red_from_red",
      name: "Red → Red",
      type: "number",
      value: 100,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "red_from_green",
      name: "Green → Red",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "red_from_blue",
      name: "Blue → Red",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "green_from_red",
      name: "Red → Green",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "green_from_green",
      name: "Green → Green",
      type: "number",
      value: 100,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "green_from_blue",
      name: "Blue → Green",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "blue_from_red",
      name: "Red → Blue",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "blue_from_green",
      name: "Green → Blue",
      type: "number",
      value: 0,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "blue_from_blue",
      name: "Blue → Blue",
      type: "number",
      value: 100,
      min: -200,
      max: 200,
      step: 1,
      animatable: true,
    },
    {
      id: "monochrome",
      name: "Monochrome",
      type: "boolean",
      value: false,
    },
  ],

  process: async (node, inputs, _context) => {
    const input = inputs.input
    const matrix = [
      [
        node.parameters.find((p) => p.id === "red_from_red")?.value / 100 || 1,
        node.parameters.find((p) => p.id === "red_from_green")?.value / 100 || 0,
        node.parameters.find((p) => p.id === "red_from_blue")?.value / 100 || 0,
      ],
      [
        node.parameters.find((p) => p.id === "green_from_red")?.value / 100 || 0,
        node.parameters.find((p) => p.id === "green_from_green")?.value / 100 || 1,
        node.parameters.find((p) => p.id === "green_from_blue")?.value / 100 || 0,
      ],
      [
        node.parameters.find((p) => p.id === "blue_from_red")?.value / 100 || 0,
        node.parameters.find((p) => p.id === "blue_from_green")?.value / 100 || 0,
        node.parameters.find((p) => p.id === "blue_from_blue")?.value / 100 || 1,
      ],
    ]

    const monochrome = node.parameters.find((p) => p.id === "monochrome")?.value || false

    return {
      output: {
        ...input,
        channelMixer: {
          matrix,
          monochrome,
        },
      },
    }
  },
}
