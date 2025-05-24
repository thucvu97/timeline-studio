import type { MouseEvent } from "react";
import { useMemo, useRef, useState } from "react";

import { CirclePause, CirclePlay, Pause, Play } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddMediaButton } from "@/features/browser/components/layout/add-media-button";
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button";
import { NoFiles } from "@/features/browser/components/layout/no-files";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { MediaFile } from "@/types/media";
import { MusicResource } from "@/types/resources";

import { useMusic } from "./music-provider";
import { MusicToolbar } from "./music-toolbar";
import { sortFiles } from "./music-utils";
import { useMedia } from "../browser/media";
import { useResources } from "../resources";
import { useMusicImport } from "./use-music-import";

/**
 * Компонент для отображения списка музыкальных файлов
 * Позволяет просматривать, воспроизводить, фильтровать и добавлять музыкальные файлы в проект
 *
 * @returns {JSX.Element} Компонент списка музыкальных файлов
 */
export function MusicList() {
  const { t } = useTranslation(); // Хук для интернационализации
  const [activeFile, setActiveFile] = useState<MediaFile | null>(null); // Активный (воспроизводимый) файл
  const [isPlaying, setIsPlaying] = useState(false); // Состояние воспроизведения
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ссылка на аудио-элемент

  // Получаем методы для работы с ресурсами
  const { addMusic, removeResource, musicResources, isMusicFileAdded } =
    useResources();

  // Получаем состояние из музыкальной машины состояний
  const {
    filteredFiles, // Отфильтрованные музыкальные файлы
    sortBy, // Текущий критерий сортировки
    sortOrder, // Порядок сортировки (asc/desc)
    viewMode, // Режим отображения (list/thumbnails)
    showFavoritesOnly, // Флаг отображения только избранных файлов
    groupBy, // Группировка файлов (none/artist/genre/album)
    isLoading, // Флаг загрузки
    isError, // Флаг ошибки
    error, // Сообщение об ошибке
  } = useMusic();

  const media = useMedia(); // Хук для работы с медиа-файлами и избранным

  // Хук для импорта музыкальных файлов
  const { importFile, importDirectory } = useMusicImport();

  /**
   * Мемоизированная функция для группировки и сортировки музыкальных файлов
   * Группирует файлы по выбранному критерию (artist, genre, album) и сортирует их
   */
  const groupedFiles = useMemo(() => {
    // Фильтруем файлы по избранному, если включена соответствующая опция
    const favoritesFilteredFiles = showFavoritesOnly
      ? filteredFiles.filter((file) => media.isItemFavorite(file, "audio"))
      : filteredFiles;

    // Если группировка отключена, возвращаем все файлы в одной группе
    if (groupBy === "none") {
      return { "": favoritesFilteredFiles };
    }

    // Получаем метку для неизвестных значений
    const unknownLabel = t("browser.common.unknown");

    // Группируем файлы по выбранному критерию
    const groups = favoritesFilteredFiles.reduce<Record<string, MediaFile[]>>(
      (acc, file) => {
        // Получаем значение для группировки (artist, genre, album) или "Неизвестно"
        const key = file.probeData?.format.tags?.[groupBy] ?? unknownLabel;
        // Создаем массив для группы, если его еще нет
        if (!acc[key]) {
          acc[key] = [];
        }
        // Добавляем файл в соответствующую группу
        acc[key].push(file);
        return acc;
      },
      {},
    );

    // Сортируем группы по названию
    const sortedGroups = Object.entries(groups).sort(([a], [b]) => {
      // Перемещаем "Неизвестно" в конец списка
      if (a === unknownLabel) return 1;
      if (b === unknownLabel) return -1;

      // Обычная сортировка для остальных элементов
      if (sortOrder === "asc") {
        return a.localeCompare(b); // По возрастанию
      }
      return b.localeCompare(a); // По убыванию
    });

    // Сортируем файлы внутри каждой группы и возвращаем результат
    return Object.fromEntries(
      sortedGroups.map(([group, files]) => [
        group,
        sortFiles(files, sortBy, sortOrder), // Сортируем файлы по выбранному критерию
      ]),
    );
  }, [filteredFiles, groupBy, sortBy, sortOrder, media, showFavoritesOnly, t]);

  /**
   * Обработчик воспроизведения/паузы музыкального файла
   * Управляет воспроизведением аудио и обновляет состояние UI
   *
   * @param {React.MouseEvent} e - Событие клика
   * @param {MediaFile} file - Музыкальный файл для воспроизведения
   */
  const handlePlayPause = (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation(); // Предотвращаем всплытие события

    if (activeFile?.path === file.path) {
      // Если это тот же файл, что уже активен - переключаем воспроизведение/паузу
      setIsPlaying(!isPlaying);
      if (audioRef.current) {
        void (isPlaying ? audioRef.current.pause() : audioRef.current.play());
      }
    } else {
      // Если выбран новый файл - останавливаем текущий и запускаем новый
      if (audioRef.current) {
        audioRef.current.pause(); // Останавливаем текущий аудио
        audioRef.current.removeEventListener("ended", handleAudioEnd); // Удаляем обработчик
      }
      // Создаем новый аудио-элемент
      const audio = new Audio(file.path);
      audio.addEventListener("ended", handleAudioEnd); // Добавляем обработчик окончания
      audioRef.current = audio;
      void audio.play(); // Запускаем воспроизведение
      setActiveFile(file); // Обновляем активный файл
      setIsPlaying(true); // Устанавливаем состояние воспроизведения
    }
  };

  /**
   * Обработчик окончания воспроизведения аудио
   * Вызывается, когда аудио-файл проигран до конца
   */
  const handleAudioEnd = () => {
    setIsPlaying(false); // Сбрасываем состояние воспроизведения
  };

  /**
   * Обработчик импорта музыкальных файлов
   * Использует хук useMusicImport для импорта отдельных файлов
   */
  const handleImport = async () => {
    console.log("Импорт музыкальных файлов");
    try {
      const result = await importFile();
      if (result.success) {
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error);
    }
  };

  /**
   * Обработчик импорта отдельных музыкальных файлов
   * Использует хук useMusicImport для импорта отдельных файлов
   */
  const handleImportFile = async () => {
    console.log("Импорт отдельных музыкальных файлов");
    try {
      const result = await importFile();
      if (result.success) {
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error);
    }
  };

  /**
   * Обработчик импорта папки с музыкальными файлами
   * Использует хук useMusicImport для импорта директории
   */
  const handleImportFolder = async () => {
    console.log("Импорт папки с музыкальными файлами");
    try {
      const result = await importDirectory();
      if (result.success) {
        console.log(result.message);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Ошибка при импорте папки:", error);
    }
  };

  /**
   * Обработчик добавления музыкального файла в проект
   *
   * @param {MouseEvent} e - Событие клика
   * @param {MediaFile} file - Музыкальный файл для добавления
   */
  const handleAdd = (e: MouseEvent, file: MediaFile) => {
    e.stopPropagation(); // Предотвращаем всплытие события

    // Проверяем, не добавлен ли файл уже
    if (isMusicFileAdded(file)) {
      console.log(`[handleAdd] Музыкальный файл ${file.name} уже добавлен`);
      return;
    }

    console.log("[handleAdd] Adding music file:", file.name);

    // Добавляем музыкальный файл в ресурсы проекта
    addMusic(file);
  };

  /**
   * Обработчик удаления музыкального файла из проекта
   *
   * @param {MouseEvent} e - Событие клика
   * @param {MediaFile} file - Музыкальный файл для удаления
   */
  const handleRemove = (e: MouseEvent, file: MediaFile) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log("[handleRemove] Removing music file:", file.name);

    // Находим ресурс с этим музыкальным файлом
    const musicResource = musicResources.find(
      (resource: MusicResource) => resource.resourceId === file.id,
    );

    if (musicResource) {
      removeResource(musicResource.id); // Удаляем ресурс из проекта
    } else {
      console.warn(
        `Не удалось найти ресурс музыкального файла с ID ${file.id} для удаления`,
      );
    }
  };

  return (
    <div className="flex h-full flex-col" data-testid="music-list-container">
      {/* Панель инструментов с кнопками импорта и фильтрации */}
      <MusicToolbar
        onImport={handleImport}
        onImportFile={handleImportFile}
        onImportFolder={handleImportFolder}
      />

      {/* Основной контейнер для списка музыкальных файлов */}
      <div
        className="min-h-0 flex-1 overflow-y-auto p-0 bg-background"
        data-testid="music-list-content"
      >
        {/* Отображение различных состояний, когда нет файлов */}
        {filteredFiles.length === 0 && (
          <>
            {/* Состояние загрузки - отображается индикатор загрузки */}
            {isLoading && (
              <div
                data-testid="music-list-loading"
                className="flex h-full items-center justify-center"
              >
                <p>{t("browser.loading")}</p>
              </div>
            )}

            {/* Состояние ошибки - отображается сообщение об ошибке */}
            {isError && <NoFiles />}

            {/* Пустое состояние - отображается сообщение об отсутствии файлов */}
            {!isLoading && !isError && <NoFiles />}
          </>
        )}

        {/* Отображение сгруппированных музыкальных файлов */}
        {Object.entries(groupedFiles).map(([group, files]) => (
          <div
            key={group}
            className=""
            data-testid={
              group ? `music-list-group-${group}` : "music-list-group-default"
            }
          >
            {/* Заголовок группы (отображается только если группировка включена) */}
            {group && (
              <h2
                className="mb-2 px-4 text-lg font-semibold"
                data-testid="music-list-group-title"
              >
                {group}
              </h2>
            )}

            {/* Отображение в режиме списка */}
            {viewMode === "list" ? (
              <div
                key={group}
                className="h-full overflow-y-hidden"
                data-testid="music-list-view-list"
              >
                <div className="space-y-1">
                  {/* Отображение каждого файла в группе */}
                  {files.map((file) => (
                    <div
                      key={file.path}
                      className="group relative flex cursor-pointer items-center gap-1 rounded-sm border border-transparent p-0 hover:bg-gray-100 dark:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]"
                    >
                      {/* Контейнер для кнопки воспроизведения */}
                      <div className="relative">
                        <div className="flex h-12 w-12 flex-shrink-0 cursor-pointer items-center justify-center rounded">
                          {/* Кнопка воспроизведения/паузы */}
                          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                          <button
                            onClick={(e) => handlePlayPause(e, file)}
                            className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded bg-black/30 opacity-50 transition-opacity duration-200 group-hover:opacity-100 ${
                              activeFile?.path === file.path
                                ? "opacity-100"
                                : ""
                            }`}
                          >
                            {/* Иконка в зависимости от состояния воспроизведения */}
                            {activeFile?.path === file.path && isPlaying ? (
                              <CirclePause className="h-6 w-6 text-white" />
                            ) : (
                              <CirclePlay className="h-6 w-6 text-white" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Информация о музыкальном файле */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                      <div
                        className="flex h-12 min-w-0 flex-1 flex-col justify-between p-1"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        {/* Верхняя строка: название и длительность */}
                        <div className="flex items-center justify-between">
                          {/* Название трека (из метаданных или имя файла) */}
                          <p className="max-w-[300px] truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.tags?.title ?? file.name}
                          </p>
                          {/* Длительность трека */}
                          <p className="min-w-12 text-right text-xs text-gray-900 dark:text-gray-100">
                            {file.probeData?.format.duration && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatTime(file.probeData.format.duration)}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Нижняя строка: метаданные (исполнитель, альбом, жанр, дата) */}
                        <div className="flex items-center justify-between truncate pr-7">
                          <div className="w-full truncate text-xs text-gray-500">
                            {/* Исполнитель */}
                            {file.probeData?.format.tags?.artist && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.artist}
                              </span>
                            )}
                            {/* Альбом */}
                            {file.probeData?.format.tags?.album && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.album}
                              </span>
                            )}
                            {/* Название (закомментировано, т.к. уже отображается выше) */}
                            {/* {file.probeData?.format.tags?.title && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.title}
                              </span>
                            )} */}
                            {/* Жанр */}
                            {file.probeData?.format.tags?.genre && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.genre}
                              </span>
                            )}
                            {/* Дата выпуска */}
                            {(file.probeData?.format.tags?.date ??
                              file.probeData?.format.tags?.TDOR) && (
                              <span className="mr-4 text-gray-500 dark:text-gray-400">
                                {file.probeData.format.tags.date ??
                                  file.probeData.format.tags.TDOR}
                              </span>
                            )}
                          </div>

                          <div className="w-20 truncate text-right text-xs text-gray-500">
                            {/* Пустой блок для сохранения структуры */}
                          </div>
                        </div>
                      </div>

                      {/* Кнопки действий (избранное и добавление в проект) */}
                      <div className="flex items-center">
                        {/* Кнопка добавления в избранное */}
                        <FavoriteButton file={file} size={60} type="audio" />
                        {/* Кнопка добавления/удаления из проекта */}
                        <AddMediaButton
                          file={file}
                          onAddMedia={handleAdd}
                          onRemoveMedia={handleRemove}
                          isAdded={isMusicFileAdded(file)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Отображение в режиме миниатюр */
              <div
                className="flex w-full flex-wrap gap-3 p-2"
                data-testid="music-list-view-thumbnails"
              >
                {/* Отображение каждого файла в виде карточки */}
                {files.map((file) => (
                  <div
                    key={file.path}
                    className="group relative cursor-pointer"
                  >
                    <div className="flex h-15 w-[260px] items-center overflow-hidden rounded-lg border border-transparent bg-gray-100 hover:bg-gray-100 dark:bg-[#25242b] dark:group-hover:bg-[#25242b] dark:hover:border-[#35d1c1] dark:hover:bg-[#2f2d38]">
                      {/* Левая часть с кнопкой воспроизведения */}
                      <div className="flex h-full w-12 items-center justify-center">
                        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                        <button
                          onClick={(e) => handlePlayPause(e, file)}
                          className={`flex h-full w-full cursor-pointer items-center justify-center ${
                            activeFile?.path === file.path ? "opacity-100" : ""
                          }`}
                        >
                          {/* Иконка в зависимости от состояния воспроизведения */}
                          {activeFile?.path === file.path && isPlaying ? (
                            <Pause
                              className={cn(
                                "h-5 w-5 text-white opacity-50 group-hover:opacity-100",
                              )}
                              strokeWidth={1.5}
                            />
                          ) : (
                            <Play
                              className="h-5 w-5 text-white opacity-50 group-hover:opacity-100"
                              strokeWidth={1.5}
                            />
                          )}
                        </button>
                      </div>

                      {/* Правая часть с информацией о файле */}
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                      <div
                        className="flex flex-1 flex-col justify-between gap-5 px-0 py-0 pr-10"
                        onClick={(e) => handlePlayPause(e, file)}
                      >
                        {/* Место для визуализатора аудио (закомментировано) */}
                        <div className="absolute top-1 right-1">
                          {/* {activeFile?.path === file.path && mediaRecorder && isPlaying && (
                            <LiveAudioVisualizer
                              mediaRecorder={mediaRecorder}
                              width={30}
                              height={20}
                              barWidth={1}
                              gap={1}
                              barColor="#35d1c1"
                            backgroundColor="transparent"
                          />
                          )} */}
                        </div>

                        {/* Название и длительность */}
                        <div className="flex w-[170px] items-center justify-between">
                          <p className="max-w-[120px] truncate text-xs font-medium">
                            {file.probeData?.format.tags?.title ?? file.name}
                          </p>
                          <p className="min-w-12 text-right text-xs text-gray-500">
                            {file.probeData?.format.duration && (
                              <span className="text-gray-500 dark:text-gray-400">
                                {formatTime(file.probeData.format.duration)}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Исполнитель */}
                        <div className="flex w-[170px] items-center justify-between">
                          <span className="max-w-[170px] truncate text-xs text-gray-500">
                            {file.probeData?.format.tags?.artist ?? ""}
                          </span>
                        </div>
                      </div>

                      {/* Кнопки действий (избранное и добавление в проект) */}
                      <div className="flex items-center">
                        {/* Кнопка добавления в избранное */}
                        <FavoriteButton file={file} size={120} type="audio" />
                        {/* Кнопка добавления/удаления из проекта */}
                        <AddMediaButton
                          file={file}
                          size={120}
                          onAddMedia={handleAdd}
                          onRemoveMedia={handleRemove}
                          isAdded={isMusicFileAdded(file)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
