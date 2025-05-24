import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProjectFile, ProjectSettings } from "@/types/project";
import { SavedMediaFile, SavedMusicFile } from "@/types/saved-media";

import { ProjectFileService } from "./project-file-service";

const { readTextFile, writeTextFile } = await import("@tauri-apps/plugin-fs");
const mockReadTextFile = readTextFile as any;
const mockWriteTextFile = writeTextFile as any;

describe("ProjectFileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadProject", () => {
    const mockProjectData: ProjectFile = {
      settings: {
        name: "Test Project",
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: { ratio: "16:9", width: 16, height: 9 },
      } as ProjectSettings,
      mediaLibrary: {
        mediaFiles: [],
        musicFiles: [],
        lastUpdated: Date.now(),
        version: "1.0.0",
      },
      browserState: {
        selectedTab: "media",
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "grid",
        filterBy: "all",
      },
      projectFavorites: {
        favoriteFiles: [],
        lastUpdated: Date.now(),
      },
      meta: {
        version: "1.0.0",
        createdAt: Date.now(),
        lastModified: Date.now(),
        originalPlatform: "darwin",
      },
    };

    it("должен загрузить проект из файла", async () => {
      mockReadTextFile.mockResolvedValue(JSON.stringify(mockProjectData));

      const result = await ProjectFileService.loadProject(
        "/path/to/project.tlsp",
      );

      expect(result).toEqual(mockProjectData);
      expect(mockReadTextFile).toHaveBeenCalledWith("/path/to/project.tlsp");
    });

    it("должен обрабатывать ошибки чтения файла", async () => {
      mockReadTextFile.mockRejectedValue(new Error("File not found"));

      await expect(
        ProjectFileService.loadProject("/invalid/path.tlsp"),
      ).rejects.toThrow("Failed to load project: Error: File not found");
    });

    it("должен обрабатывать невалидный JSON", async () => {
      mockReadTextFile.mockResolvedValue("invalid json");

      await expect(
        ProjectFileService.loadProject("/path/to/project.tlsp"),
      ).rejects.toThrow("Failed to load project: SyntaxError");
    });

    it("должен валидировать структуру проекта", async () => {
      const invalidProject = { invalid: "structure" };
      mockReadTextFile.mockResolvedValue(JSON.stringify(invalidProject));

      await expect(
        ProjectFileService.loadProject("/path/to/project.tlsp"),
      ).rejects.toThrow("Invalid project structure");
    });

    it("должен отклонять неподдерживаемые версии проектов", async () => {
      const oldProject = {
        ...mockProjectData,
        meta: {
          ...mockProjectData.meta,
          version: "0.9.0",
        },
      };
      mockReadTextFile.mockResolvedValue(JSON.stringify(oldProject));

      await expect(
        ProjectFileService.loadProject("/path/to/project.tlsp"),
      ).rejects.toThrow("Unsupported project version: 0.9.0");
    });
  });

  describe("saveProject", () => {
    const mockProjectData: ProjectFile = {
      settings: {
        name: "Test Project",
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: { ratio: "16:9", width: 16, height: 9 },
      } as ProjectSettings,
      mediaLibrary: {
        mediaFiles: [],
        musicFiles: [],
        lastUpdated: Date.now(),
        version: "1.0.0",
      },
      browserState: {
        selectedTab: "media",
        sortBy: "name",
        sortOrder: "asc",
        viewMode: "grid",
        filterBy: "all",
      },
      projectFavorites: {
        favoriteFiles: [],
        lastUpdated: Date.now(),
      },
      meta: {
        version: "1.0.0",
        createdAt: Date.now(),
        lastModified: Date.now(),
        originalPlatform: "darwin",
      },
    };

    it("должен сохранить проект в файл", async () => {
      mockWriteTextFile.mockResolvedValue(undefined);

      await ProjectFileService.saveProject(
        "/path/to/project.tlsp",
        mockProjectData,
      );

      expect(mockWriteTextFile).toHaveBeenCalledWith(
        "/path/to/project.tlsp",
        expect.any(String),
      );
    });

    it("должен обновить lastModified при сохранении", async () => {
      mockWriteTextFile.mockResolvedValue(undefined);
      const originalLastModified = mockProjectData.meta.lastModified;

      await ProjectFileService.saveProject(
        "/path/to/project.tlsp",
        mockProjectData,
      );

      const savedData = JSON.parse(mockWriteTextFile.mock.calls[0][1]);
      expect(savedData.meta.lastModified).toBeGreaterThan(originalLastModified);
    });

    it("должен обрабатывать ошибки записи файла", async () => {
      mockWriteTextFile.mockRejectedValue(new Error("Permission denied"));

      await expect(
        ProjectFileService.saveProject(
          "/readonly/project.tlsp",
          mockProjectData,
        ),
      ).rejects.toThrow("Failed to save project: Error: Permission denied");
    });
  });

  describe("createNewProject", () => {
    it("должен создать новый проект с базовыми настройками", () => {
      const project = ProjectFileService.createNewProject("New Project");

      expect(project.settings.resolution).toBe("1920x1080");
      expect(project.settings.frameRate).toBe("30");
      expect(project.settings.aspectRatio.value).toEqual({
        width: 1920,
        height: 1080,
        name: "16:9",
      });
      expect(project.mediaLibrary.mediaFiles).toEqual([]);
      expect(project.mediaLibrary.musicFiles).toEqual([]);
      expect(project.meta.version).toBe("1.0.0");
    });

    it("должен установить правильные временные метки", () => {
      const beforeCreate = Date.now();
      const project = ProjectFileService.createNewProject("Test");
      const afterCreate = Date.now();

      expect(project.meta.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(project.meta.createdAt).toBeLessThanOrEqual(afterCreate);
      expect(project.meta.lastModified).toBe(project.meta.createdAt);
    });
  });

  describe("updateMediaLibrary", () => {
    const baseProject = ProjectFileService.createNewProject("Test");

    const mockMediaFiles: SavedMediaFile[] = [
      {
        id: "media-1",
        originalPath: "/path/video.mp4",
        name: "video.mp4",
        size: 1024,
        lastModified: Date.now(),
        isVideo: true,
        isAudio: false,
        isImage: false,
        metadata: { duration: 120 },
        status: "found",
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
        status: "found",
        lastChecked: Date.now(),
      },
    ];

    it("должен обновить медиабиблиотеку проекта", () => {
      const updatedProject = ProjectFileService.updateMediaLibrary(
        baseProject,
        mockMediaFiles,
        mockMusicFiles,
      );

      expect(updatedProject.mediaLibrary.mediaFiles).toEqual(mockMediaFiles);
      expect(updatedProject.mediaLibrary.musicFiles).toEqual(mockMusicFiles);
      expect(updatedProject.mediaLibrary.lastUpdated).toBeGreaterThan(
        baseProject.mediaLibrary.lastUpdated,
      );
    });

    it("должен сохранить остальные данные проекта", () => {
      const updatedProject = ProjectFileService.updateMediaLibrary(
        baseProject,
        mockMediaFiles,
        mockMusicFiles,
      );

      expect(updatedProject.settings).toEqual(baseProject.settings);
      expect(updatedProject.browserState).toEqual(baseProject.browserState);
      expect(updatedProject.projectFavorites).toEqual(
        baseProject.projectFavorites,
      );
    });
  });

  describe("getProjectStats", () => {
    const projectWithMedia: ProjectFile = {
      ...ProjectFileService.createNewProject("Test"),
      mediaLibrary: {
        mediaFiles: [
          {
            id: "media-1",
            originalPath: "/path/video.mp4",
            name: "video.mp4",
            size: 1024,
            lastModified: Date.now(),
            isVideo: true,
            isAudio: false,
            isImage: false,
            metadata: { duration: 120 },
            status: "found",
            lastChecked: Date.now(),
          },
        ],
        musicFiles: [
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
            status: "found",
            lastChecked: Date.now(),
          },
        ],
        lastUpdated: Date.now(),
        version: "1.0.0",
      },
    };

    it("должен вернуть статистику проекта", () => {
      const stats = ProjectFileService.getProjectStats(projectWithMedia);

      expect(stats.totalMediaFiles).toBe(1);
      expect(stats.totalMusicFiles).toBe(1);
      expect(stats.totalSize).toBe(1536); // 1024 + 512
      expect(stats.lastModified).toBe(projectWithMedia.meta.lastModified);
    });

    it("должен обрабатывать пустой проект", () => {
      const emptyProject = ProjectFileService.createNewProject("Empty");
      const stats = ProjectFileService.getProjectStats(emptyProject);

      expect(stats.totalMediaFiles).toBe(0);
      expect(stats.totalMusicFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });
});
