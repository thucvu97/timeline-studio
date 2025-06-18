import { describe, expect, it } from "vitest"

import { MediaTemplate } from "../lib/templates"
import { VideoTemplateStyle, getVideoStyleForTemplate } from "../services/template-service"

describe("Template Service", () => {
  describe("getVideoStyleForTemplate", () => {
    describe("Null and Default Templates", () => {
      it("should return default style when template is null", () => {
        const result = getVideoStyleForTemplate(null as any, 0, 2)

        expect(result).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        })
      })

      it("should return default style when template is undefined", () => {
        const result = getVideoStyleForTemplate(undefined as any, 0, 2)

        expect(result).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
        })
      })
    })

    describe("Video Index Out of Range", () => {
      it("should hide video when index exceeds template screens", () => {
        const template: MediaTemplate = {
          id: "test-template",
          name: "Test Template",
          screens: 2,
          split: "vertical",
        }

        const result = getVideoStyleForTemplate(template, 3, 4)

        expect(result).toEqual({
          position: "absolute",
          width: "0",
          height: "0",
          top: "0",
          left: "0",
          display: "none",
        })
      })

      it("should hide video when index equals template screens", () => {
        const template: MediaTemplate = {
          id: "test-template",
          name: "Test Template",
          screens: 2,
          split: "vertical",
        }

        const result = getVideoStyleForTemplate(template, 2, 3)

        expect(result).toEqual({
          position: "absolute",
          width: "0",
          height: "0",
          top: "0",
          left: "0",
          display: "none",
        })
      })
    })

    describe("Vertical Split", () => {
      it("should calculate correct styles for vertical split with 2 screens", () => {
        const template: MediaTemplate = {
          id: "vertical-2",
          name: "Vertical 2",
          screens: 2,
          split: "vertical",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0%",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2).toEqual({
          position: "absolute",
          top: "0",
          left: "50%",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })
      })

      it("should calculate correct styles for vertical split with 4 screens", () => {
        const template: MediaTemplate = {
          id: "vertical-4",
          name: "Vertical 4",
          screens: 4,
          split: "vertical",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 4)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0%",
          width: "25%",
          height: "100%",
          cellConfig: undefined,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 4)
        expect(result3).toEqual({
          position: "absolute",
          top: "0",
          left: "50%",
          width: "25%",
          height: "100%",
          cellConfig: undefined,
        })
      })
    })

    describe("Horizontal Split", () => {
      it("should calculate correct styles for horizontal split with 2 screens", () => {
        const template: MediaTemplate = {
          id: "horizontal-2",
          name: "Horizontal 2",
          screens: 2,
          split: "horizontal",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1).toEqual({
          position: "absolute",
          top: "0%",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig: undefined,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2).toEqual({
          position: "absolute",
          top: "50%",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig: undefined,
        })
      })

      it("should calculate correct styles for horizontal split with 3 screens", () => {
        const template: MediaTemplate = {
          id: "horizontal-3",
          name: "Horizontal 3",
          screens: 3,
          split: "horizontal",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 3)
        expect(result1.top).toBe("0%")
        expect(result1.height).toBe("33.333333333333336%")

        const result2 = getVideoStyleForTemplate(template, 1, 3)
        expect(result2.top).toBe("33.333333333333336%")
        expect(result2.height).toBe("33.333333333333336%")

        const result3 = getVideoStyleForTemplate(template, 2, 3)
        expect(result3.top).toBe("66.66666666666667%")
        expect(result3.height).toBe("33.333333333333336%")
      })
    })

    describe("Diagonal Split", () => {
      it("should calculate correct styles for diagonal split with 2 screens", () => {
        const template: MediaTemplate = {
          id: "diagonal-2",
          name: "Diagonal 2",
          screens: 2,
          split: "diagonal",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 66.67% 0, 33.33% 100%, 0 100%)",
          zIndex: 1,
          cellConfig: undefined,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(66.67% 0, 100% 0, 100% 100%, 33.33% 100%)",
          zIndex: 2,
          cellConfig: undefined,
        })
      })

      it("should use custom split points when provided", () => {
        const template: MediaTemplate = {
          id: "diagonal-custom",
          name: "Diagonal Custom",
          screens: 2,
          split: "diagonal",
          splitPoints: [
            { x: 75, y: 0 },
            { x: 25, y: 100 },
          ],
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1.clipPath).toBe("polygon(0 0, 75% 0, 25% 100%, 0 100%)")

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2.clipPath).toBe("polygon(75% 0, 100% 0, 100% 100%, 25% 100%)")
      })

      it("should calculate correct styles for diagonal split with 3 screens (triangle)", () => {
        const template: MediaTemplate = {
          id: "diagonal-3",
          name: "Diagonal 3",
          screens: 3,
          split: "diagonal",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 3)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 100% 0, 50% 50%)",
          zIndex: 1,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 3)
        expect(result2).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(0 0, 50% 50%, 0 100%)",
          zIndex: 2,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 3)
        expect(result3).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          clipPath: "polygon(50% 50%, 100% 0, 100% 100%)",
          zIndex: 3,
        })
      })
    })

    describe("Custom Split - 1 Left + 3 Right", () => {
      it("should calculate correct styles for 1 left + 3 right layout", () => {
        const template: MediaTemplate = {
          id: "split-1-3-landscape",
          name: "1 Left + 3 Right",
          screens: 4,
          split: "custom",
        }

        // Large video on the left
        const result1 = getVideoStyleForTemplate(template, 0, 4)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })

        // Small videos on the right
        const result2 = getVideoStyleForTemplate(template, 1, 4)
        expect(result2).toEqual({
          position: "absolute",
          top: "0%",
          left: "50%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 4)
        expect(result3).toEqual({
          position: "absolute",
          top: "33.33%",
          left: "50%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result4 = getVideoStyleForTemplate(template, 3, 4)
        expect(result4).toEqual({
          position: "absolute",
          top: "66.66%",
          left: "50%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })
      })
    })

    describe("Custom Split - 3 Left + 1 Right", () => {
      it("should calculate correct styles for 3 left + 1 right layout", () => {
        const template: MediaTemplate = {
          id: "split-3-1-right-landscape",
          name: "3 Left + 1 Right",
          screens: 4,
          split: "custom",
        }

        // Small videos on the left
        const result1 = getVideoStyleForTemplate(template, 0, 4)
        expect(result1).toEqual({
          position: "absolute",
          top: "0%",
          left: "0",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 4)
        expect(result2).toEqual({
          position: "absolute",
          top: "33.33%",
          left: "0",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 4)
        expect(result3).toEqual({
          position: "absolute",
          top: "66.66%",
          left: "0",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        // Large video on the right
        const result4 = getVideoStyleForTemplate(template, 3, 4)
        expect(result4).toEqual({
          position: "absolute",
          top: "0",
          left: "50%",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })
      })
    })

    describe("Mixed Split Templates", () => {
      it("should calculate correct styles for mixed split (2+1) layout", () => {
        const template: MediaTemplate = {
          id: "split-mixed-1-landscape",
          name: "Mixed Split (2+1)",
          screens: 3,
          split: "custom",
        }

        // Top video (full width)
        const result1 = getVideoStyleForTemplate(template, 0, 3)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "50%",
          cellConfig: undefined,
        })

        // Bottom videos (half width each)
        const result2 = getVideoStyleForTemplate(template, 1, 3)
        expect(result2).toEqual({
          position: "absolute",
          top: "50%",
          left: "0%",
          width: "50%",
          height: "50%",
          cellConfig: undefined,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 3)
        expect(result3).toEqual({
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "50%",
          height: "50%",
          cellConfig: undefined,
        })
      })

      it("should calculate correct styles for mixed split (1+2) layout", () => {
        const template: MediaTemplate = {
          id: "split-mixed-2-landscape",
          name: "Mixed Split (1+2)",
          screens: 3,
          split: "custom",
        }

        // Left video (full height)
        const result1 = getVideoStyleForTemplate(template, 0, 3)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })

        // Right videos (half height each)
        const result2 = getVideoStyleForTemplate(template, 1, 3)
        expect(result2).toEqual({
          position: "absolute",
          top: "0%",
          left: "50%",
          width: "50%",
          height: "50%",
          cellConfig: undefined,
        })

        const result3 = getVideoStyleForTemplate(template, 2, 3)
        expect(result3).toEqual({
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "50%",
          height: "50%",
          cellConfig: undefined,
        })
      })
    })

    describe("Complex 5-Screen Layouts", () => {
      it("should calculate correct styles for 5 screens: 1 left + 4 right layout", () => {
        const template: MediaTemplate = {
          id: "split-custom-5-1-landscape",
          name: "5 Screens: 1 Left + 4 Right",
          screens: 5,
          split: "custom",
        }

        // Large video on left
        const result1 = getVideoStyleForTemplate(template, 0, 5)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0",
          width: "50%",
          height: "100%",
          cellConfig: undefined,
        })

        // Large video in top-right
        const result2 = getVideoStyleForTemplate(template, 1, 5)
        expect(result2).toEqual({
          position: "absolute",
          top: "0",
          left: "50%",
          width: "50%",
          height: "50%",
          cellConfig: undefined,
        })

        // Small videos in bottom-right area
        const result3 = getVideoStyleForTemplate(template, 2, 5)
        expect(result3).toEqual({
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "25%",
          height: "25%",
          cellConfig: undefined,
        })

        const result4 = getVideoStyleForTemplate(template, 3, 5)
        expect(result4).toEqual({
          position: "absolute",
          top: "50%",
          left: "75%",
          width: "25%",
          height: "25%",
          cellConfig: undefined,
        })

        // Bottom video in bottom-right area
        const result5 = getVideoStyleForTemplate(template, 4, 5)
        expect(result5).toEqual({
          position: "absolute",
          top: "75%",
          left: "50%",
          width: "50%",
          height: "25%",
          cellConfig: undefined,
        })
      })

      it("should calculate correct styles for 5 screens: 1 top + 4 bottom layout", () => {
        const template: MediaTemplate = {
          id: "split-custom-5-3-landscape",
          name: "5 Screens: 1 Top + 4 Bottom",
          screens: 5,
          split: "custom",
        }

        // Top videos (2 in a row)
        const result1 = getVideoStyleForTemplate(template, 0, 5)
        expect(result1).toEqual({
          position: "absolute",
          top: "0",
          left: "0%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result2 = getVideoStyleForTemplate(template, 1, 5)
        expect(result2).toEqual({
          position: "absolute",
          top: "0",
          left: "50%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        // Middle video (full width)
        const result3 = getVideoStyleForTemplate(template, 2, 5)
        expect(result3).toEqual({
          position: "absolute",
          top: "33.33%",
          left: "0",
          width: "100%",
          height: "33.33%",
          cellConfig: undefined,
        })

        // Bottom videos (2 in a row)
        const result4 = getVideoStyleForTemplate(template, 3, 5)
        expect(result4).toEqual({
          position: "absolute",
          top: "66.66%",
          left: "0%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })

        const result5 = getVideoStyleForTemplate(template, 4, 5)
        expect(result5).toEqual({
          position: "absolute",
          top: "66.66%",
          left: "50%",
          width: "50%",
          height: "33.33%",
          cellConfig: undefined,
        })
      })
    })

    describe("Grid Layouts", () => {
      it("should calculate correct styles for 2x2 grid (4 screens)", () => {
        const template: MediaTemplate = {
          id: "grid-2x2",
          name: "2x2 Grid",
          screens: 4,
          split: "custom",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 4)
        expect(result1).toMatchObject({
          position: "absolute",
          top: "0%",
          left: "0%",
          width: "50%",
          height: "50%",
        })

        const result2 = getVideoStyleForTemplate(template, 1, 4)
        expect(result2).toMatchObject({
          position: "absolute",
          top: "0%",
          left: "50%",
          width: "50%",
          height: "50%",
        })

        const result3 = getVideoStyleForTemplate(template, 2, 4)
        expect(result3).toMatchObject({
          position: "absolute",
          top: "50%",
          left: "0%",
          width: "50%",
          height: "50%",
        })

        const result4 = getVideoStyleForTemplate(template, 3, 4)
        expect(result4).toMatchObject({
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "50%",
          height: "50%",
        })
      })

      it("should calculate correct styles for 3x3 grid (9 screens)", () => {
        const template: MediaTemplate = {
          id: "grid-3x3-landscape",
          name: "3x3 Grid",
          screens: 9,
          split: "custom",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 9)
        expect(result1).toMatchObject({
          position: "absolute",
          top: "0%",
          left: "0%",
          width: "33.33%",
          height: "33.33%",
        })

        const result5 = getVideoStyleForTemplate(template, 4, 9)
        expect(result5).toMatchObject({
          position: "absolute",
          top: "33.33%",
          left: "33.33%",
          width: "33.33%",
          height: "33.33%",
        })

        const result9 = getVideoStyleForTemplate(template, 8, 9)
        expect(result9).toMatchObject({
          position: "absolute",
          top: "66.66%",
          left: "66.66%",
          width: "33.33%",
          height: "33.33%",
        })
      })

      it("should calculate correct styles for 4x4 grid (16 screens)", () => {
        const template: MediaTemplate = {
          id: "grid-4x4-landscape",
          name: "4x4 Grid",
          screens: 16,
          split: "custom",
        }

        const result1 = getVideoStyleForTemplate(template, 0, 16)
        expect(result1).toMatchObject({
          position: "absolute",
          top: "0%",
          left: "0%",
          width: "25%",
          height: "25%",
        })

        const result16 = getVideoStyleForTemplate(template, 15, 16)
        expect(result16).toMatchObject({
          position: "absolute",
          top: "75%",
          left: "75%",
          width: "25%",
          height: "25%",
        })
      })
    })

    describe("Cell Configuration", () => {
      it("should include single cell config for all videos", () => {
        const cellConfig = { border: "2px solid red", borderRadius: "10px" }
        const template: MediaTemplate = {
          id: "test-cell-config",
          name: "Test Cell Config",
          screens: 2,
          split: "vertical",
          cellConfig,
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1.cellConfig).toEqual(cellConfig)

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2.cellConfig).toEqual(cellConfig)
      })

      it("should include individual cell configs for each video", () => {
        const cellConfigs = [
          { border: "2px solid red", borderRadius: "10px" },
          { border: "2px solid blue", borderRadius: "5px" },
        ]
        const template: MediaTemplate = {
          id: "test-individual-configs",
          name: "Test Individual Configs",
          screens: 2,
          split: "vertical",
          cellConfig: cellConfigs,
        }

        const result1 = getVideoStyleForTemplate(template, 0, 2)
        expect(result1.cellConfig).toEqual(cellConfigs[0])

        const result2 = getVideoStyleForTemplate(template, 1, 2)
        expect(result2.cellConfig).toEqual(cellConfigs[1])
      })

      it("should handle array cell config when index is out of bounds", () => {
        const cellConfigs = [{ border: "2px solid red" }]
        const template: MediaTemplate = {
          id: "test-out-of-bounds",
          name: "Test Out of Bounds",
          screens: 3,
          split: "vertical",
          cellConfig: cellConfigs,
        }

        const result = getVideoStyleForTemplate(template, 2, 3)
        expect(result.cellConfig).toBeUndefined()
      })
    })

    describe("Fallback to Relative Layout", () => {
      it("should return relative layout for unrecognized template types", () => {
        const template: MediaTemplate = {
          id: "unknown-template",
          name: "Unknown Template",
          screens: 2,
          split: "unknown" as any,
        }

        const result = getVideoStyleForTemplate(template, 0, 2)

        expect(result).toEqual({
          position: "relative",
          width: "100%",
          height: "100%",
          cellConfig: undefined,
        })
      })

      it("should return relative layout for resizable templates", () => {
        const template: MediaTemplate = {
          id: "resizable-template",
          name: "Resizable Template",
          screens: 2,
          split: "custom",
          // No specific custom layout ID
        }

        const result = getVideoStyleForTemplate(template, 0, 2)

        expect(result).toEqual({
          position: "relative",
          width: "100%",
          height: "100%",
          cellConfig: undefined,
        })
      })
    })
  })
})
