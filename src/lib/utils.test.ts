import { describe, expect, it } from "vitest"

import { FfprobeData } from "@/types/ffprobe"

import {
  cn,
  formatBitrate,
  formatFileSize,
  formatResolution,
  generateVideoId,
  getMediaCreationTime,
  isVideoAvailable,
  parseFileNameDateTime,
} from "./utils"

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2")
  })

  it("should handle conditional classes", () => {
    expect(cn("class1", "class2", undefined)).toBe("class1 class2")
  })

  it("should handle objects", () => {
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2")
  })

  it("should handle arrays", () => {
    expect(cn("class1", ["class2", "class3"])).toBe("class1 class2 class3")
  })

  it("should handle complex combinations", () => {
    expect(
      cn(
        "class1",
        {
          class2: true,
          class3: false,
        },
        ["class4", undefined],
      ),
    ).toBe("class1 class2 class4")
  })
})

describe("formatResolution", () => {
  it("should format standard resolutions", () => {
    expect(formatResolution(1920, 1080)).toBe("FHD")
    expect(formatResolution(2048, 1080)).toBe("DCI 2K")
    expect(formatResolution(2560, 1440)).toBe("QHD")
    expect(formatResolution(3200, 1800)).toBe("QHD+")
    expect(formatResolution(3840, 2160)).toBe("UHD")
    expect(formatResolution(4096, 2160)).toBe("DCI 4K")
    expect(formatResolution(5120, 2880)).toBe("5K")
    expect(formatResolution(6144, 3240)).toBe("6K")
    expect(formatResolution(7680, 4320)).toBe("8K UHD")
  })

  it("should handle vertical videos", () => {
    expect(formatResolution(1080, 1920)).toBe("FHD")
    expect(formatResolution(2160, 3840)).toBe("UHD")
  })

  it("should format based on pixel count for non-standard resolutions", () => {
    // 8K UHD (7680×4320 = 33,177,600 pixels)
    expect(formatResolution(7000, 4000)).toBe("8K UHD")

    // 6K (6144×3240 = 19,906,560 pixels)
    expect(formatResolution(5000, 4000)).toBe("6K")

    // 5K (5120×2880 = 14,745,600 pixels)
    expect(formatResolution(4000, 4000)).toBe("5K")

    // UHD (3840×2160 = 8,294,400 pixels)
    expect(formatResolution(3000, 3000)).toBe("UHD")

    // QHD+ (3200×1800 = 5,760,000 pixels)
    expect(formatResolution(2500, 2500)).toBe("QHD+")

    // QHD (2560×1440 = 3,686,400 pixels)
    expect(formatResolution(2100, 2100)).toBe("QHD")

    // FHD (1920×1080 = 2,073,600 pixels)
    expect(formatResolution(1500, 1500)).toBe("FHD")

    // HD (1280×720 = 921,600 pixels)
    expect(formatResolution(1000, 1000)).toBe("HD")

    // SD (less than HD)
    expect(formatResolution(500, 500)).toBe("SD")
  })
})

describe("formatBitrate", () => {
  it("should format bitrate in Mbps", () => {
    expect(formatBitrate(5000000)).toBe("5.0 Mbps")
    expect(formatBitrate(15000000)).toBe("15.0 Mbps")
    expect(formatBitrate(1500000)).toBe("1.5 Mbps")
  })

  it("should handle undefined bitrate", () => {
    expect(formatBitrate(undefined)).toBe("N/A")
  })

  it("should handle zero bitrate", () => {
    expect(formatBitrate(0)).toBe("N/A")
  })
})

describe("generateVideoId", () => {
  it("should generate first video ID", () => {
    expect(generateVideoId([])).toBe("V1")
  })

  it("should generate next video ID based on existing IDs", () => {
    const videos = [
      { id: "V1", name: "video1.mp4", path: "/path/to/video1.mp4" },
      { id: "V2", name: "video2.mp4", path: "/path/to/video2.mp4" },
      { id: "V3", name: "video3.mp4", path: "/path/to/video3.mp4" },
    ]
    expect(generateVideoId(videos)).toBe("V4")
  })

  it("should handle non-sequential IDs", () => {
    const videos = [
      { id: "V1", name: "video1.mp4", path: "/path/to/video1.mp4" },
      { id: "V5", name: "video5.mp4", path: "/path/to/video5.mp4" },
      { id: "V3", name: "video3.mp4", path: "/path/to/video3.mp4" },
    ]
    expect(generateVideoId(videos)).toBe("V6")
  })

  it("should handle non-standard IDs", () => {
    const videos = [
      { id: "custom1", name: "video1.mp4", path: "/path/to/video1.mp4" },
      { id: "custom2", name: "video2.mp4", path: "/path/to/video2.mp4" },
    ]
    expect(generateVideoId(videos)).toBe("V1")
  })
})

describe("isVideoAvailable", () => {
  it("should return true for current time within video duration", () => {
    const video = {
      id: "V1",
      name: "video1.mp4",
      path: "/path/to/video1.mp4",
      startTime: 10,
      duration: 5,
    }
    expect(isVideoAvailable(video, 12)).toBe(true)
  })

  it("should return true for current time at video boundaries with tolerance", () => {
    const video = {
      id: "V1",
      name: "video1.mp4",
      path: "/path/to/video1.mp4",
      startTime: 10,
      duration: 5,
    }
    expect(isVideoAvailable(video, 9.8)).toBe(true) // 10 - 0.3 (default tolerance) = 9.7
    expect(isVideoAvailable(video, 15.2)).toBe(true) // 15 + 0.3 (default tolerance) = 15.3
  })

  it("should return false for current time outside video duration", () => {
    const video = {
      id: "V1",
      name: "video1.mp4",
      path: "/path/to/video1.mp4",
      startTime: 10,
      duration: 5,
    }
    expect(isVideoAvailable(video, 5)).toBe(false)
    expect(isVideoAvailable(video, 20)).toBe(false)
  })

  it("should use custom tolerance", () => {
    const video = {
      id: "V1",
      name: "video1.mp4",
      path: "/path/to/video1.mp4",
      startTime: 10,
      duration: 5,
    }
    expect(isVideoAvailable(video, 9.6, 0.5)).toBe(true) // 10 - 0.5 = 9.5
    expect(isVideoAvailable(video, 15.4, 0.5)).toBe(true) // 15 + 0.5 = 15.5
    expect(isVideoAvailable(video, 9.4, 0.5)).toBe(false) // 9.4 < 9.5
    expect(isVideoAvailable(video, 15.6, 0.5)).toBe(false) // 15.6 > 15.5
  })
})

describe("parseFileNameDateTime", () => {
  it("should parse date and time from filename", () => {
    const result = parseFileNameDateTime("IMG_20240910_170942.jpg")
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2024)
    expect(result?.getMonth()).toBe(8) // 0-based, so 8 = September
    expect(result?.getDate()).toBe(10)
    expect(result?.getHours()).toBe(17)
    expect(result?.getMinutes()).toBe(9)
    expect(result?.getSeconds()).toBe(42)
  })

  it("should handle filenames with date and time in the middle", () => {
    const result = parseFileNameDateTime("prefix_20240910_170942_suffix.jpg")
    expect(result).toBeInstanceOf(Date)

    // Проверяем только дату и время, без учета часового пояса
    const dateStr = result?.toISOString().split("T")[0]
    const timeComponents = result?.toTimeString().split(" ")[0].split(":")

    expect(dateStr).toBe("2024-09-10")
    expect(timeComponents?.[0]).toBe("17")
    expect(timeComponents?.[1]).toBe("09")
    expect(timeComponents?.[2]).toBe("42")
  })

  it("should return null for filenames without date and time", () => {
    expect(parseFileNameDateTime("image.jpg")).toBeNull()
    expect(parseFileNameDateTime("2024-09-10.jpg")).toBeNull()
    expect(parseFileNameDateTime("20240910.jpg")).toBeNull()
  })
})

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500.0 B")
  })

  it("should format kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB")
    expect(formatFileSize(1536)).toBe("1.5 KB")
  })

  it("should format megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB")
    expect(formatFileSize(5242880)).toBe("5.0 MB")
  })

  it("should format gigabytes", () => {
    expect(formatFileSize(1073741824)).toBe("1.0 GB")
  })

  it("should format terabytes", () => {
    expect(formatFileSize(1099511627776)).toBe("1.0 TB")
  })
})

describe("getMediaCreationTime", () => {
  it("should get time from creation_time metadata", () => {
    const probeData: FfprobeData = {
      format: {
        filename: "video.mp4",
        tags: {
          creation_time: "2024-05-19T12:00:00Z",
        },
      },
      streams: [],
    }
    const result = getMediaCreationTime(probeData)
    expect(result).toBe(new Date("2024-05-19T12:00:00Z").getTime() / 1000)
  })

  it("should parse time from filename if no metadata", () => {
    const probeData: FfprobeData = {
      format: {
        filename: "IMG_20240519_120000.mp4",
      },
      streams: [],
    }
    const result = getMediaCreationTime(probeData)
    expect(result).toBe(new Date("2024-05-19T12:00:00").getTime() / 1000)
  })

  it("should use start_time if available and no other time sources", () => {
    const startTime = 1621425600 // 2021-05-19T12:00:00Z
    const probeData: FfprobeData = {
      format: {
        filename: "video.mp4",
        start_time: startTime,
      },
      streams: [],
    }
    const result = getMediaCreationTime(probeData)
    expect(result).toBe(startTime)
  })
})
