import { CreatePresetsFunction, ShortcutCategory } from "./types"

// Функция для создания предустановки Wondershare Filmora
export const createFilmoraPreset: CreatePresetsFunction = (t: any): ShortcutCategory[] => [
  {
    id: "preferences",
    name: t("dialogs.keyboardShortcuts.categories.preferences", "Предпочтения"),
    shortcuts: [
      {
        id: "preferences",
        name: t("dialogs.keyboardShortcuts.shortcuts.preferences", "Предпочтения"),
        keys: "⌘,",
      },
      {
        id: "shortcuts",
        name: t("dialogs.keyboardShortcuts.shortcuts.shortcuts", "Быстрые клавиши"),
        keys: "⌥⌘K",
      },
      {
        id: "exit",
        name: t("dialogs.keyboardShortcuts.shortcuts.exit", "Выход"),
        keys: "⌘Q",
      },
    ],
  },
  {
    id: "file",
    name: t("dialogs.keyboardShortcuts.categories.file", "Файл"),
    shortcuts: [
      {
        id: "new-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.new-project", "Создать новый проект"),
        keys: "⌘N",
      },
      {
        id: "open-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.open-project", "Открыть Проект"),
        keys: "⌘O",
      },
      {
        id: "save-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.save-project", "Сохранить проект"),
        keys: "⌘S",
      },
      {
        id: "save-as",
        name: t("dialogs.keyboardShortcuts.shortcuts.save-as", "Сохранить проект как"),
        keys: "⇧⌘S",
      },
      {
        id: "archive-project",
        name: t("dialogs.keyboardShortcuts.shortcuts.archive-project", "Архивный проект"),
        keys: "⇧⌘A",
      },
      {
        id: "import",
        name: t("dialogs.keyboardShortcuts.shortcuts.import", "Импорт Медиафайлов"),
        keys: "⌘I",
      },
      {
        id: "record-voiceover",
        name: t("dialogs.keyboardShortcuts.shortcuts.record-voiceover", "Записать закадровый голос"),
        keys: "⌘R",
      },
      {
        id: "add-to-new-track",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-to-new-track", "Добавить на новую дорожку"),
        keys: "⌥⌘N",
      },
    ],
  },
  {
    id: "edit",
    name: t("dialogs.keyboardShortcuts.categories.edit", "Редактировать"),
    shortcuts: [
      {
        id: "undo",
        name: t("dialogs.keyboardShortcuts.shortcuts.undo", "Вернуть"),
        keys: "⌘Z",
      },
      {
        id: "redo",
        name: t("dialogs.keyboardShortcuts.shortcuts.redo", "Отменить"),
        keys: "⇧⌘Z",
      },
      {
        id: "cut",
        name: t("dialogs.keyboardShortcuts.shortcuts.cut", "Вырезать"),
        keys: "⌘X",
      },
      {
        id: "copy",
        name: t("dialogs.keyboardShortcuts.shortcuts.copy", "Копировать"),
        keys: "⌘C",
      },
      {
        id: "paste",
        name: t("dialogs.keyboardShortcuts.shortcuts.paste", "Вставить"),
        keys: "⌘V",
      },
      {
        id: "duplicate",
        name: t("dialogs.keyboardShortcuts.shortcuts.duplicate", "Скопировать"),
        keys: "⌘D",
      },
      {
        id: "enable-disable-clip",
        name: t("dialogs.keyboardShortcuts.shortcuts.enable-disable-clip", "Включить/отключить клип"),
        keys: "E",
      },
      {
        id: "delete",
        name: t("dialogs.keyboardShortcuts.shortcuts.delete", "Удалить"),
        keys: "Delete",
      },
      {
        id: "ripple-delete",
        name: t("dialogs.keyboardShortcuts.shortcuts.ripple-delete", "Удаление пульсаций"),
        keys: "⇧Delete",
      },
      {
        id: "close-gap",
        name: t("dialogs.keyboardShortcuts.shortcuts.close-gap", "Закрыть разрыв"),
        keys: "⌥D",
      },
    ],
  },
  {
    id: "selection",
    name: t("dialogs.keyboardShortcuts.categories.selection", "Выбор и навигация"),
    shortcuts: [
      {
        id: "select-all",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-all", "Выбрать все"),
        keys: "⌘A",
      },
      {
        id: "copy-effects",
        name: t("dialogs.keyboardShortcuts.shortcuts.copy-effects", "Копировать эффекты"),
        keys: "⌥⌘C",
      },
      {
        id: "paste-effects",
        name: t("dialogs.keyboardShortcuts.shortcuts.paste-effects", "Вставить эффекты"),
        keys: "⌥⌘V",
      },
      {
        id: "select-clip-range",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-clip-range", "Выберите диапазон клипа"),
        keys: "X",
      },
      {
        id: "cancel-selection",
        name: t("dialogs.keyboardShortcuts.shortcuts.cancel-selection", "Отмена выбранного диапазона"),
        keys: "⇧X",
      },
      {
        id: "nudge-left",
        name: t("dialogs.keyboardShortcuts.shortcuts.nudge-left", "Подтолкнуть Влево"),
        keys: "⌘←",
      },
      {
        id: "nudge-right",
        name: t("dialogs.keyboardShortcuts.shortcuts.nudge-right", "Подтолкнуть Вправо"),
        keys: "⌘→",
      },
      {
        id: "nudge-up",
        name: t("dialogs.keyboardShortcuts.shortcuts.nudge-up", "Подтолкнуть Вверх"),
        keys: "⌥↑",
      },
      {
        id: "nudge-down",
        name: t("dialogs.keyboardShortcuts.shortcuts.nudge-down", "Подтолкнуть Вниз"),
        keys: "⌥↓",
      },
      {
        id: "magnetic-timeline",
        name: t("dialogs.keyboardShortcuts.shortcuts.magnetic-timeline", "Магнитная временная шкала"),
        keys: "P",
      },
      {
        id: "linking",
        name: t("dialogs.keyboardShortcuts.shortcuts.linking", "Связывание"),
        keys: "⇧⌘L",
      },
    ],
  },
  {
    id: "keyframe-animation",
    name: t("dialogs.keyboardShortcuts.categories.keyframe-animation", "Анимация ключевого кадра"),
    shortcuts: [
      {
        id: "keyframe-animation",
        name: t("dialogs.keyboardShortcuts.shortcuts.keyframe-animation", "Анимация ключевого кадра"),
        keys: "⌥⇧K",
      },
    ],
  },
  {
    id: "tools",
    name: t("dialogs.keyboardShortcuts.categories.tools", "Инструменты"),
    shortcuts: [
      {
        id: "show-properties",
        name: t("dialogs.keyboardShortcuts.shortcuts.show-properties", "Показать свойства"),
        keys: "⌥E",
      },
      {
        id: "split",
        name: t("dialogs.keyboardShortcuts.shortcuts.split", "Разделить"),
        keys: "⌘K",
      },
      {
        id: "trim-start-to-playhead",
        name: t("dialogs.keyboardShortcuts.shortcuts.trim-start-to-playhead", "Обрезать страт до точки воспроизведения"),
        keys: "Q",
      },
      {
        id: "trim-end-to-playhead",
        name: t("dialogs.keyboardShortcuts.shortcuts.trim-end-to-playhead", "Обрезать конец до точки воспроизведения"),
        keys: "W",
      },
      {
        id: "multi-trim",
        name: t("dialogs.keyboardShortcuts.shortcuts.multi-trim", "Множественная Обрезка"),
        keys: "⌘F",
      },
      {
        id: "crop-and-zoom",
        name: t("dialogs.keyboardShortcuts.shortcuts.crop-and-zoom", "Обрезка и масштабирование"),
        keys: "⌥C",
      },
      {
        id: "rotate-90-cw",
        name: t("dialogs.keyboardShortcuts.shortcuts.rotate-90-cw", "Повернуть 90 CW"),
        keys: "⌥⌘→",
      },
      {
        id: "rotate-90-ccw",
        name: t("dialogs.keyboardShortcuts.shortcuts.rotate-90-ccw", "Повернуть 90 CCW"),
        keys: "⌥⌘←",
      },
    ],
  },
  {
    id: "markers",
    name: t("dialogs.keyboardShortcuts.categories.markers", "Маркер"),
    shortcuts: [
      {
        id: "mark-in",
        name: t("dialogs.keyboardShortcuts.shortcuts.mark-in", "Отметить в"),
        keys: "I",
      },
      {
        id: "mark-out",
        name: t("dialogs.keyboardShortcuts.shortcuts.mark-out", "Отметить"),
        keys: "O",
      },
      {
        id: "clear-in-out",
        name: t("dialogs.keyboardShortcuts.shortcuts.clear-in-out", "Очистить вход и выход"),
        keys: "↑⌘X",
      },
      {
        id: "add-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-marker", "Добавить маркер"),
        keys: "M",
      },
      {
        id: "edit-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.edit-marker", "Изменить маркер"),
        keys: "↑M",
      },
    ],
  },
  {
    id: "multicam-editing",
    name: t("dialogs.keyboardShortcuts.categories.multicam-editing", "Мультикамерный монтаж"),
    shortcuts: [
      {
        id: "switch-camera-1",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-1", "Переключение угла видео 1"),
        keys: "1",
      },
      {
        id: "switch-camera-2",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-2", "Переключение угла видео 2"),
        keys: "2",
      },
      {
        id: "switch-camera-3",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-3", "Переключение угла видео 3"),
        keys: "3",
      },
      {
        id: "switch-camera-4",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-4", "Переключение угла видео 4"),
        keys: "4",
      },
      {
        id: "switch-camera-5",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-5", "Переключение угла видео 5"),
        keys: "5",
      },
      {
        id: "switch-camera-6",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-6", "Переключение угла видео 6"),
        keys: "6",
      },
      {
        id: "switch-camera-7",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-7", "Переключение угла видео 7"),
        keys: "7",
      },
      {
        id: "switch-camera-8",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-8", "Переключение угла видео 8"),
        keys: "8",
      },
      {
        id: "switch-camera-9",
        name: t("dialogs.keyboardShortcuts.shortcuts.switch-camera-9", "Переключение угла видео 9"),
        keys: "9",
      },
    ],
  },
  {
    id: "grouping-markers",
    name: t("dialogs.keyboardShortcuts.categories.grouping-markers", "Группировка и маркеры"),
    shortcuts: [
      {
        id: "group",
        name: t("dialogs.keyboardShortcuts.shortcuts.group", "Группа"),
        keys: "⌘G",
      },
      {
        id: "ungroup",
        name: t("dialogs.keyboardShortcuts.shortcuts.ungroup", "Разгруппировать"),
        keys: "⌥⌘G",
      },
      {
        id: "uniform-speed",
        name: t("dialogs.keyboardShortcuts.shortcuts.uniform-speed", "Равномерная скорость"),
        keys: "⇧R",
      },
      {
        id: "add-freeze-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-freeze-frame", "Добавить замороженный кадр"),
        keys: "⌥F",
      },
      {
        id: "detach-audio",
        name: t("dialogs.keyboardShortcuts.shortcuts.detach-audio", "Отсоединить аудио"),
        keys: "⌘L",
      },
      {
        id: "mute",
        name: t("dialogs.keyboardShortcuts.shortcuts.mute", "Безгласный"),
        keys: "⇧⌘M",
      },
      {
        id: "stabilization",
        name: t("dialogs.keyboardShortcuts.shortcuts.stabilization", "Стабилизация"),
        keys: "⌥S",
      },
      {
        id: "chroma-key",
        name: t("dialogs.keyboardShortcuts.shortcuts.chroma-key", "Хромакей"),
        keys: "⇧⌘G",
      },
      {
        id: "red-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.red-marker", "Красный маркер"),
        keys: "⌘1",
      },
      {
        id: "orange-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.orange-marker", "Оранжевый Маркер"),
        keys: "⌘2",
      },
      {
        id: "yellow-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.yellow-marker", "Желтый маркер"),
        keys: "⌘3",
      },
      {
        id: "green-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.green-marker", "Зеленый маркер"),
        keys: "⌘4",
      },
      {
        id: "blue-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.blue-marker", "Голубой Маркер"),
        keys: "⌘5",
      },
      {
        id: "indigo-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.indigo-marker", "Синий маркер"),
        keys: "⌘6",
      },
      {
        id: "purple-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.purple-marker", "Фиолетовый маркер"),
        keys: "⌘7",
      },
      {
        id: "gray-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.gray-marker", "Серый маркер"),
        keys: "⌘8",
      },
      {
        id: "select-same-color-clips",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-same-color-clips", "Выбрать все клипы с одинаковой цветовой меткой"),
        keys: "⌘'",
      },
      {
        id: "render-preview",
        name: t("dialogs.keyboardShortcuts.shortcuts.render-preview", "Предпросмотр рендера"),
        keys: "Return",
      },
      {
        id: "add-keyframes",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-keyframes", "Добавить ключевые кадры аудио/видео"),
        keys: "⌘+LeftClick",
      },
      {
        id: "previous-keyframe",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-keyframe", "Предыдущий ключевой кадр"),
        keys: "[",
      },
      {
        id: "next-keyframe",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-keyframe", "Следующий ключевой кадр"),
        keys: "]",
      },
      {
        id: "track-motion",
        name: t("dialogs.keyboardShortcuts.shortcuts.track-motion", "Отслеж. Движения"),
        keys: "⌥X",
      },
    ],
  },
  {
    id: "timeline-navigation",
    name: t("dialogs.keyboardShortcuts.categories.timeline-navigation", "Навигация по временной шкале"),
    shortcuts: [
      {
        id: "insert",
        name: t("dialogs.keyboardShortcuts.shortcuts.insert", "Вставить"),
        keys: ",",
      },
      {
        id: "overwrite",
        name: t("dialogs.keyboardShortcuts.shortcuts.overwrite", "Затирать"),
        keys: ".",
      },
      {
        id: "replace",
        name: t("dialogs.keyboardShortcuts.shortcuts.replace", "Заменить"),
        keys: "⌥+MouseDrag",
      },
      {
        id: "rename",
        name: t("dialogs.keyboardShortcuts.shortcuts.rename", "Переименовывать"),
        keys: "F2",
      },
      {
        id: "reveal-in-finder",
        name: t("dialogs.keyboardShortcuts.shortcuts.reveal-in-finder", "Показать в Finder"),
        keys: "⇧⌘R",
      },
      {
        id: "apply",
        name: t("dialogs.keyboardShortcuts.shortcuts.apply", "Применить"),
        keys: "⌥A",
      },
      {
        id: "blade-tool",
        name: t("dialogs.keyboardShortcuts.shortcuts.blade-tool", "Режим быстрого разделения"),
        keys: "C",
      },
      {
        id: "select-tool",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-tool", "Выбрать"),
        keys: "V",
      },
      {
        id: "audio-stretch",
        name: t("dialogs.keyboardShortcuts.shortcuts.audio-stretch", "Доступ к функции «Растягивание аудио»"),
        keys: "S",
      },
      {
        id: "close-audio-stretch",
        name: t("dialogs.keyboardShortcuts.shortcuts.close-audio-stretch", "Закрыть окно растягивания аудио"),
        keys: "⇧S",
      },
      {
        id: "add-to-favorites",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-to-favorites", "Добавить в избранное"),
        keys: "⇧F",
      },
      {
        id: "adjust-bezier-curve",
        name: t("dialogs.keyboardShortcuts.shortcuts.adjust-bezier-curve", "Настройте кривую Безье"),
        keys: "⌥+MouseDrag",
      },
      {
        id: "create-compound-clip",
        name: t("dialogs.keyboardShortcuts.shortcuts.create-compound-clip", "Создать составной клип"),
        keys: "⌥G",
      },
      {
        id: "bring-to-front",
        name: t("dialogs.keyboardShortcuts.shortcuts.bring-to-front", "На передний план"),
        keys: "⌥⌘]",
      },
      {
        id: "push-forward",
        name: t("dialogs.keyboardShortcuts.shortcuts.push-forward", "Выдвинуть"),
        keys: "⌘]",
      },
      {
        id: "send-backward",
        name: t("dialogs.keyboardShortcuts.shortcuts.send-backward", "Отправить Назад"),
        keys: "⌘[",
      },
      {
        id: "send-to-back",
        name: t("dialogs.keyboardShortcuts.shortcuts.send-to-back", "Отправить на задний план"),
        keys: "⌥⌘[",
      },
      {
        id: "snap-to-timeline",
        name: t("dialogs.keyboardShortcuts.shortcuts.snap-to-timeline", "Прикрепление по временной шкале"),
        keys: "N",
      },
      {
        id: "fast-preview",
        name: t("dialogs.keyboardShortcuts.shortcuts.fast-preview", "Режим быстрого просмотра"),
        keys: "B",
      },
      {
        id: "select-all-forward",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-all-forward", "Выбрать все вперед"),
        keys: "A",
      },
      {
        id: "select-all-backward",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-all-backward", "Выбрать все назад"),
        keys: "⇧A",
      },
      {
        id: "silence-detection",
        name: t("dialogs.keyboardShortcuts.shortcuts.silence-detection", "Обнаружение тишины"),
        keys: "⌥⌘M",
      },
      {
        id: "scene-detection",
        name: t("dialogs.keyboardShortcuts.shortcuts.scene-detection", "Обнаружение сцены"),
        keys: "⌥⇧D",
      },
      {
        id: "detach-compound-clip",
        name: t("dialogs.keyboardShortcuts.shortcuts.detach-compound-clip", "Открепить составной клип"),
        keys: "⇧⌘B",
      },
      {
        id: "apply-transition-by-default",
        name: t("dialogs.keyboardShortcuts.shortcuts.apply-transition-by-default", "Применить переход по умолчанию"),
        keys: "⌘T",
      },
    ],
  },
  {
    id: "subtitles",
    name: t("dialogs.keyboardShortcuts.categories.subtitles", "Субтитры"),
    shortcuts: [
      {
        id: "split-subtitle-edit-mode",
        name: t("dialogs.keyboardShortcuts.shortcuts.split-subtitle-edit-mode", "Разделить (режим редактирования)"),
        keys: "⇧Return",
      },
      {
        id: "merge-subtitles-up",
        name: t("dialogs.keyboardShortcuts.shortcuts.merge-subtitles-up", "Объединить субтитры сверху (курсор в начале предложения)"),
        keys: "Delete",
      },
      {
        id: "merge-subtitles-down-single",
        name: t("dialogs.keyboardShortcuts.shortcuts.merge-subtitles-down-single", "Объединить субтитры снизу (режим одиночного выбора или режим редактирования)"),
        keys: "⌥Q",
      },
      {
        id: "merge-subtitles-down-multi",
        name: t("dialogs.keyboardShortcuts.shortcuts.merge-subtitles-down-multi", "Объединить выбранные субтитры (режим множественного выбора)"),
        keys: "⌥Q",
      },
    ],
  },
  {
    id: "playback",
    name: t("dialogs.keyboardShortcuts.categories.playback", "Посмотреть"),
    shortcuts: [
      {
        id: "play-pause",
        name: t("dialogs.keyboardShortcuts.shortcuts.play-pause", "Воспроизведение / Пауза"),
        keys: "Space",
      },
      {
        id: "stop",
        name: t("dialogs.keyboardShortcuts.shortcuts.stop", "Стоп"),
        keys: "⌃/",
      },
      {
        id: "fullscreen-restore",
        name: t("dialogs.keyboardShortcuts.shortcuts.fullscreen-restore", "Полный экран / Восстановление"),
        keys: "⇧'",
      },
      {
        id: "screenshot",
        name: t("dialogs.keyboardShortcuts.shortcuts.screenshot", "Снимок"),
        keys: "⇧E",
      },
      {
        id: "previous-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-frame", "Предыдущий Кадр / Переместить Влево"),
        keys: "←",
      },
      {
        id: "next-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-frame", "Следующий Кадр / Переместить Вправо"),
        keys: "→",
      },
      {
        id: "previous-edit-point-up",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-edit-point-up", "Предыдущая Точка Редактирования / Перемещение Вверх"),
        keys: "↑",
      },
      {
        id: "next-edit-point-down",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-edit-point-down", "Следующая Точка Редактирования / Перемещение Вниз"),
        keys: "↓",
      },
      {
        id: "go-to-previous-second",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-previous-second", "Перейти к предыдущей секунде"),
        keys: "⇧←",
      },
      {
        id: "go-to-next-second",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-next-second", "Перейти к следующей секунде"),
        keys: "⇧→",
      },
      {
        id: "go-to-previous-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-previous-marker", "Перейти к предыдущему маркеру"),
        keys: "⇧↑",
      },
      {
        id: "go-to-next-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-next-marker", "Перейти к следующему маркеру"),
        keys: "⇧↓",
      },
      {
        id: "go-to-project-start",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-project-start", "Перейти к началу проекта"),
        keys: "Home",
      },
      {
        id: "go-to-project-end",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-project-end", "Перейти к концу проекта"),
        keys: "End",
      },
      {
        id: "go-to-clip-start",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-clip-start", "Перейти к началу выбранного клипа"),
        keys: "⇧I",
      },
      {
        id: "go-to-clip-end",
        name: t("dialogs.keyboardShortcuts.shortcuts.go-to-clip-end", "Перейти к концу выбранного клипа"),
        keys: "⇧O",
      },
      {
        id: "zoom-in",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-in", "Увеличить"),
        keys: "=",
      },
      {
        id: "zoom-out",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-out", "Уменьшить"),
        keys: "-",
      },
      {
        id: "zoom-to-fit-timeline",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-to-fit-timeline", "Увеличить по размеру шкалы времени"),
        keys: "⇧Z",
      },
      {
        id: "select-previous",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-previous", "Выбрать Предыдущий"),
        keys: "⌘↑",
      },
      {
        id: "select-next",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-next", "Выбрать Следующий"),
        keys: "⌘↓",
      },
      {
        id: "scroll-horizontal",
        name: t("dialogs.keyboardShortcuts.shortcuts.scroll-horizontal", "Горизонтальная прокрутка (временная шкала)"),
        keys: "⌘+ScrollUpDown",
      },
      {
        id: "scroll-vertical",
        name: t("dialogs.keyboardShortcuts.shortcuts.scroll-vertical", "Вертикальная прокрутка (временная шкала)"),
        keys: "ScrollUpDown",
      },
      {
        id: "pause",
        name: t("dialogs.keyboardShortcuts.shortcuts.pause", "Пауза"),
        keys: "K",
      },
      {
        id: "play-forward",
        name: t("dialogs.keyboardShortcuts.shortcuts.play-forward", "Воспроизведение вперед/ Скорость"),
        keys: "L",
      },
      {
        id: "play-backward",
        name: t("dialogs.keyboardShortcuts.shortcuts.play-backward", "Воспроизведение назад/ Скорость"),
        keys: "J",
      },
      {
        id: "ruler",
        name: t("dialogs.keyboardShortcuts.shortcuts.ruler", "Линейка"),
        keys: "⌘P",
      },
      {
        id: "show-hide-guides",
        name: t("dialogs.keyboardShortcuts.shortcuts.show-hide-guides", "Показать/Скрыть направляющие"),
        keys: "⌘;",
      },
      {
        id: "lock-unlock-guides",
        name: t("dialogs.keyboardShortcuts.shortcuts.lock-unlock-guides", "Заблокировать/ Разблокировать направляющие"),
        keys: "⇧⌘P",
      },
    ],
  },
]
