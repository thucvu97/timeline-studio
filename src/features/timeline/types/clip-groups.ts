// Типы для группировки клипов

export type GroupId = string;
export type ClipId = string;

export type SyncMode = 'none' | 'relative' | 'absolute';

export interface ClipReference {
  clipId: ClipId;
  trackId: string;
}

export interface ClipGroup {
  id: GroupId;
  name: string;
  clips: ClipReference[];
  locked: boolean;
  color: string;
  
  // Вложенность
  parent?: GroupId;
  children?: GroupId[];
  
  // Синхронизация
  syncMode: SyncMode;
  syncOffset?: number;
  
  // Состояние отображения
  collapsed: boolean;
  
  // Метаданные
  createdAt: number;
  modifiedAt: number;
}

export interface NestedSequence extends ClipGroup {
  sourceTimelineId?: string;
  instanceId: string;
  
  // Параметры вложения
  scale: number;
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  
  // Режим обновления
  updateMode: 'live' | 'snapshot' | 'manual';
  
  // Кэш рендеринга
  renderCache?: {
    frameRate: number;
    duration: number;
    lastUpdate: number;
  };
}

export interface GroupOperationResult {
  success: boolean;
  groupId?: GroupId;
  error?: string;
  affectedClips?: ClipReference[];
}

export interface GroupManager {
  groups: Map<GroupId, ClipGroup>;
  
  // Операции с группами
  createGroup(clips: ClipReference[], name?: string): GroupOperationResult;
  ungroupClips(groupId: GroupId): GroupOperationResult;
  addToGroup(groupId: GroupId, clips: ClipReference[]): GroupOperationResult;
  removeFromGroup(groupId: GroupId, clips: ClipReference[]): GroupOperationResult;
  
  // Управление состоянием
  toggleCollapse(groupId: GroupId): void;
  lockGroup(groupId: GroupId, locked: boolean): void;
  renameGroup(groupId: GroupId, name: string): void;
  setGroupColor(groupId: GroupId, color: string): void;
  
  // Вложенные sequences
  createNestedSequence(clips: ClipReference[], name?: string): GroupOperationResult;
  updateNestedSequence(sequenceId: GroupId, updates: Partial<NestedSequence>): void;
  breakApartSequence(sequenceId: GroupId): GroupOperationResult;
  
  // Запросы
  getGroup(groupId: GroupId): ClipGroup | undefined;
  getGroupByClip(clipId: ClipId): ClipGroup | undefined;
  getChildGroups(groupId: GroupId): ClipGroup[];
  isClipInGroup(clipId: ClipId): boolean;
  getGroupHierarchy(): ClipGroup[];
}

// События группировки
export interface GroupEvent {
  type: 'created' | 'deleted' | 'modified' | 'collapsed' | 'expanded' | 'locked' | 'unlocked';
  groupId: GroupId;
  timestamp: number;
  data?: any;
}

// Опции для операций
export interface GroupOptions {
  preserveSyncRelationships?: boolean;
  autoColor?: boolean;
  autoName?: boolean;
  collapseOnCreate?: boolean;
}

// Утилиты для работы с группами
export const GroupColors = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280'
} as const;

export type GroupColorKey = keyof typeof GroupColors;

export const getDefaultGroupName = (index: number): string => {
  return `Group ${index + 1}`;
};

export const getDefaultGroupColor = (index: number): string => {
  const colors = Object.values(GroupColors);
  return colors[index % colors.length];
};