import { useCallback, useState } from "react"

import type { AudioChannel, MixerState } from "../types"

// Mock initial state for development
const initialMixerState: MixerState = {
  channels: [
    {
      id: "ch1",
      name: "Track 1",
      type: "stereo",
      volume: 75,
      pan: 0,
      muted: false,
      solo: false,
      armed: false,
      effects: [],
      sends: [],
      eq: {
        enabled: false,
        bands: [],
      },
    },
    {
      id: "ch2",
      name: "Track 2",
      type: "mono",
      volume: 60,
      pan: -20,
      muted: false,
      solo: false,
      armed: true,
      effects: [],
      sends: [],
      eq: {
        enabled: false,
        bands: [],
      },
    },
    {
      id: "ch3",
      name: "Track 3",
      type: "stereo",
      volume: 80,
      pan: 20,
      muted: true,
      solo: false,
      armed: false,
      effects: [],
      sends: [],
      eq: {
        enabled: false,
        bands: [],
      },
    },
  ],
  buses: [],
  master: {
    volume: 85,
    muted: false,
    limiterEnabled: true,
    limiterThreshold: -3,
  },
  soloMode: "AFL",
}

export function useMixerState() {
  const [state, setState] = useState<MixerState>(initialMixerState)

  const updateChannel = useCallback((channelId: string, updates: Partial<AudioChannel>) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === channelId ? { ...ch, ...updates } : ch)),
    }))
  }, [])

  const toggleMute = useCallback((channelId: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === channelId ? { ...ch, muted: !ch.muted } : ch)),
    }))
  }, [])

  const toggleSolo = useCallback((channelId: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === channelId ? { ...ch, solo: !ch.solo } : ch)),
    }))
  }, [])

  const toggleArm = useCallback((channelId: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === channelId ? { ...ch, armed: !ch.armed } : ch)),
    }))
  }, [])

  const updateMaster = useCallback((updates: Partial<MixerState["master"]>) => {
    setState((prev) => ({
      ...prev,
      master: { ...prev.master, ...updates },
    }))
  }, [])

  const addChannel = useCallback((channel: AudioChannel) => {
    setState((prev) => ({
      ...prev,
      channels: [...prev.channels, channel],
    }))
  }, [])

  const removeChannel = useCallback((channelId: string) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.filter((ch) => ch.id !== channelId),
    }))
  }, [])

  const setChannels = useCallback((newChannels: AudioChannel[]) => {
    setState((prev) => ({
      ...prev,
      channels: newChannels,
    }))
  }, [])

  // Convenience methods for MIDI integration
  const setChannelVolume = useCallback((channelIndex: number, volume: number) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch, index) => (index === channelIndex ? { ...ch, volume: volume * 100 } : ch)),
    }))
  }, [])

  const setChannelPan = useCallback((channelIndex: number, pan: number) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch, index) => (index === channelIndex ? { ...ch, pan: pan * 100 } : ch)),
    }))
  }, [])

  const setMasterVolume = useCallback((volume: number) => {
    setState((prev) => ({
      ...prev,
      master: { ...prev.master, volume: volume * 100 },
    }))
  }, [])

  const setMasterLimiterThreshold = useCallback((threshold: number) => {
    setState((prev) => ({
      ...prev,
      master: { ...prev.master, limiterThreshold: threshold },
    }))
  }, [])

  return {
    ...state,
    updateChannel,
    toggleMute,
    toggleSolo,
    toggleArm,
    updateMaster,
    addChannel,
    removeChannel,
    setChannels,
    // MIDI integration methods
    setChannelVolume,
    setChannelPan,
    setMasterVolume,
    setMasterLimiterThreshold,
  }
}
