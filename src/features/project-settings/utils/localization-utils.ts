/**
 * Утилиты для локализации настроек проекта
 */

/**
 * Функция для получения локализованного названия соотношения сторон
 * Преобразует текстовые метки в локализованные строки
 *
 * @param {string} textLabel - Текстовая метка соотношения сторон
 * @param {Function} t - Функция перевода из react-i18next
 * @returns {string} Локализованное название соотношения сторон
 */
export function getAspectRatioLabel(textLabel: string, t: (key: string) => string): string {
  // Карта соответствия текстовых меток и ключей локализации
  const labelMap: Record<string, string> = {
    Широкоэкнранный: t("dialogs.projectSettings.aspectRatioLabels.widescreen"),
    Портрет: t("dialogs.projectSettings.aspectRatioLabels.portrait"),
    "Социальные сети": t("dialogs.projectSettings.aspectRatioLabels.social"),
    Стандарт: t("dialogs.projectSettings.aspectRatioLabels.standard"),
    Вертикальный: t("dialogs.projectSettings.aspectRatioLabels.vertical"),
    Кинотеатр: t("dialogs.projectSettings.aspectRatioLabels.cinema"),
  }

  // Возвращаем локализованную строку или исходную метку, если перевод не найден
  return labelMap[textLabel] || textLabel
}

/**
 * Получает локализованный текст для заблокированного соотношения сторон
 *
 * @param {string} ratio - Соотношение сторон
 * @param {Function} t - Функция перевода из react-i18next
 * @returns {string} Локализованный текст
 */
export function getLockedAspectRatioText(ratio: string, t: (key: string, options?: any) => string): string {
  return t("dialogs.projectSettings.aspectRatioLocked", { ratio })
}

/**
 * Получает локализованный текст для разблокированного соотношения сторон
 *
 * @param {string} ratio - Соотношение сторон
 * @param {Function} t - Функция перевода из react-i18next
 * @returns {string} Локализованный текст
 */
export function getUnlockedAspectRatioText(ratio: string, t: (key: string, options?: any) => string): string {
  return t("dialogs.projectSettings.aspectRatioUnlocked", { ratio })
}

/**
 * Получает локализованный текст для пользовательского соотношения сторон
 *
 * @param {Function} t - Функция перевода из react-i18next
 * @returns {string} Локализованный текст
 */
export function getCustomAspectRatioText(t: (key: string) => string): string {
  return t("dialogs.projectSettings.aspectRatioLabels.custom")
}
