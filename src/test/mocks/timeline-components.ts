import React from "react"

import { vi } from "vitest"

// Mock Timeline sub-components to prevent complex state interactions
const MockTimelineContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MockTimelineContent(props, ref) {
    return React.createElement("div", {
      ...props,
      ref,
      "data-testid": "timeline-content",
    })
  },
)

const MockAudioMixerView = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MockAudioMixerView(props, ref) {
    return React.createElement("div", {
      ...props,
      ref,
      "data-testid": "audio-mixer-view",
    })
  },
)

const MockTimelineWorkspaceTabs = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { activeView?: string; onViewChange?: (view: string) => void }
    >(function MockTimelineWorkspaceTabs({ activeView, onViewChange, ...props }, ref) {
      return React.createElement("div", {
        ...props,
        ref,
        "data-testid": "timeline-workspace-tabs",
        "data-active-view": activeView,
      })
    })

const MockResourcesPanel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MockResourcesPanel(props, ref) {
    return React.createElement("div", {
      ...props,
      ref,
      "data-testid": "resources-panel",
    })
  },
)

const MockAiChat = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  function MockAiChat(props, ref) {
    return React.createElement("div", {
      ...props,
      ref,
      "data-testid": "ai-chat",
    })
  },
)

MockTimelineContent.displayName = "MockTimelineContent"
MockAudioMixerView.displayName = "MockAudioMixerView"
MockTimelineWorkspaceTabs.displayName = "MockTimelineWorkspaceTabs"
MockResourcesPanel.displayName = "MockResourcesPanel"
MockAiChat.displayName = "MockAiChat"

// Mock ResourcesProvider as well
const MockResourcesProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'mock-resources-provider' }, children)
}
MockResourcesProvider.displayName = "MockResourcesProvider"

// Mock the imports
vi.mock("@/features/timeline/components/timeline-content", () => ({
  TimelineContent: MockTimelineContent,
}))

vi.mock("@/features/timeline/components/audio-mixer-view", () => ({
  AudioMixerView: MockAudioMixerView,
}))

vi.mock("@/features/timeline/components/timeline-workspace-tabs", () => ({
  TimelineWorkspaceTabs: MockTimelineWorkspaceTabs,
  WorkspaceView: "timeline",
}))

vi.mock("@/features/resources", () => ({
  ResourcesPanel: MockResourcesPanel,
  ResourcesProvider: MockResourcesProvider,
}))

vi.mock("@/features/ai-chat/components/ai-chat", () => ({
  AiChat: MockAiChat,
}))

export {
  MockTimelineContent as TimelineContent,
  MockAudioMixerView as AudioMixerView,
  MockTimelineWorkspaceTabs as TimelineWorkspaceTabs,
  MockResourcesPanel as ResourcesPanel,
  MockResourcesProvider as ResourcesProvider,
  MockAiChat as AiChat,
}