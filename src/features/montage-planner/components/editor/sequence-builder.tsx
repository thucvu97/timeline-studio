/**
 * Sequence builder component for Smart Montage Planner
 * Allows visual construction and editing of montage sequences
 */

import React, { useState } from "react"

import { ChevronDown, ChevronUp, Copy, Edit2, GripVertical, Plus, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { formatTime } from "@/features/timeline/utils/utils"
import { cn } from "@/lib/utils"

import type { Fragment, Sequence, SequenceType } from "../../types"


interface SequenceBuilderProps {
  sequences: Sequence[]
  availableFragments: Fragment[]
  onSequencesChange: (sequences: Sequence[]) => void
  className?: string
}

export function SequenceBuilder({
  sequences,
  availableFragments,
  onSequencesChange,
  className,
}: SequenceBuilderProps) {
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set())
  const [editingSequence, setEditingSequence] = useState<string | null>(null)

  const sequenceTypes: SequenceType[] = ["intro", "main", "climax", "resolution", "outro", "montage"]
  
  const sequenceColors = {
    intro: "bg-blue-500",
    main: "bg-green-500",
    climax: "bg-red-500",
    resolution: "bg-purple-500",
    outro: "bg-indigo-500",
    montage: "bg-yellow-500",
  }

  const toggleSequenceExpanded = (sequenceId: string) => {
    const newExpanded = new Set(expandedSequences)
    if (newExpanded.has(sequenceId)) {
      newExpanded.delete(sequenceId)
    } else {
      newExpanded.add(sequenceId)
    }
    setExpandedSequences(newExpanded)
  }

  const addSequence = () => {
    const newSequence: Sequence = {
      id: `seq_${Date.now()}`,
      type: "main",
      clips: [],
      duration: 0,
      energyLevel: 50,
      purpose: "narrative-development",
    }
    onSequencesChange([...sequences, newSequence])
  }

  const updateSequence = (sequenceId: string, updates: Partial<Sequence>) => {
    onSequencesChange(
      sequences.map((seq) =>
        seq.id === sequenceId ? { ...seq, ...updates } : seq
      )
    )
  }

  const deleteSequence = (sequenceId: string) => {
    onSequencesChange(sequences.filter((seq) => seq.id !== sequenceId))
  }

  const duplicateSequence = (sequence: Sequence) => {
    const newSequence: Sequence = {
      ...sequence,
      id: `seq_${Date.now()}`,
      clips: [...sequence.clips],
    }
    const index = sequences.findIndex((seq) => seq.id === sequence.id)
    const newSequences = [...sequences]
    newSequences.splice(index + 1, 0, newSequence)
    onSequencesChange(newSequences)
  }

  const moveSequence = (index: number, direction: "up" | "down") => {
    const newSequences = [...sequences]
    const newIndex = direction === "up" ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < sequences.length) {
      [newSequences[index], newSequences[newIndex]] = [newSequences[newIndex], newSequences[index]]
      onSequencesChange(newSequences)
    }
  }

  const addClipToSequence = (sequenceId: string, fragment: Fragment) => {
    const sequence = sequences.find((seq) => seq.id === sequenceId)
    if (!sequence) return

    const newClip = {
      id: `clip_${Date.now()}`,
      fragmentId: fragment.id,
      startTime: sequence.duration,
      duration: fragment.duration,
      inPoint: 0,
      outPoint: fragment.duration,
    }

    updateSequence(sequenceId, {
      clips: [...sequence.clips, newClip],
      duration: sequence.duration + fragment.duration,
    })
  }

  const removeClipFromSequence = (sequenceId: string, clipId: string) => {
    const sequence = sequences.find((seq) => seq.id === sequenceId)
    if (!sequence) return

    const clipToRemove = sequence.clips.find((clip) => clip.id === clipId)
    if (!clipToRemove) return

    const newClips = sequence.clips.filter((clip) => clip.id !== clipId)
    const newDuration = newClips.reduce((sum, clip) => sum + Number(clip.duration || 0), 0)

    updateSequence(sequenceId, {
      clips: newClips,
      duration: newDuration,
    })
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Sequence Builder</CardTitle>
            <CardDescription>
              Construct and arrange sequences for your montage
            </CardDescription>
          </div>
          <Button onClick={addSequence} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Sequence
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sequences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sequences yet. Click &quot;Add Sequence&quot; to start building your montage.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sequences.map((sequence, index) => {
              const isExpanded = expandedSequences.has(sequence.id)
              const isEditing = editingSequence === sequence.id

              return (
                <div
                  key={sequence.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* Sequence Header */}
                  <div className="p-3 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      
                      <div className={cn("w-3 h-3 rounded", sequenceColors[sequence.type])} />
                      
                      {isEditing ? (
                        <Select
                          value={sequence.type}
                          onValueChange={(value: SequenceType) => {
                            updateSequence(sequence.id, { type: value })
                            setEditingSequence(null)
                          }}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sequenceTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                <span className="capitalize">{type}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <button
                          onClick={() => setEditingSequence(sequence.id)}
                          className="font-medium capitalize hover:underline"
                        >
                          {sequence.type}
                        </button>
                      )}

                      <Badge variant="outline" className="ml-auto">
                        {sequence.clips.length} clips
                      </Badge>
                      
                      <span className="text-sm text-muted-foreground">
                        {formatTime(sequence.duration)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSequence(index, "up")}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveSequence(index, "down")}
                          disabled={index === sequences.length - 1}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => duplicateSequence(sequence)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteSequence(sequence.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleSequenceExpanded(sequence.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>

                  {/* Sequence Content */}
                  <Collapsible open={isExpanded}>
                    <CollapsibleContent>
                      <div className="p-4 space-y-4">
                        {/* Energy Level */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Energy Level</Label>
                            <span className="text-sm text-muted-foreground">
                              {sequence.energyLevel}%
                            </span>
                          </div>
                          <Slider
                            value={[sequence.energyLevel]}
                            onValueChange={([value]) =>
                              updateSequence(sequence.id, { energyLevel: value })
                            }
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        {/* Purpose */}
                        <div className="space-y-2">
                          <Label>Purpose</Label>
                          <Select
                            value={sequence.purpose}
                            onValueChange={(value) =>
                              updateSequence(sequence.id, { purpose: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="hook">Hook</SelectItem>
                              <SelectItem value="setup">Setup</SelectItem>
                              <SelectItem value="narrative-development">
                                Narrative Development
                              </SelectItem>
                              <SelectItem value="emotional-peak">Emotional Peak</SelectItem>
                              <SelectItem value="resolution">Resolution</SelectItem>
                              <SelectItem value="call-to-action">Call to Action</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clips */}
                        <div className="space-y-2">
                          <Label>Clips in Sequence</Label>
                          {sequence.clips.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              No clips added yet. Drag fragments here to add them.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {sequence.clips.map((clip) => {
                                const fragment = availableFragments.find(
                                  (f) => f.id === clip.fragmentId
                                )
                                return (
                                  <div
                                    key={clip.id}
                                    className="flex items-center justify-between p-2 rounded border"
                                  >
                                    <span className="text-sm">
                                      {fragment?.videoId || "Unknown"} •{" "}
                                      {formatTime(clip.startTime)} -{" "}
                                      {formatTime(Number(clip.startTime || 0) + Number(clip.duration || 0))}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        removeClipFromSequence(sequence.id, clip.id)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Available Fragments (simplified) */}
                        <div className="space-y-2">
                          <Label>Available Fragments</Label>
                          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                            {availableFragments.slice(0, 10).map((fragment) => (
                              <Button
                                key={fragment.id}
                                variant="outline"
                                size="sm"
                                className="justify-start"
                                onClick={() => addClipToSequence(sequence.id, fragment)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                {fragment.videoId} ({formatTime(fragment.duration)})
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )
            })}
          </div>
        )}

        {/* Total Duration */}
        {sequences.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Duration</span>
              <span className="font-medium">
                {formatTime(sequences.reduce((sum, seq) => sum + seq.duration, 0))}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}