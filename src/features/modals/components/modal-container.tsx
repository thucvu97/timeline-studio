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

  // Рендерим все модальные окна, но показываем только активное
  const renderAllModals = () => {
    return (
      <>
        {/* ProjectSettingsModal */}
        <div
          style={{
            display: modalType === "project-settings" ? "block" : "none",
          }}
        >
          <ProjectSettingsModal />
        </div>

        {/* KeyboardShortcutsModal */}
        <div
          style={{
            display: modalType === "keyboard-shortcuts" ? "block" : "none",
          }}
        >
          <KeyboardShortcutsModal />
        </div>

        {/* UserSettingsModal */}
        <div
          style={{ display: modalType === "user-settings" ? "block" : "none" }}
        >
          <UserSettingsModal />
        </div>

        {/* CameraCaptureModal */}
        <div
          style={{ display: modalType === "camera-capture" ? "block" : "none" }}
        >
          <CameraCaptureModal />
        </div>

        {/* VoiceRecordModal */}
        <div
          style={{
            display: modalType === "voice-recording" ? "block" : "none",
          }}
        >
          <VoiceRecordModal />
        </div>

        {/* ExportModal */}
        <div style={{ display: modalType === "export" ? "block" : "none" }}>
          <ExportModal />
        </div>
      </>
    )
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
        {renderAllModals()}
      </DialogContent>
    </Dialog>
  )
}
