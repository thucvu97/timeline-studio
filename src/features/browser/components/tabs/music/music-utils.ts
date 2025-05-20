import { MediaFile } from "@/types/media"

/**
 * Сортирует массив медиафайлов по указанному критерию
 *
 * @param files - Массив медиафайлов для сортировки
 * @param sortBy - Критерий сортировки (name, title, artist, date, duration, size, genre)
 * @param sortOrder - Порядок сортировки (asc - по возрастанию, desc - по убыванию)
 * @returns Отсортированный массив медиафайлов
 */
export const sortFiles = (
  files: MediaFile[],
  sortBy: string,
  sortOrder: "asc" | "desc",
): MediaFile[] => {
  return [...files].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "name":
        comparison = String(
          a.probeData?.format.tags?.TOPE ?? a.name,
        ).localeCompare(String(b.probeData?.format.tags?.TOPE ?? b.name))
        break
      case "title":
        comparison = String(
          a.probeData?.format.tags?.title ?? a.name,
        ).localeCompare(String(b.probeData?.format.tags?.title ?? b.name))
        break
      case "artist":
        comparison = String(
          a.probeData?.format.tags?.artist ?? "",
        ).localeCompare(String(b.probeData?.format.tags?.artist ?? ""))
        break
      case "date":
        comparison =
          new Date(a.probeData?.format.tags?.date ?? "1970-01-01").getTime() -
          new Date(b.probeData?.format.tags?.date ?? "1970-01-01").getTime()
        break
      case "duration":
        comparison =
          (a.probeData?.format.duration ?? 0) -
          (b.probeData?.format.duration ?? 0)
        break
      case "size":
        comparison =
          (a.probeData?.format.size ?? 0) - (b.probeData?.format.size ?? 0)
        break
      case "genre":
        comparison = String(
          a.probeData?.format.tags?.genre ?? "",
        ).localeCompare(String(b.probeData?.format.tags?.genre ?? ""))
        break
      default:
        comparison = 0
    }

    return sortOrder === "asc" ? comparison : -comparison
  })
}

/**
 * Фильтрует массив медиафайлов по различным критериям
 *
 * @param files - Массив медиафайлов для фильтрации
 * @param searchQuery - Строка поиска
 * @param filterType - Тип файла для фильтрации (all - все типы)
 * @param showFavoritesOnly - Показывать только избранные файлы
 * @param mediaContext - Контекст медиа для проверки избранных файлов
 * @returns Отфильтрованный массив медиафайлов
 */
export const filterFiles = (
  files: MediaFile[],
  searchQuery: string,
  filterType: string,
  showFavoritesOnly = false,
  mediaContext: any = null,
): MediaFile[] => {
  let filtered = files
  console.log("Всего файлов:", files.length)

  // Фильтрация по типу файла
  if (filterType !== "all") {
    filtered = filtered.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase()
      return extension === filterType
    })
    console.log("После фильтрации по типу:", filtered.length)
  }

  // Фильтрация по избранному
  if (showFavoritesOnly && mediaContext) {
    filtered = filtered.filter((file) => {
      return mediaContext.isItemFavorite(file, "audio")
    })
    console.log("После фильтрации по избранному:", filtered.length)
  }

  // Фильтрация по поисковому запросу
  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        String(file.probeData?.format.tags?.title ?? "")
          .toLowerCase()
          .includes(query) ||
        String(file.probeData?.format.tags?.artist ?? "")
          .toLowerCase()
          .includes(query) ||
        String(file.probeData?.format.tags?.genre ?? "")
          .toLowerCase()
          .includes(query),
    )
    console.log("После фильтрации по поиску:", filtered.length)
  }

  return filtered
}
