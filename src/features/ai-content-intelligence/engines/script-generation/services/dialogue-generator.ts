/**
 * Dialogue Generator
 * Генератор диалогов для сценариев
 */

import { UnifiedAIService } from "@/features/ai-chat/services/unified-ai-service"

import type { Character, Dialogue, ScriptTiming } from "../../../shared/types/script-generation"
import type { DialogueConstraints, DialogueGenerationParams, DialogueStyle, SceneContext } from "../types"

export class DialogueGenerator {
  private aiService: UnifiedAIService
  private isInitialized = false

  constructor() {
    this.aiService = UnifiedAIService.getInstance()
  }

  async initialize(): Promise<void> {
    // Инициализация генератора диалогов
    this.isInitialized = true
  }

  /**
   * Генерировать диалоги для сцены
   */
  async generate(params: DialogueGenerationParams): Promise<Dialogue[]> {
    if (!this.isInitialized) {
      throw new Error("Dialogue Generator not initialized")
    }

    const { characters, scene, style, constraints } = params

    // Строим промпт для генерации
    const prompt = this.buildDialoguePrompt(characters, scene, style, constraints)

    // Генерируем диалог через AI
    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], {
        temperature: style.naturalism || 0.8,
        maxTokens: 1500,
      })
      .then((r) => r.content)

    // Парсим ответ в диалоги
    return this.parseDialogueResponse(response, characters, scene)
  }

  /**
   * Генерировать реплику персонажа
   */
  async generateLine(character: Character, context: SceneContext, previousLine?: string): Promise<string> {
    const prompt = `Generate a single line of dialogue for ${character.name} (${character.role}).
    
Character description: ${character.description || "not specified"}
Character role: ${character.role}
Scene: ${context.location} - ${context.timeOfDay}
Mood: ${context.mood}
Action: ${context.action}
${previousLine ? `Previous line: "${previousLine}"` : ""}

Generate only the dialogue line, no attribution or stage directions.`

    const response = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.8, maxTokens: 100 })
      .then((r) => r.content)

    return this.cleanDialogueLine(response)
  }

  /**
   * Улучшить существующий диалог
   */
  async improveDialogue(dialogue: Dialogue, character: Character, style: DialogueStyle): Promise<Dialogue> {
    const prompt = `Improve this dialogue line while maintaining character voice:

Character: ${character.name} (${character.role})
Current line: "${dialogue.text}"
Style: ${style.tone}, ${style.pacing} pacing
${style.subtext ? "Include subtext" : "Direct communication"}

Provide an improved version that sounds more ${style.naturalism > 0.7 ? "natural" : "stylized"}.`

    const improvedText = await this.aiService
      .sendRequest("gpt-4", [{ role: "user", content: prompt }], { temperature: 0.6, maxTokens: 150 })
      .then((r) => r.content)

    return {
      ...dialogue,
      text: this.cleanDialogueLine(improvedText),
    }
  }

  /**
   * Генерировать диалог между персонажами
   */
  async generateConversation(characters: Character[], scene: SceneContext, turnCount = 4): Promise<Dialogue[]> {
    const dialogues: Dialogue[] = []
    let previousLine = ""

    for (let i = 0; i < turnCount; i++) {
      const character = characters[i % characters.length]
      const line = await this.generateLine(character, scene, previousLine)

      dialogues.push({
        id: `dialogue-${Date.now()}-${i}`,
        sceneId: "current-scene",
        character: character.name,
        text: line,
        timing: this.estimateTiming(line, i),
        direction: this.generateDirection(character, scene),
      })

      previousLine = line
    }

    return dialogues
  }

  // Приватные методы

  private buildDialoguePrompt(
    characters: Character[],
    scene: SceneContext,
    style: DialogueStyle,
    constraints?: DialogueConstraints,
  ): string {
    const characterDescriptions = characters
      .map((c) => `- ${c.name} (${c.role}): ${c.description || "no description"}`)
      .join("\n")

    return `Generate dialogue for a scene with the following parameters:

SCENE CONTEXT:
Location: ${scene.location}
Time: ${scene.timeOfDay}
Mood: ${scene.mood}
Action: ${scene.action}

CHARACTERS:
${characterDescriptions}

STYLE:
Tone: ${style.tone}
Pacing: ${style.pacing}
Naturalism: ${style.naturalism * 100}% natural (vs stylized)
${style.subtext ? "Include subtext and unspoken tensions" : "Direct communication"}

${
  constraints
    ? `
CONSTRAINTS:
${constraints.maxLength ? `Maximum ${constraints.maxLength} words` : ""}
${constraints.minLength ? `Minimum ${constraints.minLength} words` : ""}
${constraints.requiredTopics ? `Must cover: ${constraints.requiredTopics.join(", ")}` : ""}
${constraints.avoidTopics ? `Avoid: ${constraints.avoidTopics.join(", ")}` : ""}
${constraints.mustInclude ? `Must include phrases: ${constraints.mustInclude.join(", ")}` : ""}
`
    : ""
}

Generate a natural dialogue exchange between the characters that fits the scene and advances the story.
Format each line as:
CHARACTER: Dialogue text

Include 3-5 exchanges.`
  }

  private parseDialogueResponse(response: string, characters: Character[], _scene: SceneContext): Dialogue[] {
    const lines = response.split("\n").filter((line) => line.trim())
    const dialogues: Dialogue[] = []

    let currentTime = 0

    for (const line of lines) {
      const match = /^([A-Z][A-Z\s]+):\s*(.+)$/.exec(line)
      if (match) {
        const [, characterName, dialogueText] = match
        const character = characters.find((c) => c.name.toUpperCase() === characterName.trim())

        if (character) {
          const dialogue: Dialogue = {
            id: `dialogue-${Date.now()}-${dialogues.length}`,
            sceneId: "current-scene",
            character: character.name,
            text: dialogueText.trim(),
            timing: {
              start: currentTime,
              end: currentTime + this.estimateLineDuration(dialogueText),
              duration: this.estimateLineDuration(dialogueText),
            },
          }

          dialogues.push(dialogue)
          currentTime = dialogue.timing.end + 0.5 // Небольшая пауза между репликами
        }
      }
    }

    return dialogues
  }

  private cleanDialogueLine(text: string): string {
    // Удаляем кавычки, если они есть
    text = text.replace(/^["']|["']$/g, "")

    // Удаляем имена персонажей, если они случайно попали
    text = text.replace(/^[A-Z][A-Z\s]+:\s*/, "")

    // Trim и нормализация пробелов
    text = text.trim().replace(/\s+/g, " ")

    return text
  }

  private estimateTiming(text: string, index: number): ScriptTiming {
    const wordsPerSecond = 2.5 // Средняя скорость речи
    const words = text.split(/\s+/).length
    const duration = words / wordsPerSecond

    const start = index * (duration + 0.5) // Добавляем паузы между репликами

    return {
      start,
      end: start + duration,
      duration,
    }
  }

  private estimateLineDuration(text: string): number {
    const wordsPerSecond = 2.5
    const words = text.split(/\s+/).length
    return Math.max(1, words / wordsPerSecond) // Минимум 1 секунда
  }

  private generateDirection(_character: Character, scene: SceneContext): string | undefined {
    // Генерируем режиссерские ремарки на основе контекста
    const mood = scene.mood.toLowerCase()

    if (mood.includes("tense") || mood.includes("angry")) {
      return "(firmly)"
    }
    if (mood.includes("sad") || mood.includes("melancholy")) {
      return "(softly)"
    }
    if (mood.includes("happy") || mood.includes("excited")) {
      return "(enthusiastically)"
    }

    return undefined
  }

  /**
   * Проверить согласованность диалога
   */
  async checkConsistency(dialogues: Dialogue[]): Promise<{
    isConsistent: boolean
    issues: string[]
  }> {
    const issues: string[] = []

    // Проверяем, что персонажи говорят в соответствии со своим стилем
    // Проверяем логическую последовательность
    // Проверяем отсутствие повторов

    // Упрощенная проверка
    const characterLines: Record<string, string[]> = {}

    for (const dialogue of dialogues) {
      if (!characterLines[dialogue.character]) {
        characterLines[dialogue.character] = []
      }
      characterLines[dialogue.character].push(dialogue.text)
    }

    // Проверяем на повторы
    for (const [character, lines] of Object.entries(characterLines)) {
      const uniqueLines = new Set(lines)
      if (uniqueLines.size < lines.length) {
        issues.push(`${character} has repeated lines`)
      }
    }

    return {
      isConsistent: issues.length === 0,
      issues,
    }
  }
}
