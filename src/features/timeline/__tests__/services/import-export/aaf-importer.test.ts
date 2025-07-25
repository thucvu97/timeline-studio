import { describe, expect, it } from "vitest"

import { AAFImporter } from "../../../services/import-export/importers/aaf-importer"
import { ImportOptions } from "../../../services/import-export/types"

describe("AAFImporter", () => {
  const importer = new AAFImporter()

  const defaultOptions: ImportOptions = {
    format: "aaf",
    frameRate: 30,
  }

  describe("validateContent", () => {
    it("должен валидировать корректный AAF XML контент", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>urn:smpte:umid:060a2b34.01010101.01010f00.13000000.1234567890ab0000</MobID>
    <Name>Test Composition</Name>
  </CompositionMob>
</AAF>`

      expect(importer.validateContent(content)).toBe(true)
    })

    it("должен отклонять некорректный XML", () => {
      const content = "This is not XML"
      expect(importer.validateContent(content)).toBe(false)
    })

    it("должен отклонять XML без AAF элементов", () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <timeline/>
</project>`

      expect(importer.validateContent(content)).toBe(false)
    })
  })

  describe("import", () => {
    it("должен импортировать простой AAF проект", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>comp-001</MobID>
    <Name>Test AAF Project</Name>
    <TimelineMobSlot>
      <TrackID>1</TrackID>
      <TrackName>Video Track 1</TrackName>
      <PhysicalTrackNumber>1</PhysicalTrackNumber>
      <Sequence>
        <SourceClip>
          <Name>Test Clip</Name>
          <DataDefinition>Picture</DataDefinition>
          <Length>300</Length>
          <SourceID>source-001</SourceID>
          <SourceTrackID>1</SourceTrackID>
          <StartTime>0</StartTime>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
  </CompositionMob>
  
  <SourceMob>
    <MobID>source-001</MobID>
    <Name>test_video.mxf</Name>
    <EssenceDescriptor>
      <Type>FileDescriptor</Type>
      <Locator>/path/to/test_video.mxf</Locator>
      <StoredWidth>1920</StoredWidth>
      <StoredHeight>1080</StoredHeight>
    </EssenceDescriptor>
  </SourceMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.project).toBeDefined()
      expect(result.errors).toHaveLength(0)

      const project = result.project!
      expect(project.name).toBe("Test AAF Project")
      expect(project.fps).toBe(30)

      expect(project.globalTracks).toHaveLength(1)

      const track = project.globalTracks[0]
      expect(track.name).toBe("Video Track 1")
      expect(track.type).toBe("video")
      expect(track.clips).toHaveLength(1)

      const clip = track.clips[0]
      expect(clip.name).toBe("Test Clip")
      expect(clip.startTime).toBe(0)
      expect(clip.duration).toBe(10) // 300 frames / 30 fps = 10s
    })

    it("должен импортировать медиафайлы из SourceMob", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>comp-001</MobID>
    <Name>Media Test</Name>
    <TimelineMobSlot>
      <TrackID>1</TrackID>
      <TrackName>V1</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Picture</DataDefinition>
          <Length>600</Length>
          <SourceID>video-001</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
    <TimelineMobSlot>
      <TrackID>2</TrackID>
      <TrackName>A1</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Sound</DataDefinition>
          <Length>600</Length>
          <SourceID>audio-001</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
  </CompositionMob>
  
  <SourceMob>
    <MobID>video-001</MobID>
    <Name>video_file.mxf</Name>
    <EssenceDescriptor>
      <Type>FileDescriptor</Type>
      <Locator>/media/video_file.mxf</Locator>
      <StoredWidth>1920</StoredWidth>
      <StoredHeight>1080</StoredHeight>
      <AspectRatio>16:9</AspectRatio>
    </EssenceDescriptor>
  </SourceMob>
  
  <SourceMob>
    <MobID>audio-001</MobID>
    <Name>audio_file.wav</Name>
    <EssenceDescriptor>
      <Type>WaveAudioDescriptor</Type>
      <Locator>/media/audio_file.wav</Locator>
      <SampleRate>48000/1</SampleRate>
    </EssenceDescriptor>
  </SourceMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.mediaFiles).toHaveLength(2)

      const videoFile = result.mediaFiles.find((f) => f.name === "video_file.mxf")
      const audioFile = result.mediaFiles.find((f) => f.name === "audio_file.wav")

      expect(videoFile).toBeDefined()
      expect(videoFile?.isVideo).toBe(true)
      expect(videoFile?.isAudio).toBe(false)
      expect(videoFile?.name).toBe("video_file.mxf")
      expect(videoFile?.path).toBe("/media/video_file.mxf")

      expect(audioFile).toBeDefined()
      expect(audioFile?.isVideo).toBe(false)
      expect(audioFile?.isAudio).toBe(true)
      expect(audioFile?.name).toBe("audio_file.wav")
    })

    it("должен обрабатывать Filler (пробелы между клипами)", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>comp-001</MobID>
    <Name>Filler Test</Name>
    <TimelineMobSlot>
      <TrackID>1</TrackID>
      <TrackName>V1</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Picture</DataDefinition>
          <Length>150</Length>
          <SourceID>source-001</SourceID>
        </SourceClip>
        <Filler>
          <DataDefinition>Unknown</DataDefinition>
          <Length>60</Length>
        </Filler>
        <SourceClip>
          <DataDefinition>Picture</DataDefinition>
          <Length>150</Length>
          <SourceID>source-002</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
  </CompositionMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      const track = project.globalTracks[0]

      expect(track.clips).toHaveLength(2)

      const clip1 = track.clips[0]
      const clip2 = track.clips[1]

      expect(clip1.startTime).toBe(0)
      expect(clip1.duration).toBe(5) // 150 frames / 30 fps

      expect(clip2.startTime).toBe(7) // 5s clip + 2s filler (60/30)
      expect(clip2.duration).toBe(5)
    })

    it("должен определять тип трека по DataDefinition", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>comp-001</MobID>
    <Name>Track Type Test</Name>
    <TimelineMobSlot>
      <TrackID>1</TrackID>
      <TrackName>Video Track</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Picture</DataDefinition>
          <Length>300</Length>
          <SourceID>vid-001</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
    <TimelineMobSlot>
      <TrackID>2</TrackID>
      <TrackName>Audio Track</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Sound</DataDefinition>
          <Length>300</Length>
          <SourceID>aud-001</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
  </CompositionMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)

      const project = result.project!
      expect(project.globalTracks).toHaveLength(2)

      const videoTrack = project.globalTracks[0]
      const audioTrack = project.globalTracks[1]

      expect(videoTrack.type).toBe("video")
      expect(audioTrack.type).toBe("audio")
    })
  })

  describe("обработка ошибок", () => {
    it("должен обрабатывать отсутствие композиции", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <SourceMob>
    <MobID>source-001</MobID>
    <Name>Only Source</Name>
  </SourceMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain("No composition found")
    })

    it("должен добавлять предупреждения для отсутствующих медиафайлов", async () => {
      const content = `<?xml version="1.0" encoding="UTF-8"?>
<AAF>
  <CompositionMob>
    <MobID>comp-001</MobID>
    <Name>Missing Media Test</Name>
    <TimelineMobSlot>
      <TrackID>1</TrackID>
      <TrackName>V1</TrackName>
      <Sequence>
        <SourceClip>
          <DataDefinition>Picture</DataDefinition>
          <Length>300</Length>
          <SourceID>missing-source</SourceID>
        </SourceClip>
      </Sequence>
    </TimelineMobSlot>
  </CompositionMob>
</AAF>`

      const result = await importer.import(content, defaultOptions)

      expect(result.success).toBe(true)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe("MISSING_MEDIA")
    })
  })
})
