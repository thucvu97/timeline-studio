import React from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { getDialogClassForType } from "../services/modal-machine"
import { useModal } from "../services/modal-provider"

import {
  CameraCaptureModal,
  ExportModal,
  KeyboardShortcutsModal,
  ProjectSettingsModal,
  UserSettingsModal,
  VoiceRecordModal,
} from "."

/**
 * Контейнер для модальных окон
 */
export function ModalContainer() {
  const { modalType, modalData, isOpen, closeModal } = useModal()

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

  // Функция для получения заголовка модального окна
  const getModalTitle = () => {
    switch (modalType) {
      case "project-settings":
        return "Настройки проекта"
      case "keyboard-shortcuts":
        return "Горячие клавиши"
      case "user-settings":
        return "Настройки пользователя"
      case "camera-capture":
        return "Запись с камеры"
      case "voice-recording":
        return "Запись голоса"
      case "export":
        return "Экспорт"
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
      <DialogContent className={dialogClass}>
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        {renderModalContent()}
      </DialogContent>
    </Dialog>
  )
}
