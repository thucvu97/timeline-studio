/* eslint-disable */
// @ts-nocheck
/**
 * Модуль для работы с датами и временем на основе библиотеки dayjs
 *
 * @module dayjs
 *
 * @description
 * Этот модуль экспортирует настроенный экземпляр dayjs с подключенными плагинами:
 * - duration - для работы с длительностями
 * - utc - для работы с UTC временем
 * - timezone - для работы с часовыми поясами
 *
 * @example
 * ```ts
 * import dayjs from '@/lib/dayjs';
 *
 * // Форматирование даты
 * const formattedDate = dayjs().format('DD.MM.YYYY');
 *
 * // Работа с UTC
 * const utcDate = dayjs.utc();
 *
 * // Работа с часовыми поясами
 * const localDate = dayjs().tz(dayjs.tz.guess());
 *
 * // Работа с длительностями
 * const duration = dayjs.duration(5, 'minutes');
 * ```
 */
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

// Инициализируем плагины dayjs
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default dayjs
