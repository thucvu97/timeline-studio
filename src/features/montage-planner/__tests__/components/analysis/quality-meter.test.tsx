/**
 * Tests for QualityMeter component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BaseProviders } from "@/test/test-utils"

import { QualityMeter } from "../../../components/analysis/quality-meter"
import { mockAudioAnalysis, mockMomentScore, mockVideoAnalysis } from "../../test-utils"

describe("QualityMeter", () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(<BaseProviders>{ui}</BaseProviders>)
  }

  it("should render without data", () => {
    renderWithProviders(<QualityMeter />)

    expect(screen.getByText("montage-planner.analysis.quality")).toBeInTheDocument()
    expect(screen.getByText("common.qualityAssessment")).toBeInTheDocument()
  })

  it("should display overall quality score", () => {
    renderWithProviders(<QualityMeter momentScore={mockMomentScore} />)

    expect(screen.getByText("common.overallQuality")).toBeInTheDocument()
    expect(screen.getByText(`${mockMomentScore.totalScore.toFixed(0)}%`)).toBeInTheDocument()
  })

  it("should display video analysis metrics", () => {
    renderWithProviders(<QualityMeter videoAnalysis={mockVideoAnalysis} />)

    expect(screen.getByText("montage-planner.analysis.title")).toBeInTheDocument()
    expect(screen.getByText("common.resolution")).toBeInTheDocument()
    expect(
      screen.getByText(`${mockVideoAnalysis.quality.resolution.width}x${mockVideoAnalysis.quality.resolution.height}`),
    ).toBeInTheDocument()
    expect(screen.getByText("common.frameRate")).toBeInTheDocument()
    expect(screen.getByText(`${mockVideoAnalysis.quality.frameRate} fps`)).toBeInTheDocument()
  })

  it("should display audio analysis metrics", () => {
    renderWithProviders(<QualityMeter audioAnalysis={mockAudioAnalysis} />)

    expect(screen.getByText("montage-planner.analysis.audio")).toBeInTheDocument()
    expect(screen.getByText("common.sampleRate")).toBeInTheDocument()
    expect(screen.getByText("common.speechClarity")).toBeInTheDocument()
    expect(screen.getByText(`${mockAudioAnalysis.quality.clarity.toFixed(0)}%`)).toBeInTheDocument()
  })

  it("should display moment score breakdown", () => {
    renderWithProviders(<QualityMeter momentScore={mockMomentScore} />)

    expect(screen.getByText("montage-planner.analysis.moments")).toBeInTheDocument()
    expect(screen.getByText("common.visualImpact")).toBeInTheDocument()
    expect(screen.getByText("common.technicalQuality")).toBeInTheDocument()
    expect(screen.getByText("common.emotionalValue")).toBeInTheDocument()
    expect(screen.getByText("common.relevance")).toBeInTheDocument()
  })

  it("should apply correct quality colors", () => {
    const highQualityScore = {
      ...mockMomentScore,
      totalScore: 90,
    }

    const { rerender } = renderWithProviders(<QualityMeter momentScore={highQualityScore} />)

    expect(screen.getByText("90%")).toHaveClass("text-green-600")
    expect(screen.getByText("montage-planner.quality.excellent")).toBeInTheDocument()

    const lowQualityScore = {
      ...mockMomentScore,
      totalScore: 40,
    }

    rerender(
      <BaseProviders>
        <QualityMeter momentScore={lowQualityScore} />
      </BaseProviders>,
    )

    expect(screen.getByText("40%")).toHaveClass("text-red-600")
    expect(screen.getByText("montage-planner.quality.poor")).toBeInTheDocument()
  })

  it("should display composition quality", () => {
    renderWithProviders(<QualityMeter videoAnalysis={mockVideoAnalysis} />)

    expect(screen.getByText("montage-planner.quality.composition")).toBeInTheDocument()
    expect(screen.getByText("common.ruleOfThirds")).toBeInTheDocument()
    expect(screen.getByText("common.balance")).toBeInTheDocument()
    expect(screen.getByText("common.leadingLines")).toBeInTheDocument()
  })

  it("should show quality warnings", () => {
    const lowQualityVideo = {
      ...mockVideoAnalysis,
      quality: {
        ...mockVideoAnalysis.quality,
        sharpness: 30,
        stability: 40,
      },
    }

    renderWithProviders(<QualityMeter videoAnalysis={lowQualityVideo} />)

    // Should show warning icon for low quality
    expect(screen.getByTestId("alerttriangle-icon")).toBeInTheDocument()
  })

  it("should display trend indicators", () => {
    renderWithProviders(<QualityMeter videoAnalysis={mockVideoAnalysis} />)

    // Should show trend icons for metrics (default to minus)
    const trendIcons = screen.getAllByTestId(/minus-icon/)
    expect(trendIcons.length).toBeGreaterThan(0)
  })

  it("should handle all data combined", () => {
    renderWithProviders(
      <QualityMeter
        videoAnalysis={mockVideoAnalysis}
        audioAnalysis={mockAudioAnalysis}
        momentScore={mockMomentScore}
      />,
    )

    expect(screen.getByText("common.overallQuality")).toBeInTheDocument()
    expect(screen.getByText("montage-planner.analysis.title")).toBeInTheDocument()
    expect(screen.getByText("montage-planner.analysis.audio")).toBeInTheDocument()
    expect(screen.getByText("montage-planner.analysis.moments")).toBeInTheDocument()
  })
})
