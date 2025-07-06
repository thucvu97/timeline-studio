/**
 * Suggestions component for Smart Montage Planner
 * Displays AI-generated recommendations for improving the montage plan
 */

import React from "react"

import { AlertTriangle, CheckCircle, Info, Lightbulb } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { useMontagePlanner } from "../../hooks/use-montage-planner"
import { usePlanGenerator } from "../../hooks/use-plan-generator"

export function Suggestions() {
  const { improvementSuggestions, fragmentUsage } = usePlanGenerator()
  const { optimizePlan, isOptimizing } = useMontagePlanner()

  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.toLowerCase().includes("quality")) {
      return <AlertTriangle className="h-4 w-4" />
    }
    if (suggestion.toLowerCase().includes("add") || suggestion.toLowerCase().includes("more")) {
      return <Info className="h-4 w-4" />
    }
    return <Lightbulb className="h-4 w-4" />
  }

  const getSuggestionVariant = (suggestion: string): "default" | "destructive" => {
    if (suggestion.toLowerCase().includes("quality") || suggestion.toLowerCase().includes("replace")) {
      return "destructive"
    }
    return "default"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Suggestions & Insights</h3>
        <Button
          size="sm"
          onClick={optimizePlan}
          disabled={isOptimizing}
        >
          Apply Optimizations
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Improvement Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Improvement Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations to enhance your montage
            </CardDescription>
          </CardHeader>
          <CardContent>
            {improvementSuggestions.length > 0 ? (
              <div className="space-y-2">
                {improvementSuggestions.map((suggestion, index) => (
                  <Alert key={index} variant={getSuggestionVariant(suggestion)}>
                    {getSuggestionIcon(suggestion)}
                    <AlertDescription>{suggestion}</AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your montage plan looks great! No major improvements needed.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Fragment Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Fragment Usage</CardTitle>
            <CardDescription>
              How your content is being utilized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Fragments</span>
                <Badge variant="outline">{fragmentUsage.totalFragments}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Used Fragments</span>
                <Badge variant="default">{fragmentUsage.usedFragments}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Unused Fragments</span>
                <Badge variant="secondary">{fragmentUsage.unusedFragments.length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Multi-use Fragments</span>
                <Badge variant="outline">{fragmentUsage.multiUseFragments.length}</Badge>
              </div>

              {fragmentUsage.unusedFragments.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-2">Top Unused Fragments</p>
                  <div className="space-y-1">
                    {fragmentUsage.unusedFragments.slice(0, 3).map((fragment) => (
                      <div key={fragment.id} className="text-xs text-muted-foreground">
                        • {fragment.videoId} ({fragment.startTime.toFixed(1)}s - Score:{" "}
                        {fragment.score.totalScore.toFixed(0)})
                      </div>
                    ))}
                    {fragmentUsage.unusedFragments.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {fragmentUsage.unusedFragments.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Style-specific Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Style Tips</CardTitle>
          <CardDescription>
            Recommendations based on your selected montage style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> For dynamic action montages, consider adding more quick cuts during{" "}
                high-energy moments to maintain viewer engagement.
              </AlertDescription>
            </Alert>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Tip:</strong> Sync your cuts with music beats for a more professional and engaging result.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}