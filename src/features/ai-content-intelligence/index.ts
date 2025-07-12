/**
 * AI Content Intelligence Module
 * Единая точка входа для всех AI функций
 */

// ===== Components =====
// Export components individually to avoid circular dependencies
export { AnalysisViewer } from "./components/analysis-viewer"
export { GenerationWizard } from "./components/generation-wizard"
export { PreviewGrid } from "./components/preview-grid"
export { UnifiedDashboard } from "./components/unified-dashboard"
// Dashboard Components
export { ActionPanel } from "./components/unified-dashboard/action-panel"
export { AnalysisResults } from "./components/unified-dashboard/analysis-results"
export { DashboardHeader } from "./components/unified-dashboard/dashboard-header"
export { PipelineStatus } from "./components/unified-dashboard/pipeline-status"
// ===== Hooks =====
export { useAIIntelligence } from "./hooks/use-ai-intelligence"
export { useAIIntelligenceOrchestrator } from "./hooks/use-ai-intelligence-orchestrator"
export { useAIOrchestrator } from "./hooks/use-ai-orchestrator"
export { useContentPipeline } from "./hooks/use-content-pipeline"
// ===== Services & Providers =====
export {
  AIIntelligenceProvider,
  useAIIntelligence as useAIIntelligenceContext,
} from "./services/ai-intelligence-provider"
export type { AIIntelligenceContext, AIIntelligenceEvent } from "./shared/services/ai-intelligence-machine"
export { aiIntelligenceMachine } from "./shared/services/ai-intelligence-machine"
// ===== Orchestrator & State Machine =====
export { AIIntelligenceOrchestrator } from "./shared/services/ai-intelligence-orchestrator"
// ===== Types =====
// Export all types from shared/types
export * from "./shared/types"

// NOTE: Engines are NOT exported here to avoid circular dependencies
// If you need to use engines, import them directly from their respective paths
