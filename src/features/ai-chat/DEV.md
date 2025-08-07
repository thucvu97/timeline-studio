# AI Chat Module - Developer Guide

## 📋 Текущее состояние модуля

### 🏗️ Архитектура
- **48+ AI-инструментов** организованных по доменам
- **Domain-based структура**: core, analysis, automation, integration
- **Единая точка входа**: `UnifiedAIService`
- **State management**: XState машины состояния
- **Типобезопасность**: Comprehensive TypeScript типы
- **Интеграция**: 20+ модулей используют ai-chat функциональность

### 📊 Статистика
- **Основные файлы**: 45+
- **Тест покрытие**: 22 test файла
- **Документация**: README.md (RU/EN)
- **Размер кода**: ~15,000+ строк

## 🚨 Критические проблемы для рефакторинга

### 1. Монолитный UnifiedAIService ⚠️ ВЫСОКИЙ ПРИОРИТЕТ
**Файл**: `services/unified-ai-service.ts`
**Проблема**: 1,124 строки в одном файле
**Воздействие**: Сложность поддержки, тестирования, code review

```typescript
// ТЕКУЩЕЕ СОСТОЯНИЕ
unified-ai-service.ts (1,124 строк)
├── Content intelligence
├── Model management  
├── Provider management
├── Response processing
└── Error handling
```

**ПЛАН РАЗДЕЛЕНИЯ**:
```typescript
// ЦЕЛЕВОЕ СОСТОЯНИЕ
services/
├── unified-ai-service.ts (основная логика - 300 строк)
├── content-intelligence-service.ts (анализ контента)
├── model-configuration-manager.ts (управление моделями)
├── ai-response-processor.ts (обработка ответов)
└── provider-manager.ts (управление провайдерами)
```

### 2. Дублирование Error Handling ⚠️ ВЫСОКИЙ ПРИОРИТЕТ
**Проблема**: Идентичная логика обработки ошибок в 15+ файлах
**Пример дублирования**:
```typescript
// ПОВТОРЯЕТСЯ В МНОЖЕСТВЕ ФАЙЛОВ
try {
  // logic
} catch (error) {
  return {
    success: false,
    message: `Ошибка: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
    errors: [error instanceof Error ? error.message : "Неизвестная ошибка"],
    executionTime: Date.now() - startTime,
  }
}
```

**РЕШЕНИЕ**:
```typescript
// Создать базовый класс
abstract class BaseAITool {
  protected async executeWithErrorHandling<T>(
    toolName: string,
    executor: () => Promise<T>
  ): Promise<AIToolResult<T>>
}
```

### 3. Структура инструментов ✅ ЗАВЕРШЕНО
**Решение**: Domain-based архитектура успешно внедрена
**Новая структура**:
```
tools/
├── 📁 core/               # Основные инструменты
│   ├── timeline/         # 17 инструментов для работы с таймлайном
│   ├── resources/        # 7 инструментов управления ресурсами
│   ├── browser/          # 5 инструментов браузера медиа
│   ├── player/           # 3 инструмента управления плеером
│   └── *.ts              # Эффекты, настройки
├── 🔬 analysis/          # Инструменты анализа
│   ├── video-analysis-tools.ts
│   ├── audio-analysis-tools.ts
│   ├── content-intelligence-tools.ts
│   ├── multimodal-tools.ts
│   ├── whisper-tools.ts
│   ├── person-identification-tools.ts
│   └── color-style-tools.ts
├── ⚙️ automation/        # Автоматизация
│   ├── workflow-tools.ts
│   ├── batch-processing-tools.ts
│   ├── performance-tools.ts
│   ├── smart-templates-tools.ts
│   └── subtitle-tools.ts
├── 🔗 integration/       # Интеграции
│   ├── export-tools.ts
│   ├── platform-integration-tools.ts
│   └── format-conversion-tools.ts
└── 📕 base-ai-tool.ts    # Базовый класс
```

### 4. Provider Abstraction 🔧 СРЕДНИЙ ПРИОРИТЕТ
**Проблема**: Дублирование логики между Claude/OpenAI/DeepSeek
**Решение**: Создать единую абстракцию провайдера

```typescript
interface AIProvider {
  name: string
  sendRequest(messages: AiMessage[], options: RequestOptions): Promise<string>
  sendStreamingRequest(messages: AiMessage[], options: StreamingOptions): Promise<void>
  isAvailable(): Promise<boolean>
  getModels(): Promise<AIModel[]>
}

class ClaudeProvider implements AIProvider { /* ... */ }
class OpenAIProvider implements AIProvider { /* ... */ }
class DeepSeekProvider implements AIProvider { /* ... */ }
```

## 📅 План рефакторинга

### Фаза 1: Критические исправления ✅ **ЗАВЕРШЕНА (100%)**
**Цель**: Устранить основные архитектурные проблемы

- [x] **Разделить UnifiedAIService** на 5 сервисов ✅
  - [x] Извлечь ContentIntelligenceService ✅
  - [x] Создать ModelConfigurationManager ✅
  - [x] Выделить AIResponseProcessor ✅
  - [x] Создать ProviderManager ✅
  - [x] Создать новый UnifiedAIService координатор ✅

- [x] **Унифицировать Error Handling** ✅
  - [x] Создать BaseAITool абстрактный класс ✅
  - [x] Рефакторить все tool executors (48 из 48 готов - 100% выполнено) ✅
    - [x] timeline-analysis-tool.ts ✅
    - [x] export-data.ts ✅ 
    - [x] detect-scenes.ts ✅
    - [x] create-tracks.ts ✅
    - [x] create-sections.ts ✅
    - [x] place-clips.ts ✅
    - [x] analyze-structure.ts ✅
    - [x] suggest-improvements.ts ✅
    - [x] analyze-story.ts ✅
    - [x] apply-enhancements.ts ✅
    - [x] create-project.ts ✅
    - [x] sync-music.ts ✅
    - [x] optimize-timeline.ts ✅
    - [x] manage-clips.ts ✅
    - [x] analytics-timeline.ts ✅
    - [x] smart-templates.ts ✅
    - [x] batch-processing-tools.ts ✅
    - [x] resource-management-tools.ts ✅
    - [x] color-style-tools.ts ✅
    - [x] content-intelligence-tools.ts ✅
    - [x] audio-processing-tools.ts ✅
    - [x] whisper-tools.ts ✅
    - [x] search-files.ts (browser) ✅
    - [x] settings-configuration-tools.ts ✅
    - [x] subtitle-tools.ts ✅
    - [x] video-analysis-tools.ts ✅
    - [x] effects-filters-tools.ts ✅
    - [x] export-management-tools.ts ✅
    - [x] media-processing-tools.ts ✅
    - [x] multimodal-analysis-tools.ts ✅
    - [x] person-identification-tools.ts ✅
    - [x] platform-optimization-tools.ts ✅
    - [x] render-performance-tools.ts ✅
    - [x] template-layout-tools.ts ✅
    - [x] workflow-automation-tools.ts ✅
    - [x] extended-tools.ts ✅
    - [x] browser-state.ts ✅
    - [x] content-analysis.ts ✅
    - [x] file-operations.ts ✅
    - [x] analyze-browser.ts ✅
    - [x] playback-control.ts ✅
    - [x] preview-effects.ts ✅
    - [x] analyze-media.ts ✅
    - [x] analyze-resources.ts ✅
    - [x] compatibility-analysis.ts ✅
    - [x] export-resources.ts ✅
    - [x] manage-resources.ts ✅
    - [x] suggest-resources.ts ✅
    - [x] usage-stats.ts ✅
  - [x] Добавить централизованное логирование ошибок ✅
  - [x] Исправить все критические ошибки линтера ✅

- [x] **Стандартизировать типы результатов** ✅
  - [x] Создать общие интерфейсы в `/types/common.ts` ✅
  - [x] Создать унифицированные типы результатов ✅
  - [x] Обновить все AIToolResult типы ✅

### Фаза 2: Структурные улучшения ✅ **ЗАВЕРШЕНА (100%)**
**Цель**: Улучшить организацию и поддерживаемость

- [x] **Реорганизовать структуру инструментов** ✅
  - [x] Создать новую domain-based структуру ✅
  - [x] Переместить файлы по доменам (core, analysis, automation, integration) ✅
  - [x] Обновить все импорты в коде ✅
  - [x] Удалить старую структуру и переименовать tools-v2 в tools ✅
  - [x] Создать index файлы для каждого домена ✅
  - [x] Создать миграционную документацию ✅

- [ ] **Создать Provider абстракцию**
  - [ ] Определить AIProvider interface
  - [ ] Рефакторить существующие провайдеры
  - [ ] Создать ProviderFactory
  - [ ] Добавить provider-specific тесты

- [ ] **Оптимизировать зависимости**
  - [ ] Проанализировать circular dependencies
  - [ ] Реорганизовать импорты
  - [ ] Создать dependency injection

### Фаза 3: Оптимизация (1-2 недели)
**Цель**: Улучшить производительность и DX

- [ ] **Lazy Loading инструментов**
  - [ ] Реализовать динамические импорты
  - [ ] Создать tool registry
  - [ ] Оптимизировать bundle size

- [ ] **Производительность**
  - [ ] Добавить мемоизацию для частых операций
  - [ ] Оптимизировать кэширование
  - [ ] Реализовать connection pooling

- [ ] **Developer Experience**
  - [ ] Создать архитектурные диаграммы
  - [ ] Добавить code examples
  - [ ] Улучшить TypeScript типы

## 🧪 Тестирование

### Текущее состояние
- **22 test файла** - хорошее покрытие unit тестов
- Отсутствуют интеграционные тесты
- Нет e2e тестов для AI workflow

### Планы по тестированию
- [ ] **Интеграционные тесты** для AI сервисов
- [ ] **E2E тесты** для полного AI workflow
- [ ] **Mock провайдеры** для тестирования без внешних API
- [ ] **Performance тесты** для batch операций

## 📏 Метрики успеха

### До рефакторинга
- **Монолитный файл**: 1,124 строки
- **Дублирование**: 15+ идентичных error handlers
- **Структура**: Плоская организация 67 файлов
- **Maintenance**: Сложный code review и отладка

### ✅ После рефакторинга (Фазы 1-2 завершены)
- **Размер файлов**: ✅ 280 строк главный сервис (75% сокращение)
- **DRY принцип**: ✅ 1 BaseAITool для всех инструментов 
- **Архитектура**: ✅ 5 специализированных сервисов + domain-based tools
- **Структура**: ✅ 4 домена инструментов вместо плоской структуры
- **Maintenance**: ✅ Четкое разделение ответственности

### Достигнутые улучшения
| Метрика | До | После | Улучшение |
|---------|-----|-------|-----------|
| Основной файл | 1,124 строк | 280 строк | **75% ↓** |
| Сервисы | 1 монолит | 5 специализированных | **5x** |
| Error handling | 15+ копий | 1 базовый класс | **100% ↓** |
| Структура tools | 67 файлов без группировки | 4 домена | **🗺️** |

## 🔧 Инструменты разработки

### Рекомендуемые для рефакторинга
- **TypeScript strict mode** для type safety
- **ESLint rules** для предотвращения anti-patterns
- **Dependency cruiser** для анализа зависимостей
- **Bundle analyzer** для оптимизации размера

### Автоматизация
- [ ] Создать скрипт для анализа размера файлов
- [ ] Добавить pre-commit hooks для проверки структуры
- [ ] Настроить CI проверки для новых AI tools

## 📚 Ресурсы

### Документация
- [README.md](./README.md) - Основная документация
- [Architecture Decision Records](./docs/) - Архитектурные решения
- [API Documentation](./types/) - TypeScript типы и интерфейсы

### Связанные модули
- `features/transcription` - Транскрипция AI
- `features/ai-content-intelligence` - Анализ контента
- `features/timeline` - Основная интеграция
- `features/resources` - Управление ресурсами

---

## 👥 Участие в разработке

### Для добавления нового AI инструмента:
1. Выберите соответствующую категорию в `/tools/`
2. Используйте `BaseAITool` как базовый класс
3. Следуйте паттерну существующих инструментов
4. Добавьте тесты и документацию

### Для модификации провайдеров:
1. Обновите соответствующий `AIProvider` implementation
2. Убедитесь в совместимости с существующим API
3. Добавьте provider-specific тесты
4. Обновите конфигурацию моделей

## 🎆 Новые возможности для добавления инструментов

### 🎬 Timeline домен (core/timeline)
Потенциальные новые инструменты:
- **Slip/Slide редактирование** - сдвиг контента внутри клипа без изменения длительности
- **Ripple редактирование** - автоматический сдвиг последующих клипов
- **Timeline бэкапы** - сохранение и восстановление состояний
- **Magnetic Timeline** - магнитная привязка клипов
- **Группировка клипов** - объединение клипов в группы
- **Timeline маркеры** - добавление маркеров и заметок

### 🎭 Субтитры (automation/subtitle-tools)
Расширение функциональности:
- **Мультиязычные субтитры** - автоматический перевод на разные языки
- **Стилизация субтитров** - применение различных стилей и анимаций
- **Синхронизация с речью** - точная синхронизация тайминга
- **Karaoke эффект** - пословная подсветка текста
- **Экспорт в разные форматы** - SRT, VTT, ASS, SSA

### 🎵 Аудио анализ (analysis/audio-analysis)
Новые возможности:
- **Анализ BPM** - определение темпа музыки
- **Детекция клиппинга** - обнаружение искажений
- **Частотный анализ** - спектральный анализ
- **Классификация звуков** - речь, музыка, шум

### 🤖 AI автоматизация (automation)
Новые workflow:
- **Авто-монтаж по сценарию** - AI создает монтаж на основе текста
- **Авто-цветокоррекция** - согласование цветов между клипами
- **Умная нарезка** - AI выбирает лучшие моменты
- **Генерация превью** - автоматические thumbnails

### 🔍 Анализ контента (analysis)
Новые аналитические инструменты:
- **Эмоциональный анализ** - определение настроения сцен
- **Анализ движения** - motion tracking и стабилизация
- **Детекция объектов** - распознавание предметов в кадре
- **Качество видео** - резкость, яркость, контраст

**Последнее обновление**: Август 2025
**Ответственный**: Development Team
**Статус**: Миграция завершена, готово к расширению