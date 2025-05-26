import { open } from "@tauri-apps/plugin-dialog";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFiltersImport } from "../../hooks/use-filters-import";

// Мокаем Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}));

// Получаем мок функцию
const mockOpen = vi.mocked(open);

describe("useFiltersImport", () => {
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
    const { result } = renderHook(() => useFiltersImport());

    expect(result.current.isImporting).toBe(false);
    expect(typeof result.current.importFiltersFile).toBe("function");
    expect(typeof result.current.importFilterFile).toBe("function");
  });

  describe("importFiltersFile", () => {
    it("должен открывать диалог выбора JSON файла", async () => {
      mockOpen.mockResolvedValue("/path/to/filters.json");
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFiltersFile();
      });

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
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

      const { result } = renderHook(() => useFiltersImport());

      // Начинаем импорт
      act(() => {
        void result.current.importFiltersFile();
      });

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true);

      // Завершаем импорт
      await act(async () => {
        resolveOpen!("/path/to/filters.json");
        await openPromise;
      });

      // Проверяем, что isImporting стал false
      await waitFor(() => {
        expect(result.current.isImporting).toBe(false);
      });
    });

    it("должен логировать выбранный файл", async () => {
      const filePath = "/path/to/filters.json";
      mockOpen.mockResolvedValue(filePath);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFiltersFile();
      });

      expect(console.log).toHaveBeenCalledWith(
        "Импорт JSON файла с фильтрами:",
        filePath,
      );
    });

    it("не должен делать ничего если файл не выбран", async () => {
      mockOpen.mockResolvedValue(null);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFiltersFile();
      });

      expect(console.log).not.toHaveBeenCalled();
    });

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error");
      mockOpen.mockRejectedValue(error);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFiltersFile();
      });

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка при импорте фильтров:",
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

      const { result } = renderHook(() => useFiltersImport());

      // Начинаем первый импорт
      act(() => {
        void result.current.importFiltersFile();
      });

      expect(result.current.isImporting).toBe(true);

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importFiltersFile();
      });

      // open должен быть вызван только один раз
      expect(mockOpen).toHaveBeenCalledTimes(1);

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!("/path/to/filters.json");
        await openPromise;
      });
    });
  });

  describe("importFilterFile", () => {
    it("должен открывать диалог выбора файлов фильтров", async () => {
      mockOpen.mockResolvedValue(["/path/to/filter.cube"]);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFilterFile();
      });

      expect(mockOpen).toHaveBeenCalledWith({
        multiple: true,
        filters: [
          {
            name: "Filter Files",
            extensions: ["cube", "3dl", "lut", "preset"],
          },
        ],
      });
    });

    it("должен обрабатывать множественный выбор файлов", async () => {
      const files = ["/path/to/filter1.cube", "/path/to/filter2.3dl"];
      mockOpen.mockResolvedValue(files);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFilterFile();
      });

      expect(console.log).toHaveBeenCalledWith(
        "Импорт файлов фильтров:",
        files,
      );
    });

    it("должен обрабатывать одиночный файл как массив", async () => {
      const file = "/path/to/filter.cube";
      mockOpen.mockResolvedValue(file);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFilterFile();
      });

      expect(console.log).toHaveBeenCalledWith("Импорт файлов фильтров:", [
        file,
      ]);
    });

    it("должен устанавливать isImporting в true во время импорта", async () => {
      let resolveOpen: (value: string[]) => void;
      const openPromise = new Promise<string[]>((resolve) => {
        resolveOpen = resolve;
      });
      mockOpen.mockReturnValue(openPromise);

      const { result } = renderHook(() => useFiltersImport());

      // Начинаем импорт
      act(() => {
        void result.current.importFilterFile();
      });

      // Проверяем, что isImporting стал true
      expect(result.current.isImporting).toBe(true);

      // Завершаем импорт
      await act(async () => {
        resolveOpen!(["/path/to/filter.cube"]);
        await openPromise;
      });

      // Проверяем, что isImporting стал false
      await waitFor(() => {
        expect(result.current.isImporting).toBe(false);
      });
    });

    it("не должен делать ничего если файлы не выбраны", async () => {
      mockOpen.mockResolvedValue(null);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFilterFile();
      });

      expect(console.log).not.toHaveBeenCalled();
    });

    it("должен обрабатывать ошибки", async () => {
      const error = new Error("Dialog error");
      mockOpen.mockRejectedValue(error);
      const { result } = renderHook(() => useFiltersImport());

      await act(async () => {
        await result.current.importFilterFile();
      });

      expect(console.error).toHaveBeenCalledWith(
        "Ошибка при импорте файлов фильтров:",
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

      const { result } = renderHook(() => useFiltersImport());

      // Начинаем первый импорт
      act(() => {
        void result.current.importFilterFile();
      });

      expect(result.current.isImporting).toBe(true);

      // Пытаемся запустить второй импорт
      await act(async () => {
        await result.current.importFilterFile();
      });

      // open должен быть вызван только один раз
      expect(mockOpen).toHaveBeenCalledTimes(1);

      // Завершаем первый импорт
      await act(async () => {
        resolveOpen!(["/path/to/filter.cube"]);
        await openPromise;
      });
    });
  });

  it("должен корректно обрабатывать параллельные вызовы разных методов импорта", async () => {
    let resolveFiltersOpen: (value: string) => void;
    let resolveFilterOpen: (value: string[]) => void;

    const filtersOpenPromise = new Promise<string>((resolve) => {
      resolveFiltersOpen = resolve;
    });
    const filterOpenPromise = new Promise<string[]>((resolve) => {
      resolveFilterOpen = resolve;
    });

    mockOpen
      .mockReturnValueOnce(filtersOpenPromise)
      .mockReturnValueOnce(filterOpenPromise);

    const { result } = renderHook(() => useFiltersImport());

    // Начинаем импорт JSON файла
    act(() => {
      void result.current.importFiltersFile();
    });

    expect(result.current.isImporting).toBe(true);

    // Пытаемся запустить импорт файлов фильтров
    await act(async () => {
      await result.current.importFilterFile();
    });

    // Второй вызов не должен сработать
    expect(mockOpen).toHaveBeenCalledTimes(1);

    // Завершаем первый импорт
    await act(async () => {
      resolveFiltersOpen!("/path/to/filters.json");
      await filtersOpenPromise;
    });

    expect(result.current.isImporting).toBe(false);
  });
});
