import React from "react"

import { useTranslation } from "react-i18next"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProjectSettingsModal } from "@/features/project-settings/project-settings-modal"
import { UserSettingsModal } from "@/features/user-settings/user-settings-modal"

import { getDialogClassForType } from "../services/modal-machine"
import { useModal } from "../services/modal-provider"

import {
  CameraCaptureModal,
  ExportModal,
  KeyboardShortcutsModal,
  VoiceRecordModal,
} from "."

/**
 * Контейнер для модальных окон
 */
export function ModalContainer() {
  const { modalType, modalData, isOpen, closeModal } = useModal()
  const { t } = useTranslation() // Получаем функцию перевода

  // Функция для рендеринга содержимого модального окна
  const renderModalContent = () => {
    switch (modalType) {
      case "project-settings":
        return <ProjectSettingsModal />
      case "keyboard-shortcuts":
        return <KeyboardShortcutsModal />
      case "user-settings":
        return <UserSettingsModal />
      case "camera-capture":
        return <CameraCaptureModal />
      case "voice-recording":
        return <VoiceRecordModal />
      case "export":
        return <ExportModal />
      default:
        return null
    }
  }

  // Функция для получения заголовка модального окна с использованием i18n
  const getModalTitle = () => {
    switch (modalType) {
      case "project-settings":
        return t("modals.projectSettings.title", "Настройки проекта")
      case "keyboard-shortcuts":
        return t("modals.keyboardShortcuts.title", "Горячие клавиши")
      case "user-settings":
        return t("modals.userSettings.title", "Настройки пользователя")
      case "camera-capture":
        return t("modals.cameraCapture.title", "Запись с камеры")
      case "voice-recording":
        return t("modals.voiceRecording.title", "Запись голоса")
      case "export":
        return t("modals.export.title", "Экспорт")
      case "none":
        return ""
      default:
        return ""
    }
  }

  // Получаем класс размера из данных модального окна или используем значение из функции getDialogClassForType
  const dialogClass = modalData?.dialogClass ?? getDialogClassForType(modalType)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        aria-describedby="modal"
        className={
          dialogClass + " bg-[#dfdfdf] dark:bg-[#1e1e1e] [&>button]:hidden"
        }
      >
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        {renderModalContent()}
      </DialogContent>
    </Dialog>
  )
}
