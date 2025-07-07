# Переводы для Smart Montage Planner

## Описание
Добавить переводы интерфейса для модуля Smart Montage Planner на русский и английский языки (остальные языки позже).

## Статус
- **Статус**: В процессе
- **Приоритет**: Средний
- **Готовность**: 10%
- **Назначено**: Claude AI

## Требования

### Языки для реализации
Все 13 поддерживаемых языков проекта:

1. **Английский** (en.json) - базовый язык
2. **Русский** (ru.json) - полный перевод
3. **Испанский** (es.json) - полный перевод
4. **Французский** (fr.json) - полный перевод  
5. **Немецкий** (de.json) - полный перевод
6. **Португальский** (pt.json) - полный перевод
7. **Китайский** (zh.json) - полный перевод
8. **Японский** (ja.json) - полный перевод
9. **Корейский** (ko.json) - полный перевод
10. **Турецкий** (tr.json) - полный перевод
11. **Тайский** (th.json) - полный перевод
12. **Итальянский** (it.json) - полный перевод
13. **Хинди** (hi.json) - полный перевод

### Файлы для изменения
Секция `montage-planner` должна быть добавлена во все файлы переводов:

- `/src/i18n/locales/en.json` - английский (базовый)
- `/src/i18n/locales/ru.json` - русский  
- `/src/i18n/locales/es.json` - испанский
- `/src/i18n/locales/fr.json` - французский
- `/src/i18n/locales/de.json` - немецкий
- `/src/i18n/locales/pt.json` - португальский
- `/src/i18n/locales/zh.json` - китайский (упрощенный)
- `/src/i18n/locales/ja.json` - японский
- `/src/i18n/locales/ko.json` - корейский
- `/src/i18n/locales/tr.json` - турецкий
- `/src/i18n/locales/th.json` - тайский
- `/src/i18n/locales/it.json` - итальянский
- `/src/i18n/locales/hi.json` - хинди

### Структура переводов

#### Основные секции
```json
"montage-planner": {
  "title": "Smart Montage Planner",
  "description": "AI-powered automatic video montage creation",
  
  "navigation": {
    "dashboard": "Dashboard",
    "analysis": "Analysis", 
    "planning": "Planning",
    "timeline": "Timeline Integration"
  },
  
  "analysis": {
    "title": "Video Analysis",
    "addVideos": "Add Videos",
    "analyzeVideos": "Analyze Videos",
    "analyzing": "Analyzing...",
    "analysisComplete": "Analysis Complete",
    "quality": "Quality",
    "moments": "Key Moments",
    "composition": "Composition",
    "audio": "Audio Analysis"
  },
  
  "planning": {
    "title": "Montage Planning",
    "generatePlan": "Generate Plan",
    "generating": "Generating...",
    "planGenerated": "Plan Generated",
    "preferences": "Preferences",
    "style": "Style",
    "duration": "Target Duration",
    "platform": "Target Platform"
  },
  
  "styles": {
    "dynamicAction": "Dynamic Action",
    "musicVideo": "Music Video", 
    "socialMedia": "Social Media",
    "cinematicDrama": "Cinematic Drama",
    "documentary": "Documentary"
  },
  
  "timeline": {
    "title": "Timeline Integration",
    "applyToTimeline": "Apply to Timeline",
    "createSection": "Create New Section",
    "useExistingTracks": "Use Existing Tracks",
    "timeOffset": "Time Offset",
    "applied": "Applied to Timeline",
    "markers": "Create Markers"
  },
  
  "quality": {
    "excellent": "Excellent",
    "good": "Good", 
    "fair": "Fair",
    "poor": "Poor",
    "sharpness": "Sharpness",
    "stability": "Stability",
    "exposure": "Exposure",
    "composition": "Composition"
  },
  
  "moments": {
    "action": "Action",
    "drama": "Drama",
    "comedy": "Comedy",
    "transition": "Transition",
    "opening": "Opening", 
    "closing": "Closing",
    "highlight": "Highlight"
  },
  
  "emotions": {
    "happy": "Happy",
    "sad": "Sad",
    "energetic": "Energetic", 
    "calm": "Calm",
    "tense": "Tense",
    "excited": "Excited",
    "neutral": "Neutral"
  },
  
  "errors": {
    "noVideos": "No videos added",
    "analysisError": "Analysis failed",
    "planGenerationError": "Plan generation failed",
    "timelineError": "Timeline integration failed",
    "missingMediaFiles": "Missing media files"
  },
  
  "messages": {
    "addVideosHint": "Add videos to start analysis",
    "analysisInProgress": "Analysis in progress, please wait...",
    "planReady": "Montage plan is ready to apply",
    "timelineIntegrated": "Plan successfully applied to timeline"
  }
}
```

## Детали реализации

### Интеграция с существующими переводами
- Использовать существующий стиль ключей (camelCase)
- Следовать структуре других модулей (timeline, templates, export)
- Переиспользовать общие термины из секции `common`

### Компоненты требующие перевода
1. **Dashboard** - основная панель управления
2. **Analysis components** - компоненты анализа видео
3. **Planning components** - компоненты планирования монтажа 
4. **Timeline integration** - интеграция с Timeline
5. **Quality meter** - индикатор качества
6. **Moment categories** - категории моментов
7. **Style selector** - выбор стиля монтажа
8. **Error messages** - сообщения об ошибках
9. **Status messages** - статусные сообщения

### Специфические термины
- **Smart Montage** - Умный Монтаж
- **Key Moments** - Ключевые Моменты  
- **Composition Analysis** - Анализ Композиции
- **Genetic Algorithm** - Генетический Алгоритм
- **Timeline Integration** - Интеграция с Timeline
- **YOLO Detection** - YOLO Детекция
- **Audio Analysis** - Аудио Анализ

## Критерии готовности
- [x] **Smart Montage Planner 100% завершен** - все компоненты готовы к переводу
- [x] **Все тесты исправлены** - 91 тест проходит успешно
- [ ] Английские переводы добавлены в en.json
- [ ] Русские переводы добавлены в ru.json  
- [ ] Переводы на все 13 языков добавлены
- [ ] Все компоненты используют переводы через хуки i18n
- [ ] Переводы протестированы в UI
- [ ] Нет хардкод строк в компонентах
- [ ] Переводы соответствуют стилю проекта

## Зависимости
- Завершение разработки UI компонентов Smart Montage Planner
- Интеграция с системой i18n проекта

## Последующие задачи
- Добавление переводов на остальные 8 языков проекта
- Локализация терминологии для разных регионов
- Перевод документации модуля

---

*Создано: 7 января 2025*
*Обновлено: 7 января 2025*