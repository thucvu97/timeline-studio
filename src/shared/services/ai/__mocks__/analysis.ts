/**
 * Mock implementations for analysis services
 * Используется в тестах для изоляции от FFmpeg и других внешних зависимостей
 */

import type {
  AudioAnalysisResult,
  ColorAnalysis,
  CompositionAnalysis,
  ContentAnalysisOptions,
  ContentAnalysisResult,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaFile,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoAnalysisResult,
  VideoMetadata,
} from "../analysis/interfaces"

// Mock FFmpeg Service
export class MockFFmpegService implements IFFmpegAnalysisService {
  async analyzeVideo(_file: MediaFile): Promise<VideoAnalysisResult> {
    return {
      duration: 120,
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      codec: "h264",
      bitrate: 5000000,
      scenes: [
        { start: 0, end: 30, confidence: 0.95 },
        { start: 30, end: 60, confidence: 0.9 },
        { start: 60, end: 120, confidence: 0.92 },
      ],
      quality: {
        overall: 85,
        sharpness: 90,
        noise: 10,
        compression: 15,
        motionIntensity: 45,
      },
    }
  }

  async analyzeAudio(_file: MediaFile): Promise<AudioAnalysisResult> {
    return {
      duration: 120,
      channels: 2,
      sampleRate: 48000,
      bitrate: 192000,
      codec: "aac",
      volume: {
        average: -12,
        peak: -6,
        min: -30,
      },
      silentSegments: [
        { start: 10, end: 12 },
        { start: 45, end: 47 },
      ],
    }
  }

  async extractFrames(_file: MediaFile, timestamps: number[]): Promise<string[]> {
    return timestamps.map((t, i) => `/tmp/frame_${i}_${t}.jpg`)
  }

  async extractAudioSegment(_file: MediaFile, start: number, end: number): Promise<string> {
    return `/tmp/audio_${start}_${end}.wav`
  }

  async detectScenes(
    _pathOrFile: string | MediaFile,
    _optionsOrThreshold?:
      | { sensitivity?: number; minSceneDuration?: number; method?: "threshold" | "histogram" }
      | number,
  ): Promise<SceneDetectionResult[]> {
    return [
      { start: 0, end: 30, confidence: 0.95 },
      { start: 30, end: 60, confidence: 0.9 },
      { start: 60, end: 120, confidence: 0.92 },
    ]
  }

  async getVideoMetadata(_path: string): Promise<VideoMetadata> {
    return {
      format: "mp4",
      duration: 120,
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000,
      hasAudio: true,
      audioChannels: 2,
      audioSampleRate: 48000,
      codec: "h264",
    }
  }

  async analyzeQuality(
    _path: string,
    _options?: {
      checkVideo?: boolean
      checkAudio?: boolean
      deepAnalysis?: boolean
    },
  ): Promise<QualityAnalysisResult> {
    return {
      overall: 85,
      video: {
        sharpness: 90,
        brightness: 75,
        contrast: 80,
        saturation: 85,
        noise: 10,
        stability: 95,
      },
      audio: {
        clarity: 90,
        volume: 80,
        clipping: false,
        noiseLevel: 5,
      },
    }
  }

  async detectSilence(
    _path: string,
    _options?: {
      threshold?: number
      minDuration?: number
    },
  ): Promise<SilenceDetectionResult> {
    return {
      silentSegments: [
        { startTime: 10, endTime: 12, duration: 2, confidence: 0.95 },
        { startTime: 45, endTime: 47, duration: 2, confidence: 0.9 },
      ],
      totalSilenceDuration: 4,
      speechRatio: 0.96,
    }
  }

  async analyzeMotion(
    _path: string,
    _options?: {
      sensitivity?: number
      stabilityCheck?: boolean
    },
  ): Promise<MotionAnalysisResult> {
    return {
      motionIntensity: 45,
      stabilityScore: 85,
    }
  }

  async extractKeyframes(
    _path: string,
    options?: {
      count?: number
      interval?: number
      outputDir?: string
    },
  ): Promise<string[]> {
    const count = options?.count || 5
    return Array.from({ length: count }, (_, i) => `/tmp/keyframe_${i}.jpg`)
  }

  async convertToFormat(_inputPath: string, _outputPath: string, _format: string): Promise<boolean> {
    return true
  }
}

// Mock Vision Service
export class MockVisionService implements IVisionService {
  async analyzeFrame(_imagePath: string): Promise<FrameAnalysisResult> {
    return {
      objects: [
        { label: "person", confidence: 0.95, bbox: { x: 100, y: 100, width: 200, height: 300 } },
        { label: "car", confidence: 0.87, bbox: { x: 400, y: 200, width: 300, height: 200 } },
      ],
      faces: [
        { confidence: 0.98, bbox: { x: 120, y: 120, width: 80, height: 100 }, emotions: { happy: 0.8, neutral: 0.2 } },
      ],
      text: [{ text: "Sample Text", confidence: 0.92, bbox: { x: 500, y: 50, width: 200, height: 40 } }],
      scene: {
        type: "outdoor",
        confidence: 0.89,
        attributes: ["daylight", "urban", "street"],
      },
      nsfw: {
        safe: 0.99,
        suggestive: 0.01,
        explicit: 0.0,
      },
    }
  }

  async analyzeVideo(_videoPath: string, _sampleRate?: number): Promise<FrameAnalysisResult[]> {
    // Return analysis for 3 sample frames
    return [
      await this.analyzeFrame("frame1.jpg"),
      await this.analyzeFrame("frame2.jpg"),
      await this.analyzeFrame("frame3.jpg"),
    ]
  }

  async detectFaces(imagePath: string): Promise<any[]> {
    const result = await this.analyzeFrame(imagePath)
    return result.faces
  }

  async recognizeText(imagePath: string): Promise<string> {
    const result = await this.analyzeFrame(imagePath)
    return result.text.map((t) => t.text).join(" ")
  }

  async analyzeFrames(imagePaths: string[]): Promise<FrameAnalysis[]> {
    return Promise.all(
      imagePaths.map(async (_path, i) => ({
        id: `frame_${i}`,
        timestamp: i * 1000,
        objects: [
          {
            class: "person",
            confidence: 0.95,
            boundingBox: { x: 100, y: 100, width: 200, height: 300 },
          },
        ],
        text: [
          {
            text: "Sample Text",
            confidence: 0.92,
            boundingBox: { x: 500, y: 50, width: 200, height: 40 },
          },
        ],
        composition: {
          ruleOfThirds: { score: 0.8, points: [{ x: 640, y: 360 }] },
          leadingLines: { score: 0.7, lines: [] },
          balance: { score: 0.85, centerOfMass: { x: 640, y: 360 } },
          symmetry: { score: 0.6, axis: "vertical" },
        },
        colors: {
          dominantColors: [
            { r: 120, g: 150, b: 180, hex: "#7896b4", percentage: 35 },
            { r: 80, g: 100, b: 120, hex: "#506478", percentage: 25 },
          ],
          palette: [
            { r: 120, g: 150, b: 180, hex: "#7896b4", percentage: 35 },
            { r: 80, g: 100, b: 120, hex: "#506478", percentage: 25 },
          ],
          temperature: "cool",
          saturation: "medium",
          brightness: "medium",
        },
        quality: {
          sharpness: 85,
          brightness: 75,
          contrast: 80,
        },
      })),
    )
  }

  async detectObjects(imagePath: string): Promise<DetectedObject[]> {
    const result = await this.analyzeFrame(imagePath)
    return result.objects.map((obj) => ({
      class: obj.label,
      confidence: obj.confidence,
      boundingBox: obj.bbox,
    }))
  }

  async extractText(imagePath: string): Promise<ExtractedText[]> {
    const result = await this.analyzeFrame(imagePath)
    return result.text.map((t) => ({
      text: t.text,
      confidence: t.confidence,
      boundingBox: t.bbox,
    }))
  }

  async analyzeComposition(_imagePath: string): Promise<CompositionAnalysis> {
    return {
      ruleOfThirds: { score: 0.8, points: [{ x: 640, y: 360 }] },
      leadingLines: { score: 0.7, lines: [] },
      balance: { score: 0.85, centerOfMass: { x: 640, y: 360 } },
      symmetry: { score: 0.6, axis: "vertical" },
    }
  }

  async analyzeColors(_imagePath: string): Promise<ColorAnalysis> {
    return {
      dominantColors: [
        { r: 120, g: 150, b: 180, hex: "#7896b4", percentage: 35 },
        { r: 80, g: 100, b: 120, hex: "#506478", percentage: 25 },
      ],
      palette: [
        { r: 120, g: 150, b: 180, hex: "#7896b4", percentage: 35 },
        { r: 80, g: 100, b: 120, hex: "#506478", percentage: 25 },
      ],
      temperature: "cool",
      saturation: "medium",
      brightness: "medium",
    }
  }
}

// Mock Content Analysis Service
export class MockContentAnalysisService implements IContentAnalysisService {
  private ffmpeg = new MockFFmpegService()

  async analyzeContent(file: MediaFile): Promise<ContentAnalysisResult> {
    const [video, audio] = await Promise.all([this.ffmpeg.analyzeVideo(file), this.ffmpeg.analyzeAudio(file)])

    return {
      id: `analysis_${Date.now()}`,
      mediaFile: file,
      video,
      audio,
      metadata: {
        format: "mp4",
        duration: video.duration,
        width: video.resolution.width,
        height: video.resolution.height,
        fps: video.fps,
        bitrate: video.bitrate,
        hasAudio: true,
        audioChannels: 2,
        audioSampleRate: 48000,
        codec: "h264",
      },
      quality: video.quality,
      motion: {
        motionIntensity: 45,
        stabilityScore: 85,
      },
      scenes: video.scenes.map((s, i) => ({
        start: s.start,
        end: s.end,
        confidence: s.confidence,
        id: `scene_${i}`,
        description: `Scene ${i + 1}`,
        objects: ["person", "car"],
        keyframes: [`/tmp/keyframe_${i}.jpg`],
      })),
      transcript: {
        text: "This is a sample transcript of the video content.",
        segments: [
          { start: 0, end: 10, text: "This is a sample", confidence: 0.95 },
          { start: 10, end: 20, text: "transcript of the", confidence: 0.93 },
          { start: 20, end: 30, text: "video content.", confidence: 0.97 },
        ],
      },
      summary: "A sample video with outdoor scenes containing people and vehicles.",
      tags: ["outdoor", "people", "vehicles", "urban"],
      sentiment: {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1,
      },
      processingTime: 3200, // 3.2 seconds
    }
  }

  async analyzeMultiple(files: MediaFile[]): Promise<ContentAnalysisResult[]> {
    return Promise.all(files.map((f) => this.analyzeContent(f)))
  }

  async generateSummary(analysis: ContentAnalysisResult): Promise<string> {
    return analysis.summary || "Generated summary based on content analysis"
  }

  async extractKeyMoments(
    analysis: ContentAnalysisResult,
    count?: number,
  ): Promise<Array<{ timestamp: number; description: string; confidence: number }>> {
    const moments = []
    const numMoments = count || 5

    if (analysis.scenes) {
      for (let i = 0; i < numMoments && i < analysis.scenes.length; i++) {
        const scene = analysis.scenes[i]
        moments.push({
          timestamp: scene.start,
          description: scene.description || `Key moment ${i + 1}`,
          confidence: scene.confidence,
        })
      }
    }

    return moments
  }

  async analyzeMedia(file: MediaFile, _options?: ContentAnalysisOptions): Promise<ContentAnalysisResult> {
    return this.analyzeContent(file)
  }

  async batchAnalyzeMedia(files: MediaFile[], _options?: ContentAnalysisOptions): Promise<ContentAnalysisResult[]> {
    return this.analyzeMultiple(files)
  }
}

// Helper to create analysis results with specific data
export function createMockVideoAnalysis(overrides: Partial<VideoAnalysisResult> = {}): VideoAnalysisResult {
  return {
    duration: 60,
    fps: 24,
    resolution: { width: 1280, height: 720 },
    codec: "h264",
    bitrate: 3000000,
    scenes: [
      { start: 0, end: 30, confidence: 0.9 },
      { start: 30, end: 60, confidence: 0.85 },
    ],
    quality: {
      overall: 75,
      sharpness: 80,
      noise: 20,
      compression: 25,
      motionIntensity: 50,
    },
    ...overrides,
  }
}

export function createMockAudioAnalysis(overrides: Partial<AudioAnalysisResult> = {}): AudioAnalysisResult {
  return {
    duration: 60,
    channels: 2,
    sampleRate: 44100,
    bitrate: 128000,
    codec: "mp3",
    volume: {
      average: -15,
      peak: -9,
      min: -35,
    },
    silentSegments: [],
    ...overrides,
  }
}

export function createMockContentAnalysis(overrides: Partial<ContentAnalysisResult> = {}): ContentAnalysisResult {
  const video = createMockVideoAnalysis(overrides.video)
  const audio = createMockAudioAnalysis(overrides.audio)

  return {
    id: `mock_analysis_${Date.now()}`,
    mediaFile: {
      id: "mock_file",
      path: "/mock/video.mp4",
      filename: "video.mp4",
      size: 1000000,
      type: "video",
    },
    video,
    audio,
    metadata: {
      format: "mp4",
      duration: video.duration,
      width: video.resolution.width,
      height: video.resolution.height,
      fps: video.fps,
      bitrate: video.bitrate,
      hasAudio: true,
      audioChannels: 2,
      audioSampleRate: 48000,
      codec: "h264",
    },
    quality: video.quality,
    motion: {
      motionIntensity: 45,
      stabilityScore: 85,
    },
    scenes: [
      {
        start: 0,
        end: 30,
        confidence: 0.95,
        id: "scene_0",
        description: "Opening scene",
      },
    ],
    transcript: {
      text: "Mock transcript",
      segments: [],
    },
    summary: "Mock content summary",
    tags: ["mock", "test"],
    sentiment: {
      positive: 0.5,
      neutral: 0.4,
      negative: 0.1,
    },
    processingTime: 2800, // 2.8 seconds
    ...overrides,
  }
}
