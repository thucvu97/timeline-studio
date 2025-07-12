/**
 * AI Content Intelligence Module
 * Единая точка входа для всех AI функций
 */

export { AnalysisViewer } from "./components/analysis-viewer"
export { GenerationWizard } from "./components/generation-wizard"
export { PreviewGrid } from "./components/preview-grid"

// ===== Components =====
// Main Components
export { UnifiedDashboard } from "./components/unified-dashboard"
// Dashboard Components
export { ActionPanel } from "./components/unified-dashboard/action-panel"
export { AnalysisResults } from "./components/unified-dashboard/analysis-results"
export { DashboardHeader } from "./components/unified-dashboard/dashboard-header"
export { PipelineStatus } from "./components/unified-dashboard/pipeline-status"
// Multi-Platform Engine
export * from "./engines/multi-platform"
// ===== Engines =====
// Scene Analysis Engine
export * from "./engines/scene-analysis"
// Script Generation Engine
export * from "./engines/script-generation"
// ===== Hooks =====
export { useAIIntelligence } from "./hooks/use-ai-intelligence"
export { useAIOrchestrator } from "./hooks/use-ai-orchestrator"
export { useContentPipeline } from "./hooks/use-content-pipeline"
export type { AIIntelligenceContext, AIIntelligenceEvent } from "./shared/services/ai-intelligence-machine"
export { aiIntelligenceMachine } from "./shared/services/ai-intelligence-machine"
// ===== Orchestrator & State Machine =====
export { AIIntelligenceOrchestrator } from "./shared/services/ai-intelligence-orchestrator"

// ===== Types =====
// Export all types from shared/types
export * from "./shared/types"
