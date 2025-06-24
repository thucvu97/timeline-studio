import { vi } from "vitest"

// Общий мок для ленивых загрузчиков ресурсов
export const mockResourcesData = {
  effects: [
    {
      id: "test-effect-1",
      name: "Test Effect 1",
      type: "blur",
      category: "artistic",
      complexity: "basic",
      tags: ["test", "popular"],
      description: { ru: "Тестовый эффект 1", en: "Test Effect 1" },
      ffmpegCommand: () => "blur=5",
      params: { intensity: 50 },
      previewPath: "/test1.mp4",
      labels: { en: "Test Effect 1", ru: "Тестовый эффект 1" },
    },
    {
      id: "test-effect-2",
      name: "Test Effect 2",
      type: "brightness",
      category: "color-correction",
      complexity: "intermediate",
      tags: ["test", "color"],
      description: { ru: "Тестовый эффект 2", en: "Test Effect 2" },
      ffmpegCommand: () => "brightness=0.1",
      params: { intensity: 75 },
      previewPath: "/test2.mp4",
      labels: { en: "Test Effect 2", ru: "Тестовый эффект 2" },
    },
  ],
  filters: [
    {
      id: "test-filter-1",
      name: "Test Filter 1",
      category: "technical",
      complexity: "advanced",
      tags: ["log", "professional"],
      description: { ru: "Тестовый фильтр", en: "Test Filter" },
      labels: { en: "Test Filter", ru: "Тестовый фильтр" },
    },
  ],
  transitions: [
    {
      id: "test-transition-1",
      type: "fade",
      labels: { ru: "Исчезновение", en: "Fade" },
      description: { ru: "Плавное исчезновение", en: "Smooth fade" },
      category: "basic",
      complexity: "basic",
      tags: ["smooth", "classic"],
      duration: { min: 0.1, max: 5, default: 1 },
    },
  ],
}

export const loadAllResourcesLazy = vi.fn().mockResolvedValue({
  effects: {
    success: true,
    data: mockResourcesData.effects,
    source: "built-in",
    timestamp: Date.now(),
  },
  filters: {
    success: true,
    data: mockResourcesData.filters,
    source: "built-in",
    timestamp: Date.now(),
  },
  transitions: {
    success: true,
    data: mockResourcesData.transitions,
    source: "built-in",
    timestamp: Date.now(),
  },
})

export const loadEffectsLazy = vi.fn().mockResolvedValue({
  success: true,
  data: mockResourcesData.effects,
  source: "built-in",
  timestamp: Date.now(),
})

export const loadFiltersLazy = vi.fn().mockResolvedValue({
  success: true,
  data: mockResourcesData.filters,
  source: "built-in", 
  timestamp: Date.now(),
})

export const loadTransitionsLazy = vi.fn().mockResolvedValue({
  success: true,
  data: mockResourcesData.transitions,
  source: "built-in",
  timestamp: Date.now(),
})

export const loadResourcesByCategory = vi.fn().mockImplementation(async (type: string, category: string) => {
  const data = mockResourcesData[type as keyof typeof mockResourcesData] || []
  const filteredData = data.filter((item: any) => item.category === category)
  
  return {
    success: true,
    data: filteredData,
    source: "built-in",
    timestamp: Date.now(),
  }
})

export const loadResourcesInChunks = vi.fn().mockImplementation(async function* (type: string, chunkSize: number = 50) {
  const data = mockResourcesData[type as keyof typeof mockResourcesData] || []
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    yield {
      success: true,
      data: chunk,
      source: "built-in",
      timestamp: Date.now(),
    }
  }
})