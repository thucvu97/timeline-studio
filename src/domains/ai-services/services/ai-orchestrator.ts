/**
 * AI Services Orchestrator
 * 
 * Координирует работу AI сервисов и публикует события
 */

import { createActor, type ActorRefFrom } from 'xstate'
import { 
  eventBus, 
  DOMAIN_EVENTS,
  type ChatMessageSentEvent,
  type ContentAnalysisStartedEvent,
  type MontagePlanGeneratedEvent 
} from '@domains/shared/events'
import { chatMachine, type ChatMachine } from '../machines/chat-machine'
import { aiIntelligenceMachine, type AIIntelligenceMachine } from '../machines/ai-intelligence-machine'
import { montagePlannerMachine, type MontagePlannerMachine } from '../machines/montage-planner-machine'

export class AIServicesOrchestrator {
  private static instance: AIServicesOrchestrator | null = null
  
  private chatActor: ActorRefFrom<ChatMachine>
  private intelligenceActor: ActorRefFrom<AIIntelligenceMachine>
  private montagePlannerActor: ActorRefFrom<MontagePlannerMachine>

  private constructor() {
    // Создаем акторы
    this.chatActor = createActor(chatMachine)
    this.intelligenceActor = createActor(aiIntelligenceMachine)
    this.montagePlannerActor = createActor(montagePlannerMachine)

    // Запускаем акторы
    this.chatActor.start()
    this.intelligenceActor.start()
    this.montagePlannerActor.start()

    // Настраиваем обработчики событий
    this.setupEventHandlers()
    
    // Настраиваем публикацию событий из машин
    this.setupEventPublishing()
  }

  static getInstance(): AIServicesOrchestrator {
    if (!AIServicesOrchestrator.instance) {
      AIServicesOrchestrator.instance = new AIServicesOrchestrator()
    }
    return AIServicesOrchestrator.instance
  }

  /**
   * Настройка обработчиков входящих событий
   */
  private setupEventHandlers() {
    // Слушаем события из других доменов
    eventBus.subscribe(
      async (event) => {
        console.log('[AI Orchestrator] Received event:', event.type)
        
        switch (event.type) {
          case DOMAIN_EVENTS.MEDIA.FILES_IMPORTED:
            // Запускаем анализ для новых файлов
            const files = event.payload as any
            if (files?.length > 0) {
              await this.startContentAnalysis(files)
            }
            break
            
          case DOMAIN_EVENTS.VIDEO.TIMELINE_CREATED:
            // Можем предложить AI оптимизацию для нового таймлайна
            console.log('New timeline created, AI can suggest improvements')
            break
        }
      },
      {
        filter: {
          // Слушаем события из media и video доменов
          source: ['media-management', 'video-editing']
        }
      }
    )
  }

  /**
   * Настройка публикации событий из машин
   */
  private setupEventPublishing() {
    // Подписываемся на изменения состояния chat машины
    this.chatActor.subscribe((snapshot) => {
      const { context } = snapshot
      
      // Публикуем событие при отправке сообщения
      if (snapshot.matches('processing') && context.messages.length > 0) {
        const lastMessage = context.messages[context.messages.length - 1]
        if (lastMessage.role === 'user') {
          eventBus.publish<ChatMessageSentEvent>(
            DOMAIN_EVENTS.AI_SERVICES.CHAT_MESSAGE_SENT,
            'ai-services',
            {
              sessionId: context.currentSessionId || 'default',
              message: {
                id: lastMessage.id,
                content: lastMessage.content,
                role: lastMessage.role
              }
            }
          )
        }
      }
    })

    // Подписываемся на изменения montage planner
    this.montagePlannerActor.subscribe((snapshot) => {
      if (snapshot.matches('completed') && snapshot.context.plans.length > 0) {
        const lastPlan = snapshot.context.plans[snapshot.context.plans.length - 1]
        
        eventBus.publish<MontagePlanGeneratedEvent>(
          DOMAIN_EVENTS.AI_SERVICES.MONTAGE_PLAN_GENERATED,
          'ai-services',
          {
            planId: lastPlan.id,
            plan: lastPlan,
            mediaFiles: snapshot.context.analysis?.mediaFiles || [],
            style: lastPlan.style,
            duration: lastPlan.sequences.reduce((sum, seq) => sum + seq.duration, 0)
          }
        )
      }
    })
  }

  /**
   * Запуск анализа контента
   */
  async startContentAnalysis(files: any[]) {
    const analysisId = `analysis-${Date.now()}`
    
    // Публикуем событие о начале анализа
    await eventBus.publish<ContentAnalysisStartedEvent>(
      DOMAIN_EVENTS.AI_SERVICES.CONTENT_ANALYSIS_STARTED,
      'ai-services',
      {
        analysisId,
        mediaFiles: files,
        analysisTypes: ['scene', 'object', 'emotion', 'transcript']
      }
    )

    // Запускаем анализ через intelligence машину
    this.intelligenceActor.send({
      type: 'ANALYZE_CONTENT',
      mediaFiles: files
    })
  }

  /**
   * Получить акторы для прямого взаимодействия
   */
  getActors() {
    return {
      chat: this.chatActor,
      intelligence: this.intelligenceActor,
      montagePlanner: this.montagePlannerActor
    }
  }

  /**
   * Остановить оркестратор
   */
  stop() {
    this.chatActor.stop()
    this.intelligenceActor.stop()
    this.montagePlannerActor.stop()
    AIServicesOrchestrator.instance = null
  }
}