/**
 * Backend synchronization service
 * Handles communication with Rust backend state management
 */

import { invoke } from "@tauri-apps/api/core"
import { UnlistenFn, listen } from "@tauri-apps/api/event"

// Use generated types from Specta once they're available
// For now, keep using our manually created types
import { CommandResult, ProjectCommand } from "../types/commands"
import { EventEnvelope, ProjectEvent } from "../types/events"
import { ProjectState } from "../types/unified-project"

// TODO: Replace with generated types when Specta export is working
// import {
//   ProjectCommand,
//   CommandResult,
//   EventEnvelope,
//   ProjectEvent,
//   ProjectState
// } from '@/types/generated/tauri-bindings'

export type EventHandler = (event: ProjectEvent) => void
export type StateChangeHandler = (state: ProjectState) => void

export class BackendSync {
  private eventHandlers = new Set<EventHandler>()
  private stateChangeHandlers = new Set<StateChangeHandler>()
  private unlisten: UnlistenFn | null = null
  private isConnected = false
  private lastVersion = 0

  /**
   * Initialize the backend sync service
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return
    }

    try {
      // Subscribe to backend events
      this.unlisten = await listen<EventEnvelope>("project:event", (event) => {
        this.handleBackendEvent(event.payload)
      })

      // Get initial state
      const state = await this.getProjectState()
      if (state) {
        this.lastVersion = state.version
        this.notifyStateChange(state)
      }

      this.isConnected = true
      console.log("Backend sync connected")
    } catch (error) {
      console.error("Failed to connect backend sync:", error)
      throw error
    }
  }

  /**
   * Disconnect from backend
   */
  async disconnect(): Promise<void> {
    if (this.unlisten) {
      this.unlisten()
      this.unlisten = null
    }
    this.isConnected = false
    console.log("Backend sync disconnected")
  }

  /**
   * Execute a command on the backend
   */
  async executeCommand(command: ProjectCommand): Promise<CommandResult> {
    try {
      const result = await invoke<CommandResult>("execute_command", {
        command,
      })
      return result
    } catch (error) {
      console.error("Command execution failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Get current project state
   */
  async getProjectState(): Promise<ProjectState | null> {
    try {
      const state = await invoke<ProjectState>("get_project_state")
      return state
    } catch (error) {
      console.error("Failed to get project state:", error)
      return null
    }
  }

  /**
   * Get event history since a specific version
   */
  async getEventHistory(sinceVersion?: number): Promise<EventEnvelope[]> {
    try {
      const events = await invoke<EventEnvelope[]>("get_event_history", {
        sinceVersion: sinceVersion ?? this.lastVersion,
      })
      return events
    } catch (error) {
      console.error("Failed to get event history:", error)
      return []
    }
  }

  /**
   * Subscribe to backend events
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.add(handler)
    return () => {
      this.eventHandlers.delete(handler)
    }
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler)
    return () => {
      this.stateChangeHandlers.delete(handler)
    }
  }

  /**
   * Handle incoming backend event
   */
  private handleBackendEvent(envelope: EventEnvelope) {
    // Update last version
    this.lastVersion = envelope.metadata.version

    // Notify event handlers
    this.eventHandlers.forEach((handler) => {
      try {
        handler(envelope.event)
      } catch (error) {
        console.error("Event handler error:", error)
      }
    })

    // For state-changing events, fetch new state
    if (this.isStateChangingEvent(envelope.event)) {
      void this.fetchAndNotifyState()
    }
  }

  /**
   * Check if event changes state
   */
  private isStateChangingEvent(event: ProjectEvent): boolean {
    const stateChangingTypes = [
      "ProjectCreated",
      "ProjectOpened",
      "ProjectSaved",
      "ProjectClosed",
      "ClipAdded",
      "ClipMoved",
      "ClipTrimmed",
      "ClipDeleted",
      "ClipUpdated",
      "TrackAdded",
      "TrackDeleted",
      "TrackUpdated",
      "MediaAdded",
      "MediaRemoved",
      "MediaUpdated",
      "StateRestored",
    ]

    return stateChangingTypes.includes(event.type)
  }

  /**
   * Fetch state and notify handlers
   */
  private async fetchAndNotifyState() {
    const state = await this.getProjectState()
    if (state) {
      this.notifyStateChange(state)
    }
  }

  /**
   * Notify state change handlers
   */
  private notifyStateChange(state: ProjectState) {
    this.stateChangeHandlers.forEach((handler) => {
      try {
        handler(state)
      } catch (error) {
        console.error("State change handler error:", error)
      }
    })
  }
}

// Singleton instance
let backendSyncInstance: BackendSync | null = null

/**
 * Get or create backend sync instance
 */
export function getBackendSync(): BackendSync {
  if (!backendSyncInstance) {
    backendSyncInstance = new BackendSync()
  }
  return backendSyncInstance
}
