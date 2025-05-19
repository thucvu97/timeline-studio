import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { NoFiles } from "./no-files"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.noFiles.title": "No files found",
        "browser.noFiles.addFilesPrompt":
          "Add files to the following directories:",
        "browser.noFiles.mediaTypes": "Video and image files",
        "browser.noFiles.musicType": "Audio files",
        "browser.noFiles.supportedVideoFormats":
          "Supported video formats: MP4, MOV, AVI, MKV",
        "browser.noFiles.supportedAudioFormats":
          "Supported audio formats: MP3, WAV, OGG, FLAC",
      }
      return translations[key] || key
    },
  }),
}))

describe("NoFiles", () => {
  it("should render the component with correct translations", () => {
    render(<NoFiles />)

    // Проверяем, что заголовок отображается
    expect(screen.getByText("No files found")).toBeInTheDocument()

    // Проверяем, что подсказка отображается
    expect(
      screen.getByText("Add files to the following directories:"),
    ).toBeInTheDocument()

    // Проверяем, что пути к директориям отображаются
    expect(screen.getByText("/public/media/")).toBeInTheDocument()
    expect(screen.getByText("/public/music/")).toBeInTheDocument()

    // Проверяем, что типы файлов отображаются
    expect(screen.getByText("Video and image files")).toBeInTheDocument()
    expect(screen.getByText("Audio files")).toBeInTheDocument()

    // Проверяем, что поддерживаемые форматы отображаются
    // Используем регулярное выражение для поиска текста, так как он может быть разбит на несколько элементов
    expect(screen.getByText(/Supported video formats/)).toBeInTheDocument()
    expect(screen.getByText(/Supported audio formats/)).toBeInTheDocument()
  })

  it("should have the correct styling", () => {
    render(<NoFiles />)

    // Проверяем, что контейнер имеет правильные классы
    const container = screen
      .getByText("No files found")
      .closest("div")?.parentElement
    expect(container).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "gap-4",
      "py-10",
      "text-center",
    )

    // Проверяем, что заголовок имеет правильные классы
    const title = screen.getByText("No files found")
    expect(title).toHaveClass("text-gray-600", "dark:text-gray-400")

    // Проверяем, что подсказка имеет правильные классы
    const prompt = screen.getByText("Add files to the following directories:")
    expect(prompt).toHaveClass("text-sm", "text-gray-500", "dark:text-gray-400")

    // Проверяем, что директории имеют правильные классы
    const directories = screen
      .getByText("/public/media/")
      .closest("div")?.parentElement
    expect(directories).toHaveClass("flex", "flex-col", "gap-2", "text-sm")

    // Проверяем, что пути имеют правильные классы
    const mediaPath = screen.getByText("/public/media/")
    expect(mediaPath).toHaveClass(
      "rounded",
      "bg-gray-100",
      "px-2",
      "py-1",
      "dark:bg-gray-800",
    )

    const musicPath = screen.getByText("/public/music/")
    expect(musicPath).toHaveClass(
      "rounded",
      "bg-gray-100",
      "px-2",
      "py-1",
      "dark:bg-gray-800",
    )

    // Проверяем, что поддерживаемые форматы имеют правильные классы
    const formats = screen.getByText(/Supported video formats/).closest("div")
    expect(formats).toHaveClass(
      "text-xs",
      "text-gray-400",
      "dark:text-gray-500",
    )
  })
})
