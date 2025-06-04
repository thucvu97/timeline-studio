import { describe, expect, it } from "vitest"

import { VideoStream } from "../../types/types"
import { calculateRealDimensions } from "../../utils"

describe("calculateRealDimensions", () => {
  it("должен возвращать оригинальные размеры, если нет поворота", () => {
    const stream: VideoStream & { width: number; height: number } = {
      codec_type: "video",
      width: 1920,
      height: 1080,
    }

    const dimensions = calculateRealDimensions(stream)

    expect(dimensions.width).toBe(1920)
    expect(dimensions.height).toBe(1080)
    expect(dimensions.style).toBe("")
  })

  it("должен менять местами ширину и высоту при повороте на 90 градусов", () => {
    const stream: VideoStream & { width: number; height: number } = {
      codec_type: "video",
      width: 1920,
      height: 1080,
      rotation: "90",
    }

    const dimensions = calculateRealDimensions(stream)

    expect(dimensions.width).toBe(1080)
    expect(dimensions.height).toBe(1920)
    expect(dimensions.style).toBe("")
  })

  it("должен менять местами ширину и высоту при повороте на -90 градусов", () => {
    const stream: VideoStream & { width: number; height: number } = {
      codec_type: "video",
      width: 1920,
      height: 1080,
      rotation: "-90",
    }

    const dimensions = calculateRealDimensions(stream)

    expect(dimensions.width).toBe(1080)
    expect(dimensions.height).toBe(1920)
    expect(dimensions.style).toBe("")
  })

  it("должен менять местами ширину и высоту при повороте на 270 градусов", () => {
    const stream: VideoStream & { width: number; height: number } = {
      codec_type: "video",
      width: 1920,
      height: 1080,
      rotation: "270",
    }

    const dimensions = calculateRealDimensions(stream)

    expect(dimensions.width).toBe(1080)
    expect(dimensions.height).toBe(1920)
    expect(dimensions.style).toBe("")
  })

  it("должен корректно обрабатывать поворот на 180 градусов (без изменения размеров)", () => {
    const stream: VideoStream & { width: number; height: number } = {
      codec_type: "video",
      width: 1920,
      height: 1080,
      rotation: "180",
    }

    const dimensions = calculateRealDimensions(stream)

    expect(dimensions.width).toBe(1920)
    expect(dimensions.height).toBe(1080)
    expect(dimensions.style).toBe("")
  })
})
