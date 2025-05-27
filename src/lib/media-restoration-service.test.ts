import { beforeEach, describe, expect, it, vi } from "vitest";

import { MediaFile } from "@/features/media/types/media";
import { SavedMediaFile, SavedMusicFile } from "@/types/saved-media";

import { MediaRestorationService } from "./media-restoration-service";

// Мокаем утилиты
vi.mock("./saved-media-utils", () => ({
  fileExists: vi.fn(),
  validateFileIntegrity: vi.fn(),
  generateAlternativePaths: vi.fn(),
  convertFromSavedMediaFile: vi.fn(),
  getExtensionsForFile: vi.fn(),
}));

// Импортируем замоканные функции
const {
  fileExists,
  validateFileIntegrity,
  generateAlternativePaths,
  convertFromSavedMediaFile,
  getExtensionsForFile,
} = await import("./saved-media-utils");
const mockFileExists = fileExists as any;
const mockValidateFileIntegrity = validateFileIntegrity as any;
const mockGenerateAlternativePaths = generateAlternativePaths as any;
const mockConvertFromSavedMediaFile = convertFromSavedMediaFile as any;
const mockGetExtensionsForFile = getExtensionsForFile as any;

describe("MediaRestorationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Настройка базовых моков
    mockGetExtensionsForFile.mockReturnValue(["mp4", "avi", "mkv"]);
  });

  describe("restoreFile", () => {
    const mockSavedFile: SavedMediaFile = {
      id: "test-id",
      originalPath: "/original/path/video.mp4",
      name: "video.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: {
        duration: 120,
        probeData: { streams: [], format: {} },
      },
      status: "unknown",
      lastChecked: Date.now(),
    };

    it("должен восстановить файл по оригинальному пути", async () => {
      mockFileExists.mockResolvedValue(true);
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      });
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/original/path/video.mp4",
      } as MediaFile);

      const result = await MediaRestorationService.restoreFile(
        mockSavedFile,
        "/project/dir",
      );

      expect(result.status).toBe("found");
      expect(result.restoredFile).toBeDefined();
      expect(mockFileExists).toHaveBeenCalledWith("/original/path/video.mp4");
    });

    it("должен найти файл по относительному пути", async () => {
      const savedFileWithRelative = {
        ...mockSavedFile,
        relativePath: "media/video.mp4",
      };

      mockFileExists.mockResolvedValueOnce(false); // Оригинальный путь не найден
      mockFileExists.mockResolvedValueOnce(true); // Относительный путь найден
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      });
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/project/dir/media/video.mp4",
      } as MediaFile);

      const result = await MediaRestorationService.restoreFile(
        savedFileWithRelative,
        "/project/dir",
      );

      expect(result.status).toBe("relocated");
      expect(result.newPath).toBe("/project/dir/media/video.mp4");
    });

    it("должен найти файл в альтернативных местах", async () => {
      mockFileExists.mockResolvedValueOnce(false); // Оригинальный путь
      mockFileExists.mockResolvedValueOnce(true); // Альтернативный путь
      mockGenerateAlternativePaths.mockResolvedValue([
        "/project/dir/video.mp4",
        "/project/dir/media/video.mp4",
      ]);
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      });
      mockConvertFromSavedMediaFile.mockReturnValue({
        id: "test-id",
        name: "video.mp4",
        path: "/project/dir/video.mp4",
      } as MediaFile);

      const result = await MediaRestorationService.restoreFile(
        mockSavedFile,
        "/project/dir",
      );

      expect(result.status).toBe("relocated");
      expect(result.newPath).toBe("/project/dir/video.mp4");
    });

    it("должен вернуть missing если файл не найден", async () => {
      mockFileExists.mockResolvedValue(false);
      mockGenerateAlternativePaths.mockResolvedValue([]);

      const result = await MediaRestorationService.restoreFile(
        mockSavedFile,
        "/project/dir",
      );

      expect(result.status).toBe("missing");
      expect(result.restoredFile).toBeUndefined();
    });

    it("должен обрабатывать ошибки валидации", async () => {
      mockFileExists.mockResolvedValue(true);
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: false,
        confidence: 0.3,
        issues: ["File size mismatch"],
      });

      const result = await MediaRestorationService.restoreFile(
        mockSavedFile,
        "/project/dir",
      );

      expect(result.status).toBe("corrupted");
    });

    it("должен обрабатывать ошибки", async () => {
      mockFileExists.mockRejectedValue(new Error("File system error"));

      await expect(
        MediaRestorationService.restoreFile(mockSavedFile, "/project/dir"),
      ).rejects.toThrow("File system error");
    });
  });

  describe("restoreProjectMedia", () => {
    const mockMediaFiles: SavedMediaFile[] = [
      {
        id: "media-1",
        originalPath: "/path/video1.mp4",
        name: "video1.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: { duration: 120 },
        status: "unknown",
        lastChecked: Date.now(),
      },
    ];

    const mockMusicFiles: SavedMusicFile[] = [
      {
        id: "music-1",
        originalPath: "/path/song.mp3",
        name: "song.mp3",
        size: 512,
        lastModified: Date.now(),
        isVideo: false,
        isAudio: true,
        isImage: false,
        metadata: { duration: 180 },
        musicMetadata: { artist: "Test Artist" },
        status: "unknown",
        lastChecked: Date.now(),
      },
    ];

    it("должен восстановить все файлы проекта", async () => {
      mockFileExists.mockResolvedValue(true);
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      });
      mockConvertFromSavedMediaFile.mockReturnValue({} as MediaFile);

      const result = await MediaRestorationService.restoreProjectMedia(
        mockMediaFiles,
        mockMusicFiles,
        "/project/path.tlsp",
      );

      expect(result.stats.total).toBe(2);
      expect(result.stats.restored).toBe(2);
      expect(result.stats.missing).toBe(0);
    });

    it("должен обрабатывать отсутствующие файлы", async () => {
      mockFileExists.mockResolvedValue(false);
      mockGenerateAlternativePaths.mockResolvedValue([]);

      const result = await MediaRestorationService.restoreProjectMedia(
        mockMediaFiles,
        mockMusicFiles,
        "/project/path.tlsp",
      );

      expect(result.stats.missing).toBe(2);
      expect(result.missingFiles).toHaveLength(2);
    });

    it("должен генерировать отчет о восстановлении", async () => {
      mockFileExists.mockResolvedValue(true);
      mockValidateFileIntegrity.mockResolvedValue({
        isValid: true,
        confidence: 1.0,
        issues: [],
      });
      mockConvertFromSavedMediaFile.mockReturnValue({} as MediaFile);

      const result = await MediaRestorationService.restoreProjectMedia(
        mockMediaFiles,
        mockMusicFiles,
        "/project/path.tlsp",
      );

      const report = MediaRestorationService.generateRestorationReport(result);

      expect(report).toContain("Восстановление медиафайлов завершено");
      expect(report).toContain("Всего файлов: 2");
      expect(report).toContain("Восстановлено: 2");
    });
  });

  describe("promptUserToFindFile", () => {
    const mockSavedFileForDialog: SavedMediaFile = {
      id: "test-id",
      originalPath: "/original/path/video.mp4",
      name: "video.mp4",
      size: 1024,
      lastModified: Date.now(),
      isVideo: true,
      isAudio: false,
      isImage: false,
      metadata: {
        duration: 120,
        probeData: { streams: [], format: {} },
      },
      status: "unknown",
      lastChecked: Date.now(),
    };

    it("должен открыть диалог выбора файла", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const mockOpen = vi.mocked(open);

      mockOpen.mockResolvedValue("/new/path/video.mp4");

      const result = await MediaRestorationService.promptUserToFindFile(
        mockSavedFileForDialog,
      );

      expect(result).toBe("/new/path/video.mp4");
      expect(mockOpen).toHaveBeenCalledWith({
        title: "Найти файл: video.mp4",
        multiple: false,
        filters: expect.any(Array),
      });
    });

    it("должен вернуть null если пользователь отменил", async () => {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const mockOpen = vi.mocked(open);

      mockOpen.mockResolvedValue(null);

      const result = await MediaRestorationService.promptUserToFindFile(
        mockSavedFileForDialog,
      );

      expect(result).toBeNull();
    });
  });
});
