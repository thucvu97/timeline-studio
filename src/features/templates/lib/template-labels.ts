import i18n from "@/i18n";

export interface TemplateDescription {
  id: string;
}

/**
 * Функция для получения локализованного названия шаблона по id
 * @param id Идентификатор шаблона
 * @returns Локализованное название шаблона
 */
export function getTemplateLabels(id: string): string {
  return i18n.t(`templates.templateLabels.${id}`);
}

/**
 * Функция для получения локализованного описания шаблона по id
 * @param id Идентификатор шаблона
 * @returns Локализованное описание шаблона
 */
export function getTemplateDescription(id: string): string {
  return i18n.t(`templates.templateDescriptions.${id}`);
}
