import { describe, expect, it } from "vitest"

// Импортируем все экспорты из index
import * as SubtitlesModule from "../index"

describe("Subtitles Module Exports", () => {
  it("должен экспортировать все компоненты", () => {
    // Компоненты
    expect(SubtitlesModule.SubtitleAITools).toBeDefined()
    expect(SubtitlesModule.SubtitleGroup).toBeDefined()
    expect(SubtitlesModule.SubtitlePreview).toBeDefined()
    expect(SubtitlesModule.SubtitleSyncTools).toBeDefined()
    expect(SubtitlesModule.SubtitleToolbar).toBeDefined()
    expect(SubtitlesModule.SubtitleTools).toBeDefined()
  })

  it("должен экспортировать все хуки", () => {
    // Хуки
    expect(SubtitlesModule.useSubtitles).toBeDefined()
    expect(SubtitlesModule.useSubtitleById).toBeDefined()
    expect(SubtitlesModule.useSubtitlesByCategory).toBeDefined()
    expect(SubtitlesModule.useSubtitlesSearch).toBeDefined()
    expect(SubtitlesModule.useSubtitlesExport).toBeDefined()
    expect(SubtitlesModule.useSubtitlesImport).toBeDefined()
  })

  it("должен экспортировать все утилиты", () => {
    // Утилиты CSS
    expect(SubtitlesModule.subtitleStyleToCSS).toBeDefined()
    expect(SubtitlesModule.applySubtitleStyleTemplate).toBeDefined()
    expect(SubtitlesModule.resetSubtitleStyleTemplate).toBeDefined()
    expect(SubtitlesModule.generateSubtitleCSS).toBeDefined()
    expect(SubtitlesModule.subtitleAnimations).toBeDefined()
    expect(SubtitlesModule.getSubtitleAnimation).toBeDefined()
    expect(SubtitlesModule.validateSubtitleStyleTemplate).toBeDefined()
    expect(SubtitlesModule.createSubtitleCSSVariables).toBeDefined()

    // Утилиты экспорта
    expect(SubtitlesModule.exportToSRT).toBeDefined()
    expect(SubtitlesModule.exportToVTT).toBeDefined()
    expect(SubtitlesModule.exportToASS).toBeDefined()
    expect(SubtitlesModule.exportSubtitles).toBeDefined()
    expect(SubtitlesModule.getSubtitleFileExtension).toBeDefined()
    expect(SubtitlesModule.getSubtitleMimeType).toBeDefined()

    // Утилиты парсинга
    expect(SubtitlesModule.parseSRT).toBeDefined()
    expect(SubtitlesModule.parseVTT).toBeDefined()
    expect(SubtitlesModule.parseASS).toBeDefined()
    expect(SubtitlesModule.detectSubtitleFormat).toBeDefined()
    expect(SubtitlesModule.parseSubtitleFile).toBeDefined()

    // Утилиты обработки
    expect(SubtitlesModule.processSubtitleStyleTemplates).toBeDefined()
    expect(SubtitlesModule.validateSubtitleStyleTemplatesData).toBeDefined()
    expect(SubtitlesModule.createFallbackSubtitleStyleTemplate).toBeDefined()
    expect(SubtitlesModule.searchSubtitleStyleTemplates).toBeDefined()
    expect(SubtitlesModule.groupSubtitleStyleTemplates).toBeDefined()
    expect(SubtitlesModule.sortSubtitleStyleTemplates).toBeDefined()
  })

  it("должен экспортировать объект анимаций", () => {
    // Проверяем наличие объекта анимаций
    expect(SubtitlesModule.subtitleAnimations).toBeDefined()
    expect(typeof SubtitlesModule.subtitleAnimations).toBe("object")
    expect(Object.keys(SubtitlesModule.subtitleAnimations).length).toBeGreaterThan(0)
  })

  it("компоненты должны быть функциями React", () => {
    // Проверяем, что компоненты являются функциями
    expect(typeof SubtitlesModule.SubtitleAITools).toBe("function")
    expect(typeof SubtitlesModule.SubtitleGroup).toBe("function")
    expect(typeof SubtitlesModule.SubtitlePreview).toBe("function")
    expect(typeof SubtitlesModule.SubtitleSyncTools).toBe("function")
    expect(typeof SubtitlesModule.SubtitleToolbar).toBe("function")
    expect(typeof SubtitlesModule.SubtitleTools).toBe("function")
  })

  it("хуки должны быть функциями", () => {
    // Проверяем, что хуки являются функциями
    expect(typeof SubtitlesModule.useSubtitles).toBe("function")
    expect(typeof SubtitlesModule.useSubtitleById).toBe("function")
    expect(typeof SubtitlesModule.useSubtitlesByCategory).toBe("function")
    expect(typeof SubtitlesModule.useSubtitlesSearch).toBe("function")
    expect(typeof SubtitlesModule.useSubtitlesExport).toBe("function")
    expect(typeof SubtitlesModule.useSubtitlesImport).toBe("function")
  })

  it("утилиты должны быть функциями", () => {
    // Проверяем типы утилит
    expect(typeof SubtitlesModule.applySubtitleStyleTemplate).toBe("function")
    expect(typeof SubtitlesModule.exportToSRT).toBe("function")
    expect(typeof SubtitlesModule.parseSRT).toBe("function")
    expect(typeof SubtitlesModule.processSubtitleStyleTemplates).toBe("function")
  })

  it("не должен экспортировать закомментированные модули", () => {
    // Проверяем, что закомментированный компонент не экспортируется
    expect(SubtitlesModule).not.toHaveProperty("SubtitleList")
  })
})
