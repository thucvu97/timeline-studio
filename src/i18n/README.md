# Модуль интернационализации (i18n)

Этот модуль отвечает за поддержку многоязычности в Timeline Studio, предоставляя переводы интерфейса на 15 языков.

## 🌍 Поддерживаемые языки

Timeline Studio поддерживает следующие языки:

| Код | Язык | Нативное название | Локаль | Статус |
|-----|------|-------------------|--------|--------|
| `en` | Английский | English | en-US | ✅ Базовый |
| `ru` | Русский | Русский | ru-RU | ✅ Полный |
| `es` | Испанский | Español | es-ES | ✅ Полный |
| `fr` | Французский | Français | fr-FR | ✅ Полный |
| `de` | Немецкий | Deutsch | de-DE | ✅ Полный |
| `pt` | Португальский | Português | pt-PT | ✅ Полный |
| `zh` | Китайский | 中文 | zh-CN | ✅ Полный |
| `ja` | Японский | 日本語 | ja-JP | ✅ Полный |
| `ko` | Корейский | 한국어 | ko-KR | ✅ Полный |
| `tr` | Турецкий | Türkçe | tr-TR | ✅ Полный |
| `th` | Тайский | ไทย | th-TH | ✅ Полный |
| `it` | Итальянский | Italiano | it-IT | ✅ Полный |
| `hi` | Хинди | हिन्दी | hi-IN | ✅ Полный |
| `ar` | Арабский | العربية | ar-SA | ✅ Полный (RTL) |
| `fa` | Персидский | فارسی | fa-IR | ✅ Полный (RTL) |

## 📁 Структура модуля

```
src/i18n/
├── __tests__/                  # Тесты модуля
│   ├── constants.test.ts       # Тесты констант и утилит
│   ├── i18n-provider.test.tsx  # Тесты React провайдера
│   └── use-language.test.ts    # Тесты хука языка
├── hooks/                      # React хуки
│   └── use-language.ts         # Хук для смены языка
├── locales/                    # Файлы переводов
│   ├── en.json                 # Английский (базовый)
│   ├── ru.json                 # Русский
│   ├── es.json                 # Испанский
│   ├── fr.json                 # Французский
│   ├── de.json                 # Немецкий
│   ├── pt.json                 # Португальский
│   ├── zh.json                 # Китайский
│   ├── ja.json                 # Японский
│   ├── ko.json                 # Корейский
│   ├── tr.json                 # Турецкий
│   ├── th.json                 # Тайский
│   ├── it.json                 # Итальянский
│   ├── hi.json                 # Хинди
│   ├── ar.json                 # Арабский (RTL)
│   └── fa.json                 # Персидский/Фарси (RTL)
├── services/                   # Сервисы
│   └── i18n-provider.tsx      # React провайдер i18n
├── constants.ts               # Константы и утилиты
├── index.ts                   # Главный файл модуля
└── README.md                  # Этот файл
```

## 🔧 Основные файлы

### `constants.ts`
Содержит основные константы и утилиты для работы с языками:

- `LanguageCode` - типы кодов языков
- `SUPPORTED_LANGUAGES` - массив поддерживаемых языков
- `DEFAULT_LANGUAGE` - язык по умолчанию (`en`)
- `LANGUAGE_LOCALES` - соответствие кодов языков и локалей
- `getLocaleByLanguage()` - получение локали по коду языка
- `isSupportedLanguage()` - проверка поддержки языка
- `formatDateByLanguage()` - форматирование дат с учетом языка
- `RTL_LANGUAGES` - массив языков с направлением справа налево
- `isRTLLanguage()` - проверка, является ли язык RTL
- `getTextDirection()` - получение направления текста (ltr/rtl)

### `index.ts`
Главный файл модуля, инициализирует i18next с:
- Импортом всех файлов переводов
- Настройкой определения языка браузера
- Сохранением выбранного языка в localStorage
- Обработкой ошибок инициализации

### `services/i18n-provider.tsx`
React провайдер, который:
- Инициализирует i18n при загрузке приложения
- Показывает индикатор загрузки переводов
- Предоставляет контекст i18n для всего приложения

### `hooks/use-language.ts`
React хук для работы с языками:
- `currentLanguage` - текущий выбранный язык
- `changeLanguage(lang)` - смена языка
- `isLanguageSupported(lang)` - проверка поддержки языка

## 💾 Хранение настроек

Выбранный язык сохраняется в:
- **localStorage** - ключ `app-language`
- **i18next** - автоматическое определение при загрузке

Приоритет определения языка:
1. Сохраненный в localStorage
2. Язык браузера (если поддерживается)
3. Язык по умолчанию (`en`)

## 🔄 RTL поддержка

Для языков с направлением письма справа налево (арабский, персидский):
- Автоматическое изменение направления документа при смене языка
- Установка атрибута `dir="rtl"` на корневом элементе
- Установка атрибута `lang` для правильного отображения шрифтов

## 🎯 Использование в компонентах

### Базовое использование
```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('common.title')}</h1>
      <p>{t('common.description')}</p>
    </div>
  )
}
```

### Смена языка
```tsx
import { useLanguage } from '@/i18n/hooks/use-language'

function LanguageSwitcher() {
  const { currentLanguage, changeLanguage } = useLanguage()

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value)}
    >
      <option value="en">English</option>
      <option value="ru">Русский</option>
      {/* другие языки */}
    </select>
  )
}
```

### Форматирование дат
```tsx
import { formatDateByLanguage } from '@/i18n/constants'
import { useLanguage } from '@/i18n/hooks/use-language'

function DateDisplay({ date }: { date: Date }) {
  const { currentLanguage } = useLanguage()

  const formattedDate = formatDateByLanguage(date, currentLanguage, {
    includeYear: true,
    longFormat: true
  })

  return <span>{formattedDate}</span>
}
```

## 📝 Структура файлов переводов

Каждый файл перевода содержит ~2,000 ключей, организованных по разделам:

```json
{
  "common": {
    "add": "Добавить",
    "remove": "Удалить",
    "save": "Сохранить"
  },
  "topBar": {
    "layout": "Макет",
    "export": "Экспорт"
  },
  "timeline": {
    "tracks": {
      "video": "Видео",
      "audio": "Аудио"
    }
  },
  "language": {
    "native": {
      "en": "English",
      "ru": "Русский",
      "es": "Español"
    }
  }
}
```

### Основные разделы:
- `common` - общие элементы (кнопки, действия)
- `topBar` - верхняя панель
- `timeline` - временная шкала
- `browser` - браузер медиа
- `modals` - модальные окна
- `dialogs` - диалоги
- `effects` - эффекты
- `filters` - фильтры
- `transitions` - переходы
- `language` - названия языков

## 🔄 Добавление нового языка

### 1. Создание файла перевода
```bash
# Скопировать базовый файл
cp src/i18n/locales/en.json src/i18n/locales/[код].json
```

### 2. Обновление констант
```typescript
// src/i18n/constants.ts
export type LanguageCode = "ru" | "en" | /* ... */ | "новый_код"

export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  "ru", "en", /* ... */, "новый_код"
]

export const LANGUAGE_LOCALES: Record<LanguageCode, string> = {
  // ...
  новый_код: "новый_код-СТРАНА"
}
```

### 3. Добавление импорта
```typescript
// src/i18n/index.ts
import translationНовый from "./locales/новый_код.json"

const resources = {
  // ...
  новый_код: {
    translation: translationНовый,
  },
}
```

### 4. Обновление бэкенда
```rust
// src-tauri/src/language_tauri.rs
const SUPPORTED_LANGUAGES: [&str; 15] = [
  "en", "ru", /* ... */, "ar", "fa"
];
```

### 5. Добавление нативных названий
Во всех файлах переводов добавить:
```json
{
  "language": {
    "native": {
      "новый_код": "Название на родном языке"
    }
  }
}
```

## 🧪 Тестирование

Модуль покрыт тестами:

```bash
# Запуск тестов i18n
bun run test src/i18n/

# Конкретные тесты
bun run test src/i18n/__tests__/constants.test.ts
bun run test src/i18n/__tests__/use-language.test.ts
```

### Тестируемые функции:
- Поддержка всех языков
- Правильные локали
- Форматирование дат
- Смена языка
- Сохранение в localStorage

## 🐛 Отладка

### Включение отладки i18next
```typescript
// В режиме разработки
debug: process.env.NODE_ENV === "development"
```

### Логи в консоли:
- `i18n: Using saved language from localStorage: ru`
- `i18n: Language changed and saved to localStorage: en`
- `i18n: Failed to initialize: [error]`

### Проверка текущего состояния:
```javascript
// В консоли браузера
localStorage.getItem('app-language')  // текущий язык
i18n.language                        // активный язык i18next
i18n.options.resources               // загруженные переводы
```

## 🚀 Планы развития

### ✅ Phase 2 (Завершено)
- 🇸🇦 **Арабский** (ar) - реализовано с RTL поддержкой
- 🇮🇷 **Персидский/Фарси** (fa) - реализовано с RTL поддержкой

### Будущие релизы (Phase 3-6)

#### Phase 3: Популярные азиатские языки
- 🇮🇩 **Индонезийский** (id)
- 🇻🇳 **Вьетнамский** (vi)
- 🇵🇱 **Польский** (pl)
- 🇷🇴 **Румынский** (ro)
- 🇵🇰 **Урду** (ur) + RTL
- 🇧🇩 **Бенгальский** (bn)

#### Phase 4: Африканские и региональные языки
- 🇰🇪 **Суахили** (sw)
- 🇮🇳 **Тамильский** (ta)
- 🇮🇳 **Гуджарати** (gu)
- 🇮🇳 **Каннада** (kn)
- 🇪🇹 **Амхарский** (am)
- 🇿🇦 **Африкаанс** (af)
- 🇵🇭 **Филиппинский/Тагальский** (tl)
- 🇳🇵 **Непальский** (ne)
- 🇲🇲 **Бирманский** (my)
- 🇱🇦 **Лаосский** (lo)
- 🇱🇰 **Сингальский** (si)
- 🇰🇭 **Кхмерский** (km)

#### Phase 5: Европейские языки
- 🇮🇱 **Иврит** (he) + RTL
- 🇺🇦 **Украинский** (uk)
- 🇧🇬 **Болгарский** (bg)
- 🇨🇿 **Чешский** (cs)
- 🇸🇪 **Шведский** (sv)
- 🇬🇷 **Греческий** (el)
- 🇩🇰 **Датский** (da)
- 🇫🇮 **Финский** (fi)
- 🇳🇴 **Норвежский** (no)
- 🇷🇸 **Сербский** (sr)
- 🇭🇷 **Хорватский** (hr)
- 🇸🇰 **Словацкий** (sk)
- 🇸🇮 **Словенский** (sl)
- 🇧🇦 **Боснийский** (bs)
- 🇦🇱 **Албанский** (sq)
- 🇧🇾 **Белорусский** (be)
- 🇮🇸 **Исландский** (is)
- 🇲🇰 **Македонский** (mk)
- 🇱🇹 **Литовский** (lt)
- 🇱🇻 **Латышский** (lv)
- 🇪🇪 **Эстонский** (et)
- 🇲🇹 **Мальтийский** (mt)
- 🇲🇩 **Молдавский** (mo)
- 🇭🇺 **Венгерский** (hu)
- 🇮🇪 **Ирландский** (ga)

#### Phase 6: Региональные и исторические языки
- 🇪🇸 **Каталанский** (ca)
- 🇪🇸 **Баскский** (eu)
- 🏴󠁧󠁢󠁳󠁣󠁴󠁿 **Гэльский шотландский** (gd)
- 🇪🇸 **Галисийский** (gl)
- 🇬🇪 **Грузинский** (ka)
- 🇦🇿 **Азербайджанский** (az)
- 🇦🇲 **Армянский** (hy)
- 🇹🇯 **Таджикский** (tg)
- 🇹🇲 **Туркменский** (tk)
- 🇰🇿 **Казахский** (kk)
- 🇺🇿 **Узбекский** (uz)
- 🇰🇬 **Киргизский** (ky)
- 🇲🇳 **Монгольский** (mn)
- 🇿🇦 **Зулу** (zu)
- 🇮🇳 **Пенджаби** (pa)

### Итоговая цель: 50+ языков
Превратить Timeline Studio в самый многоязычный видео-редактор в мире! 🌍

## 📚 Дополнительные ресурсы

- [react-i18next документация](https://react.i18next.com/)
- [i18next документация](https://www.i18next.com/)
- [RFC 5646 - языковые теги](https://tools.ietf.org/rfc/rfc5646.txt)
- [Unicode CLDR - данные локализации](https://cldr.unicode.org/)
