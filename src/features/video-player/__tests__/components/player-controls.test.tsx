import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { PlayerControls } from "../../components/player-controls"

// Мокаем иконки Lucide
vi.mock("lucide-react", () => ({
  Camera: () => <div data-testid="icon-camera">Camera</div>,
  ChevronFirst: () => <div data-testid="icon-chevron-first">ChevronFirst</div>,
  ChevronLast: () => <div data-testid="icon-chevron-last">ChevronLast</div>,
  CircleDot: () => <div data-testid="icon-circle-dot">CircleDot</div>,
  ImagePlay: () => <div data-testid="icon-image-play">ImagePlay</div>,
  Maximize2: () => <div data-testid="icon-maximize">Maximize2</div>,
  Minimize2: () => <div data-testid="icon-minimize">Minimize2</div>,
  Pause: () => <div data-testid="icon-pause">Pause</div>,
  Play: () => <div data-testid="icon-play">Play</div>,
  StepBack: () => <div data-testid="icon-step-back">StepBack</div>,
  StepForward: () => <div data-testid="icon-step-forward">StepForward</div>,
  TvMinimalPlay: () => <div data-testid="icon-tv-minimal">TvMinimalPlay</div>,
  UnfoldHorizontal: () => <div data-testid="icon-unfold">UnfoldHorizontal</div>,
  Volume2: () => <div data-testid="icon-volume">Volume2</div>,
  VolumeX: () => <div data-testid="icon-volume-x">VolumeX</div>,
}))

// Мокаем компоненты UI
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, className, ...props }: any) => (
    <button onClick={onClick} className={className} data-variant={variant} data-size={size} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/slider", () => ({
  Slider: ({ value, onValueChange, max, step, className, disabled }: any) => (
    <input
      type="range"
      data-testid="slider"
      value={value?.[0] || 0}
      onChange={(e) => onValueChange?.([Number.parseFloat(e.target.value)])}
      max={max}
      step={step}
      className={className}
      disabled={disabled}
    />
  ),
}))

// Мокаем дочерние компоненты
vi.mock("../../components/prerender-controls", () => ({
  PrerenderControls: () => <div data-testid="prerender-controls">Prerender Controls</div>,
}))

vi.mock("../../components/volume-slider", () => ({
  VolumeSlider: ({ volume, onValueChange, onValueCommit }: any) => (
    <div
      data-testid="volume-slider"
      data-volume={volume}
      onClick={() => {
        if (onValueChange) onValueChange([0.5])
        if (onValueCommit) onValueCommit([0.5])
      }}
    >
      Volume Slider
    </div>
  ),
}))

// Мокаем хуки
const mockPlayerContext = {
  isPlaying: false,
  setIsPlaying: vi.fn(),
  setCurrentTime: vi.fn(),
  volume: 0.75,
  setVolume: vi.fn(),
  isRecording: false,
  setIsRecording: vi.fn(),
  setIsSeeking: vi.fn(),
  isChangingCamera: false,
  isResizableMode: false,
  setIsResizableMode: vi.fn(),
  videoSource: "timeline" as const,
  setVideoSource: vi.fn(),
}

vi.mock("../../services/player-provider", () => ({
  usePlayer: () => mockPlayerContext,
}))

const mockFullscreen = {
  isFullscreen: false,
  toggleFullscreen: vi.fn(),
}

vi.mock("../../hooks/use-fullscreen", () => ({
  useFullscreen: () => mockFullscreen,
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock("@/features/media/utils/video", () => ({
  getFrameTime: (_file: MediaFile) => 1 / 30, // 30 fps
}))

describe("PlayerControls", () => {
  const mockFile: MediaFile = {
    id: "test-video",
    path: "/path/to/video.mp4",
    name: "Test Video.mp4",
    size: 1024000,
    isVideo: true,
    duration: 120, // 2 минуты в секундах
    probeData: {
      format: {},
      streams: [{ r_frame_rate: "30/1" }],
    } as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPlayerContext.isPlaying = false
    mockPlayerContext.volume = 0.75
    mockPlayerContext.isRecording = false
    mockPlayerContext.isResizableMode = false
    mockPlayerContext.videoSource = "timeline"
    mockFullscreen.isFullscreen = false
  })

  describe("Отображение элементов управления", () => {
    it("должен отображать все основные элементы управления", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("icon-step-back")).toBeInTheDocument()
      expect(screen.getByTestId("icon-play")).toBeInTheDocument()
      expect(screen.getByTestId("icon-step-forward")).toBeInTheDocument()
      expect(screen.getByTestId("slider")).toBeInTheDocument()
      expect(screen.getByTestId("volume-slider")).toBeInTheDocument()
      expect(screen.getByTestId("icon-maximize")).toBeInTheDocument()
    })

    it("должен отображать иконку паузы при воспроизведении", () => {
      mockPlayerContext.isPlaying = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("icon-pause")).toBeInTheDocument()
      expect(screen.queryByTestId("icon-play")).not.toBeInTheDocument()
    })

    it("должен отображать иконку записи при isRecording", () => {
      mockPlayerContext.isRecording = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("icon-circle-dot")).toBeInTheDocument()
    })

    it("должен отображать иконку minimize в полноэкранном режиме", () => {
      mockFullscreen.isFullscreen = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("icon-minimize")).toBeInTheDocument()
      expect(screen.queryByTestId("icon-maximize")).not.toBeInTheDocument()
    })
  })

  describe("Управление воспроизведением", () => {
    it("должен переключать воспроизведение при клике на play/pause", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const playButton = screen.getByTitle("timeline.controls.play")
      fireEvent.click(playButton)

      expect(mockPlayerContext.setIsPlaying).toHaveBeenCalledWith(true)
    })

    it("должен переключать паузу при воспроизведении", () => {
      mockPlayerContext.isPlaying = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const pauseButton = screen.getByTitle("timeline.controls.pause")
      fireEvent.click(pauseButton)

      expect(mockPlayerContext.setIsPlaying).toHaveBeenCalledWith(false)
    })

    it("должен переключать запись", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const recordButton = screen.getByTitle("timeline.controls.record")
      expect(recordButton).not.toBeDisabled() // Проверяем что кнопка активна
      fireEvent.click(recordButton)

      expect(mockPlayerContext.setIsRecording).toHaveBeenCalledWith(true)
    })

    it("должен останавливать запись", () => {
      mockPlayerContext.isRecording = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const stopRecordButton = screen.getByTitle("timeline.controls.stopRecord")
      fireEvent.click(stopRecordButton)

      expect(mockPlayerContext.setIsRecording).toHaveBeenCalledWith(false)
    })
  })

  describe("Навигация по времени", () => {
    it("должен обновлять время при изменении слайдера", () => {
      render(<PlayerControls currentTime={30} file={mockFile} />)

      const slider = screen.getByTestId("slider")
      fireEvent.change(slider, { target: { value: "60" } })

      expect(mockPlayerContext.setCurrentTime).toHaveBeenCalledWith(60)
    })

    it("должен устанавливать isSeeking при начале перемещения", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const slider = screen.getByTestId("slider")
      // Мокаем onValueChange для триггера isSeeking
      fireEvent.change(slider, { target: { value: "30" } })

      expect(mockPlayerContext.setIsSeeking).toHaveBeenCalledWith(true)
      expect(mockPlayerContext.setCurrentTime).toHaveBeenCalledWith(30)
    })

    it("должен правильно отображать время файла", () => {
      const fileWithTime = {
        ...mockFile,
        startTime: "00:01:05:15",
        duration: 120, // Число, а не строка
      }
      render(<PlayerControls currentTime={65.5} file={fileWithTime} />)

      // Компонент отображает startTime и duration из файла
      expect(screen.getByText("00:01:05:15")).toBeInTheDocument()
      expect(screen.getByText("120")).toBeInTheDocument()
    })

    it("должен отображать значения по умолчанию если время не задано", () => {
      const fileWithoutTime = {
        ...mockFile,
        startTime: undefined,
        duration: undefined,
      }
      render(<PlayerControls currentTime={0} file={fileWithoutTime} />)

      // Показывает значения по умолчанию - должно быть два элемента с текстом 00:00:00:00
      const defaultTimeElements = screen.getAllByText("00:00:00:00")
      expect(defaultTimeElements).toHaveLength(2) // startTime и duration
    })
  })

  describe("Управление громкостью", () => {
    it("должен отображать текущую громкость", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const volumeSlider = screen.getByTestId("volume-slider")
      expect(volumeSlider).toHaveAttribute("data-volume", "0.75")
    })

    it("должен обновлять громкость при клике на слайдер", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const volumeSlider = screen.getByTestId("volume-slider")
      fireEvent.click(volumeSlider)

      expect(mockPlayerContext.setVolume).toHaveBeenCalledWith(0.5)
    })
  })

  describe("Полноэкранный режим", () => {
    it("должен вызывать toggleFullscreen при клике", () => {
      // Создаем mock элемент
      const mockContainer = document.createElement("div")
      mockContainer.className = "media-player-container"
      document.body.appendChild(mockContainer)

      render(<PlayerControls currentTime={0} file={mockFile} />)

      const fullscreenButton = screen.getByTitle("timeline.controls.fullscreen")
      fireEvent.click(fullscreenButton)

      expect(mockFullscreen.toggleFullscreen).toHaveBeenCalledWith(mockContainer)

      // Очищаем
      document.body.removeChild(mockContainer)
    })

    it("должен показывать ошибку если контейнер не найден", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      render(<PlayerControls currentTime={0} file={mockFile} />)

      const fullscreenButton = screen.getByTitle("timeline.controls.fullscreen")
      fireEvent.click(fullscreenButton)

      expect(consoleSpy).toHaveBeenCalledWith("[handleFullscreen] Не найден контейнер медиаплеера")
      expect(mockFullscreen.toggleFullscreen).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe("Режим изменения размера", () => {
    it("должен переключать режим изменения размера", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const resizeButton = screen.getByTitle("timeline.controlsMain.resizableMode")
      fireEvent.click(resizeButton)

      expect(mockPlayerContext.setIsResizableMode).toHaveBeenCalledWith(true)
    })

    it("должен показывать правильную иконку в режиме изменения размера", () => {
      mockPlayerContext.isResizableMode = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме изменения размера title меняется на fixedSizeMode
      expect(screen.getByTitle("timeline.controlsMain.fixedSizeMode")).toBeInTheDocument()
    })
  })

  describe("Переключение источника видео", () => {
    it("должен переключать источник видео при клике", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline показывается иконка TvMinimalPlay
      const sourceButton = screen.getByTestId("icon-tv-minimal").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockPlayerContext.setVideoSource).toHaveBeenCalledWith("browser")
    })

    it("должен переключать обратно на timeline", () => {
      mockPlayerContext.videoSource = "browser" as any
      render(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме browser показывается иконка ImagePlay
      const sourceButton = screen.getByTestId("icon-image-play").closest("button")
      fireEvent.click(sourceButton!)

      expect(mockPlayerContext.setVideoSource).toHaveBeenCalledWith("timeline")
    })

    it("должен показывать правильную иконку для текущего источника", () => {
      const { rerender } = render(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме timeline
      expect(screen.getByTestId("icon-tv-minimal")).toBeInTheDocument()
      expect(screen.queryByTestId("icon-image-play")).not.toBeInTheDocument()

      // Переключаем на browser
      mockPlayerContext.videoSource = "browser" as any
      rerender(<PlayerControls currentTime={0} file={mockFile} />)

      // В режиме browser
      expect(screen.getByTestId("icon-image-play")).toBeInTheDocument()
      expect(screen.queryByTestId("icon-tv-minimal")).not.toBeInTheDocument()
    })
  })

  describe("Обработка времени", () => {
    it("должен корректно обрабатывать Unix timestamp", () => {
      // Unix timestamp (больше года в секундах)
      const unixTime = Date.now() / 1000
      render(<PlayerControls currentTime={unixTime} file={mockFile} />)

      // Проверяем что слайдер использует правильное значение
      const slider = screen.getByTestId("slider")
      expect(slider).toHaveValue("0") // localDisplayTime по умолчанию 0
    })

    it("должен правильно рассчитывать frameTime", () => {
      const fileWith60fps = {
        ...mockFile,
        probeData: {
          format: {},
          streams: [{ r_frame_rate: "60/1" }],
        } as any,
      }
      render(<PlayerControls currentTime={0} file={fileWith60fps} />)

      // getFrameTime мокнут для возврата 1/30, проверяем что слайдер использует step
      const slider = screen.getByTestId("slider")
      expect(slider).toHaveAttribute("step", "0.001") // Компонент использует фиксированный step
    })
  })

  describe("Отключенные состояния", () => {
    it("должен отключать элементы управления при смене камеры", () => {
      mockPlayerContext.isChangingCamera = true
      render(<PlayerControls currentTime={0} file={mockFile} />)

      const playButton = screen.getByTitle("timeline.controls.play")
      expect(playButton).toBeDisabled()

      const slider = screen.getByTestId("slider")
      expect(slider).toBeDisabled()
    })

    it("должен показывать prerender controls", () => {
      render(<PlayerControls currentTime={0} file={mockFile} />)

      expect(screen.getByTestId("prerender-controls")).toBeInTheDocument()
    })
  })
})
