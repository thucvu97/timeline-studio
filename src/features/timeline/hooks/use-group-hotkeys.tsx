import { useHotkeys } from "react-hotkeys-hook"

import { useClipGroups } from "./use-clip-groups"
import { useTimeline } from "./use-timeline"

import type { TimelineClip } from "../types/timeline"

export function useGroupHotkeys() {
  const { createGroup, ungroupClips, getGroupByClip } = useClipGroups()
  const { uiState, project } = useTimeline()

  // Helper function to get selected clips
  const getSelectedClips = (): TimelineClip[] => {
    if (!project) return []

    const selectedClips: TimelineClip[] = []

    // Check global tracks
    project.globalTracks.forEach((track) => {
      track.clips.forEach((clip) => {
        if (uiState.selectedClipIds.includes(clip.id)) {
          selectedClips.push(clip)
        }
      })
    })

    // Check section tracks
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          if (uiState.selectedClipIds.includes(clip.id)) {
            selectedClips.push(clip)
          }
        })
      })
    })

    return selectedClips
  }

  // Cmd/Ctrl + G - Create group
  useHotkeys(
    "cmd+g, ctrl+g",
    (e) => {
      e.preventDefault()
      const selectedClips = getSelectedClips()

      if (selectedClips.length >= 2) {
        createGroup(selectedClips)
      }
    },
    {
      enableOnFormTags: false,
    },
    [project, uiState.selectedClipIds],
  )

  // Cmd/Ctrl + Shift + G - Ungroup
  useHotkeys(
    "cmd+shift+g, ctrl+shift+g",
    (e) => {
      e.preventDefault()
      const selectedClips = getSelectedClips()

      if (selectedClips.length > 0) {
        // Find the group of the first selected clip
        const group = getGroupByClip(selectedClips[0].id)
        if (group) {
          ungroupClips(group.id)
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [project, uiState.selectedClipIds],
  )
}
