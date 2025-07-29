import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

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

  // Register keyboard shortcuts for grouping operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "group-clips",
        action: () => {
          const selectedClips = getSelectedClips()
          if (selectedClips.length >= 2) {
            createGroup(selectedClips)
          }
        },
      },
      {
        id: "ungroup-clips",
        action: () => {
          const selectedClips = getSelectedClips()
          if (selectedClips.length > 0) {
            // Find the group of the first selected clip
            const group = getGroupByClip(selectedClips[0].id)
            if (group) {
              ungroupClips(group.id)
            }
          }
        },
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [project, uiState.selectedClipIds, createGroup, ungroupClips, getGroupByClip])
}
