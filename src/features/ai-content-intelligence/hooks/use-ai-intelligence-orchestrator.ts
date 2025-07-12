import { useMemo } from "react"

import { useAIIntelligence } from "../services/ai-intelligence-provider"
import { AIIntelligenceOrchestrator } from "../shared/services/ai-intelligence-orchestrator"

/**
 * Хук для получения экземпляра AI Intelligence Orchestrator
 */
export function useAIIntelligenceOrchestrator() {
  const context = useAIIntelligence()
  const actor = context?.actor

  const orchestrator = useMemo(() => {
    if (!actor) return null
    return new AIIntelligenceOrchestrator(actor)
  }, [actor])

  return orchestrator
}
