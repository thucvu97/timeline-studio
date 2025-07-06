/**
 * Smart Montage Planner module exports
 * AI-powered tool for automatic montage plan generation
 */

// Main component
export { MontagePlanner } from "./components"

// Hooks
export {
  useMontagePlanner,
  useContentAnalysis,
  usePlanGenerator,
} from "./hooks"

// Services
export {
  MontagePlannerProvider,
  ContentAnalyzer,
  MomentDetector,
  RhythmCalculator,
  PlanGenerator,
} from "./services"

// Types
export * from "./types"