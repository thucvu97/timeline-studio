import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CameraCaptureModal } from "@/features/camera-capture"
import { ExportModal } from "@/features/export"
import { KeyboardShortcutsModal } from "@/features/keyboard-shortcuts"
import { CacheSettingsModal } from "@/features/media/components/cache-settings-modal"
import { ProjectSettingsModal } from "@/features/project-settings"
import { UserSettingsModal } from "@/features/user-settings"
import { CacheStatisticsModal } from "@/features/video-compiler/components/cache-statistics-modal"
import { VoiceRecordModal } from "@/features/voice-recording"

import { ModalType, useModal } from "../services"

/**
 * Контейнер для модальных окон
 */
export function ModalContainer() {
  const { modalType, modalData, isOpen, closeModal } = useModal()
  const { t } = useTranslation() // Получаем функцию перевода

  // Рендерим только активное модальное окно с помощью switch
  const renderAllModals = () => {
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
      case "cache-settings":
        return <CacheSettingsModal />
      case "cache-statistics":
        return <CacheStatisticsModal />
      default:
        return null
    }
  }

  const getDialogClassForType = (modalType: ModalType): string => {
    switch (modalType) {
      case "camera-capture":
        return "h-[max(600px,min(70vh,800px))] w-[max(700px,min(80vw,900px))]"
      case "voice-recording":
        return "h-[max(500px,min(60vh,700px))] w-[max(600px,min(70vw,800px))]"
      case "export":
        return "h-[max(700px,min(80vh,900px))] w-[max(800px,min(90vw,1200px))]"
      case "project-settings":
        return "h-[450px] w-[500px]"
      case "user-settings":
        return "h-[700px] w-[600px]"
      case "keyboard-shortcuts":
        return "h-[max(600px,min(70vh,1000px))] w-[1200px]"
      case "cache-settings":
        return "h-[max(700px,min(80vh,900px))] w-[666px]"
      case "cache-statistics":
        return "h-[max(600px,min(70vh,800px))] w-[666px]"
      default:
        return "h-[max(600px,min(50vh,800px))]"
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
      case "cache-settings":
        return t("modals.cacheSettings.title", "Настройки кэша")
      case "cache-statistics":
        return t("modals.cacheStatistics.title", "Статистика кэша")
      case "none":
        return ""
      default:
        return ""
    }
  }

  const dialogClass = modalData?.dialogClass ?? getDialogClassForType(modalType)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        aria-describedby="modal"
        className={`${dialogClass} bg-[#dfdfdf] dark:bg-[#1e1e1e] [&>button]:cursor-pointer px-4 py-2 flex flex-col`}
      >
        <DialogHeader className="flex-shrink-0 h-[50px] flex items-center justify-center">
          <DialogTitle className="text-center">{getModalTitle()}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">{renderAllModals()}</div>
      </DialogContent>
    </Dialog>
  )
}
