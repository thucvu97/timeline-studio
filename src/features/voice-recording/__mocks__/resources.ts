/**
 * Mock для useResources hook
 */

import { vi } from "vitest"

export const mockAddMedia = vi.fn().mockResolvedValue(undefined)

export const mockUseResources = {
  addMedia: mockAddMedia,
  addMusic: vi.fn().mockResolvedValue(undefined),
  addEffect: vi.fn().mockResolvedValue(undefined),
  addFilter: vi.fn().mockResolvedValue(undefined),
  addTransition: vi.fn().mockResolvedValue(undefined),
  addSubtitle: vi.fn().mockResolvedValue(undefined),
  addTemplate: vi.fn().mockResolvedValue(undefined),
  addStyleTemplate: vi.fn().mockResolvedValue(undefined),
  removeResource: vi.fn().mockResolvedValue(undefined),
  updateResource: vi.fn().mockResolvedValue(undefined),
  clearResources: vi.fn().mockResolvedValue(undefined),
  getResourceById: vi.fn().mockReturnValue(undefined),
  getResourcesByType: vi.fn().mockReturnValue([]),
  isMusicAdded: vi.fn().mockReturnValue(false),
  isSubtitleAdded: vi.fn().mockReturnValue(false),
  isTemplateAdded: vi.fn().mockReturnValue(false),
  isEffectAdded: vi.fn().mockReturnValue(false),
  isFilterAdded: vi.fn().mockReturnValue(false),
  isTransitionAdded: vi.fn().mockReturnValue(false),
  isStyleTemplateAdded: vi.fn().mockReturnValue(false),
  isAdded: vi.fn().mockReturnValue(false),
  resources: [],
  mediaResources: [],
  musicResources: [],
  subtitleResources: [],
  effectResources: [],
  filterResources: [],
  transitionResources: [],
  templateResources: [],
  styleTemplateResources: [],
  isLoading: false,
  error: null,
}

export const resetResourcesMocks = () => {
  mockAddMedia.mockClear()
  Object.values(mockUseResources).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) {
      value.mockClear()
    }
  })
}
