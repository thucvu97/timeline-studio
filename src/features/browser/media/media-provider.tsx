import { createContext, useEffect } from "react";

import { useMachine } from "@xstate/react";

import { MediaFile } from "@/features/media/types/media";

import { FavoritesType, mediaMachine } from "./media-machine";

interface MediaContextType {
  allMediaFiles: MediaFile[];
  includedFiles: MediaFile[]; // Вычисляемое поле на основе allMediaFiles с isIncluded=true
  error: string | null;
  isLoading: boolean;
  unavailableFiles: MediaFile[]; // Вычисляемое поле на основе allMediaFiles с isUnavailable=true
  favorites: FavoritesType;

  addMediaFiles: (files: MediaFile[]) => void;
  includeFiles: (files: MediaFile[]) => void;
  removeFile: (path: string) => void;
  clearFiles: () => void;
  isFileAdded: (file: MediaFile) => boolean;
  areAllFilesAdded: (files: MediaFile[]) => boolean;
  reload: () => void;

  // Методы для работы с избранным
  addToFavorites: (item: any, itemType: string) => void;
  removeFromFavorites: (item: any, itemType: string) => void;
  clearFavorites: (itemType?: string) => void;
  isItemFavorite: (item: any, itemType: string) => boolean;
}

export const MediaContext = createContext<MediaContextType | null>(null);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [mediaState, mediaSend] = useMachine(mediaMachine);

  // Вычисляем includedFiles и unavailableFiles на основе allMediaFiles
  const includedFiles = mediaState.context.allMediaFiles.filter(
    (file) => file.isIncluded,
  );
  const unavailableFiles = mediaState.context.allMediaFiles.filter(
    (file) => file.isUnavailable,
  );

  // Инициализируем медиа-машину при монтировании
  useEffect(() => {
    mediaSend({ type: "FETCH_MEDIA" });
  }, []); // Убираем mediaSend из зависимостей

  const includedFilePaths = includedFiles.map((file: MediaFile) => file.path);

  const addMediaFiles = (files: MediaFile[]) => {
    mediaSend({ type: "addMediaFiles", files });
  };

  const includeFiles = (files: MediaFile[]) => {
    mediaSend({ type: "INCLUDE_FILES", files });
  };

  const removeFile = (path: string) => {
    mediaSend({ type: "REMOVE_FILE", path });
  };

  const clearFiles = () => {
    mediaSend({ type: "CLEAR_FILES" });
  };

  const reload = () => {
    mediaSend({ type: "RELOAD" });
  };

  const isFileAdded = (file: MediaFile) => {
    // Сначала проверяем флаг isIncluded
    if (file.isIncluded !== undefined) {
      return file.isIncluded;
    }
    // Если флаг не установлен, проверяем по пути
    return includedFilePaths.includes(file.path);
  };

  const areAllFilesAdded = (files: MediaFile[]) =>
    files.every((file) => isFileAdded(file));

  // Методы для работы с избранным
  const addToFavorites = (item: any, itemType: string) => {
    mediaSend({ type: "ADD_TO_FAVORITES", item, itemType });
  };

  const removeFromFavorites = (item: any, itemType: string) => {
    mediaSend({ type: "REMOVE_FROM_FAVORITES", item, itemType });
  };

  const clearFavorites = (itemType?: string) => {
    mediaSend({ type: "CLEAR_FAVORITES", itemType });
  };

  const isItemFavorite = (item: any, itemType: string) => {
    const favorites = mediaState.context.favorites;
    return favorites[itemType].some((favItem: any) => favItem.id === item.id);
  };

  const value = {
    allMediaFiles: mediaState.context.allMediaFiles,
    includedFiles, // Используем вычисляемое поле
    error: mediaState.context.error,
    isLoading: mediaState.context.isLoading,
    unavailableFiles, // Используем вычисляемое поле
    favorites: mediaState.context.favorites,
    addMediaFiles,
    includeFiles,
    removeFile,
    clearFiles,
    isFileAdded,
    areAllFilesAdded,
    reload,
    addToFavorites,
    removeFromFavorites,
    clearFavorites,
    isItemFavorite,
  };

  return (
    <MediaContext.Provider value={value}>{children}</MediaContext.Provider>
  );
}
