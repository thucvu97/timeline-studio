import { describe, expect, it } from "vitest"

import { EDLImporter } from "../../../services/import-export/importers/edl-importer"
import { ImportOptions } from "../../../services/import-export/types"

describe("EDLImporter", () => {
  const importer = new EDLImporter()

  const defaultOptions: ImportOptions = {
    format: "edl",
    frameRate: 30,
  }

  describe("validateContent", () => {
    it("должен валидировать корректный EDL контент", () => {
      const content = `
TITLE: Test Project

001  CLIP001  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
      `

      expect(importer.validateContent(content)).toBe(true)
    })

    it("должен отклонять пустой контент", () => {
      expect(importer.validateContent("")).toBe(false)
    })

    it("должен отклонять контент без событий", () => {
      const content = `
TITLE: Test Project
FCM: NON-DROP FRAME
      `

      expect(importer.validateContent(content)).toBe(false)
    })
  })

  describe("import", () => {
    it("должен импортировать простой EDL", async () => {
      const content = `
TITLE: Test EDL

001  CLIP001  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
002  CLIP002  V  C  00:00:05:00 00:00:15:00 00:00:10:00 00:00:20:00
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.errors).toHaveLength(0)

      const project = result.project!
      expect(project.name).toBe("Imported EDL Project")
      expect(project.fps).toBe(30)
      expect(project.globalTracks).toHaveLength(1)

      const videoTrack = project.globalTracks[0]
      expect(videoTrack.type).toBe("video")
      expect(videoTrack.clips).toHaveLength(2)

      const clip1 = videoTrack.clips[0]
      expect(clip1.startTime).toBe(0)
      expect(clip1.duration).toBe(10)

      const clip2 = videoTrack.clips[1]
      expect(clip2.startTime).toBe(10)
      expect(clip2.duration).toBe(10)
    })

    it("должен импортировать EDL с переходами", async () => {
      const content = `
TITLE: Test EDL with Transitions

001  CLIP001  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
002  CLIP002  V  D  00:00:05:00 00:00:15:00 00:00:09:00 00:00:19:00
* DISSOLVE DURATION: 30 FRAMES
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      const clip = project.globalTracks[0].clips[1]

      expect(clip.transitions).toHaveLength(1)
      expect(clip.transitions[0].transitionId).toBe("dissolve")
      expect(clip.transitions[0].type).toBe("cross")
    })

    it("должен импортировать EDL с видео и аудио треками", async () => {
      const content = `
TITLE: Multi-track EDL

001  VIDEO01  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
002  AUDIO01  A  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      expect(project.globalTracks).toHaveLength(2)

      const videoTrack = project.globalTracks.find((t) => t.type === "video")
      const audioTrack = project.globalTracks.find((t) => t.type === "audio")

      expect(videoTrack).toBeDefined()
      expect(audioTrack).toBeDefined()
      expect(videoTrack!.clips).toHaveLength(1)
      expect(audioTrack!.clips).toHaveLength(1)
    })

    it("должен обрабатывать комментарии и дополнительную информацию", async () => {
      const content = `
TITLE: EDL with Comments

001  CLIP001  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
* FROM CLIP NAME: Original_Clip_Name.mov
* SOURCE FILE: /path/to/media/Original_Clip_Name.mov
* COMMENT: This is a test clip
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.mediaFiles).toHaveLength(1)
      expect(result.mediaFiles[0].path).toBe("/path/to/media/Original_Clip_Name.mov")
      expect(result.mediaFiles[0].name).toBe("Original_Clip_Name.mov")
      expect(result.mediaFiles[0].path).toContain(".mov")
    })

    it("должен добавлять предупреждения для нераспознанных строк", async () => {
      const content = `
TITLE: EDL with Unknown Lines

001  CLIP001  V  C  00:00:00:00 00:00:10:00 00:00:00:00 00:00:10:00
UNKNOWN LINE FORMAT
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe("UNRECOGNIZED_LINE")
    })
  })

  describe("timecode parsing", () => {
    it("должен корректно парсить и конвертировать timecode", async () => {
      const content = `
001  CLIP001  V  C  00:01:30:15 00:01:40:15 00:00:00:00 00:00:10:00
      `

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const clip = result.project!.globalTracks[0].clips[0]

      // 00:01:30:15 = 90 секунд + 15/30 = 90.5 секунд
      expect(clip.mediaStartTime).toBeCloseTo(90.5, 2)

      // 00:01:40:15 = 100 секунд + 15/30 = 100.5 секунд
      expect(clip.mediaEndTime).toBeCloseTo(100.5, 2)
    })
  })
})
