import { open } from "@tauri-apps/plugin-dialog";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useStyleTemplatesImport } from "../../hooks/use-style-templates-import";

// Мокаем Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

// Получаем мок функцию
const mockOpen = vi.mocked(open);

describe("useStyleTemplatesImport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем console.log и console.error
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("должен инициализироваться с правильными значениями по умолчанию", () => {
    const { result } = renderHook(() => useStyleTemplatesImport());

    expect(result.current.isImporting).toBe(false);
    expect(typeof result.current.importStyleTemplatesFile).toBe("function");
    expect(typeof result.current.importStyleTemplateFile).toBe("function");
  });

  describe("importStyleTemplatesFile", () => {
    it("должен открывать диалог выбора JSON файла", async () => {
      mockOpen.mockResolvedValue("/path/to/templates.json");
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplatesFile();
      });

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Style Templates JSON",
            extensions: ["json"],
          },
        ],
      });
    });

    it("должен устанавливать isImporting в true во время импорта", async () => {
      let resolveOpen: (value: string) => void;
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve;
      });
      mockOpen.mockReturnValue(openPromise);

      const { result } = renderHook(() => useStyleTemplatesImport());

      // Начинаем импорт
      act(() => {
        void result.current.importStyleTemplatesFile();
      });

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true);

      // Завершаем импорт
      await act(async () => {
        resolveOpen!("/path/to/templates.json");
        await openPromise;
      });

      // Проверяем, что isImporting стал false
      expect(result.current.isImporting).toBe(false);
    });

    it("не должен делать ничего если файл не выбран", async () => {
      mockOpen.mockResolvedValue(null);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplatesFile();
      });

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Импорт JSON файла"),
      );
    });

    it("должен логировать выбранный файл", async () => {
      const filePath = "/path/to/templates.json";
      mockOpen.mockResolvedValue(filePath);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplatesFile();
      });

      expect(console.log).toHaveBeenCalledWith(
        "Импорт JSON файла со стилистическими шаблонами:",
        filePath,
      );
    });

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error");
      mockOpen.mockRejectedValue(error);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplatesFile();
      });

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка при импорте стилистических шаблонов:",
        error,
      );
      expect(result.current.isImporting).toBe(false);
    });

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string) => void;
      const openPromise = new Promise<string>((resolve) => {
        resolveOpen = resolve;
      });
      mockOpen.mockReturnValue(openPromise);

      const { result } = renderHook(() => useStyleTemplatesImport());

      // Начинаем первый импорт
      act(() => {
        void result.current.importStyleTemplatesFile();
      });

      expect(result.current.isImporting).toBe(true);

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importStyleTemplatesFile();
      });

      // Второй вызов не должен сработать (функция должна выйти рано)
      expect(mockOpen).toHaveBeenCalledTimes(1);

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!("/path/to/templates.json");
        await openPromise;
      });
    });
  });

  describe("importStyleTemplateFile", () => {
    it("должен открывать диалог выбора файлов шаблонов", async () => {
      mockOpen.mockResolvedValue(["/path/to/template.json"]);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Style Template Files",
            extensions: ["json"],
          },
        ],
      });
    });

    it("должен обрабатывать множественный выбор файлов", async () => {
      const files = ["/path/to/template1.json", "/path/to/template2.json"];
      mockOpen.mockResolvedValue(files);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      expect(console.log).toHaveBeenCalledWith(
        "Импорт файлов стилистических шаблонов:",
        files,
      );
    });

    it("должен обрабатывать одиночный файл как массив", async () => {
      const file = "/path/to/template.json";
      mockOpen.mockResolvedValue(file);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      expect(console.log).toHaveBeenCalledWith(
        "Импорт файлов стилистических шаблонов:",
        [file],
      );
    });

    it("не должен делать ничего если файлы не выбраны", async () => {
      mockOpen.mockResolvedValue(null);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining("Импорт файлов"),
      );
    });

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error");
      mockOpen.mockRejectedValue(error);
      const { result } = renderHook(() => useStyleTemplatesImport());

      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка при импорте файлов стилистических шаблонов:",
        error,
      );
      expect(result.current.isImporting).toBe(false);
    });

    it("не должен запускать импорт если уже идет импорт", async () => {
      let resolveOpen: (value: string[]) => void;
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve;
      });
      mockOpen.mockReturnValue(openPromise);

      const { result } = renderHook(() => useStyleTemplatesImport());

      // Начинаем первый импорт
      act(() => {
        void result.current.importStyleTemplateFile();
      });

      expect(result.current.isImporting).toBe(true);

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importStyleTemplateFile();
      });

      // Второй вызов не должен сработать
      expect(mockOpen).toHaveBeenCalledTimes(1);

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!(["/path/to/template.json"]);
        await openPromise;
      });
    });
  });

  it("должен корректно обрабатывать параллельные вызовы разных методов импорта", async () => {
    let resolveTemplatesOpen: (value: string) => void;
    let resolveTemplateOpen: (value: string[]) => void;

    const templatesOpenPromise = new Promise<string>((resolve) => {
      resolveTemplatesOpen = resolve;
    });
    const templateOpenPromise = new Promise<string[]>((resolve) => {
      resolveTemplateOpen = resolve;
    });

    mockOpen
      .mockReturnValueOnce(templatesOpenPromise)
      .mockReturnValueOnce(templateOpenPromise);

    const { result } = renderHook(() => useStyleTemplatesImport());

    // Начинаем импорт JSON файла
    act(() => {
      void result.current.importStyleTemplatesFile();
    });

    expect(result.current.isImporting).toBe(true);

    // Пытаемся запустить импорт файлов шаблонов
    await act(async () => {
      await result.current.importStyleTemplateFile();
    });

    // Второй вызов не должен сработать
    expect(mockOpen).toHaveBeenCalledTimes(1);

    // Завершаем первый импорт
    await act(async () => {
      resolveTemplatesOpen!("/path/to/templates.json");
      await templatesOpenPromise;
    });

    expect(result.current.isImporting).toBe(false);
  });
});
