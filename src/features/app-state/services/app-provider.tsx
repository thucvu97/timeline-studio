/**
 * App Provider V2
 * 
 * Главный провайдер с новой архитектурой backend state management
 */

import React, { ReactNode, useEffect } from 'react'
import { useMachine } from '@xstate/react'

import { appMachine } from './app-machine'
import { getBackendSync } from './backend-sync'

export interface AppProviderV2Context {
  // Backend connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null

  // Project state (from backend)
  projectState: any // ProjectState from backend

  // Actions
  connect: () => void
  disconnect: () => void
  retryConnection: () => void
  executeCommand: (command: any) => void
}

const AppContextV2 = React.createContext<AppProviderV2Context | null>(null)

interface AppProviderV2Props {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderV2Props) {
  const [state, send] = useMachine(appMachine)

  // Auto-connect when component mounts
  useEffect(() => {
    if (state.matches('disconnected')) {
      send({ type: 'CONNECT' })
    }
  }, [state, send])

  // Actions
  const connect = () => {
    send({ type: 'CONNECT' })
  }

  const disconnect = () => {
    send({ type: 'DISCONNECT' })
  }

  const retryConnection = () => {
    send({ type: 'RETRY_CONNECTION' })
  }

  const executeCommand = (command: any) => {
    send({ type: 'EXECUTE_COMMAND', command })
  }

  // Context value
  const contextValue: AppProviderV2Context = {
    isConnected: state.context.isConnected,
    isConnecting: state.matches('connecting'),
    connectionError: state.context.error,
    projectState: state.context.projectState,
    connect,
    disconnect,
    retryConnection,
    executeCommand,
  }

  return (
    <AppContextV2.Provider value={contextValue}>
      {children}
    </AppContextV2.Provider>
  )
}

// Hook for using app context
export function useApp(): AppProviderV2Context {
  const context = React.useContext(AppContextV2)
  
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  
  return context
}

// Legacy exports для обратной совместимости
export { AppProvider as AppProviderV2 }
export { useApp as useAppV2 }