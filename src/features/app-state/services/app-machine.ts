/**
 * New App Machine that coordinates all state through backend
 */

import { setup, fromCallback, fromPromise, assign } from 'xstate'
import { BackendSync, getBackendSync } from './backend-sync'
import { ProjectState, UiState, PlaybackState } from '../types/unified-project'
import { ProjectCommand } from '../types/commands'
import { ProjectEvent } from '../types/events'

// Context for the app machine
export interface AppMachineContext {
  projectState: ProjectState | null
  backendSync: BackendSync
  isConnected: boolean
  error: string | null
  commandQueue: ProjectCommand[]
}

// Events for the app machine
export type AppMachineEvent =
  | { type: 'CONNECT' }
  | { type: 'DISCONNECT' }
  | { type: 'BACKEND_EVENT'; event: ProjectEvent }
  | { type: 'STATE_UPDATED'; state: ProjectState }
  | { type: 'EXECUTE_COMMAND'; command: ProjectCommand }
  | { type: 'COMMAND_SUCCESS'; data?: any }
  | { type: 'COMMAND_ERROR'; error: string }
  | { type: 'CONNECTION_ERROR'; error: string }
  | { type: 'RETRY_CONNECTION' }

// Create the app machine
export const appMachine = setup({
  types: {} as {
    context: AppMachineContext
    events: AppMachineEvent
  },
  
  actions: {
    setProjectState: assign({
      projectState: (_, params: { state: ProjectState }) => params.state,
    }),
    
    setError: assign({
      error: (_, params: { error: string }) => params.error,
    }),
    
    clearError: assign({
      error: () => null,
    }),
    
    setConnected: assign({
      isConnected: () => true,
    }),
    
    setDisconnected: assign({
      isConnected: () => false,
    }),
    
    queueCommand: assign({
      commandQueue: ({ context }, params: { command: ProjectCommand }) => 
        [...context.commandQueue, params.command],
    }),
    
    clearCommandQueue: assign({
      commandQueue: () => [],
    }),
  },
  
  actors: {
    backendConnection: fromCallback(({ sendBack, input }: { sendBack: any; input: { backendSync: BackendSync } }) => {
      const { backendSync } = input
      
      // Subscribe to backend events
      const unsubscribeEvent = backendSync.onEvent((event) => {
        sendBack({ type: 'BACKEND_EVENT', event })
      })
      
      // Subscribe to state changes
      const unsubscribeState = backendSync.onStateChange((state) => {
        sendBack({ type: 'STATE_UPDATED', state })
      })
      
      // Connect to backend
      backendSync.connect()
        .then(() => {
          sendBack({ type: 'CONNECT' })
        })
        .catch((error) => {
          sendBack({ type: 'CONNECTION_ERROR', error: error.message })
        })
      
      // Cleanup function
      return () => {
        unsubscribeEvent()
        unsubscribeState()
        backendSync.disconnect()
      }
    }),

    executeCommand: fromPromise(async ({ input }: { input: { command: ProjectCommand; backendSync: BackendSync } }) => {
      const { command, backendSync } = input
      const result = await backendSync.executeCommand(command)
      
      if (!result.success) {
        throw new Error(result.error || 'Command failed')
      }
      
      return result.data
    }),
  },
  
  guards: {
    hasQueuedCommands: ({ context }) => context.commandQueue.length > 0,
  },
}).createMachine({
  id: 'appV2',
  initial: 'disconnected',
  
  context: {
    projectState: null,
    backendSync: getBackendSync(),
    isConnected: false,
    error: null,
    commandQueue: [],
  },
  
  states: {
    disconnected: {
      entry: 'clearError',
      
      on: {
        CONNECT: 'connecting',
      },
    },
    
    connecting: {
      invoke: {
        id: 'backendConnection',
        src: 'backendConnection',
        input: ({ context }) => ({ backendSync: context.backendSync }),
      },
      
      on: {
        CONNECT: {
          target: 'connected',
          actions: ['setConnected', 'clearError'],
        },
        
        CONNECTION_ERROR: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({ error: event.error }),
          },
        },
        
        STATE_UPDATED: {
          actions: {
            type: 'setProjectState',
            params: ({ event }) => ({ state: event.state }),
          },
        },
      },
    },
    
    connected: {
      initial: 'idle',
      
      on: {
        DISCONNECT: {
          target: 'disconnected',
          actions: 'setDisconnected',
        },
        
        BACKEND_EVENT: {
          // Log event for debugging
          actions: ({ event }) => {
            console.log('Backend event:', event.event)
          },
        },
        
        STATE_UPDATED: {
          actions: {
            type: 'setProjectState',
            params: ({ event }) => ({ state: event.state }),
          },
        },
        
        CONNECTION_ERROR: {
          target: 'error',
          actions: {
            type: 'setError',
            params: ({ event }) => ({ error: event.error }),
          },
        },
      },
      
      states: {
        idle: {
          always: [
            {
              target: 'processingQueue',
              guard: 'hasQueuedCommands',
            },
          ],
          
          on: {
            EXECUTE_COMMAND: {
              target: 'executing',
              actions: {
                type: 'queueCommand',
                params: ({ event }) => ({ command: event.command }),
              },
            },
          },
        },
        
        executing: {
          invoke: {
            id: 'executeCommand',
            src: 'executeCommand',
            input: ({ context }) => ({
              command: context.commandQueue[0],
              backendSync: context.backendSync,
            }),
            onDone: {
              target: 'idle',
              actions: [
                ({ context }) => {
                  // Remove executed command from queue
                  context.commandQueue.shift()
                },
                ({ event }) => {
                  console.log('Command executed successfully:', event.output)
                },
              ],
            },
            onError: {
              target: 'idle',
              actions: [
                ({ context }) => {
                  // Remove failed command from queue
                  context.commandQueue.shift()
                },
                ({ event }) => {
                  console.error('Command execution failed:', event.error)
                },
              ],
            },
          },
        },
        
        processingQueue: {
          always: {
            target: 'executing',
          },
        },
      },
    },
    
    error: {
      on: {
        RETRY_CONNECTION: 'connecting',
        
        CONNECT: 'connecting',
      },
    },
  },
})

// Helper functions for common commands
export const AppCommands = {
  // Project commands
  createProject: (name: string, settings: any): ProjectCommand => ({
    type: 'CreateProject',
    params: { name, settings },
  }),
  
  saveProject: (path?: string): ProjectCommand => ({
    type: 'SaveProject',
    params: { path },
  }),
  
  // Timeline commands
  addClip: (trackId: string, mediaId: string, time: number): ProjectCommand => ({
    type: 'AddClip',
    params: { trackId, mediaId, time },
  }),
  
  moveClip: (clipId: string, trackId: string, time: number): ProjectCommand => ({
    type: 'MoveClip',
    params: { clipId, trackId, time },
  }),
  
  // Basic playback commands
  play: (): ProjectCommand => ({
    type: 'Play',
    params: {},
  }),
  
  pause: (): ProjectCommand => ({
    type: 'Pause',
    params: {},
  }),
  
  seek: (time: number): ProjectCommand => ({
    type: 'Seek',
    params: { time },
  }),
  
  // Player commands
  playerSetMedia: (mediaId: string, startTime?: number): ProjectCommand => ({
    type: 'PlayerSetMedia',
    params: { mediaId, startTime },
  }),
  
  playerSetVolume: (volume: number): ProjectCommand => ({
    type: 'PlayerSetVolume',
    params: { volume },
  }),
  
  playerSelectClip: (clipId: string): ProjectCommand => ({
    type: 'PlayerSelectClip',
    params: { clipId },
  }),
  
  playerClearSelection: (): ProjectCommand => ({
    type: 'PlayerClearSelection',
    params: {},
  }),
  
  playerSetSource: (source: 'browser' | 'timeline'): ProjectCommand => ({
    type: 'PlayerSetSource',
    params: { source },
  }),
  
  playerApplyEffect: (effectId: string, params: Record<string, any>): ProjectCommand => ({
    type: 'PlayerApplyEffect',
    params: { effectId, params },
  }),
  
  playerApplyFilter: (filterId: string, params: Record<string, any>): ProjectCommand => ({
    type: 'PlayerApplyFilter',
    params: { filterId, params },
  }),
  
  playerApplyTemplate: (templateId: string, mediaIds: string[]): ProjectCommand => ({
    type: 'PlayerApplyTemplate',
    params: { templateId, mediaIds },
  }),
  
  playerClearEffects: (): ProjectCommand => ({
    type: 'PlayerClearEffects',
    params: {},
  }),
  
  playerClearFilters: (): ProjectCommand => ({
    type: 'PlayerClearFilters',
    params: {},
  }),
  
  playerClearTemplate: (): ProjectCommand => ({
    type: 'PlayerClearTemplate',
    params: {},
  }),
}

// Legacy export для обратной совместимости
export { appMachine as appMachineV2 }