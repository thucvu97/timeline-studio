import { useCallback } from "react"

import { useAudioEngine } from "./use-audio-engine"
import { AudioClip, FadeOptions } from "../services/audio-clip-editor"

export function useAudioClipEditor() {
  const { engine: audioEngine } = useAudioEngine()

  const trimClip = useCallback(
    async (clip: AudioClip, startOffset: number, endOffset: number) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.trimClip(clip, startOffset, endOffset)
    },
    [audioEngine],
  )

  const splitClip = useCallback(
    async (clip: AudioClip, splitTime: number) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.splitClip(clip, splitTime)
    },
    [audioEngine],
  )

  const applyFadeIn = useCallback(
    (clip: AudioClip, options: FadeOptions) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.applyFadeIn(clip, options)
    },
    [audioEngine],
  )

  const applyFadeOut = useCallback(
    (clip: AudioClip, options: FadeOptions) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.applyFadeOut(clip, options)
    },
    [audioEngine],
  )

  const createCrossfade = useCallback(
    async (clipA: AudioClip, clipB: AudioClip, crossfadeDuration: number, fadeType?: FadeOptions["type"]) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.createCrossfade(clipA, clipB, crossfadeDuration, fadeType)
    },
    [audioEngine],
  )

  const normalizeClip = useCallback(
    (clip: AudioClip, targetLevel?: number) => {
      if (!audioEngine?.clipEditor) {
        throw new Error("Audio engine not initialized")
      }
      return audioEngine.clipEditor.normalizeClip(clip, targetLevel)
    },
    [audioEngine],
  )

  return {
    trimClip,
    splitClip,
    applyFadeIn,
    applyFadeOut,
    createCrossfade,
    normalizeClip,
  }
}
