import { useEffect, useState } from "react"

import { useHotkeys } from "react-hotkeys-hook"

import { useModal } from "@/features/modals/services/modal-provider"

/**
 * Хук для обработки горячих клавиш приложения
 */
export function useAppHotkeys() {
  const { openModal } = useModal()
  const [isEnabled, setIsEnabled] = useState(true)

  // Настройки пользователя (Option+Command+точка)
  useHotkeys(
    "alt+meta+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (alt+meta+.)")
      openModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Альтернативный вариант для настроек пользователя
  useHotkeys(
    "option+command+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (option+command+.)")
      openModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек пользователя
  useHotkeys(
    "opt+cmd+.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (opt+cmd+.)")
      openModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек пользователя с символами
  useHotkeys(
    "⌥⌘.",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (⌥⌘.)")
      openModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек пользователя с другим синтаксисом
  useHotkeys(
    "alt+command+period",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек пользователя сработала! (alt+command+period)")
      openModal("user-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Настройки проекта (Option+Command+запятая)
  useHotkeys(
    "alt+meta+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (alt+meta+,)")
      openModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Альтернативный вариант для настроек проекта
  useHotkeys(
    "option+command+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (option+command+,)")
      openModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек проекта
  useHotkeys(
    "opt+cmd+,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (opt+cmd+,)")
      openModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек проекта с символами
  useHotkeys(
    "⌥⌘,",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (⌥⌘,)")
      openModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для настроек проекта с другим синтаксисом
  useHotkeys(
    "alt+command+comma",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для настроек проекта сработала! (alt+command+comma)")
      openModal("project-settings")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Горячие клавиши (Option+Command+K)
  useHotkeys(
    "alt+meta+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (alt+meta+k)")
      openModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Альтернативный вариант для быстрых клавиш
  useHotkeys(
    "option+command+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (option+command+k)")
      openModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для быстрых клавиш
  useHotkeys(
    "opt+cmd+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (opt+cmd+k)")
      openModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для быстрых клавиш с символами
  useHotkeys(
    "⌥⌘k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (⌥⌘k)")
      openModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Еще один вариант для быстрых клавиш с другим синтаксисом
  useHotkeys(
    "alt+command+k",
    (event) => {
      event.preventDefault()
      console.log("Горячая клавиша для быстрых клавиш сработала! (alt+command+k)")
      openModal("keyboard-shortcuts")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [openModal, isEnabled],
  )

  // Тестовый обработчик для клавиши запятая
  useHotkeys(
    ",",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (,)")
      alert("Тестовая горячая клавиша сработала! (,)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled],
  )

  // Тестовый обработчик для клавиши k
  useHotkeys(
    "k",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (k)")
      alert("Тестовая горячая клавиша сработала! (k)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled],
  )

  // Тестовый обработчик для клавиши точка
  useHotkeys(
    ".",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (.)")
      alert("Тестовая горячая клавиша сработала! (.)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled],
  )

  // Тестовый обработчик для клавиши alt+k
  useHotkeys(
    "alt+k",
    (event) => {
      event.preventDefault()
      console.log("Тестовая горячая клавиша сработала! (alt+k)")
      alert("Тестовая горячая клавиша сработала! (alt+k)")
    },
    {
      enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
      preventDefault: true,
      enabled: isEnabled,
    },
    [isEnabled],
  )

  // Отключаем горячие клавиши, когда открыто модальное окно редактирования горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Если открыто модальное окно редактирования горячих клавиш, отключаем горячие клавиши
      if (e.key === "Escape") {
        setIsEnabled(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return null
}
