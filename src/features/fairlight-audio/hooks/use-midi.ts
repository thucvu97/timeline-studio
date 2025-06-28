import { useCallback, useEffect, useRef, useState } from "react"

import { MidiDevice, MidiEngine, MidiMapping, MidiMessage } from "../services/midi/midi-engine"

interface MidiState {
  devices: MidiDevice[]
  mappings: MidiMapping[]
  isInitialized: boolean
  isLearning: boolean
  error: string | null
}

export function useMidi() {
  const engineRef = useRef<MidiEngine | null>(null)
  const [state, setState] = useState<MidiState>({
    devices: [],
    mappings: [],
    isInitialized: false,
    isLearning: false,
    error: null,
  })

  // Initialize MIDI engine
  useEffect(() => {
    const engine = new MidiEngine()
    engineRef.current = engine

    // Set up event listeners
    engine.on("initialized", () => {
      setState((prev) => ({ ...prev, isInitialized: true, error: null }))
    })

    engine.on("devicesChanged", (devices: MidiDevice[]) => {
      setState((prev) => ({ ...prev, devices }))
    })

    engine.on("mappingAdded", () => {
      setState((prev) => ({ ...prev, mappings: engine.getMappings() }))
    })

    engine.on("mappingRemoved", () => {
      setState((prev) => ({ ...prev, mappings: engine.getMappings() }))
    })

    engine.on("mappingUpdated", () => {
      setState((prev) => ({ ...prev, mappings: engine.getMappings() }))
    })

    engine.on("learningStarted", () => {
      setState((prev) => ({ ...prev, isLearning: true }))
    })

    engine.on("learningStopped", () => {
      setState((prev) => ({ ...prev, isLearning: false }))
    })

    // Initialize MIDI
    void engine.initialize().catch((error: unknown) => {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to initialize MIDI",
      }))
    })

    return () => {
      engine.dispose()
    }
  }, [])

  // Add a new MIDI mapping
  const addMapping = useCallback((mapping: Omit<MidiMapping, "id">): string | null => {
    if (!engineRef.current) return null
    return engineRef.current.addMapping(mapping)
  }, [])

  // Remove a MIDI mapping
  const removeMapping = useCallback((id: string) => {
    if (!engineRef.current) return
    engineRef.current.removeMapping(id)
  }, [])

  // Update a MIDI mapping
  const updateMapping = useCallback((id: string, updates: Partial<MidiMapping>) => {
    if (!engineRef.current) return
    engineRef.current.updateMapping(id, updates)
  }, [])

  // Start MIDI learn mode
  const startLearning = useCallback((onMessage: (message: MidiMessage) => void): (() => void) => {
    if (!engineRef.current) return () => {}

    engineRef.current.startLearning(onMessage)

    return () => {
      engineRef.current?.stopLearning()
    }
  }, [])

  // Send MIDI message
  const sendMessage = useCallback(async (deviceId: string, message: number[]) => {
    if (!engineRef.current) return
    await engineRef.current.sendMessage(deviceId, message)
  }, [])

  // Get parameter change events
  const onParameterChange = useCallback(
    (callback: (data: { parameter: string; value: number; mapping: string }) => void): (() => void) => {
      if (!engineRef.current) return () => {}

      engineRef.current.on("parameterChange", callback)

      return () => {
        engineRef.current?.off("parameterChange", callback)
      }
    },
    [],
  )

  // Get raw MIDI message events
  const onMidiMessage = useCallback(
    (callback: (data: { deviceId: string; message: MidiMessage }) => void): (() => void) => {
      if (!engineRef.current) return () => {}

      engineRef.current.on("midiMessage", callback)

      return () => {
        engineRef.current?.off("midiMessage", callback)
      }
    },
    [],
  )

  return {
    // State
    devices: state.devices,
    inputDevices: state.devices.filter((d) => d.type === "input"),
    outputDevices: state.devices.filter((d) => d.type === "output"),
    mappings: state.mappings,
    isInitialized: state.isInitialized,
    isLearning: state.isLearning,
    error: state.error,

    // Actions
    addMapping,
    removeMapping,
    updateMapping,
    startLearning,
    sendMessage,

    // Events
    onParameterChange,
    onMidiMessage,
  }
}
