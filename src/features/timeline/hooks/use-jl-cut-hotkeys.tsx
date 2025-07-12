import { useHotkeys } from "react-hotkeys-hook"

import { useJLCuts } from "./use-jl-cuts"
import { useTimeline } from "./use-timeline"

export function useJLCutHotkeys() {
  const { uiState, project } = useTimeline()
  const { createJCut, createLCut, resetCut, linkClips, unlinkClips, getLinkedPair } = useJLCuts()

  // J - Create J-Cut (audio starts before video)
  useHotkeys(
    "j",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 1) {
        const clipId = uiState.selectedClipIds[0]
        const pair = getLinkedPair(clipId)

        if (pair) {
          // Default 0.5 second offset
          createJCut(clipId, 0.5)
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, getLinkedPair, createJCut],
  )

  // L - Create L-Cut (audio continues after video)
  useHotkeys(
    "l",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 1) {
        const clipId = uiState.selectedClipIds[0]
        const pair = getLinkedPair(clipId)

        if (pair) {
          // Default 0.5 second offset
          createLCut(clipId, 0.5)
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, getLinkedPair, createLCut],
  )

  // Shift+J/L - Create with larger offset
  useHotkeys(
    "shift+j",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 1) {
        const clipId = uiState.selectedClipIds[0]
        const pair = getLinkedPair(clipId)

        if (pair) {
          // Larger 1.5 second offset
          createJCut(clipId, 1.5)
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, getLinkedPair, createJCut],
  )

  useHotkeys(
    "shift+l",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 1) {
        const clipId = uiState.selectedClipIds[0]
        const pair = getLinkedPair(clipId)

        if (pair) {
          // Larger 1.5 second offset
          createLCut(clipId, 1.5)
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, getLinkedPair, createLCut],
  )

  // R - Reset to straight cut
  useHotkeys(
    "r",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 1) {
        const clipId = uiState.selectedClipIds[0]
        resetCut(clipId)
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, resetCut],
  )

  // Cmd/Ctrl + Alt + L - Link selected clips
  useHotkeys(
    "cmd+alt+l, ctrl+alt+l",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length === 2 && project) {
        const [clip1Id, clip2Id] = uiState.selectedClipIds

        // Find clips
        const allClips = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].flatMap(
          (track) => track.clips,
        )

        const clip1 = allClips.find((c) => c.id === clip1Id)
        const clip2 = allClips.find((c) => c.id === clip2Id)

        if (clip1 && clip2) {
          // Determine which is video and which is audio
          const track1 = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
            (t) => t.id === clip1.trackId,
          )
          const track2 = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
            (t) => t.id === clip2.trackId,
          )

          const isVideo1 = track1?.type === "video" || track1?.type === "image"
          const isVideo2 = track2?.type === "video" || track2?.type === "image"
          const isAudio1 = ["audio", "music", "voiceover", "sfx", "ambient"].includes(track1?.type || "")
          const isAudio2 = ["audio", "music", "voiceover", "sfx", "ambient"].includes(track2?.type || "")

          if ((isVideo1 && isAudio2) || (isAudio1 && isVideo2)) {
            const videoClipId = isVideo1 ? clip1Id : clip2Id
            const audioClipId = isAudio1 ? clip1Id : clip2Id
            linkClips(videoClipId, audioClipId)
          }
        }
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, project, linkClips],
  )

  // Cmd/Ctrl + Alt + U - Unlink selected clip
  useHotkeys(
    "cmd+alt+u, ctrl+alt+u",
    (e) => {
      e.preventDefault()

      if (uiState.selectedClipIds.length >= 1) {
        const clipId = uiState.selectedClipIds[0]
        unlinkClips(clipId)
      }
    },
    {
      enableOnFormTags: false,
    },
    [uiState.selectedClipIds, unlinkClips],
  )
}
