# Документация по машинам состояний (XState)

В проекте Timeline Studio используется библиотека XState для управления состоянием приложения. Этот документ описывает основные машины состояний, их контексты, события и переходы.

## Общие принципы

При создании машин состояний в проекте следуем следующим принципам:

1. Используем метод `setup` для создания машин состояний (для новых машин)
2. Определяем типы для контекста и событий
3. Разделяем сложную логику на отдельные акторы
4. Пишем тесты для машин состояний

## Основные машины состояний

### 1. Машина модальных окон (Modal Machine)

**Файл:** `src/features/modals/services/modal-machine.ts`

**Описание:** Управляет отображением и состоянием модальных окон в приложении.

**Контекст:**
```typescript
{
  modalType: ModalType; // Тип открытого модального окна
  modalData: ModalData | null; // Данные, передаваемые в модальное окно
}
```

**Типы модальных окон:**
- `camera-capture` - Захват с камеры
- `voice-recording` - Запись голоса
- `export` - Экспорт проекта
- `project-settings` - Настройки проекта
- `user-settings` - Пользовательские настройки
- `keyboard-shortcuts` - Горячие клавиши
- `none` - Нет открытого окна

**События:**
- `OPEN_MODAL` - Открыть модальное окно
- `CLOSE_MODAL` - Закрыть модальное окно
- `SUBMIT_MODAL` - Отправить форму модального окна

**Состояния:**
- `closed` - Модальное окно закрыто
- `opened` - Модальное окно открыто

**Пример использования:**
```typescript
import { useActor } from '@xstate/react';
import { modalMachine } from './modal-machine';

// Открытие модального окна
actor.send({ 
  type: 'OPEN_MODAL', 
  modalType: 'project-settings',
  modalData: { customData: 'value' } 
});

// Закрытие модального окна
actor.send({ type: 'CLOSE_MODAL' });

// Отправка формы
actor.send({ 
  type: 'SUBMIT_MODAL', 
  data: { result: 'success' } 
});
```

### 2. Машина настроек проекта (Project Settings Machine)

**Файл:** `src/features/project-settings/project-settings-machine.ts`

**Описание:** Управляет настройками проекта и их сохранением в localStorage.

**Контекст:**
```typescript
{
  settings: ProjectSettings; // Настройки проекта
}
```

**События:**
- `UPDATE_SETTINGS` - Обновить настройки проекта
- `RESET_SETTINGS` - Сбросить настройки проекта до значений по умолчанию

**Состояния:**
- `idle` - Машина в режиме ожидания действий

**Пример использования:**
```typescript
import { useActor } from '@xstate/react';
import { projectSettingsMachine } from './project-settings-machine';

// Обновление настроек
actor.send({ 
  type: 'UPDATE_SETTINGS', 
  settings: { 
    name: 'Новый проект',
    resolution: { width: 1920, height: 1080 }
  } 
});

// Сброс настроек
actor.send({ type: 'RESET_SETTINGS' });
```

### 3. Машина пользовательских настроек (User Settings Machine)

**Файл:** `src/features/user-settings/user-settings-machine.ts`

**Описание:** Управляет пользовательскими настройками интерфейса и их сохранением.

**Контекст:**
```typescript
{
  previewSizes: Record<"MEDIA" | "TRANSITIONS" | "TEMPLATES", PreviewSize>;
  activeTab: BrowserTab;
  layoutMode: LayoutMode;
  screenshotsPath: string;
  aiApiKey: string;
  isLoaded: boolean;
}
```

**События:**
- `LOAD_SETTINGS` - Загрузить настройки
- `SETTINGS_LOADED` - Настройки загружены
- `UPDATE_PREVIEW_SIZE` - Обновить размер превью
- `UPDATE_ACTIVE_TAB` - Обновить активную вкладку
- `UPDATE_LAYOUT_MODE` - Обновить режим макета
- `UPDATE_SCREENSHOTS_PATH` - Обновить путь для скриншотов
- `UPDATE_AI_API_KEY` - Обновить API ключ для ИИ

**Состояния:**
- `loading` - Загрузка настроек
- `idle` - Машина в режиме ожидания действий

### 4. Машина медиафайлов (Media Machine)

**Файл:** `src/features/browser/media/media-machine.ts`

**Описание:** Управляет загрузкой и отображением медиафайлов в браузере.

**Контекст:**
```typescript
{
  allMediaFiles: MediaFile[]; // Все медиафайлы
  error: string | null; // Ошибка загрузки
  isLoading: boolean; // Флаг загрузки
  favorites: FavoritesType; // Избранные элементы
}
```

**События:**
- `FETCH_MEDIA` - Загрузить медиафайлы
- `INCLUDE_FILES` - Включить файлы в проект
- `REMOVE_FILE` - Удалить файл из проекта
- `CLEAR_FILES` - Очистить список файлов
- `ADD_TO_FAVORITES` - Добавить в избранное
- `REMOVE_FROM_FAVORITES` - Удалить из избранного
- `CLEAR_FAVORITES` - Очистить избранное

**Состояния:**
- `idle` - Ожидание действий
- `loading` - Загрузка медиафайлов
- `loaded` - Медиафайлы загружены
- `error` - Ошибка загрузки

## Тестирование машин состояний

Для тестирования машин состояний используется Vitest и XState Test. Примеры тестов можно найти в файлах с расширением `.test.ts` рядом с файлами машин состояний.

Пример теста для модальной машины:

```typescript
import { createActor } from "xstate"
import { modalMachine } from "./modal-machine"

describe("Modal Machine", () => {
  it("should start in closed state", () => {
    const actor = createActor(modalMachine)
    actor.start()
    expect(actor.getSnapshot().value).toBe("closed")
    expect(actor.getSnapshot().context).toEqual({
      modalType: "none",
      modalData: null,
    })
  })

  it("should transition to opened state when OPEN_MODAL event is sent", () => {
    const actor = createActor(modalMachine)
    actor.start()
    actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })
    expect(actor.getSnapshot().value).toBe("opened")
    expect(actor.getSnapshot().context.modalType).toBe("project-settings")
  })
})
```

## Лучшие практики

1. **Типизация**: Всегда определяйте типы для контекста и событий машины состояний.
2. **Тестирование**: Пишите тесты для всех машин состояний.
3. **Документация**: Документируйте сложные переходы и действия.
4. **Модульность**: Разделяйте сложные машины на подмашины и акторы.
5. **Инспекция**: Используйте инструменты инспекции XState для отладки.
