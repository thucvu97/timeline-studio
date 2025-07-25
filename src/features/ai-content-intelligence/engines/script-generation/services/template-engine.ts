/**
 * Template Engine
 * Движок для работы с шаблонами сценариев
 */

import { NarrativeType, TemplateCategory } from "../../../shared/types/script-generation"
import { SectionType } from "../types"

import type { ScriptTemplate } from "../../../shared/types/script-generation"
import type { TemplateSection, TemplateStructure, TemplateVariable } from "../types"

// Расширенный тип шаблона для внутреннего использования
interface ExtendedScriptTemplate extends ScriptTemplate {
  variables?: TemplateVariable[]
  templateStructure?: TemplateStructure
}

export class TemplateEngine {
  private templates = new Map<string, ExtendedScriptTemplate>()
  private isInitialized = false

  async initialize(): Promise<void> {
    // Загружаем встроенные шаблоны
    this.loadBuiltinTemplates()
    this.isInitialized = true
  }

  /**
   * Получить шаблон по ID
   */
  getTemplate(id: string): ScriptTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * Получить шаблоны по категории
   */
  getTemplatesByCategory(category: TemplateCategory): ScriptTemplate[] {
    return Array.from(this.templates.values()).filter((template) => template.category === category)
  }

  /**
   * Применить шаблон с переменными
   */
  applyTemplate(template: ExtendedScriptTemplate, variables: Record<string, any>): TemplateStructure {
    // Валидация переменных
    if (template.variables) {
      this.validateVariables(template.variables, variables)
    }

    // Применяем переменные к секциям
    if (template.templateStructure?.sections) {
      const processedSections = template.templateStructure.sections.map((section) => 
        this.processSection(section, variables)
      )

      return {
        ...template.templateStructure,
        sections: processedSections,
      }
    }

    // Если нет templateStructure, возвращаем пустую структуру
    return {
      sections: [],
      flexibility: "flexible"
    }
  }

  /**
   * Создать кастомный шаблон
   */
  createCustomTemplate(
    name: string,
    category: TemplateCategory,
    structure: TemplateStructure,
    variables?: TemplateVariable[],
  ): ExtendedScriptTemplate {
    const template: ExtendedScriptTemplate = {
      id: `custom-${Date.now()}`,
      name,
      category,
      description: `Custom template: ${name}`,
      structure: {
        type: NarrativeType.THREE_ACT,
        acts: [],
        turningPoints: []
      },
      defaultParams: {
        genre: [],
        duration: 0,
        tone: "neutral" as any
      },
      templateStructure: structure,
      variables: variables || [],
      examples: [],
    }

    this.templates.set(template.id, template)
    return template
  }

  /**
   * Интерполировать строку с переменными
   */
  interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match
    })
  }

  // Приватные методы

  private loadBuiltinTemplates(): void {
    // YouTube шаблон
    const youtubeTemplate: ExtendedScriptTemplate = {
      id: "youtube-standard",
      name: "YouTube Standard Video",
      category: TemplateCategory.SOCIAL_MEDIA,
      description: "Standard template for YouTube videos with intro, main content, and outro",
      structure: {
        type: NarrativeType.THREE_ACT,
        acts: [],
        turningPoints: []
      },
      defaultParams: {
        genre: [],
        duration: 0,
        tone: "casual" as any
      },
      templateStructure: {
        sections: [
          {
            id: "intro",
            type: SectionType.INTRO,
            name: "Introduction",
            description: "Hook and channel intro",
            durationPercentage: 10,
            minDuration: 5,
            maxDuration: 30,
            content: [
              {
                type: "visual_description" as any,
                template: "Opening shot: {{opening_visual}}",
                variables: ["opening_visual"],
              },
              {
                type: "narration" as any,
                template: "{{greeting}} Welcome to {{channel_name}}!",
                variables: ["greeting", "channel_name"],
              },
            ],
            optional: false,
          },
          {
            id: "main",
            type: SectionType.MAIN_CONTENT,
            name: "Main Content",
            description: "Primary video content",
            durationPercentage: 80,
            content: [
              {
                type: "narration" as any,
                template: "{{main_content}}",
                variables: ["main_content"],
              },
            ],
            optional: false,
          },
          {
            id: "outro",
            type: SectionType.OUTRO,
            name: "Outro",
            description: "Call to action and closing",
            durationPercentage: 10,
            maxDuration: 20,
            content: [
              {
                type: "narration" as any,
                template: "Thanks for watching! {{cta}}",
                variables: ["cta"],
              },
            ],
            optional: false,
          },
        ],
        flexibility: "flexible",
      },
      variables: [
        {
          name: "opening_visual",
          type: "string",
          description: "Description of the opening shot",
          required: true,
        },
        {
          name: "greeting",
          type: "string",
          description: "Opening greeting",
          required: true,
          defaultValue: "Hey everyone!",
        },
        {
          name: "channel_name",
          type: "string",
          description: "Your channel name",
          required: true,
        },
        {
          name: "main_content",
          type: "string",
          description: "Main content narration",
          required: true,
        },
        {
          name: "cta",
          type: "string",
          description: "Call to action",
          required: true,
          defaultValue: "Like and subscribe for more content!",
        },
      ],
      examples: ["Tech review videos", "Tutorial content", "Vlogs"],
    }
    
    this.templates.set("youtube-standard", youtubeTemplate)

    // Documentary шаблон
    const documentaryTemplate: ExtendedScriptTemplate = {
      id: "documentary-standard",
      name: "Documentary Standard",
      category: TemplateCategory.FILM,
      description: "Classic documentary structure with narration",
      structure: {
        type: NarrativeType.THREE_ACT,
        acts: [],
        turningPoints: []
      },
      defaultParams: {
        genre: [],
        duration: 0,
        tone: "serious" as any
      },
      templateStructure: {
        sections: [
          {
            id: "opening",
            type: SectionType.INTRO,
            name: "Opening Statement",
            description: "Establish the topic and thesis",
            durationPercentage: 5,
            content: [
              {
                type: "narration" as any,
                template: "{{opening_statement}}",
                variables: ["opening_statement"],
              },
            ],
            optional: false,
          },
          {
            id: "context",
            type: SectionType.MAIN_CONTENT,
            name: "Historical Context",
            description: "Background information",
            durationPercentage: 20,
            content: [
              {
                type: "narration" as any,
                template: "{{context_narration}}",
                variables: ["context_narration"],
              },
            ],
            optional: false,
          },
          {
            id: "exploration",
            type: SectionType.MAIN_CONTENT,
            name: "Main Exploration",
            description: "Deep dive into the subject",
            durationPercentage: 60,
            content: [
              {
                type: "narration" as any,
                template: "{{main_narration}}",
                variables: ["main_narration"],
              },
            ],
            optional: false,
          },
          {
            id: "conclusion",
            type: SectionType.RESOLUTION,
            name: "Conclusion",
            description: "Synthesis and closing thoughts",
            durationPercentage: 15,
            content: [
              {
                type: "narration" as any,
                template: "{{conclusion}}",
                variables: ["conclusion"],
              },
            ],
            optional: false,
          },
        ],
        flexibility: "flexible",
      },
      variables: [
        {
          name: "opening_statement",
          type: "string",
          description: "Opening thesis statement",
          required: true,
        },
        {
          name: "context_narration",
          type: "string",
          description: "Historical context narration",
          required: true,
        },
        {
          name: "main_narration",
          type: "string",
          description: "Main exploration narration",
          required: true,
        },
        {
          name: "conclusion",
          type: "string",
          description: "Concluding thoughts",
          required: true,
        },
      ],
      examples: ["Nature documentaries", "Historical documentaries", "Social issue documentaries"],
    }
    
    this.templates.set("documentary-standard", documentaryTemplate)
  }

  private validateVariables(templateVars: TemplateVariable[], providedVars: Record<string, any>): void {
    for (const templateVar of templateVars) {
      if (templateVar.required && !(templateVar.name in providedVars)) {
        if (templateVar.defaultValue !== undefined) {
          providedVars[templateVar.name] = templateVar.defaultValue
        } else {
          throw new Error(`Required variable '${templateVar.name}' not provided`)
        }
      }

      // Валидация типов
      if (templateVar.name in providedVars) {
        const value = providedVars[templateVar.name]
        const valueType = Array.isArray(value) ? "array" : typeof value

        if (valueType !== templateVar.type && value !== null) {
          throw new Error(`Variable '${templateVar.name}' expects type '${templateVar.type}' but got '${valueType}'`)
        }

        // Дополнительная валидация
        if (templateVar.validation) {
          this.validateValue(value, templateVar.validation, templateVar.name)
        }
      }
    }
  }

  private validateValue(value: any, validation: any, varName: string): void {
    if (validation.pattern && typeof value === "string") {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        throw new Error(`Variable '${varName}' does not match pattern: ${validation.pattern}`)
      }
    }

    if (validation.min !== undefined && typeof value === "number") {
      if (value < validation.min) {
        throw new Error(`Variable '${varName}' is below minimum value: ${validation.min}`)
      }
    }

    if (validation.max !== undefined && typeof value === "number") {
      if (value > validation.max) {
        throw new Error(`Variable '${varName}' exceeds maximum value: ${validation.max}`)
      }
    }

    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Variable '${varName}' must be one of: ${validation.enum.join(", ")}`)
    }
  }

  private processSection(section: TemplateSection, variables: Record<string, any>): TemplateSection {
    const processedContent = section.content.map((content) => ({
      ...content,
      template: this.interpolate(content.template, variables),
    }))

    return {
      ...section,
      content: processedContent,
    }
  }
}
