# Автозагрузка пользовательских данных

Timeline Studio автоматически загружает пользовательские данные из папок `public/` при запуске приложения.

## Структура папок

Создайте следующие папки в корне проекта для автоматической загрузки ваших данных:

```
public/
├── effects/           # Пользовательские эффекты
├── transitions/       # Пользовательские переходы
├── filters/           # Пользовательские фильтры
├── subtitles/         # Пользовательские стили субтитров
├── templates/         # Пользовательские многокамерные шаблоны
└── style-templates/   # Пользовательские стилистические шаблоны
```

## Поддерживаемые форматы

### Текущая поддержка
- **JSON файлы** - основной формат для всех типов данных

### Планируется в будущем
- **Effects**: .cube, .3dl, .lut, .preset
- **Transitions**: .preset, .transition
- **Filters**: .cube, .3dl, .lut, .preset
- **Subtitles**: .css, .srt, .vtt, .ass
- **Templates**: .bundle (Filmora), .cct (CapCut), .zip, .mogrt (Adobe)
- **Style Templates**: .bundle (Filmora), .zip, .css, .aep (After Effects)

## Примеры JSON структур

### Effects (public/effects/my-effects.json)
```json
[
  {
    "id": "user-glow-effect",
    "name": "Custom Glow",
    "type": "glow",
    "category": "user-custom",
    "complexity": "intermediate",
    "tags": ["glow", "light", "custom"],
    "description": {
      "ru": "Пользовательский эффект свечения",
      "en": "Custom glow effect"
    },
    "ffmpegCommand": "glow=intensity=0.8",
    "cssFilter": "drop-shadow(0 0 10px rgba(255,255,255,0.8))",
    "params": {},
    "previewPath": "/t1.mp4",
    "labels": {
      "ru": "Свечение",
      "en": "Glow"
    }
  }
]
```

### Transitions (public/transitions/my-transitions.json)
```json
[
  {
    "id": "user-slide-transition",
    "type": "slide",
    "labels": {
      "ru": "Пользовательский слайд",
      "en": "Custom Slide"
    },
    "description": {
      "ru": "Пользовательский переход слайдом",
      "en": "Custom slide transition"
    },
    "category": "user-custom",
    "complexity": "beginner",
    "tags": ["slide", "custom"],
    "duration": { "min": 0.5, "max": 3.0, "default": 1.0 },
    "parameters": {},
    "ffmpegTemplate": "slide=direction=right"
  }
]
```

### Filters (public/filters/my-filters.json)
```json
[
  {
    "id": "user-vintage-filter",
    "name": "Custom Vintage",
    "category": "user-custom",
    "complexity": "intermediate",
    "tags": ["vintage", "retro", "custom"],
    "description": {
      "ru": "Пользовательский винтажный фильтр",
      "en": "Custom vintage filter"
    },
    "cssFilter": "sepia(0.8) contrast(1.2) brightness(0.9)",
    "ffmpegFilter": "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
    "previewPath": "/t1.mp4",
    "labels": {
      "ru": "Винтаж",
      "en": "Vintage"
    }
  }
]
```

### Subtitles (public/subtitles/my-styles.json)
```json
[
  {
    "id": "user-neon-style",
    "name": "Neon Style",
    "category": "user-custom",
    "complexity": "advanced",
    "tags": ["neon", "glow", "custom"],
    "description": {
      "ru": "Пользовательский неоновый стиль",
      "en": "Custom neon style"
    },
    "cssStyles": {
      "color": "#00ffff",
      "textShadow": "0 0 10px #00ffff, 0 0 20px #00ffff",
      "fontFamily": "Arial Black",
      "fontSize": "24px",
      "fontWeight": "bold"
    },
    "labels": {
      "ru": "Неон",
      "en": "Neon"
    }
  }
]
```

## Как это работает

1. **При запуске приложения** Timeline Studio автоматически сканирует папки `public/`
2. **Находит JSON файлы** в соответствующих папках
3. **Загружает и валидирует** содержимое файлов
4. **Добавляет данные** к существующим в приложении
5. **Логирует результат** в консоль разработчика

## Отладка

Откройте консоль разработчика (F12) для просмотра логов автозагрузки:

```
Начинаем автозагрузку пользовательских данных...
Найдено 2 JSON файлов в public/effects: [...]
Загружаем 5 пользовательских файлов...
Успешно загружено 5 из 5 файлов
Автозагрузка пользовательских данных завершена
```

## Ограничения

- Поддерживаются только JSON файлы (пока)
- Файлы должны соответствовать структуре данных Timeline Studio
- Неверные файлы игнорируются с логированием ошибки
- Автозагрузка происходит только при запуске приложения

## Будущие улучшения

- Поддержка форматов других редакторов (Filmora, CapCut, Adobe)
- Горячая перезагрузка при изменении файлов
- Валидация и конвертация данных
- Пользовательский интерфейс для управления загруженными данными
