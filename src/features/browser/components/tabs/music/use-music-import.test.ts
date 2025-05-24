// Импортируем моки
import { invoke } from "@tauri-apps/api/core";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getMediaMetadata,
  selectAudioFile,
  selectMediaDirectory,
} from "@/lib/media";

import { useMusic } from "./music-provider";
import { useMusicImport } from "./use-music-import";

// Мокаем зависимости
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

vi.mock("@/lib/media", () => ({
  getMediaMetadata: vi.fn(),
  selectMediaDirectory: vi.fn(),
  selectAudioFile: vi.fn(),
}));

vi.mock("./music-provider", () => ({
  useMusic: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);
const mockGetMediaMetadata = vi.mocked(getMediaMetadata);
const mockSelectMediaDirectory = vi.mocked(selectMediaDirectory);
const mockSelectAudioFile = vi.mocked(selectAudioFile);
const mockUseMusic = vi.mocked(useMusic);

describe("useMusicImport", () => {
  const mockAddMusicFiles = vi.fn();
  const mockUpdateMusicFiles = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем мок useMusic
    mockUseMusic.mockReturnValue({
      addMusicFiles: mockAddMusicFiles,
      updateMusicFiles: mockUpdateMusicFiles,
    } as any);
  });

  describe("importFile", () => {
    it("должен успешно импортировать аудиофайлы", async () => {
      // Arrange
      const mockFiles = ["/path/to/audio1.mp3", "/path/to/audio2.wav"];
      const mockMetadata = {
        is_audio: true,
        size: 1024,
        duration: 180,
        start_time: 1234567890,
        creation_time: "2023-01-01T00:00:00Z",
        probe_data: {
          streams: [],
          format: {},
        },
      };

      mockSelectAudioFile.mockResolvedValue(mockFiles);
      mockGetMediaMetadata.mockResolvedValue(mockMetadata);

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importFile();
      });

      // Assert
      expect(importResult.success).toBe(true);
      expect(importResult.message).toContain(
        "Успешно импортировано 2 музыкальных файлов",
      );
      expect(importResult.files).toHaveLength(2);
      expect(mockAddMusicFiles).toHaveBeenCalled();
      expect(mockUpdateMusicFiles).toHaveBeenCalled();
    });

    it("должен вернуть ошибку, если файлы не выбраны", async () => {
      // Arrange
      mockSelectAudioFile.mockResolvedValue(null);

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importFile();
      });

      // Assert
      expect(importResult.success).toBe(false);
      expect(importResult.message).toBe("Файлы не выбраны");
      expect(importResult.files).toHaveLength(0);
    });

    it("должен обработать ошибку при получении метаданных", async () => {
      // Arrange
      const mockFiles = ["/path/to/audio1.mp3"];
      mockSelectAudioFile.mockResolvedValue(mockFiles);
      mockGetMediaMetadata.mockRejectedValue(new Error("FFprobe error"));

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importFile();
      });

      // Assert
      expect(importResult.success).toBe(true); // Должен быть успешным, даже с ошибками
      expect(mockAddMusicFiles).toHaveBeenCalled();
      expect(mockUpdateMusicFiles).toHaveBeenCalled();
    });
  });

  describe("importDirectory", () => {
    it("должен успешно импортировать аудиофайлы из директории", async () => {
      // Arrange
      const mockDirectory = "/path/to/music";
      const mockFiles = [
        "/path/to/music/song1.mp3",
        "/path/to/music/song2.wav",
        "/path/to/music/video.mp4", // Не аудио файл
      ];
      const mockMetadata = {
        is_audio: true,
        size: 1024,
        duration: 180,
        start_time: 1234567890,
        creation_time: "2023-01-01T00:00:00Z",
        probe_data: {
          streams: [],
          format: {},
        },
      };

      mockSelectMediaDirectory.mockResolvedValue(mockDirectory);
      mockInvoke.mockResolvedValue(mockFiles);
      mockGetMediaMetadata.mockResolvedValue(mockMetadata);

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importDirectory();
      });

      // Assert
      expect(importResult.success).toBe(true);
      expect(importResult.message).toContain(
        "Успешно импортировано 2 музыкальных файлов",
      );
      expect(importResult.files).toHaveLength(2); // Только аудио файлы
      expect(mockInvoke).toHaveBeenCalledWith("get_media_files", {
        directory: mockDirectory,
      });
    });

    it("должен вернуть ошибку, если директория не выбрана", async () => {
      // Arrange
      mockSelectMediaDirectory.mockResolvedValue(null);

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importDirectory();
      });

      // Assert
      expect(importResult.success).toBe(false);
      expect(importResult.message).toBe("Директория не выбрана");
      expect(importResult.files).toHaveLength(0);
    });

    it("должен вернуть ошибку, если в директории нет аудиофайлов", async () => {
      // Arrange
      const mockDirectory = "/path/to/empty";
      const mockFiles = [
        "/path/to/empty/video.mp4",
        "/path/to/empty/image.jpg",
      ];

      mockSelectMediaDirectory.mockResolvedValue(mockDirectory);
      mockInvoke.mockResolvedValue(mockFiles);

      const { result } = renderHook(() => useMusicImport());

      // Act
      let importResult: any;
      await act(async () => {
        importResult = await result.current.importDirectory();
      });

      // Assert
      expect(importResult.success).toBe(false);
      expect(importResult.message).toBe(
        "В выбранной директории нет аудиофайлов",
      );
      expect(importResult.files).toHaveLength(0);
    });
  });

  describe("состояние загрузки", () => {
    it("должен правильно управлять состоянием isImporting", async () => {
      // Arrange
      const mockFiles = ["/path/to/audio1.mp3"];
      mockSelectAudioFile.mockResolvedValue(mockFiles);
      mockGetMediaMetadata.mockResolvedValue({
        is_audio: true,
        size: 1024,
        duration: 180,
        start_time: 1234567890,
        creation_time: "2023-01-01T00:00:00Z",
        probe_data: { streams: [], format: {} },
      });

      const { result } = renderHook(() => useMusicImport());

      // Act & Assert
      expect(result.current.isImporting).toBe(false);

      await act(async () => {
        await result.current.importFile();
      });

      // После завершения должно быть false
      expect(result.current.isImporting).toBe(false);
    });
  });

  describe("прогресс", () => {
    it("должен обновлять прогресс во время импорта", async () => {
      // Arrange
      const mockFiles = ["/path/to/audio1.mp3", "/path/to/audio2.wav"];
      const mockMetadata = {
        is_audio: true,
        size: 1024,
        duration: 180,
        start_time: 1234567890,
        creation_time: "2023-01-01T00:00:00Z",
        probe_data: { streams: [], format: {} },
      };

      mockSelectAudioFile.mockResolvedValue(mockFiles);
      mockGetMediaMetadata.mockResolvedValue(mockMetadata);

      const { result } = renderHook(() => useMusicImport());

      // Act
      await act(async () => {
        await result.current.importFile();
      });

      // Assert
      expect(result.current.progress).toBe(100);
    });
  });
});
