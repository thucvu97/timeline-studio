/**
 * Main component for Smart Montage Planner
 * Integrates all sub-components and provides the complete planning interface
 */

import { MontagePlannerProvider } from "../services/montage-planner-provider"
import { PlannerDashboard } from "./planner-dashboard/planner-dashboard"

export function MontagePlanner() {
  return (
    <MontagePlannerProvider>
      <div className="h-full w-full">
        <PlannerDashboard />
      </div>
    </MontagePlannerProvider>
  )
}
