import { describe, expect, it } from "vitest"
import {
  PREVIEW_SIZES,
  DEFAULT_SIZE,
  MIN_SIZE,
  MAX_SIZE,
  DEFAULT_PREVIEW_SIZE_INDEX,
  DEFAULT_CONTENT_SIZES,
  getPreviewSizeIndex,
  getPreviewSizeByIndex,
  getNextPreviewSize,
  getPreviousPreviewSize,
  isValidPreviewSize,
  getClosestPreviewSize,
  calculateDimensionsWithAspectRatio,
  getOptimalTemplateSize,
  calculateGridColumns,
  getResponsivePreviewSize,
  type PreviewSize,
  type PreviewSizeKey,
} from "../preview-sizes"

describe("preview-sizes", () => {
  describe("constants", () => {
    it("should export correct PREVIEW_SIZES array", () => {
      expect(PREVIEW_SIZES).toEqual([125, 150, 200, 250, 300, 400, 500])
      expect(PREVIEW_SIZES).toHaveLength(7)
    })

    it("should export correct DEFAULT_SIZE", () => {
      expect(DEFAULT_SIZE).toBe(200)
    })

    it("should export correct MIN_SIZE", () => {
      expect(MIN_SIZE).toBe(125)
      expect(MIN_SIZE).toBe(PREVIEW_SIZES[0])
    })

    it("should export correct MAX_SIZE", () => {
      expect(MAX_SIZE).toBe(500)
      expect(MAX_SIZE).toBe(PREVIEW_SIZES[PREVIEW_SIZES.length - 1])
    })

    it("should export correct DEFAULT_PREVIEW_SIZE_INDEX", () => {
      expect(DEFAULT_PREVIEW_SIZE_INDEX).toBe(3)
      expect(PREVIEW_SIZES[DEFAULT_PREVIEW_SIZE_INDEX]).toBe(250)
    })

    it("should export correct DEFAULT_CONTENT_SIZES", () => {
      const expectedKeys: PreviewSizeKey[] = [
        "MEDIA",
        "TEMPLATES",
        "STYLE_TEMPLATES",
        "EFFECTS",
        "FILTERS",
        "TRANSITIONS",
        "SUBTITLES",
        "MUSIC",
      ]
      
      expect(Object.keys(DEFAULT_CONTENT_SIZES)).toEqual(expectedKeys)
      
      Object.values(DEFAULT_CONTENT_SIZES).forEach(size => {
        expect(PREVIEW_SIZES).toContain(size)
      })
      
      expect(DEFAULT_CONTENT_SIZES.MEDIA).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.TEMPLATES).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.STYLE_TEMPLATES).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.EFFECTS).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.FILTERS).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.TRANSITIONS).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.SUBTITLES).toBe(250)
      expect(DEFAULT_CONTENT_SIZES.MUSIC).toBe(250)
    })
  })

  describe("getPreviewSizeIndex", () => {
    it("should return correct index for valid sizes", () => {
      expect(getPreviewSizeIndex(125)).toBe(0)
      expect(getPreviewSizeIndex(150)).toBe(1)
      expect(getPreviewSizeIndex(200)).toBe(2)
      expect(getPreviewSizeIndex(250)).toBe(3)
      expect(getPreviewSizeIndex(300)).toBe(4)
      expect(getPreviewSizeIndex(400)).toBe(5)
      expect(getPreviewSizeIndex(500)).toBe(6)
    })

    it("should return -1 for invalid sizes", () => {
      expect(getPreviewSizeIndex(100 as PreviewSize)).toBe(-1)
      expect(getPreviewSizeIndex(175 as PreviewSize)).toBe(-1)
      expect(getPreviewSizeIndex(600 as PreviewSize)).toBe(-1)
    })
  })

  describe("getPreviewSizeByIndex", () => {
    it("should return correct size for valid indices", () => {
      expect(getPreviewSizeByIndex(0)).toBe(125)
      expect(getPreviewSizeByIndex(1)).toBe(150)
      expect(getPreviewSizeByIndex(2)).toBe(200)
      expect(getPreviewSizeByIndex(3)).toBe(250)
      expect(getPreviewSizeByIndex(4)).toBe(300)
      expect(getPreviewSizeByIndex(5)).toBe(400)
      expect(getPreviewSizeByIndex(6)).toBe(500)
    })

    it("should clamp to boundaries for out-of-range indices", () => {
      expect(getPreviewSizeByIndex(-1)).toBe(125)
      expect(getPreviewSizeByIndex(-10)).toBe(125)
      expect(getPreviewSizeByIndex(7)).toBe(500)
      expect(getPreviewSizeByIndex(100)).toBe(500)
    })
  })

  describe("getNextPreviewSize", () => {
    it("should return next size for all valid sizes except maximum", () => {
      expect(getNextPreviewSize(125)).toBe(150)
      expect(getNextPreviewSize(150)).toBe(200)
      expect(getNextPreviewSize(200)).toBe(250)
      expect(getNextPreviewSize(250)).toBe(300)
      expect(getNextPreviewSize(300)).toBe(400)
      expect(getNextPreviewSize(400)).toBe(500)
    })

    it("should return maximum size when already at maximum", () => {
      expect(getNextPreviewSize(500)).toBe(500)
    })
  })

  describe("getPreviousPreviewSize", () => {
    it("should return previous size for all valid sizes except minimum", () => {
      expect(getPreviousPreviewSize(150)).toBe(125)
      expect(getPreviousPreviewSize(200)).toBe(150)
      expect(getPreviousPreviewSize(250)).toBe(200)
      expect(getPreviousPreviewSize(300)).toBe(250)
      expect(getPreviousPreviewSize(400)).toBe(300)
      expect(getPreviousPreviewSize(500)).toBe(400)
    })

    it("should return minimum size when already at minimum", () => {
      expect(getPreviousPreviewSize(125)).toBe(125)
    })
  })

  describe("isValidPreviewSize", () => {
    it("should return true for valid sizes", () => {
      expect(isValidPreviewSize(125)).toBe(true)
      expect(isValidPreviewSize(150)).toBe(true)
      expect(isValidPreviewSize(200)).toBe(true)
      expect(isValidPreviewSize(250)).toBe(true)
      expect(isValidPreviewSize(300)).toBe(true)
      expect(isValidPreviewSize(400)).toBe(true)
      expect(isValidPreviewSize(500)).toBe(true)
    })

    it("should return false for invalid sizes", () => {
      expect(isValidPreviewSize(100)).toBe(false)
      expect(isValidPreviewSize(126)).toBe(false)
      expect(isValidPreviewSize(175)).toBe(false)
      expect(isValidPreviewSize(225)).toBe(false)
      expect(isValidPreviewSize(350)).toBe(false)
      expect(isValidPreviewSize(450)).toBe(false)
      expect(isValidPreviewSize(600)).toBe(false)
      expect(isValidPreviewSize(0)).toBe(false)
      expect(isValidPreviewSize(-100)).toBe(false)
    })
  })

  describe("getClosestPreviewSize", () => {
    it("should return MIN_SIZE for values at or below MIN_SIZE", () => {
      expect(getClosestPreviewSize(0)).toBe(125)
      expect(getClosestPreviewSize(50)).toBe(125)
      expect(getClosestPreviewSize(100)).toBe(125)
      expect(getClosestPreviewSize(125)).toBe(125)
    })

    it("should return MAX_SIZE for values at or above MAX_SIZE", () => {
      expect(getClosestPreviewSize(500)).toBe(500)
      expect(getClosestPreviewSize(600)).toBe(500)
      expect(getClosestPreviewSize(1000)).toBe(500)
    })

    it("should return closest size for values in between", () => {
      expect(getClosestPreviewSize(130)).toBe(125)
      expect(getClosestPreviewSize(137)).toBe(125)
      expect(getClosestPreviewSize(138)).toBe(150)
      expect(getClosestPreviewSize(140)).toBe(150)
      expect(getClosestPreviewSize(175)).toBe(150)
      expect(getClosestPreviewSize(176)).toBe(200)
      expect(getClosestPreviewSize(225)).toBe(200)
      expect(getClosestPreviewSize(226)).toBe(250)
      expect(getClosestPreviewSize(275)).toBe(250)
      expect(getClosestPreviewSize(276)).toBe(300)
      expect(getClosestPreviewSize(350)).toBe(300)
      expect(getClosestPreviewSize(351)).toBe(400)
      expect(getClosestPreviewSize(450)).toBe(400)
      expect(getClosestPreviewSize(451)).toBe(500)
    })

    it("should handle edge cases correctly", () => {
      expect(getClosestPreviewSize(-Infinity)).toBe(125)
      expect(getClosestPreviewSize(Infinity)).toBe(500)
    })
  })

  describe("calculateDimensionsWithAspectRatio", () => {
    it("should calculate dimensions for horizontal aspect ratios", () => {
      const result = calculateDimensionsWithAspectRatio(200, { width: 16, height: 9 })
      expect(result.width).toBe(200)
      expect(result.height).toBe(113)
    })

    it("should calculate dimensions for vertical aspect ratios", () => {
      const result = calculateDimensionsWithAspectRatio(200, { width: 9, height: 16 })
      expect(result.width).toBe(113)
      expect(result.height).toBe(200)
    })

    it("should calculate dimensions for square aspect ratio", () => {
      const result = calculateDimensionsWithAspectRatio(200, { width: 1, height: 1 })
      expect(result.width).toBe(200)
      expect(result.height).toBe(200)
    })

    it("should handle template minimum size for horizontal", () => {
      const result = calculateDimensionsWithAspectRatio(100, { width: 16, height: 9 }, true)
      expect(result.width).toBe(150)
      expect(result.height).toBe(84)
    })

    it("should handle template minimum size for vertical", () => {
      const result = calculateDimensionsWithAspectRatio(100, { width: 9, height: 16 }, true)
      expect(result.width).toBe(84)
      expect(result.height).toBe(150)
    })

    it("should not apply minimum for non-templates", () => {
      const result = calculateDimensionsWithAspectRatio(100, { width: 16, height: 9 }, false)
      expect(result.width).toBe(100)
      expect(result.height).toBe(56)
    })

    it("should handle extreme aspect ratios", () => {
      const ultraWide = calculateDimensionsWithAspectRatio(200, { width: 32, height: 9 })
      expect(ultraWide.width).toBe(200)
      expect(ultraWide.height).toBe(56)

      const ultraTall = calculateDimensionsWithAspectRatio(200, { width: 9, height: 32 })
      expect(ultraTall.width).toBe(56)
      expect(ultraTall.height).toBe(200)
    })

    it("should round dimensions correctly", () => {
      const result = calculateDimensionsWithAspectRatio(200, { width: 3, height: 2 })
      expect(result.width).toBe(200)
      expect(result.height).toBe(133)
    })
  })

  describe("getOptimalTemplateSize", () => {
    it("should return unchanged size for small screen counts", () => {
      expect(getOptimalTemplateSize(200, 1)).toBe(200)
      expect(getOptimalTemplateSize(200, 2)).toBe(200)
      expect(getOptimalTemplateSize(200, 3)).toBe(200)
    })

    it("should apply 1.2x multiplier for 4-8 screens", () => {
      expect(getOptimalTemplateSize(200, 4)).toBe(250)
      expect(getOptimalTemplateSize(200, 5)).toBe(250)
      expect(getOptimalTemplateSize(200, 8)).toBe(250)
      expect(getOptimalTemplateSize(250, 4)).toBe(300)
    })

    it("should apply 1.3x multiplier for 9-15 screens", () => {
      expect(getOptimalTemplateSize(200, 9)).toBe(250)
      expect(getOptimalTemplateSize(200, 12)).toBe(250)
      expect(getOptimalTemplateSize(200, 15)).toBe(250)
      expect(getOptimalTemplateSize(300, 9)).toBe(400)
    })

    it("should apply 1.4x multiplier for 16-24 screens", () => {
      expect(getOptimalTemplateSize(200, 16)).toBe(300)
      expect(getOptimalTemplateSize(200, 20)).toBe(300)
      expect(getOptimalTemplateSize(200, 24)).toBe(300)
      expect(getOptimalTemplateSize(250, 16)).toBe(300)
    })

    it("should apply 1.5x multiplier for 25+ screens", () => {
      expect(getOptimalTemplateSize(200, 25)).toBe(300)
      expect(getOptimalTemplateSize(200, 36)).toBe(300)
      expect(getOptimalTemplateSize(300, 25)).toBe(400)
      expect(getOptimalTemplateSize(400, 25)).toBe(500)
    })

    it("should clamp to maximum size", () => {
      expect(getOptimalTemplateSize(400, 25)).toBe(500)
      expect(getOptimalTemplateSize(500, 25)).toBe(500)
    })
  })

  describe("calculateGridColumns", () => {
    it("should calculate correct columns for different container widths", () => {
      expect(calculateGridColumns(800, 200)).toBe(3)
      expect(calculateGridColumns(600, 200)).toBe(2)
      expect(calculateGridColumns(400, 200)).toBe(1)
      expect(calculateGridColumns(200, 200)).toBe(1)
    })

    it("should handle custom gap values", () => {
      expect(calculateGridColumns(800, 200, 0)).toBe(4)
      expect(calculateGridColumns(800, 200, 32)).toBe(3)
      expect(calculateGridColumns(800, 200, 100)).toBe(2)
    })

    it("should always return at least 1 column", () => {
      expect(calculateGridColumns(100, 200)).toBe(1)
      expect(calculateGridColumns(50, 200)).toBe(1)
      expect(calculateGridColumns(0, 200)).toBe(1)
    })

    it("should handle different preview sizes", () => {
      expect(calculateGridColumns(800, 125)).toBe(5)
      expect(calculateGridColumns(800, 250)).toBe(3)
      expect(calculateGridColumns(800, 400)).toBe(1)
      expect(calculateGridColumns(800, 500)).toBe(1)
    })

    it("should calculate correctly with exact fit", () => {
      expect(calculateGridColumns(232, 100, 16)).toBe(2)
      expect(calculateGridColumns(348, 100, 16)).toBe(3)
      expect(calculateGridColumns(464, 100, 16)).toBe(4)
    })
  })

  describe("getResponsivePreviewSize", () => {
    it("should return preferred size if it fits", () => {
      expect(getResponsivePreviewSize(800, 200)).toBe(200)
      expect(getResponsivePreviewSize(600, 250)).toBe(250)
      expect(getResponsivePreviewSize(1000, 300)).toBe(300)
    })

    it("should downsize when preferred size is too large", () => {
      expect(getResponsivePreviewSize(300, 200)).toBe(150)
      expect(getResponsivePreviewSize(250, 200)).toBe(125)
      expect(getResponsivePreviewSize(400, 300)).toBe(200)
    })

    it("should handle custom minColumns", () => {
      expect(getResponsivePreviewSize(800, 200, 3)).toBe(200)
      expect(getResponsivePreviewSize(600, 200, 3)).toBe(200)
      expect(getResponsivePreviewSize(500, 200, 3)).toBe(150)
    })

    it("should handle edge cases", () => {
      expect(getResponsivePreviewSize(100, 200)).toBe(125)
      expect(getResponsivePreviewSize(200, 500)).toBe(125)
      expect(getResponsivePreviewSize(1000, 125, 5)).toBe(125)
    })

    it("should calculate correctly with gap consideration", () => {
      const containerWidth = 216
      const gap = 16
      const minColumns = 2
      const availableWidth = containerWidth - gap * (minColumns - 1)
      const maxItemWidth = Math.floor(availableWidth / minColumns)
      
      expect(maxItemWidth).toBe(100)
      expect(getResponsivePreviewSize(216, 150, 2)).toBe(125)
    })
  })

  describe("type exports", () => {
    it("should correctly type PreviewSize", () => {
      const validSize: PreviewSize = 200
      expect(PREVIEW_SIZES).toContain(validSize)
    })

    it("should correctly type PreviewSizeKey", () => {
      const keys: PreviewSizeKey[] = [
        "MEDIA",
        "TRANSITIONS", 
        "TEMPLATES",
        "EFFECTS",
        "FILTERS",
        "SUBTITLES",
        "STYLE_TEMPLATES",
        "MUSIC",
      ]
      
      keys.forEach(key => {
        expect(DEFAULT_CONTENT_SIZES).toHaveProperty(key)
      })
    })
  })
})