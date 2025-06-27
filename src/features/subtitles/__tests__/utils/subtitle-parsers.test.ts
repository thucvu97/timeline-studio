import { describe, expect, it } from "vitest"

import { detectSubtitleFormat, parseASS, parseSRT, parseSubtitleFile, parseVTT } from "../../utils/subtitle-parsers"

describe("subtitle-parsers", () => {
  describe("parseSRT", () => {
    it("should parse valid SRT content", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:02,500
Hello world

2
00:00:03,000 --> 00:00:05,000
This is a test subtitle`

      const result = parseSRT(srtContent)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        type: "subtitle",
        startTime: 0,
        duration: 2.5,
        text: "Hello world",
      })
      expect(result[1]).toMatchObject({
        type: "subtitle",
        startTime: 3,
        duration: 2,
        text: "This is a test subtitle",
      })
    })

    it("should handle multi-line subtitles", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:02,000
Line 1
Line 2
Line 3`

      const result = parseSRT(srtContent)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Line 1\nLine 2\nLine 3")
    })

    it("should handle empty blocks", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:02,000
Text

2

3
00:00:03,000 --> 00:00:04,000
Another text`

      const result = parseSRT(srtContent)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe("Text")
      expect(result[1].text).toBe("Another text")
    })
  })

  describe("parseVTT", () => {
    it("should parse valid VTT content", () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:02.500
Hello world

00:00:03.000 --> 00:00:05.000
This is a test subtitle`

      const result = parseVTT(vttContent)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        type: "subtitle",
        startTime: 0,
        duration: 2.5,
        text: "Hello world",
      })
    })

    it("should handle VTT with cue identifiers", () => {
      const vttContent = `WEBVTT

1
00:00:00.000 --> 00:00:02.000
First subtitle

subtitle-2
00:00:03.000 --> 00:00:04.000
Second subtitle`

      const result = parseVTT(vttContent)

      expect(result).toHaveLength(2)
      expect(result[0].text).toBe("First subtitle")
      expect(result[1].text).toBe("Second subtitle")
    })

    it("should handle VTT without header", () => {
      const vttContent = `00:00:00.000 --> 00:00:02.000
Text without header`

      const result = parseVTT(vttContent)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Text without header")
    })
  })

  describe("parseASS", () => {
    it("should parse basic ASS content", () => {
      const assContent = `[Script Info]
Title: Test

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Hello world
Dialogue: 0,0:00:03.00,0:00:05.00,Default,,0,0,0,,Test subtitle`

      const result = parseASS(assContent)

      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        type: "subtitle",
        startTime: 0,
        duration: 2,
        text: "Hello world",
      })
    })

    it("should remove ASS style tags", () => {
      const assContent = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,{\\i1}Italic{\\i0} text`

      const result = parseASS(assContent)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Italic text")
    })

    it("should handle text with commas", () => {
      const assContent = `[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Hello, world, test`

      const result = parseASS(assContent)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Hello, world, test")
    })
  })

  describe("detectSubtitleFormat", () => {
    it("should detect SRT format", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:02,000
Text`

      expect(detectSubtitleFormat(srtContent)).toBe("srt")
    })

    it("should detect VTT format", () => {
      const vttContent = `WEBVTT

00:00:00.000 --> 00:00:02.000
Text`

      expect(detectSubtitleFormat(vttContent)).toBe("vtt")
    })

    it("should detect ASS format", () => {
      const assContent = `[Script Info]
Title: Test

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`

      expect(detectSubtitleFormat(assContent)).toBe("ass")
    })

    it("should return unknown for unrecognized format", () => {
      const unknownContent = `Some random text
that is not a subtitle format`

      expect(detectSubtitleFormat(unknownContent)).toBe("unknown")
    })
  })

  describe("parseSubtitleFile", () => {
    it("should parse file with auto-detection", () => {
      const srtContent = `1
00:00:00,000 --> 00:00:02,000
Auto-detected SRT`

      const result = parseSubtitleFile(srtContent)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Auto-detected SRT")
    })

    it("should parse file with specified format", () => {
      const content = `00:00:00.000 --> 00:00:02.000
Forced VTT format`

      const result = parseSubtitleFile(content, "vtt")

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe("Forced VTT format")
    })

    it("should throw error for unsupported format", () => {
      const content = "Invalid content"

      expect(() => parseSubtitleFile(content)).toThrow("Unsupported subtitle format")
    })
  })
})
