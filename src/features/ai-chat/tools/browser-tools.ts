/**
 * AI инструменты для работы с медиа браузером (модульная версия)
 *
 * Этот файл экспортирует все Browser инструменты из модульной структуры
 * и предоставляет функции для обратной совместимости
 */

// Импортируем функции выполнения
import { analyzeMediaBrowser } from "./browser/analyze-browser"
import { getBrowserState, updateBrowserFilters } from "./browser/browser-state"
import { analyzeMissingContent, exportFileList, suggestImportSources } from "./browser/content-analysis"
import { analyzeFileRelationships, bulkSelectFiles, getFileGroups } from "./browser/file-operations"
import { searchMediaFiles } from "./browser/search-files"

import type {
  AnalyzeBrowserParams,
  AnalyzeMissingParams,
  BrowserStateParams,
  BrowserToolResult,
  BulkSelectParams,
  ExportFileListParams,
  FileGroupsParams,
  FileRelationshipsParams,
  SearchMediaParams,
  SuggestImportParams,
  UpdateFiltersParams,
} from "./browser/types"

// Экспортируем инструменты для обратной совместимости
export {
  type BrowserStateAccess,
  type BrowserToolResult,
  browserTools,
  setBrowserStateAccess,
} from "./browser"

/**
 * Выполняет инструменты Browser
 */
export async function executeBrowserTool(toolName: string, input: Record<string, any>): Promise<BrowserToolResult> {
  try {
    switch (toolName) {
      case "analyze_media_browser":
        return await analyzeMediaBrowser(input as AnalyzeBrowserParams)

      case "search_media_files":
        return await searchMediaFiles(input as SearchMediaParams)

      case "get_file_groups":
        return await getFileGroups(input as FileGroupsParams)

      case "analyze_file_relationships":
        return await analyzeFileRelationships(input as FileRelationshipsParams)

      case "bulk_select_files":
        return await bulkSelectFiles(input as BulkSelectParams)

      case "get_browser_state":
        return await getBrowserState(input as BrowserStateParams)

      case "update_browser_filters":
        return await updateBrowserFilters(input as UpdateFiltersParams)

      case "analyze_missing_content":
        return await analyzeMissingContent(input as AnalyzeMissingParams)

      case "suggest_import_sources":
        return await suggestImportSources(input as SuggestImportParams)

      case "export_file_list":
        return await exportFileList(input as ExportFileListParams)

      default:
        throw new Error(`Неизвестный browser инструмент: ${toolName}`)
    }
  } catch (error) {
    console.error(`Ошибка выполнения browser tool ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
