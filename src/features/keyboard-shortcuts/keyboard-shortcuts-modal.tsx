import { useEffect, useMemo, useRef, useState } from "react"

import { Search, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModal } from "@/features/modals/services/modal-provider"

import { PresetType, createPresets } from "./presets"

export function KeyboardShortcutsModal() {
  const { t } = useTranslation()
  const { closeModal } = useModal()

  // Создаем предустановки с локализацией
  const PRESETS = useMemo(() => createPresets(t), [t])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPreset, setSelectedPreset] = useState<PresetType>("Timeline")

  // Получаем категории на основе выбранной предустановки
  const categories = useMemo(() => PRESETS[selectedPreset], [PRESETS, selectedPreset])
  const [editingShortcut, setEditingShortcut] = useState<{
    categoryIndex: number
    shortcutIndex: number
  } | null>(null)
  const [listeningForKeys, setListeningForKeys] = useState(false)

  // Ref для контейнера с категориями
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeSection, setActiveSection] = useState<number>(0)

  // Флаг для отслеживания первого рендера
  const isInitialRender = useRef(true)

  // Фильтрация категорий и горячих клавиш по поисковому запросу
  const filteredCategories = useMemo(() => {
    return searchQuery
      ? categories
          .map((category) => ({
            ...category,
            shortcuts: category.shortcuts.filter(
              (shortcut) =>
                shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                shortcut.keys.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
          }))
          .filter((category) => category.shortcuts.length > 0)
      : categories
  }, [categories, searchQuery])

  // Сбрасываем состояние при изменении фильтрованных категорий
  useEffect(() => {
    // Сбрасываем режим редактирования при смене предустановки или фильтра
    setEditingShortcut(null)
    setListeningForKeys(false)

    // Сбрасываем активную секцию
    setActiveSection(0)

    // Прокручиваем к началу при изменении фильтра
    const timeoutId = setTimeout(() => {
      const scrollContainer = scrollContainerRef.current
      if (scrollContainer) {
        scrollContainer.scrollTop = 0
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [filteredCategories])

  // Полностью отказываемся от автоматического scroll spy
  // Вместо этого будем просто устанавливать активную секцию при клике на категорию
  // и при прокрутке не будем менять активную секцию

  // Добавляем обработчик клика вне для отмены редактирования
  useEffect(() => {
    if (!listeningForKeys) return

    const handleClickOutside = () => {
      if (editingShortcut) {
        setEditingShortcut(null)
        setListeningForKeys(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [listeningForKeys])

  // Добавляем обработчик нажатия Escape для отмены редактирования
  useEffect(() => {
    if (!listeningForKeys) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingShortcut) {
          setEditingShortcut(null)
          setListeningForKeys(false)
        }
      }
    }

    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [listeningForKeys])

  // Эффект для инициализации при первом рендере
  useEffect(() => {
    // Сбрасываем флаг первого рендера
    isInitialRender.current = false

    // Устанавливаем активную секцию на первую
    setActiveSection(0)

    // Прокручиваем контейнер к началу
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }

    console.log("Component initialized")
  }, [])

  // Обработчик изменения поискового запроса
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Обработчик нажатия клавиш в поле поиска
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нажата только модификатор, добавляем его в поисковый запрос
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
      e.preventDefault()

      // Получаем символ модификатора
      let modifier = ""
      if (e.key === "Meta") modifier = "⌘"
      if (e.key === "Control") modifier = "Ctrl"
      if (e.key === "Alt") modifier = "⌥"
      if (e.key === "Shift") modifier = "⇧"

      // Добавляем модификатор в поисковый запрос, если его еще нет
      if (modifier && !searchQuery.includes(modifier)) {
        setSearchQuery((prev) => prev + modifier)
      }
      return
    }

    // Если нажата комбинация клавиш с модификатором
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) {
      e.preventDefault()

      // Получаем нажатые модификаторы
      const modifiers = []
      if (e.metaKey) modifiers.push("⌘")
      if (e.ctrlKey) modifiers.push("Ctrl")
      if (e.altKey) modifiers.push("⌥")
      if (e.shiftKey) modifiers.push("⇧")

      // Получаем основную клавишу
      let key = e.key

      // Преобразуем специальные клавиши в более читаемый формат
      if (key === " ") key = "Space"
      if (key === "ArrowUp") key = "↑"
      if (key === "ArrowDown") key = "↓"
      if (key === "ArrowLeft") key = "←"
      if (key === "ArrowRight") key = "→"
      if (key === "Escape") key = "Esc"
      if (key === "Delete") key = "Del"

      // Формируем строку с горячей клавишей
      const keyString = [...modifiers, key].join("")

      // Устанавливаем поисковый запрос
      setSearchQuery(keyString)
    }
  }

  // Обработчик изменения предустановки
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value as PresetType)
  }

  // Прокрутка к категории - упрощенная версия
  const scrollToCategory = (index: number) => {
    console.log(`Setting active section to ${index}`)

    // Просто устанавливаем активную секцию
    setActiveSection(index)

    // Находим соответствующую секцию по индексу
    const section = document.getElementById(`category-${index}`)
    const container = scrollContainerRef.current

    if (section && container) {
      try {
        // Вычисляем позицию секции
        const sectionRect = section.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        // Вычисляем позицию секции относительно контейнера
        const relativeTop = sectionRect.top - containerRect.top + container.scrollTop

        // Прокручиваем контейнер к этой позиции
        container.scrollTop = relativeTop

        console.log(`Scrolled container to position ${relativeTop}`)
      } catch (error) {
        console.error("Error scrolling to category:", error)
      }
    } else {
      console.warn(`Cannot scroll to category ${index}: section or container is null`)
    }
  }

  // Начать редактирование горячей клавиши
  const startEditing = (categoryIndex: number, shortcutIndex: number) => {
    console.log(`Starting editing shortcut at category ${categoryIndex}, shortcut ${shortcutIndex}`)
    setEditingShortcut({ categoryIndex, shortcutIndex })
    setListeningForKeys(true)
  }

  // Обработчик глобальных клавиатурных событий
  useEffect(() => {
    if (!listeningForKeys || !editingShortcut) return

    console.log("Setting up global keyboard event listener", {
      listeningForKeys,
      editingShortcut,
    })

    // Функция для обработки клавиатурных событий на уровне окна
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      console.log("Key event received:", e.key)

      // Проверяем, что мы все еще в режиме прослушивания
      if (!listeningForKeys || !editingShortcut) {
        console.log("Not listening for keys or no editing shortcut")
        return
      }

      // Предотвращаем стандартное поведение
      e.preventDefault()
      e.stopPropagation()

      console.log(
        "Global key down event:",
        e.key,
        "Meta:",
        e.metaKey,
        "Ctrl:",
        e.ctrlKey,
        "Alt:",
        e.altKey,
        "Shift:",
        e.shiftKey,
      )

      // Получаем нажатые модификаторы
      const modifiers = []
      if (e.metaKey) modifiers.push("⌘")
      if (e.ctrlKey) modifiers.push("Ctrl")
      if (e.altKey) modifiers.push("⌥")
      if (e.shiftKey) modifiers.push("⇧")

      // Получаем основную клавишу
      let key = e.key

      // Преобразуем специальные клавиши в более читаемый формат
      if (key === " ") key = "Space"
      if (key === "ArrowUp") key = "↑"
      if (key === "ArrowDown") key = "↓"
      if (key === "ArrowLeft") key = "←"
      if (key === "ArrowRight") key = "→"
      if (key === "Escape") key = "Esc"
      if (key === "Delete") key = "Del"

      // Игнорируем нажатия только модификаторов
      if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
        console.log("Ignoring modifier key:", e.key)
        return
      }

      // Формируем строку с горячей клавишей
      const keyString = [...modifiers, key].join("")
      console.log("Generated key string:", keyString)

      try {
        // Обновляем предустановку в PRESETS напрямую
        const { categoryIndex, shortcutIndex } = editingShortcut
        console.log("Updating shortcut at:", {
          categoryIndex,
          shortcutIndex,
          keyString,
        })

        PRESETS[selectedPreset][categoryIndex].shortcuts[shortcutIndex].keys = keyString

        // Вызываем перерендер, обновляя предустановку
        setSelectedPreset((prev) => prev)

        console.log("Shortcut updated successfully")
      } catch (error) {
        console.error("Error updating shortcut:", error)
      }

      // Завершаем режим редактирования
      setEditingShortcut(null)
      setListeningForKeys(false)
    }

    // Добавляем обработчик события keydown на уровне окна (window вместо document)
    window.addEventListener("keydown", handleGlobalKeyDown, true)

    // Добавляем обработчик для клика, чтобы отменить режим редактирования при клике вне
    const handleGlobalClick = () => {
      if (listeningForKeys && editingShortcut) {
        console.log("Canceling editing due to click outside")
        setEditingShortcut(null)
        setListeningForKeys(false)
      }
    }

    // Добавляем обработчик клика с задержкой, чтобы не сработал сразу при открытии
    const clickTimeout = setTimeout(() => {
      window.addEventListener("click", handleGlobalClick, true)
    }, 100)

    return () => {
      // Удаляем обработчики при размонтировании
      window.removeEventListener("keydown", handleGlobalKeyDown, true)
      window.removeEventListener("click", handleGlobalClick, true)
      clearTimeout(clickTimeout)
      console.log("Global event listeners removed")
    }
  }, [listeningForKeys, editingShortcut, PRESETS, selectedPreset])

  // Обработчик нажатия клавиш в компоненте (не используется, так как мы используем глобальные события)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Просто предотвращаем стандартное поведение, так как мы используем глобальные события
    if (listeningForKeys) {
      e.preventDefault()
      e.stopPropagation()

      console.log(
        "Key down event:",
        e.key,
        "Meta:",
        e.metaKey,
        "Ctrl:",
        e.ctrlKey,
        "Alt:",
        e.altKey,
        "Shift:",
        e.shiftKey,
      )

      // Получаем нажатые модификаторы
      const modifiers = []
      if (e.metaKey) modifiers.push("⌘")
      if (e.ctrlKey) modifiers.push("Ctrl")
      if (e.altKey) modifiers.push("⌥")
      if (e.shiftKey) modifiers.push("⇧")

      // Получаем основную клавишу
      let key = e.key

      // Преобразуем специальные клавиши в более читаемый формат
      if (key === " ") key = "Space"
      if (key === "ArrowUp") key = "↑"
      if (key === "ArrowDown") key = "↓"
      if (key === "ArrowLeft") key = "←"
      if (key === "ArrowRight") key = "→"
      if (key === "Escape") key = "Esc"
      if (key === "Delete") key = "Del"

      // Игнорируем нажатия только модификаторов
      if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
        return
      }

      // Формируем строку с горячей клавишей
      const keyString = [...modifiers, key].join("")
      console.log("Generated key string:", keyString)

      try {
        // Вместо обновления категорий, просто обновляем выбранную предустановку
        // Это вызовет пересчет useMemo для categories
        setSelectedPreset((prev) => {
          // Обновляем предустановку в PRESETS напрямую
          // Это безопасно, так как PRESETS - это объект, созданный с помощью useMemo
          const { categoryIndex, shortcutIndex } = editingShortcut!
          PRESETS[prev][categoryIndex].shortcuts[shortcutIndex].keys = keyString
          return prev
        })

        console.log("Shortcut updated successfully")
      } catch (error) {
        console.error("Error updating shortcut:", error)
      }

      // Завершаем режим редактирования
      setEditingShortcut(null)
      setListeningForKeys(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden p-4">
      {/* Верхняя часть с поиском и выбором предустановки */}
      <div className="flex-shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex w-1/2 items-center space-x-2">
            {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
            <label className="text-sm whitespace-nowrap">
              {t("dialogs.keyboardShortcuts.switchPreset", "Переключиться на другую предустановку ярлыков:")}
            </label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Timeline">{t("dialogs.keyboardShortcuts.presets.timeline", "Timeline")}</SelectItem>
                <SelectItem value="Wondershare Filmora">
                  {t("dialogs.keyboardShortcuts.presets.filmora", "Wondershare Filmora")}
                </SelectItem>
                <SelectItem value="Adobe Premier Pro">
                  {t("dialogs.keyboardShortcuts.presets.premiere", "Adobe Premier Pro")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="relative w-1/3">
            <Search className="absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
              placeholder={t("dialogs.keyboardShortcuts.searchShortcuts", "Поиск сочетаний клавиш")}
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              className="pr-8 pl-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                aria-label={t("dialogs.keyboardShortcuts.clearSearch", "Очистить поиск")}
              >
                <X />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <p>
            {t(
              "dialogs.keyboardShortcuts.editHint",
              "Нажмите на сочетание клавиш, чтобы изменить его. Нажмите нужные клавиши для установки нового сочетания.",
            )}
          </p>
          <p className="mt-1">
            {t(
              "dialogs.keyboardShortcuts.searchHint",
              "Вы можете искать по названию или нажать комбинацию клавиш в поле поиска.",
            )}
          </p>
        </div>
      </div>

      {/* Средняя часть с категориями и горячими клавишами */}
      <div className="mt-4 mb-4 flex flex-1 min-h-0 overflow-hidden">
        {/* Левая панель с категориями */}
        <div className="w-1/4 overflow-y-auto border-r border-gray-200 pr-2 dark:border-gray-700">
          <div className="space-y-1">
            {filteredCategories.map((category, index) => (
              <Button
                key={category.id}
                variant={activeSection === index ? "default" : "ghost"}
                className={`w-full cursor-pointer justify-start ${activeSection === index ? "bg-[#00CCC0] text-black dark:bg-[#00CCC0] dark:text-black" : ""}`}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log(`Clicked on category ${index}: ${category.name}`)
                  scrollToCategory(index)
                }}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Правая панель с горячими клавишами */}
        <div className="w-3/4 overflow-y-auto pl-4 flex-1" ref={scrollContainerRef}>
          {filteredCategories.map((category, index) => {
            return (
              <div key={category.id} id={`category-${index}`} className="mb-6">
                <h3 className="mb-2 text-lg font-medium">{category.name}</h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, shortcutIndex) => {
                    const isEditing =
                      editingShortcut &&
                      editingShortcut.categoryIndex === index &&
                      editingShortcut.shortcutIndex === shortcutIndex

                    return (
                      <div
                        key={shortcut.id}
                        className={`flex items-center justify-between rounded border-b border-gray-100 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${isEditing ? "ring-2 ring-[#00CCC0]" : ""} cursor-pointer`}
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditing(index, shortcutIndex)
                        }}
                        onKeyDown={(e) => {
                          e.stopPropagation()
                          handleKeyDown(e)
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Edit shortcut ${shortcut.name}`}
                      >
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{shortcut.name}</span>
                        <div
                          className={`px-3 py-1.5 ${isEditing ? "bg-[#00CCC0] text-black" : "bg-gray-100 dark:bg-gray-700"} min-w-[100px] rounded text-center font-sans text-sm tracking-wide shadow-sm transition-all`}
                        >
                          {isEditing ? (
                            <span className="animate-pulse">
                              {t("dialogs.keyboardShortcuts.pressKeys", "Нажмите клавиши...")}
                            </span>
                          ) : (
                            <span className="font-medium tracking-wide">{shortcut.keys}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Нижняя часть с кнопками */}
      <div className="mt-4 flex-shrink-0 flex justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="cursor-pointer px-4"
            onClick={() => {
              // Сбрасываем настройки к значениям по умолчанию
              const freshPresets = createPresets(t)
              // Обновляем PRESETS напрямую
              Object.assign(PRESETS, freshPresets)
              // Вызываем перерендер, обновляя предустановку
              setSelectedPreset((prev) => prev)
              setEditingShortcut(null)
              setListeningForKeys(false)
            }}
          >
            {t("dialogs.keyboardShortcuts.resetDefaults", "Восстановление значений по умолчанию")}
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer px-6"
            onClick={() => {
              closeModal()
            }}
          >
            {t("dialogs.keyboardShortcuts.cancel", "Отменить")}
          </Button>
        </div>
        <Button
          className="cursor-pointer bg-[#00CCC0] px-6 text-black hover:bg-[#00AAA0]"
          onClick={() => {
            closeModal()
          }}
        >
          {t("dialogs.keyboardShortcuts.ok", "OK")}
        </Button>
      </div>
    </div>
  )
}
