import { nanoid } from "nanoid"
import type {
  ClipGroup,
  ClipId,
  ClipReference,
  GroupEvent,
  GroupId,
  GroupManager,
  GroupOperationResult,
  GroupOptions,
  NestedSequence,
} from "../types/clip-groups"
import { getDefaultGroupColor, getDefaultGroupName } from "../types/clip-groups"

export class TimelineGroupManager implements GroupManager {
  groups = new Map<GroupId, ClipGroup>()
  private eventListeners = new Set<(event: GroupEvent) => void>()
  private groupCounter = 0

  constructor() {
    this.groups = new Map()
    this.groupCounter = 0
  }

  // Операции с группами
  createGroup(clips: ClipReference[], name?: string, options?: GroupOptions): GroupOperationResult {
    if (clips.length === 0) {
      return { success: false, error: "No clips selected for grouping" }
    }

    // Проверяем, что клипы не находятся в других группах
    const alreadyGrouped = clips.filter((clip) => this.isClipInGroup(clip.clipId))
    if (alreadyGrouped.length > 0) {
      return {
        success: false,
        error: "Some clips are already in groups. Ungroup them first.",
      }
    }

    const groupId = nanoid()
    const group: ClipGroup = {
      id: groupId,
      name: name || getDefaultGroupName(this.groupCounter++),
      clips: [...clips],
      locked: false,
      color: options?.autoColor !== false ? getDefaultGroupColor(this.groupCounter - 1) : "#6b7280",
      syncMode: options?.preserveSyncRelationships ? "relative" : "none",
      collapsed: options?.collapseOnCreate ?? false,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
    }

    this.groups.set(groupId, group)
    this.emitEvent({ type: "created", groupId, timestamp: Date.now() })

    return { success: true, groupId, affectedClips: clips }
  }

  ungroupClips(groupId: GroupId): GroupOperationResult {
    const group = this.groups.get(groupId)
    if (!group) {
      return { success: false, error: "Group not found" }
    }

    if (group.locked) {
      return { success: false, error: "Group is locked" }
    }

    const affectedClips = [...group.clips]
    this.groups.delete(groupId)
    this.emitEvent({ type: "deleted", groupId, timestamp: Date.now() })

    return { success: true, affectedClips }
  }

  addToGroup(groupId: GroupId, clips: ClipReference[]): GroupOperationResult {
    const group = this.groups.get(groupId)
    if (!group) {
      return { success: false, error: "Group not found" }
    }

    if (group.locked) {
      return { success: false, error: "Group is locked" }
    }

    // Фильтруем клипы, которые уже в группе
    const newClips = clips.filter((clip) => !group.clips.some((existing) => existing.clipId === clip.clipId))

    if (newClips.length === 0) {
      return { success: false, error: "All clips are already in the group" }
    }

    group.clips.push(...newClips)
    group.modifiedAt = Date.now()
    this.emitEvent({ type: "modified", groupId, timestamp: Date.now() })

    return { success: true, affectedClips: newClips }
  }

  removeFromGroup(groupId: GroupId, clips: ClipReference[]): GroupOperationResult {
    const group = this.groups.get(groupId)
    if (!group) {
      return { success: false, error: "Group not found" }
    }

    if (group.locked) {
      return { success: false, error: "Group is locked" }
    }

    const clipIds = new Set(clips.map((c) => c.clipId))
    const originalLength = group.clips.length
    group.clips = group.clips.filter((c) => !clipIds.has(c.clipId))

    if (group.clips.length === originalLength) {
      return { success: false, error: "No clips were removed" }
    }

    // Если в группе не осталось клипов, удаляем её
    if (group.clips.length === 0) {
      this.groups.delete(groupId)
      this.emitEvent({ type: "deleted", groupId, timestamp: Date.now() })
    } else {
      group.modifiedAt = Date.now()
      this.emitEvent({ type: "modified", groupId, timestamp: Date.now() })
    }

    return { success: true, affectedClips: clips }
  }

  // Управление состоянием
  toggleCollapse(groupId: GroupId): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.collapsed = !group.collapsed
    group.modifiedAt = Date.now()
    this.emitEvent({
      type: group.collapsed ? "collapsed" : "expanded",
      groupId,
      timestamp: Date.now(),
    })
  }

  lockGroup(groupId: GroupId, locked: boolean): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.locked = locked
    group.modifiedAt = Date.now()
    this.emitEvent({
      type: locked ? "locked" : "unlocked",
      groupId,
      timestamp: Date.now(),
    })
  }

  renameGroup(groupId: GroupId, name: string): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.name = name
    group.modifiedAt = Date.now()
    this.emitEvent({ type: "modified", groupId, timestamp: Date.now() })
  }

  setGroupColor(groupId: GroupId, color: string): void {
    const group = this.groups.get(groupId)
    if (!group) return

    group.color = color
    group.modifiedAt = Date.now()
    this.emitEvent({ type: "modified", groupId, timestamp: Date.now() })
  }

  // Вложенные sequences
  createNestedSequence(clips: ClipReference[], name?: string): GroupOperationResult {
    const groupResult = this.createGroup(clips, name)
    if (!groupResult.success || !groupResult.groupId) {
      return groupResult
    }

    // Преобразуем группу в nested sequence
    const group = this.groups.get(groupResult.groupId)!
    const nestedSequence: NestedSequence = {
      ...group,
      instanceId: nanoid(),
      scale: 1,
      position: { x: 0, y: 0 },
      rotation: 0,
      opacity: 1,
      updateMode: "live",
    }

    this.groups.set(groupResult.groupId, nestedSequence)
    return { success: true, groupId: groupResult.groupId }
  }

  updateNestedSequence(sequenceId: GroupId, updates: Partial<NestedSequence>): void {
    const sequence = this.groups.get(sequenceId) as NestedSequence
    if (!sequence || !("instanceId" in sequence)) return

    Object.assign(sequence, updates)
    sequence.modifiedAt = Date.now()
    this.emitEvent({ type: "modified", groupId: sequenceId, timestamp: Date.now() })
  }

  breakApartSequence(sequenceId: GroupId): GroupOperationResult {
    const sequence = this.groups.get(sequenceId)
    if (!sequence) {
      return { success: false, error: "Sequence not found" }
    }

    if (sequence.locked) {
      return { success: false, error: "Sequence is locked" }
    }

    // Возвращаем клипы на timeline
    const affectedClips = [...sequence.clips]
    this.groups.delete(sequenceId)
    this.emitEvent({ type: "deleted", groupId: sequenceId, timestamp: Date.now() })

    return { success: true, affectedClips }
  }

  // Запросы
  getGroup(groupId: GroupId): ClipGroup | undefined {
    return this.groups.get(groupId)
  }

  getGroupByClip(clipId: ClipId): ClipGroup | undefined {
    for (const group of this.groups.values()) {
      if (group.clips.some((c) => c.clipId === clipId)) {
        return group
      }
    }
    return undefined
  }

  getChildGroups(parentId: GroupId): ClipGroup[] {
    return Array.from(this.groups.values()).filter((g) => g.parent === parentId)
  }

  isClipInGroup(clipId: ClipId): boolean {
    return this.getGroupByClip(clipId) !== undefined
  }

  getGroupHierarchy(): ClipGroup[] {
    // Возвращаем только группы верхнего уровня (без родителей)
    return Array.from(this.groups.values()).filter((g) => !g.parent)
  }

  // События
  addEventListener(listener: (event: GroupEvent) => void): void {
    this.eventListeners.add(listener)
  }

  removeEventListener(listener: (event: GroupEvent) => void): void {
    this.eventListeners.delete(listener)
  }

  private emitEvent(event: GroupEvent): void {
    this.eventListeners.forEach((listener) => listener(event))
  }

  // Утилиты
  clear(): void {
    this.groups.clear()
    this.groupCounter = 0
  }

  toJSON(): any {
    return {
      groups: Array.from(this.groups.entries()),
      groupCounter: this.groupCounter,
    }
  }

  fromJSON(data: any): void {
    this.clear()
    if (data.groups) {
      data.groups.forEach(([id, group]: [string, ClipGroup]) => {
        this.groups.set(id, group)
      })
    }
    this.groupCounter = data.groupCounter || 0
  }
}
