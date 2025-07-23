import { describe, expect, it } from "vitest"

import { FCPXMLImporter } from "../../../services/import-export/importers/fcpxml-importer"
import { ImportOptions } from "../../../services/import-export/types"

describe("FCPXMLImporter", () => {
  const importer = new FCPXMLImporter()

  const defaultOptions: ImportOptions = {
    format: "fcpxml",
    frameRate: 30,
  }

  describe("validateContent", () => {
    it("должен валидировать корректный FCPXML контент", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <asset id="r2" name="test_video.mp4" src="test_video.mp4" hasVideo="1" hasAudio="1" duration="600/30s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Test Project">
        <sequence format="r1" duration="600/30s">
          <spine>
            <asset-clip ref="r2" name="Test Clip" offset="0s" duration="300/30s" start="0s"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      expect(importer.validateContent(content)).toBe(true)
    })

    it("должен отклонять некорректный XML", () => {
      const content = "This is not XML"
      expect(importer.validateContent(content)).toBe(false)
    })

    it("должен отклонять XML без fcpxml элемента", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <timeline/>
</project>`

      expect(importer.validateContent(content)).toBe(false)
    })
  })

  describe("import", () => {
    it("должен импортировать простой FCPXML проект", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <asset id="r2" name="test_video.mp4" src="test_video.mp4" hasVideo="1" hasAudio="1" duration="600/30s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Test FCPXML Project">
        <sequence format="r1" duration="600/30s">
          <spine>
            <asset-clip ref="r2" name="Test Clip" offset="0s" duration="300/30s" start="0s"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.errors).toHaveLength(0)

      const project = result.project!
      expect(project.name).toBe("Test FCPXML Project")
      expect(project.fps).toBe(30)
      expect(project.settings.resolution.width).toBe(1920)
      expect(project.settings.resolution.height).toBe(1080)

      expect(project.globalTracks).toHaveLength(1)

      const track = project.globalTracks[0]
      expect(track.clips).toHaveLength(1)

      const clip = track.clips[0]
      expect(clip.name).toBe("Test Clip")
      expect(clip.startTime).toBe(0)
      expect(clip.duration).toBe(10) // 300/30s = 10s
    })

    it("должен импортировать медиафайлы", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <asset id="r2" name="video1.mp4" src="/path/to/video1.mp4" hasVideo="1" hasAudio="1" duration="900/30s"/>
    <asset id="r3" name="audio1.wav" src="/path/to/audio1.wav" hasVideo="0" hasAudio="1" duration="1200/30s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Media Test">
        <sequence format="r1" duration="1200/30s">
          <spine>
            <asset-clip ref="r2" name="Video Clip" offset="0s" duration="600/30s" start="0s"/>
            <asset-clip ref="r3" name="Audio Clip" offset="600/30s" duration="600/30s" start="0s" lane="-1"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.mediaFiles).toHaveLength(4)

      const firstFile = result.mediaFiles[0]
      expect(firstFile).toBeDefined()
      expect(firstFile?.name).toBeDefined()
      expect(firstFile?.path).toBeDefined()
    })

    it("должен обрабатывать различные frame rates", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p2997" frameDuration="1001/30000s" width="1920" height="1080"/>
    <asset id="r2" name="test.mp4" src="test.mp4" hasVideo="1" hasAudio="0" duration="2997/30000s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Frame Rate Test">
        <sequence format="r1" duration="2997/30000s">
          <spine>
            <asset-clip ref="r2" name="Test Clip" offset="0s" duration="2997/30000s" start="0s"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      // frameDuration "1001/30000s" означает 29.97 fps
      expect(project.fps).toBeCloseTo(29.97, 2)
    })

    it("должен обрабатывать множественные треки", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <asset id="r2" name="video1.mp4" src="video1.mp4" hasVideo="1" hasAudio="1" duration="600/30s"/>
    <asset id="r3" name="video2.mp4" src="video2.mp4" hasVideo="1" hasAudio="0" duration="300/30s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Multi Track Test">
        <sequence format="r1" duration="900/30s">
          <spine>
            <asset-clip ref="r2" name="Main Video" offset="0s" duration="600/30s" start="0s"/>
            <asset-clip ref="r3" name="Overlay Video" offset="300/30s" duration="300/30s" start="0s" lane="1"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      expect(project.globalTracks).toHaveLength(2)

      const mainTrack = project.globalTracks.find((t) => t.order === 0)
      const overlayTrack = project.globalTracks.find((t) => t.order === 1)

      expect(mainTrack?.clips).toHaveLength(1)
      expect(overlayTrack?.clips).toHaveLength(1)

      expect(mainTrack?.clips[0].name).toBe("Main Video")
      expect(overlayTrack?.clips[0].name).toBe("Overlay Video")
    })

    it("должен обрабатывать отключенные клипы", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>

<fcpxml version="1.11">
  <resources>
    <format id="r1" name="FFVideoFormat1920x1080p30" frameDuration="1/30s" width="1920" height="1080"/>
    <asset id="r2" name="test.mp4" src="test.mp4" hasVideo="1" hasAudio="0" duration="600/30s"/>
  </resources>
  
  <library>
    <event name="Test Event">
      <project name="Disabled Clip Test">
        <sequence format="r1" duration="600/30s">
          <spine>
            <asset-clip ref="r2" name="Disabled Clip" offset="0s" duration="300/30s" start="0s" enabled="0"/>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      const clip = project.globalTracks[0].clips[0]

      expect(clip.name).toBe("Disabled Clip")
      expect(clip.opacity).toBe(0.0) // Отключенный клип имеет opacity = 0
    })
  })

  describe("обработка ошибок", () => {
    it("должен обрабатывать некорректный XML", async () => {
      const content = "This is not valid XML"

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe("INVALID_XML")
    })

    it("должен обрабатывать пустой FCPXML", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.11">
</fcpxml>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.project!.globalTracks).toHaveLength(0)
    })
  })
})
