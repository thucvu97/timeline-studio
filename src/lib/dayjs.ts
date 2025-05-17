/* eslint-disable */
// @ts-nocheck
import dayjs from "dayjs"
import duration from "dayjs/plugin/duration"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"

// Инициализируем плагины dayjs
dayjs.extend(duration)
dayjs.extend(utc)
dayjs.extend(timezone)

export default dayjs
