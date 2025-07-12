"use client"

import { ReactNode, createContext, useContext, useEffect, useRef, useState } from "react"

import { Actor, createActor } from "xstate"

import { aiIntelligenceMachine } from "../shared/services/ai-intelligence-machine"

// import { aiIntelligenceMachineSimple as aiIntelligenceMachine } from "../shared/services/ai-intelligence-machine-simple"

interface AIIntelligenceContextType {
  actor: Actor<typeof aiIntelligenceMachine> | null
}

const AIIntelligenceContext = createContext<AIIntelligenceContextType | null>(null)

interface AIIntelligenceProviderProps {
  children: ReactNode
}

export function AIIntelligenceProvider({ children }: AIIntelligenceProviderProps) {
  const [actor, setActor] = useState<Actor<typeof aiIntelligenceMachine> | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true
      const newActor = createActor(aiIntelligenceMachine)
      newActor.start()
      setActor(newActor)

      return () => {
        newActor.stop()
      }
    }
  }, [])

  return <AIIntelligenceContext.Provider value={{ actor }}>{children}</AIIntelligenceContext.Provider>
}

export function useAIIntelligence() {
  const context = useContext(AIIntelligenceContext)
  if (!context) {
    throw new Error("useAIIntelligence must be used within AIIntelligenceProvider")
  }
  return context
}
