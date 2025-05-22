import { useTranslation } from "react-i18next"

/**
 * Компонент для отображения сообщения об отсутствии файлов
 *
 * Функционал:
 * - Отображает информационное сообщение, когда в браузере нет файлов
 * - Показывает пути к директориям, куда можно добавить файлы
 * - Отображает информацию о поддерживаемых форматах файлов
 * - Адаптирован для темной и светлой темы
 */
export function NoFiles() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 py-10 text-center">
      <div className="text-l">{t("browser.noFiles.title")}</div>
      <div className="text-sm">{t("browser.noFiles.addFilesPrompt")}</div>
      <div className="flex flex-col gap-2 text-sm">
        <div className="">
          <code className="rounded px-2 py-1">/public/media/</code>
          <span className="ml-2">{t("browser.noFiles.mediaTypes")}</span>
        </div>
        <div className="">
          <code className="rounded px-2 py-1">/public/music/</code>
          <span className="ml-2">{t("browser.noFiles.musicType")}</span>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {t("browser.noFiles.supportedVideoFormats")}
        <br />
        {t("browser.noFiles.supportedAudioFormats")}
      </div>
    </div>
  )
}
