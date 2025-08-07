/**
 * Enhanced Undo/Redo Service for Timeline
 * Provides comprehensive undo/redo functionality with action grouping, selective undo, and more
 */

export type ActionType =
  | "CREATE_PROJECT"
  | "ADD_CLIP"
  | "REMOVE_CLIP"
  | "MOVE_CLIP"
  | "TRIM_CLIP"
  | "SPLIT_CLIP"
  | "UPDATE_CLIP"
  | "ADD_TRACK"
  | "REMOVE_TRACK"
  | "UPDATE_TRACK"
  | "REORDER_TRACKS"
  | "ADD_KEYFRAME"
  | "REMOVE_KEYFRAME"
  | "UPDATE_KEYFRAME"
  | "BATCH_OPERATION"
  | "APPLY_EFFECT"
  | "REMOVE_EFFECT"
  | "APPLY_FILTER"
  | "REMOVE_FILTER"
  | "APPLY_TRANSITION"
  | "REMOVE_TRANSITION"
  | "CUSTOM"

export interface UndoRedoAction {
  id: string
  type: ActionType
  timestamp: Date
  description: string

  // Группировка действий
  groupId?: string // Для группировки связанных действий
  isCompound?: boolean // Составное действие из нескольких операций

  // Данные для отмены/повтора
  undoData: any // Данные для отмены действия
  redoData: any // Данные для повтора действия

  // Метаданные
  affectedEntities: {
    clips?: string[] // ID затронутых клипов
    tracks?: string[] // ID затронутых треков
    keyframes?: string[] // ID затронутых keyframes
  }

  // Приоритет (для selective undo)
  priority?: "low" | "medium" | "high"

  // Флаги поведения
  mergeable?: boolean // Можно ли объединять с предыдущими действиями
  skipable?: boolean // Можно ли пропускать при групповой отмене
}

export interface UndoRedoState {
  history: UndoRedoAction[]
  currentIndex: number // -1 означает, что мы в текущем состоянии
  maxHistorySize: number

  // Группировка
  currentGroupId?: string
  isGrouping: boolean

  // Статистика
  totalActions: number
  undoCount: number
  redoCount: number
}

export interface UndoRedoResult {
  success: boolean
  action?: UndoRedoAction
  error?: string
  affectedEntities?: UndoRedoAction["affectedEntities"]
}

export class UndoRedoService {
  private state: UndoRedoState = {
    history: [],
    currentIndex: -1,
    maxHistorySize: 100,
    isGrouping: false,
    totalActions: 0,
    undoCount: 0,
    redoCount: 0,
  }

  /**
   * Добавляет действие в историю
   */
  addAction(action: Omit<UndoRedoAction, "id" | "timestamp">): string {
    const fullAction: UndoRedoAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      groupId: this.state.currentGroupId,
    }

    // Если мы не в конце истории, обрезаем все действия после текущего индекса
    if (this.state.currentIndex < this.state.history.length - 1) {
      this.state.history = this.state.history.slice(0, this.state.currentIndex + 1)
    }

    // Проверяем на возможность слияния с предыдущим действием
    if (action.mergeable && this.canMergeWithPrevious(fullAction)) {
      this.mergeWithPrevious(fullAction)
    } else {
      // Добавляем новое действие
      this.state.history.push(fullAction)
      this.state.currentIndex = this.state.history.length - 1
    }

    // Обрезаем историю если превышен максимальный размер
    this.trimHistory()

    this.state.totalActions++

    return fullAction.id
  }

  /**
   * Отменяет последнее действие
   */
  undo(): UndoRedoResult {
    if (!this.canUndo()) {
      return { success: false, error: "Нечего отменять" }
    }

    const action = this.state.history[this.state.currentIndex]
    this.state.currentIndex--
    this.state.undoCount++

    return {
      success: true,
      action,
      affectedEntities: action.affectedEntities,
    }
  }

  /**
   * Повторяет отмененное действие
   */
  redo(): UndoRedoResult {
    if (!this.canRedo()) {
      return { success: false, error: "Нечего повторять" }
    }

    this.state.currentIndex++
    const action = this.state.history[this.state.currentIndex]
    this.state.redoCount++

    return {
      success: true,
      action,
      affectedEntities: action.affectedEntities,
    }
  }

  /**
   * Отменяет несколько действий
   */
  undoMultiple(count: number): UndoRedoResult[] {
    const results: UndoRedoResult[] = []

    for (let i = 0; i < count && this.canUndo(); i++) {
      results.push(this.undo())
    }

    return results
  }

  /**
   * Повторяет несколько действий
   */
  redoMultiple(count: number): UndoRedoResult[] {
    const results: UndoRedoResult[] = []

    for (let i = 0; i < count && this.canRedo(); i++) {
      results.push(this.redo())
    }

    return results
  }

  /**
   * Отменяет все действия до определенного момента
   */
  undoToAction(actionId: string): UndoRedoResult {
    const actionIndex = this.state.history.findIndex((a) => a.id === actionId)

    if (actionIndex === -1) {
      return { success: false, error: "Действие не найдено" }
    }

    if (actionIndex >= this.state.currentIndex) {
      return { success: false, error: "Действие уже отменено или в будущем" }
    }

    const undoCount = this.state.currentIndex - actionIndex
    const results = this.undoMultiple(undoCount)

    return {
      success: results.every((r) => r.success),
      affectedEntities: this.mergeAffectedEntities(results.map((r) => r.affectedEntities).filter(Boolean)),
    }
  }

  /**
   * Отменяет действия определенного типа (selective undo)
   */
  undoByType(actionType: ActionType, maxCount: number = 10): UndoRedoResult[] {
    const results: UndoRedoResult[] = []
    const targetActions = this.getUndoableActionsByType(actionType, maxCount)

    for (const action of targetActions) {
      // Находим индекс действия
      const actionIndex = this.state.history.findIndex((a) => a.id === action.id)

      if (actionIndex <= this.state.currentIndex) {
        // Отменяем до этого действия
        const undoResult = this.undoToAction(action.id)
        if (undoResult.success) {
          results.push(undoResult)
        }
        break
      }
    }

    return results
  }

  /**
   * Отменяет действия, затрагивающие определенные сущности
   */
  undoByEntity(entityIds: string[], entityType: "clips" | "tracks" | "keyframes"): UndoRedoResult[] {
    const results: UndoRedoResult[] = []
    const relevantActions = this.getActionsByEntity(entityIds, entityType)

    for (const action of relevantActions) {
      const actionIndex = this.state.history.findIndex((a) => a.id === action.id)

      if (actionIndex <= this.state.currentIndex) {
        const undoResult = this.undoToAction(action.id)
        if (undoResult.success) {
          results.push(undoResult)
        }
        break
      }
    }

    return results
  }

  /**
   * Начинает группировку действий
   */
  startGrouping(groupDescription: string = "Группа действий"): string {
    const groupId = `group_${Date.now()}_${Math.random()}`

    this.state.currentGroupId = groupId
    this.state.isGrouping = true

    // Добавляем маркер начала группы
    this.addAction({
      type: "CUSTOM",
      description: `Начало: ${groupDescription}`,
      undoData: { type: "group_start", groupId },
      redoData: { type: "group_start", groupId },
      affectedEntities: {},
      groupId,
      isCompound: true,
    })

    return groupId
  }

  /**
   * Завершает группировку действий
   */
  endGrouping(): void {
    if (!this.state.isGrouping || !this.state.currentGroupId) {
      return
    }

    // Добавляем маркер конца группы
    this.addAction({
      type: "CUSTOM",
      description: "Конец группы действий",
      undoData: { type: "group_end", groupId: this.state.currentGroupId },
      redoData: { type: "group_end", groupId: this.state.currentGroupId },
      affectedEntities: {},
      groupId: this.state.currentGroupId,
      isCompound: true,
    })

    this.state.currentGroupId = undefined
    this.state.isGrouping = false
  }

  /**
   * Отменяет всю группу действий
   */
  undoGroup(groupId: string): UndoRedoResult {
    const groupActions = this.state.history.filter((a) => a.groupId === groupId)

    if (groupActions.length === 0) {
      return { success: false, error: "Группа не найдена" }
    }

    // Находим первое действие группы
    const firstAction = groupActions[0]
    const firstActionIndex = this.state.history.findIndex((a) => a.id === firstAction.id)

    if (firstActionIndex > this.state.currentIndex) {
      return { success: false, error: "Группа уже отменена" }
    }

    return this.undoToAction(firstAction.id)
  }

  /**
   * Очищает всю историю
   */
  clearHistory(): void {
    this.state.history = []
    this.state.currentIndex = -1
    this.state.currentGroupId = undefined
    this.state.isGrouping = false
  }

  /**
   * Оптимизирует историю (удаляет избыточные действия)
   */
  optimizeHistory(): void {
    // Удаляем действия с низким приоритетом если история переполнена
    if (this.state.history.length > this.state.maxHistorySize * 0.8) {
      this.state.history = this.state.history.filter(
        (action, index) => action.priority !== "low" || index > this.state.history.length - 50, // Сохраняем последние 50 действий
      )

      // Корректируем индекс
      this.state.currentIndex = Math.min(this.state.currentIndex, this.state.history.length - 1)
    }
  }

  // Геттеры состояния

  canUndo(): boolean {
    return this.state.currentIndex >= 0
  }

  canRedo(): boolean {
    return this.state.currentIndex < this.state.history.length - 1
  }

  getHistory(): readonly UndoRedoAction[] {
    return this.state.history
  }

  getCurrentIndex(): number {
    return this.state.currentIndex
  }

  getHistoryStats() {
    return {
      totalActions: this.state.totalActions,
      undoCount: this.state.undoCount,
      redoCount: this.state.redoCount,
      historySize: this.state.history.length,
      maxHistorySize: this.state.maxHistorySize,
      currentIndex: this.state.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    }
  }

  getUndoableActions(limit: number = 10): UndoRedoAction[] {
    return this.state.history
      .slice(Math.max(0, this.state.currentIndex + 1 - limit), this.state.currentIndex + 1)
      .reverse()
  }

  getRedoableActions(limit: number = 10): UndoRedoAction[] {
    return this.state.history.slice(this.state.currentIndex + 1, this.state.currentIndex + 1 + limit)
  }

  // Приватные методы

  private canMergeWithPrevious(action: UndoRedoAction): boolean {
    if (this.state.history.length === 0) return false

    const previousAction = this.state.history[this.state.history.length - 1]

    return (
      previousAction.type === action.type &&
      previousAction.mergeable === true &&
      Date.now() - previousAction.timestamp.getTime() < 2000 && // Меньше 2 секунд
      this.haveSameAffectedEntities(previousAction, action)
    )
  }

  private mergeWithPrevious(action: UndoRedoAction): void {
    const previousAction = this.state.history[this.state.history.length - 1]

    // Обновляем данные предыдущего действия
    previousAction.timestamp = action.timestamp
    previousAction.redoData = action.redoData
    previousAction.description = action.description

    // Объединяем затронутые сущности
    previousAction.affectedEntities = this.mergeAffectedEntities([
      previousAction.affectedEntities,
      action.affectedEntities,
    ])[0]!
  }

  private haveSameAffectedEntities(action1: UndoRedoAction, action2: UndoRedoAction): boolean {
    const entities1 = action1.affectedEntities
    const entities2 = action2.affectedEntities

    return (
      this.arraysEqual(entities1.clips || [], entities2.clips || []) &&
      this.arraysEqual(entities1.tracks || [], entities2.tracks || []) &&
      this.arraysEqual(entities1.keyframes || [], entities2.keyframes || [])
    )
  }

  private arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false
    return arr1.every((item, index) => item === arr2[index])
  }

  private mergeAffectedEntities(
    entities: (UndoRedoAction["affectedEntities"] | undefined)[],
  ): UndoRedoAction["affectedEntities"][] {
    const result: UndoRedoAction["affectedEntities"] = {
      clips: [],
      tracks: [],
      keyframes: [],
    }

    for (const entity of entities) {
      if (!entity) continue

      if (entity.clips) result.clips!.push(...entity.clips)
      if (entity.tracks) result.tracks!.push(...entity.tracks)
      if (entity.keyframes) result.keyframes!.push(...entity.keyframes)
    }

    // Удаляем дубликаты
    result.clips = [...new Set(result.clips)]
    result.tracks = [...new Set(result.tracks)]
    result.keyframes = [...new Set(result.keyframes)]

    return [result]
  }

  private getUndoableActionsByType(actionType: ActionType, maxCount: number): UndoRedoAction[] {
    return this.state.history
      .slice(0, this.state.currentIndex + 1)
      .filter((action) => action.type === actionType)
      .slice(-maxCount)
      .reverse()
  }

  private getActionsByEntity(entityIds: string[], entityType: "clips" | "tracks" | "keyframes"): UndoRedoAction[] {
    return this.state.history
      .slice(0, this.state.currentIndex + 1)
      .filter((action) => {
        const entities = action.affectedEntities[entityType] || []
        return entityIds.some((id) => entities.includes(id))
      })
      .reverse()
  }

  private trimHistory(): void {
    if (this.state.history.length > this.state.maxHistorySize) {
      const trimCount = this.state.history.length - this.state.maxHistorySize
      this.state.history = this.state.history.slice(trimCount)
      this.state.currentIndex -= trimCount
      this.state.currentIndex = Math.max(-1, this.state.currentIndex)
    }
  }

  // Настройки

  setMaxHistorySize(size: number): void {
    this.state.maxHistorySize = Math.max(10, size)
    this.trimHistory()
  }

  getMaxHistorySize(): number {
    return this.state.maxHistorySize
  }
}
