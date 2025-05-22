import { render, screen, fireEvent } from "@testing-library/react"
import { BrowserTabs } from "./browser-tabs"

// Мокаем модуль i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.tabs.media": "Media",
        "browser.tabs.music": "Music",
        "browser.tabs.effects": "Effects",
        "browser.tabs.filters": "Filters",
        "browser.tabs.subtitles": "Subtitles",
        "browser.tabs.transitions": "Transitions",
        "browser.tabs.templates": "Multicam",
      }
      return translations[key] || key
    },
  }),
}))

describe("BrowserTabs", () => {
  const mockOnTabChange = jest.fn()

  beforeEach(() => {
    mockOnTabChange.mockClear()
  })

  it("renders all tabs correctly", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />)

    // Проверяем, что все вкладки отображаются
    expect(screen.getByText("Media")).toBeInTheDocument()
    expect(screen.getByText("Music")).toBeInTheDocument()
    expect(screen.getByText("Effects")).toBeInTheDocument()
    expect(screen.getByText("Filters")).toBeInTheDocument()
    expect(screen.getByText("Subtitles")).toBeInTheDocument()
    expect(screen.getByText("Transitions")).toBeInTheDocument()
    expect(screen.getByText("Multicam")).toBeInTheDocument()
  })

  it("highlights the active tab", () => {
    render(<BrowserTabs activeTab="music" onTabChange={mockOnTabChange} />)

    // Проверяем, что активная вкладка имеет атрибут data-state="active"
    const musicTab = screen.getByText("Music").closest("button")
    expect(musicTab).toHaveAttribute("data-state", "active")

    // Проверяем, что неактивная вкладка имеет атрибут data-state="inactive"
    const mediaTab = screen.getByText("Media").closest("button")
    expect(mediaTab).toHaveAttribute("data-state", "inactive")
  })

  it("calls onTabChange when a tab is clicked", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />)

    // Кликаем по вкладке "Music"
    fireEvent.click(screen.getByText("Music"))
    expect(mockOnTabChange).toHaveBeenCalledWith("music")

    // Кликаем по вкладке "Effects"
    fireEvent.click(screen.getByText("Effects"))
    expect(mockOnTabChange).toHaveBeenCalledWith("effects")
  })

  it("renders all tab icons", () => {
    render(<BrowserTabs activeTab="media" onTabChange={mockOnTabChange} />)

    // Проверяем, что все иконки отображаются
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(7)

    // Проверяем, что у каждой вкладки есть иконка (svg)
    tabs.forEach((tab) => {
      const svg = tab.querySelector("svg")
      expect(svg).toBeInTheDocument()
    })
  })
})
