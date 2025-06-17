import { CreatePresetsFunction, ShortcutCategory } from "./types"

export const createPremierePreset: CreatePresetsFunction = (t: any): ShortcutCategory[] => [
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
        id: "archive",
        name: t("dialogs.keyboardShortcuts.shortcuts.archive", "Архивировать"),
        keys: "⇧⌘A",
      },
      {
        id: "import",
        name: t("dialogs.keyboardShortcuts.shortcuts.import", "Импорт"),
        keys: "⌘I",
      },
    ],
  },
  {
    id: "edit",
    name: t("dialogs.keyboardShortcuts.categories.edit", "Редактировать"),
    shortcuts: [
      {
        id: "undo",
        name: t("dialogs.keyboardShortcuts.shortcuts.undo", "Отменить"),
        keys: "⌘Z",
      },
      {
        id: "redo",
        name: t("dialogs.keyboardShortcuts.shortcuts.redo", "Повторить"),
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
        name: t("dialogs.keyboardShortcuts.shortcuts.duplicate", "Дублировать"),
        keys: "⌘D",
      },
      {
        id: "enable-disable",
        name: t("dialogs.keyboardShortcuts.shortcuts.enable-disable", "Включить/Отключить клип"),
        keys: "⇧D",
      },
      {
        id: "delete",
        name: t("dialogs.keyboardShortcuts.shortcuts.delete", "Удалить"),
        keys: "⌫",
      },
      {
        id: "ripple-delete",
        name: t("dialogs.keyboardShortcuts.shortcuts.ripple-delete", "Удалить с подтягиванием"),
        keys: "⇧⌫",
      },
      {
        id: "close-gap",
        name: t("dialogs.keyboardShortcuts.shortcuts.close-gap", "Закрыть пропуск"),
        keys: "G",
      },
      {
        id: "select-all",
        name: t("dialogs.keyboardShortcuts.shortcuts.select-all", "Выбрать все"),
        keys: "⌘A",
      },
      {
        id: "copy-effects",
        name: t("dialogs.keyboardShortcuts.shortcuts.copy-effects", "Копировать эффекты"),
        keys: "⌘C",
      },
      {
        id: "paste-effects",
        name: t("dialogs.keyboardShortcuts.shortcuts.paste-effects", "Вставить эффекты"),
        keys: "⌘V",
      },
      {
        id: "range-select",
        name: t("dialogs.keyboardShortcuts.shortcuts.range-select", "Выделение диапазона"),
        keys: "R",
      },
    ],
  },
  {
    id: "tools",
    name: t("dialogs.keyboardShortcuts.categories.tools", "Инструменты"),
    shortcuts: [
      {
        id: "magnetic-timeline",
        name: t("dialogs.keyboardShortcuts.shortcuts.magnetic-timeline", "Магнитная временная шкала"),
        keys: "⇧N",
      },
      {
        id: "link",
        name: t("dialogs.keyboardShortcuts.shortcuts.link", "Связать"),
        keys: "⌘L",
      },
      {
        id: "keyframe-animation",
        name: t("dialogs.keyboardShortcuts.shortcuts.keyframe-animation", "Анимация ключевых кадров"),
        keys: "⌘+Left Click",
      },
      {
        id: "show-properties",
        name: t("dialogs.keyboardShortcuts.shortcuts.show-properties", "Показать свойства"),
        keys: "⇧⌘P",
      },
      {
        id: "split",
        name: t("dialogs.keyboardShortcuts.shortcuts.split", "Разделить"),
        keys: "⌘K",
      },
      {
        id: "trim",
        name: t("dialogs.keyboardShortcuts.shortcuts.trim", "Обрезать"),
        keys: "T",
      },
      {
        id: "rotate-90-cw",
        name: t("dialogs.keyboardShortcuts.shortcuts.rotate-90-cw", "Повернуть 90 CW"),
        keys: "⌘→",
      },
      {
        id: "rotate-90-ccw",
        name: t("dialogs.keyboardShortcuts.shortcuts.rotate-90-ccw", "Повернуть 90 CCW"),
        keys: "⌘←",
      },
      {
        id: "group",
        name: t("dialogs.keyboardShortcuts.shortcuts.group", "Группа"),
        keys: "⌘G",
      },
      {
        id: "ungroup",
        name: t("dialogs.keyboardShortcuts.shortcuts.ungroup", "Разгруппировать"),
        keys: "⇧⌘G",
      },
      {
        id: "speed-ramping",
        name: t("dialogs.keyboardShortcuts.shortcuts.speed-ramping", "Равномерная скорость"),
        keys: "^R",
      },
      {
        id: "freeze-frame",
        name: t("dialogs.keyboardShortcuts.shortcuts.freeze-frame", "Добавить замороженный кадр"),
        keys: "⌘F",
      },
      {
        id: "unlink-audio",
        name: t("dialogs.keyboardShortcuts.shortcuts.unlink-audio", "Отсоединить аудио"),
        keys: "⌘L",
      },
      {
        id: "safe-mode",
        name: t("dialogs.keyboardShortcuts.shortcuts.safe-mode", "Безопасный"),
        keys: "⇧⌘M",
      },
      {
        id: "stabilization",
        name: t("dialogs.keyboardShortcuts.shortcuts.stabilization", "Стабилизация"),
        keys: "⌘S",
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
    ],
  },
  {
    id: "markers",
    name: t("dialogs.keyboardShortcuts.categories.markers", "Маркер"),
    shortcuts: [
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
        id: "cyan-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.cyan-marker", "Синий маркер"),
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
        id: "select-same-label",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.select-same-label",
          "Выбрать все клипы с одинаковой цветовой меткой",
        ),
        keys: "⌘'",
      },
      {
        id: "render-preview",
        name: t("dialogs.keyboardShortcuts.shortcuts.render-preview", "Предпросмотр рендера"),
        keys: "↵",
      },
      {
        id: "add-keyframes",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-keyframes", "Добавить ключевые кадры аудио/видео"),
        keys: "⌘+Left Click",
      },
      {
        id: "previous-keyframe",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-keyframe", "Предыдущий ключевой кадр"),
        keys: "[",
      },
    ],
  },
  {
    id: "advanced-tools",
    name: t("dialogs.keyboardShortcuts.categories.advanced-tools", "Дополнительные инструменты"),
    shortcuts: [
      {
        id: "next-keyframe",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-keyframe", "Следующий ключевой кадр"),
        keys: "]",
      },
      {
        id: "track-motion",
        name: t("dialogs.keyboardShortcuts.shortcuts.track-motion", "Отслеж. Движения"),
        keys: "⌘X",
      },
      {
        id: "insert",
        name: t("dialogs.keyboardShortcuts.shortcuts.insert", "Вставить"),
        keys: ".",
      },
      {
        id: "overwrite",
        name: t("dialogs.keyboardShortcuts.shortcuts.overwrite", "Затирать"),
        keys: ".",
      },
      {
        id: "replace",
        name: t("dialogs.keyboardShortcuts.shortcuts.replace", "Заменять"),
        keys: "⌘+Mouse Drag",
      },
      {
        id: "rename",
        name: t("dialogs.keyboardShortcuts.shortcuts.rename", "Переименовать"),
        keys: "F2",
      },
      {
        id: "show-in-finder",
        name: t("dialogs.keyboardShortcuts.shortcuts.show-in-finder", "Показать в Finder"),
        keys: "⇧⌘R",
      },
      {
        id: "apply",
        name: t("dialogs.keyboardShortcuts.shortcuts.apply", "Применить"),
        keys: "⌘A",
      },
      {
        id: "quick-share",
        name: t("dialogs.keyboardShortcuts.shortcuts.quick-share", "Режим быстрого разделения"),
        keys: "C",
      },
      {
        id: "select",
        name: t("dialogs.keyboardShortcuts.shortcuts.select", "Выбрать"),
        keys: "V",
      },
      {
        id: "audio-stretch",
        name: t("dialogs.keyboardShortcuts.shortcuts.audio-stretch", "Доступ к функции «Растягивание аудио»"),
        keys: "S",
      },
    ],
  },
  {
    id: "audio",
    name: t("dialogs.keyboardShortcuts.categories.audio", "Аудио"),
    shortcuts: [
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
        id: "adjust-bezier",
        name: t("dialogs.keyboardShortcuts.shortcuts.adjust-bezier", "Настройте кривую Безье"),
        keys: "⌘+Mouse Drag",
      },
      {
        id: "create-compound",
        name: t("dialogs.keyboardShortcuts.shortcuts.create-compound", "Создать составной клип"),
        keys: "⌘G",
      },
      {
        id: "send-to-front",
        name: t("dialogs.keyboardShortcuts.shortcuts.send-to-front", "На передний план"),
        keys: "⌘]",
      },
      {
        id: "extract",
        name: t("dialogs.keyboardShortcuts.shortcuts.extract", "Выдвинуть"),
        keys: "⌘]",
      },
      {
        id: "send-back",
        name: t("dialogs.keyboardShortcuts.shortcuts.send-back", "Отправить Назад"),
        keys: "⌘[",
      },
      {
        id: "send-to-back",
        name: t("dialogs.keyboardShortcuts.shortcuts.send-to-back", "Отправить на задний план"),
        keys: "⌘[",
      },
      {
        id: "timeline-snap",
        name: t("dialogs.keyboardShortcuts.shortcuts.timeline-snap", "Прикрепление по временной шкале"),
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
    ],
  },
  {
    id: "subtitles",
    name: t("dialogs.keyboardShortcuts.categories.subtitles", "Субтитры"),
    shortcuts: [
      {
        id: "split-edit-mode",
        name: t("dialogs.keyboardShortcuts.shortcuts.split-edit-mode", "Разделить (режим редактирования)"),
        keys: "⇧↵",
      },
      {
        id: "merge-subtitles-up",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.merge-subtitles-up",
          "Объединить субтитры сверху (курсор в начале предложения)",
        ),
        keys: "⌘J",
      },
      {
        id: "merge-subtitles-down",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.merge-subtitles-down",
          "Объединить субтитры снизу (режим одиночного выбора или режим редактирования)",
        ),
        keys: "⌘Q",
      },
      {
        id: "merge-selected",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.merge-selected",
          "Объединить выбранные субтитры (режим множественного выбора)",
        ),
        keys: "⌘Q",
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
        keys: "^/",
      },
      {
        id: "fullscreen",
        name: t("dialogs.keyboardShortcuts.shortcuts.fullscreen", "Полный экран / Восстановление"),
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
        id: "previous-edit-point",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.previous-edit-point",
          "Предыдущая Точка Редактирования / Перемещение Вверх",
        ),
        keys: "↑",
      },
      {
        id: "next-edit-point",
        name: t(
          "dialogs.keyboardShortcuts.shortcuts.next-edit-point",
          "Следующая Точка Редактирования / Перемещение Вниз",
        ),
        keys: "↓",
      },
      {
        id: "previous-second",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-second", "Перейти к предыдущей секунде"),
        keys: "⇧←",
      },
      {
        id: "next-second",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-second", "Перейти к следующей секунде"),
        keys: "⇧→",
      },
    ],
  },
  {
    id: "navigation",
    name: t("dialogs.keyboardShortcuts.categories.navigation", "Навигация"),
    shortcuts: [
      {
        id: "previous-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.previous-marker", "Перейти к предыдущему маркеру"),
        keys: "⇧↑",
      },
      {
        id: "next-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.next-marker", "Перейти к следующему маркеру"),
        keys: "⇧↓",
      },
      {
        id: "project-start",
        name: t("dialogs.keyboardShortcuts.shortcuts.project-start", "Перейти к началу проекта"),
        keys: "\\",
      },
      {
        id: "project-end",
        name: t("dialogs.keyboardShortcuts.shortcuts.project-end", "Перейти к концу проекта"),
        keys: "\\",
      },
      {
        id: "clip-start",
        name: t("dialogs.keyboardShortcuts.shortcuts.clip-start", "Перейти к началу выбранного клипа"),
        keys: "⇧I",
      },
      {
        id: "clip-end",
        name: t("dialogs.keyboardShortcuts.shortcuts.clip-end", "Перейти к концу выбранного клипа"),
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
        id: "zoom-to-fit",
        name: t("dialogs.keyboardShortcuts.shortcuts.zoom-to-fit", "Увеличить по размеру шкалы времени"),
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
    ],
  },
  {
    id: "timeline",
    name: t("dialogs.keyboardShortcuts.categories.timeline", "Временная шкала"),
    shortcuts: [
      {
        id: "horizontal-scroll",
        name: t("dialogs.keyboardShortcuts.shortcuts.horizontal-scroll", "Горизонтальная прокрутка (временная шкала)"),
        keys: "⌘+Scroll Up/Down",
      },
      {
        id: "vertical-scroll",
        name: t("dialogs.keyboardShortcuts.shortcuts.vertical-scroll", "Вертикальная прокрутка (временная шкала)"),
        keys: "Прокрутка вверх/вниз",
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
  {
    id: "markers-multicam",
    name: t("dialogs.keyboardShortcuts.categories.markers-multicam", "Маркеры и Мультикамера"),
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
        keys: "⇧⌘X",
      },
      {
        id: "add-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.add-marker", "Добавить маркер"),
        keys: "M",
      },
      {
        id: "edit-marker",
        name: t("dialogs.keyboardShortcuts.shortcuts.edit-marker", "Изменить маркер"),
        keys: "⇧M",
      },
      {
        id: "multicam-angle-1",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-1", "Переключение угла видео 1"),
        keys: "1",
      },
      {
        id: "multicam-angle-2",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-2", "Переключение угла видео 2"),
        keys: "2",
      },
      {
        id: "multicam-angle-3",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-3", "Переключение угла видео 3"),
        keys: "3",
      },
      {
        id: "multicam-angle-4",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-4", "Переключение угла видео 4"),
        keys: "4",
      },
      {
        id: "multicam-angle-5",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-5", "Переключение угла видео 5"),
        keys: "5",
      },
      {
        id: "multicam-angle-6",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-6", "Переключение угла видео 6"),
        keys: "6",
      },
      {
        id: "multicam-angle-7",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-7", "Переключение угла видео 7"),
        keys: "7",
      },
      {
        id: "multicam-angle-8",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-8", "Переключение угла видео 8"),
        keys: "8",
      },
      {
        id: "multicam-angle-9",
        name: t("dialogs.keyboardShortcuts.shortcuts.multicam-angle-9", "Переключение угла видео 9"),
        keys: "9",
      },
    ],
  },
  {
    id: "miscellaneous",
    name: t("dialogs.keyboardShortcuts.categories.miscellaneous", "Прочее"),
    shortcuts: [
      {
        id: "help",
        name: t("dialogs.keyboardShortcuts.shortcuts.help", "Помощь"),
        keys: "F1",
      },
      {
        id: "export",
        name: t("dialogs.keyboardShortcuts.shortcuts.export", "Экспорт"),
        keys: "⌘E",
      },
    ],
  },
]
