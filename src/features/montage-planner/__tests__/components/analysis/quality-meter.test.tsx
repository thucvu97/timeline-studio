/**
 * Tests for QualityMeter component
 */

import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { QualityMeter } from "../../../components/analysis/quality-meter"
import { mockAudioAnalysis, mockMomentScore, mockVideoAnalysis } from "../../test-utils"

describe("QualityMeter", () => {
  it("should render without data", () => {
    render(<QualityMeter />)
    
    expect(screen.getByText("Quality Metrics")).toBeInTheDocument()
    expect(screen.getByText("Real-time quality assessment of your content")).toBeInTheDocument()
  })

  it("should display overall quality score", () => {
    render(
      <QualityMeter
        momentScore={mockMomentScore}
      />
    )
    
    expect(screen.getByText("Overall Quality")).toBeInTheDocument()
    expect(screen.getByText(`${mockMomentScore.totalScore.toFixed(0)}%`)).toBeInTheDocument()
  })

  it("should display video analysis metrics", () => {
    render(
      <QualityMeter
        videoAnalysis={mockVideoAnalysis}
      />
    )
    
    expect(screen.getByText("Video Analysis")).toBeInTheDocument()
    expect(screen.getByText("Resolution")).toBeInTheDocument()
    expect(screen.getByText(`${mockVideoAnalysis.quality.resolution.width}x${mockVideoAnalysis.quality.resolution.height}`)).toBeInTheDocument()
    expect(screen.getByText("Frame Rate")).toBeInTheDocument()
    expect(screen.getByText(`${mockVideoAnalysis.quality.frameRate} fps`)).toBeInTheDocument()
  })

  it("should display audio analysis metrics", () => {
    render(
      <QualityMeter
        audioAnalysis={mockAudioAnalysis}
      />
    )
    
    expect(screen.getByText("Audio Analysis")).toBeInTheDocument()
    expect(screen.getByText("Sample Rate")).toBeInTheDocument()
    expect(screen.getByText("Speech Clarity")).toBeInTheDocument()
    expect(screen.getByText(`${mockAudioAnalysis.quality.clarity.toFixed(0)}%`)).toBeInTheDocument()
  })

  it("should display moment score breakdown", () => {
    render(
      <QualityMeter
        momentScore={mockMomentScore}
      />
    )
    
    expect(screen.getByText("Moment Score Details")).toBeInTheDocument()
    expect(screen.getByText("Visual Impact")).toBeInTheDocument()
    expect(screen.getByText("Technical Quality")).toBeInTheDocument()
    expect(screen.getByText("Emotional Value")).toBeInTheDocument()
    expect(screen.getByText("Relevance")).toBeInTheDocument()
  })

  it("should apply correct quality colors", () => {
    const highQualityScore = {
      ...mockMomentScore,
      totalScore: 90,
    }
    
    const { rerender } = render(
      <QualityMeter
        momentScore={highQualityScore}
      />
    )
    
    expect(screen.getByText("90%")).toHaveClass("text-green-600")
    expect(screen.getByText("Excellent")).toBeInTheDocument()
    
    const lowQualityScore = {
      ...mockMomentScore,
      totalScore: 40,
    }
    
    rerender(
      <QualityMeter
        momentScore={lowQualityScore}
      />
    )
    
    expect(screen.getByText("40%")).toHaveClass("text-red-600")
    expect(screen.getByText("Poor")).toBeInTheDocument()
  })

  it("should display composition quality", () => {
    render(
      <QualityMeter
        videoAnalysis={mockVideoAnalysis}
      />
    )
    
    expect(screen.getByText("Composition Quality")).toBeInTheDocument()
    expect(screen.getByText("Rule of Thirds")).toBeInTheDocument()
    expect(screen.getByText("Balance")).toBeInTheDocument()
    expect(screen.getByText("Leading Lines")).toBeInTheDocument()
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
    
    render(
      <QualityMeter
        videoAnalysis={lowQualityVideo}
      />
    )
    
    // Should show warning icon for low quality
    expect(screen.getByTestId("alerttriangle-icon")).toBeInTheDocument()
  })

  it("should display trend indicators", () => {
    render(
      <QualityMeter
        videoAnalysis={mockVideoAnalysis}
      />
    )
    
    // Should show trend icons for metrics (default to minus)
    const trendIcons = screen.getAllByTestId(/minus-icon/)
    expect(trendIcons.length).toBeGreaterThan(0)
  })

  it("should handle all data combined", () => {
    render(
      <QualityMeter
        videoAnalysis={mockVideoAnalysis}
        audioAnalysis={mockAudioAnalysis}
        momentScore={mockMomentScore}
      />
    )
    
    expect(screen.getByText("Overall Quality")).toBeInTheDocument()
    expect(screen.getByText("Video Analysis")).toBeInTheDocument()
    expect(screen.getByText("Audio Analysis")).toBeInTheDocument()
    expect(screen.getByText("Moment Score Details")).toBeInTheDocument()
  })
})