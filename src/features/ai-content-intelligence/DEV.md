# AI Content Intelligence - План рефакторинга

**Статус**: 🚀 Phase 1-2 завершены, переходим к Phase 3  
**Дата создания**: 2025-01-07  
**Приоритет**: Высокий  
**Последнее обновление**: 2025-01-07

## 🎯 Цель рефакторинга

Устранить критическое дублирование функциональности (40-50% кода) между модулями `ai-content-intelligence` и `ai-chat`, решить проблемы циклических зависимостей и создать четкую архитектурную структуру.

## 🔍 Выявленные проблемы

### Критические проблемы:
- [x] **Дублирование AI провайдеров** - Claude, OpenAI, DeepSeek, Ollama в обоих модулях ✅ РЕШЕНО
- [x] **Дублирование анализа медиа** - FFmpeg анализ, детекция сцен, качество видео повторяются ✅ РЕШЕНО
- [x] **Дублирование типов данных** - `UnifiedContentAnalysis`, `SceneAnalysis`, `QualityMetrics` почти идентичны ✅ РЕШЕНО
- [ ] **Циклические зависимости** - ai-content-intelligence импортирует из ai-chat 🔄 В ПРОЦЕССЕ
- [ ] **Смешение ответственности** - UI, движки анализа и провайдеры в одном модуле 📋 СЛЕДУЮЩИЙ

## 🚀 План рефакторинга

### Phase 1: Создание общего AI слоя ✅ ЗАВЕРШЕНО
- [x] **1.1** Создать структуру `src/shared/services/ai/` ✅ ЗАВЕРШЕНО
  - [x] `providers/` - AI провайдеры (Claude, OpenAI, DeepSeek, Ollama)
  - [x] `analysis/` - Анализ медиа контента
  - [x] `orchestration/` - Координация AI операций
- [x] **1.2** Создать интерфейсы для dependency injection ✅ ЗАВЕРШЕНО
  - [x] `AIProviderFactory` - фабрика AI провайдеров
  - [x] `MediaAnalysisFactory` - фабрика сервисов анализа
  - [x] `IContentAnalysisService` - интерфейс анализа контента
- [x] **1.3** Перенести AI провайдеры из ai-chat в shared ✅ ЗАВЕРШЕНО
  - [x] `claude-service.ts` → `src/shared/services/ai/providers/claude/`
  - [x] `open-ai-service.ts` → `src/shared/services/ai/providers/openai/`
  - [x] `deepseek-service.ts` → `src/shared/services/ai/providers/deepseek/`
  - [x] `ollama-service.ts` → `src/shared/services/ai/providers/ollama/`

### Phase 2: Унификация типов данных ✅ ЗАВЕРШЕНО
- [x] **2.1** Создать единые типы в `src/shared/services/ai/` ✅ ЗАВЕРШЕНО
  - [x] `providers/interfaces.ts` - AI провайдеры и конфигурации
  - [x] `analysis/interfaces.ts` - Единые типы анализа контента
  - [x] `orchestration/interfaces.ts` - Типы для автоматизации
- [x] **2.2** Объединить дублирующиеся типы ✅ ЗАВЕРШЕНО
  - [x] Создать `UnifiedAIService` с лучшими возможностями из обоих модулей
  - [x] Унифицировать интерфейсы анализа медиа
  - [x] Создать единые `ModelConfig` и `AiRequestOptions`
- [x] **2.3** Создать DI контейнер и фабрики ✅ ЗАВЕРШЕНО
  - [x] `AIDIContainer` - Dependency Injection контейнер
  - [x] `AIProviderFactory` - фабрика провайдеров
  - [x] `MediaAnalysisFactory` - фабрика анализа
  - [x] `EnhancedUnifiedAIService` - улучшенный сервис с fallback и кэшированием

### Phase 3: Рефакторинг ai-chat модуля
- [ ] **3.1** Удалить дублирующиеся AI провайдеры
  - [ ] Удалить локальные файлы провайдеров
  - [ ] Обновить `unified-ai-service.ts` для использования shared провайдеров
- [ ] **3.2** Рефакторить сервисы анализа
  - [ ] Вынести `ffmpeg-analysis-service.ts` в shared
  - [ ] Упростить `content-intelligence-service.ts`
  - [ ] Обновить `multimodal-analysis-service.ts`
- [ ] **3.3** Обновить инструменты (tools/)
  - [ ] Обновить импорты в tools для использования shared сервисов
  - [ ] Убедиться что все 68+ инструментов работают корректно

### Phase 4: Рефакторинг ai-content-intelligence модуля
- [ ] **4.1** Удалить зависимости от ai-chat
  - [ ] Заменить прямые импорты на shared интерфейсы
  - [ ] Обновить `scene-analysis-engine.ts`
  - [ ] Обновить `script-generation-engine.ts`
- [ ] **4.2** Рефакторить движки для использования DI
  - [ ] `SceneAnalysisEngine` → использовать `MediaAnalysisFactory`
  - [ ] `ScriptGenerationEngine` → использовать `AIProviderFactory`
  - [ ] `MultiPlatformEngine` → использовать shared типы
- [ ] **4.3** Упростить оркестратор
  - [ ] Убрать дублирующуюся логику из `AIIntelligenceOrchestrator`
  - [ ] Сосредоточить на координации движков

### Phase 5: Создание фабрик и DI контейнера
- [ ] **5.1** Создать фабрики сервисов
  - [ ] `createAIProviderFactory()` - создание AI провайдеров
  - [ ] `createMediaAnalysisFactory()` - создание сервисов анализа
  - [ ] `createOrchestrationFactory()` - создание координаторов
- [ ] **5.2** Настроить dependency injection
  - [ ] Создать DI контейнер для Timeline Studio
  - [ ] Настроить инъекцию зависимостей в модулях
- [ ] **5.3** Обновить providers и контексты
  - [ ] Интегрировать DI в React providers
  - [ ] Обновить хуки для использования новой архитектуры

### Phase 6: Обновление тестов
- [ ] **6.1** Обновить mock'и для shared сервисов
  - [ ] Создать mock'и для AI провайдеров в shared
  - [ ] Обновить тесты ai-chat модуля
  - [ ] Обновить тесты ai-content-intelligence модуля
- [ ] **6.2** Создать интеграционные тесты
  - [ ] Тесты для DI контейнера
  - [ ] Тесты для взаимодействия модулей через shared слой
- [ ] **6.3** Запустить полный набор тестов
  - [ ] Убедиться что все существующие тесты проходят
  - [ ] Проверить отсутствие регрессий

### Phase 7: Документация и финализация
- [ ] **7.1** Обновить документацию
  - [ ] Обновить README.md для нового API
  - [ ] Создать migration guide для разработчиков
  - [ ] Документировать новую архитектуру
- [ ] **7.2** Очистка кода
  - [ ] Удалить неиспользуемые файлы и типы
  - [ ] Проверить отсутствие мертвого кода
  - [ ] Оптимизировать импорты
- [ ] **7.3** Валидация результата
  - [ ] Проверить что дублирование устранено
  - [ ] Убедиться в отсутствии циклических зависимостей
  - [ ] Проверить работу всей функциональности

## 📊 Метрики успеха

### До рефакторинга:
- Дублирование кода: ~40-50%
- Циклические зависимости: Да
- AI провайдеры дублированы: 4 в каждом модуле
- Типы анализа дублированы: ~10 типов

### После рефакторинга:
- [ ] Дублирование кода: <5%
- [ ] Циклические зависимости: Нет
- [ ] AI провайдеры: В shared (4 общих)
- [ ] Типы анализа: В shared (унифицированы)
- [ ] Четкое разделение ответственности модулей
- [ ] Все тесты проходят (462+ тестов)

## ⚠️ Риски и митигация

### Высокие риски:
- **Большой объем изменений**: ~200+ файлов
  - *Митигация*: Поэтапное выполнение, тщательное тестирование
- **Временная нестабильность**: во время рефакторинга
  - *Митигация*: Feature flags, откат возможен
- **Обновление всех тестов**: mock'и нужно переписать
  - *Митигация*: Автоматизация через скрипты

### Средние риски:
- **Изменение API**: возможны breaking changes
  - *Митигация*: Migration guide, обратная совместимость где возможно
- **Performance регрессии**: новая архитектура
  - *Митигация*: Benchmarking, профилирование

## 🛠️ Инструменты и скрипты

### Полезные команды:
```bash
# Поиск дублированного кода
grep -r "UnifiedContentAnalysis" src/features/ai-* --include="*.ts"

# Проверка циклических зависимостей  
madge --circular src/features/ai-content-intelligence/

# Запуск тестов
npm run test src/features/ai-chat/
npm run test src/features/ai-content-intelligence/

# Анализ импортов
find src/features/ai-content-intelligence -name "*.ts" -exec grep -l "from.*ai-chat" {} \;
```

### Скрипты рефакторинга:
```bash
# Массовая замена импортов (создать когда будет готов shared слой)
# find src/features/ai-chat -name "*.ts" -exec sed -i 's|@/features/ai-chat/services/claude-service|@/shared/services/ai/providers/claude|g' {} \;
```

---

## ✅ Выполненная работа (Phase 1-2)

### Созданная архитектура:
1. **Shared AI Services** (`src/shared/services/ai/`):
   - `providers/` - Все 4 AI провайдера (Claude, OpenAI, DeepSeek, Ollama)
   - `analysis/` - FFmpeg, Vision, Content анализ
   - `orchestration/` - Интерфейсы для координации
   - `di-container.ts` - Dependency Injection контейнер
   - `unified-ai-service.ts` - Enhanced сервис с fallback и кэшированием

2. **Унифицированные интерфейсы**:
   - `IAIProvider` - единый интерфейс для всех AI провайдеров
   - `IFFmpegAnalysisService` - анализ медиа через FFmpeg
   - `IVisionService` - компьютерное зрение
   - `IContentAnalysisService` - комплексный анализ контента

3. **DI паттерн и фабрики**:
   - `AIDIContainer` - центральный контейнер зависимостей
   - `AIProviderFactory` - фабрика AI провайдеров
   - `MediaAnalysisFactory` - фабрика сервисов анализа

### Удаленное дублирование:
- AI провайдеры из ai-chat полностью перенесены в shared
- Типы данных унифицированы через interfaces
- Создан единый EnhancedUnifiedAIService с лучшими возможностями

**Следующий шаг**: Phase 3 - рефакторинг ai-chat модуля для использования shared сервисов