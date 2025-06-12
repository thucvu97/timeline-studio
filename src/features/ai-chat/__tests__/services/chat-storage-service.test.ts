import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LocalChatStorageService } from "../../services/chat-storage-service"

import type { ChatSession } from "../../types/chat"

// Mock модули Tauri
vi.mock("@tauri-apps/plugin-fs", () => ({
  exists: vi.fn(),
  mkdir: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  readDir: vi.fn(),
  remove: vi.fn(),
}))

// Mock AppDirectoriesService
vi.mock("@/features/app-state/services", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state/services")>()
  return {
    ...actual,
    appDirectoriesService: {
      getAppDirectories: vi.fn().mockResolvedValue({
        base_dir: "/Users/test/Movies/Timeline Studio",
      }),
    },
  }
})

describe("LocalChatStorageService", () => {
  let service: LocalChatStorageService

  beforeEach(async () => {
    // Настройка глобального окружения для тестов
    const storage: Record<string, string> = {}

    const localStorageMock = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value
      }),
      removeItem: vi.fn((key: string) => {
        if (key in storage) {
          const { [key]: removed, ...rest } = storage
          Object.keys(storage).forEach(k => {
            storage[k] = undefined as any
          })
          Object.assign(storage, rest)
        }
      }),
      clear: vi.fn(() => {
        Object.keys(storage).forEach((key) => {
          storage[key] = undefined as any
        })
        Object.keys(storage).forEach((key) => {
          const { [key]: removed, ...rest } = storage
          Object.assign(storage, rest)
        })
      }),
      get length() {
        return Object.keys(storage).length
      },
      key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    }

    vi.stubGlobal("localStorage", localStorageMock)

    // Настройка моков для веб-версии (без Tauri)
    vi.stubGlobal("window", {
      __TAURI__: undefined,
    })

    // Очищаем singleton экземпляр
    ;(LocalChatStorageService as any).instance = undefined

    // Получаем новый экземпляр сервиса
    service = LocalChatStorageService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  describe("getInstance", () => {
    it("должен возвращать singleton экземпляр", () => {
      const instance1 = LocalChatStorageService.getInstance()
      const instance2 = LocalChatStorageService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("createSession", () => {
    it("должен создавать новую сессию с заголовком по умолчанию", async () => {
      const session = await service.createSession()

      expect(session).toMatchObject({
        id: expect.any(String),
        title: expect.stringContaining("Новый чат"),
        messages: [],
        agent: "claude-4-sonnet",
      })
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.updatedAt).toBeInstanceOf(Date)

      // Проверяем, что сессия сохранена в localStorage
      const stored = localStorage.getItem(`chat_${session.id}`)
      expect(stored).toBeTruthy()
    })

    it("должен создавать сессию с пользовательским заголовком", async () => {
      const customTitle = "Мой чат о видеомонтаже"
      const session = await service.createSession(customTitle)

      expect(session.title).toBe(customTitle)
    })
  })

  describe("getSession", () => {
    it("должен возвращать существующую сессию", async () => {
      const created = await service.createSession("Тестовый чат")
      const retrieved = await service.getSession(created.id)

      expect(retrieved).toMatchObject({
        id: created.id,
        title: "Тестовый чат",
        messages: [],
      })
    })

    it("должен возвращать null для несуществующей сессии", async () => {
      const result = await service.getSession("non-existent-id")
      expect(result).toBeNull()
    })
  })

  describe("getAllSessions", () => {
    it("должен возвращать все сессии отсортированные по дате", async () => {
      // Создаем несколько сессий с задержкой
      const session1 = await service.createSession("Чат 1")
      await new Promise((resolve) => setTimeout(resolve, 10))
      const session2 = await service.createSession("Чат 2")
      await new Promise((resolve) => setTimeout(resolve, 10))
      const session3 = await service.createSession("Чат 3")

      const sessions = await service.getAllSessions()

      expect(sessions).toHaveLength(3)
      // Проверяем сортировку (новые сверху)
      expect(sessions[0].id).toBe(session3.id)
      expect(sessions[1].id).toBe(session2.id)
      expect(sessions[2].id).toBe(session1.id)
    })

    it("должен возвращать пустой массив если нет сессий", async () => {
      const sessions = await service.getAllSessions()
      expect(sessions).toEqual([])
    })
  })

  describe("updateSession", () => {
    it("должен обновлять существующую сессию", async () => {
      const session = await service.createSession("Старый заголовок")
      const newTitle = "Новый заголовок"

      // Ждем 10мс чтобы timestamp изменился
      await new Promise((resolve) => setTimeout(resolve, 10))

      await service.updateSession(session.id, { title: newTitle })

      const updated = await service.getSession(session.id)
      expect(updated?.title).toBe(newTitle)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(session.updatedAt.getTime())
    })

    it("должен выбросить ошибку для несуществующей сессии", async () => {
      await expect(service.updateSession("non-existent", { title: "Test" })).rejects.toThrow(
        "Session non-existent not found",
      )
    })
  })

  describe("deleteSession", () => {
    it("должен удалять сессию", async () => {
      const session = await service.createSession("Для удаления")

      await service.deleteSession(session.id)

      const deleted = await service.getSession(session.id)
      expect(deleted).toBeNull()
      expect(localStorage.getItem(`chat_${session.id}`)).toBeNull()
    })
  })

  describe("addMessage", () => {
    it("должен добавлять сообщение в сессию", async () => {
      const session = await service.createSession()

      const message = await service.addMessage(session.id, {
        role: "user",
        content: "Привет, помоги с видеомонтажом",
      })

      expect(message).toMatchObject({
        id: expect.any(String),
        role: "user",
        content: "Привет, помоги с видеомонтажом",
      })
      expect(message.timestamp).toBeInstanceOf(Date)

      const updated = await service.getSession(session.id)
      expect(updated?.messages).toHaveLength(1)
      expect(updated?.messages[0]).toMatchObject(message)
    })

    it("должен обновлять заголовок чата из первого сообщения пользователя", async () => {
      const session = await service.createSession()

      await service.addMessage(session.id, {
        role: "user",
        content: "Как добавить эффект размытия к видео в Timeline Studio?",
      })

      const updated = await service.getSession(session.id)
      expect(updated?.title).toBe("Как добавить эффект размытия к видео в Timeline St...")
    })

    it("должен выбросить ошибку для несуществующей сессии", async () => {
      await expect(
        service.addMessage("non-existent", {
          role: "user",
          content: "Test",
        }),
      ).rejects.toThrow("Session non-existent not found")
    })
  })

  describe("updateMessage", () => {
    it("должен обновлять существующее сообщение", async () => {
      const session = await service.createSession()
      const message = await service.addMessage(session.id, {
        role: "user",
        content: "Старый текст",
      })

      await service.updateMessage(session.id, message.id, {
        content: "Новый текст",
      })

      const updated = await service.getSession(session.id)
      expect(updated?.messages[0].content).toBe("Новый текст")
    })

    it("должен выбросить ошибку для несуществующего сообщения", async () => {
      const session = await service.createSession()

      await expect(
        service.updateMessage(session.id, "non-existent", {
          content: "Test",
        }),
      ).rejects.toThrow("Message non-existent not found")
    })
  })

  describe("deleteMessage", () => {
    it("должен удалять сообщение из сессии", async () => {
      const session = await service.createSession()
      const message1 = await service.addMessage(session.id, {
        role: "user",
        content: "Сообщение 1",
      })
      const message2 = await service.addMessage(session.id, {
        role: "assistant",
        content: "Ответ",
      })

      await service.deleteMessage(session.id, message1.id)

      const updated = await service.getSession(session.id)
      expect(updated?.messages).toHaveLength(1)
      expect(updated?.messages[0].id).toBe(message2.id)
    })
  })

  describe("searchSessions", () => {
    it("должен находить сессии по заголовку", async () => {
      await service.createSession("Чат про эффекты")
      await service.createSession("Чат про переходы")
      await service.createSession("Другая тема")

      const results = await service.searchSessions("эффект")

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe("Чат про эффекты")
    })

    it("должен находить сессии по содержимому последнего сообщения", async () => {
      const session = await service.createSession("Тестовый чат")
      await service.addMessage(session.id, {
        role: "user",
        content: "Как настроить цветокоррекцию?",
      })

      const results = await service.searchSessions("цветокоррекц")

      expect(results).toHaveLength(1)
      expect(results[0].id).toBe(session.id)
    })

    it("должен возвращать пустой массив если ничего не найдено", async () => {
      await service.createSession("Чат 1")
      await service.createSession("Чат 2")

      const results = await service.searchSessions("несуществующий текст")

      expect(results).toEqual([])
    })
  })

  describe("exportSession", () => {
    it("должен экспортировать сессию в JSON", async () => {
      const session = await service.createSession("Экспортируемый чат")
      await service.addMessage(session.id, {
        role: "user",
        content: "Тестовое сообщение",
      })

      const exported = await service.exportSession(session.id)
      const parsed = JSON.parse(exported)

      expect(parsed).toMatchObject({
        id: session.id,
        title: "Тестовое сообщение",
        messages: expect.arrayContaining([
          expect.objectContaining({
            content: "Тестовое сообщение",
          }),
        ]),
      })
    })

    it("должен выбросить ошибку для несуществующей сессии", async () => {
      await expect(service.exportSession("non-existent")).rejects.toThrow("Session non-existent not found")
    })
  })

  describe("importSession", () => {
    it("должен импортировать сессию из JSON", async () => {
      const sessionData = {
        id: "old-id",
        title: "Импортированный чат",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: "msg-1",
            role: "user" as const,
            content: "Импортированное сообщение",
            timestamp: new Date().toISOString(),
          },
        ],
        agent: "gpt-4" as const,
      }

      const json = JSON.stringify(sessionData)
      const imported = await service.importSession(json)

      expect(imported.id).not.toBe("old-id") // Должен получить новый ID
      expect(imported.title).toBe("Импортированный чат")
      expect(imported.messages).toHaveLength(1)
      expect(imported.messages[0].content).toBe("Импортированное сообщение")
    })

    it("должен выбросить ошибку для невалидного JSON", async () => {
      await expect(service.importSession("invalid json")).rejects.toThrow("Invalid session data")
    })
  })

  describe("private методы", () => {
    it("generateTitle должен корректно обрезать заголовок", () => {
      const service = LocalChatStorageService.getInstance()
      const generateTitle = (service as any).generateTitle.bind(service)

      const shortText = "Короткий текст"
      expect(generateTitle(shortText)).toBe(shortText)

      const longText =
        "Это очень длинный текст который должен быть обрезан до 50 символов и получить многоточие в конце"
      const result = generateTitle(longText)
      expect(result).toHaveLength(53) // 50 + '...'
      expect(result.endsWith("...")).toBe(true)

      const multilineText = "Первая строка\nВторая строка которая не должна попасть в заголовок"
      expect(generateTitle(multilineText)).toBe("Первая строка")
    })

    it("sessionToListItem должен правильно преобразовывать сессию", () => {
      const service = LocalChatStorageService.getInstance()
      const sessionToListItem = (service as any).sessionToListItem.bind(service)

      const session: ChatSession = {
        id: "test-id",
        title: "Тестовый чат",
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: "msg-1",
            role: "user",
            content:
              "Это очень длинное сообщение которое должно быть обрезано для отображения в списке чатов и не занимать слишком много места на экране пользователя",
            timestamp: new Date(),
          },
        ],
        agent: "claude-4-sonnet",
      }

      const listItem = sessionToListItem(session)

      expect(listItem).toMatchObject({
        id: "test-id",
        title: "Тестовый чат",
        lastMessage: expect.stringMatching(/^Это очень длинное сообщение.+\.\.\.$/),
        lastMessageAt: session.updatedAt,
        messageCount: 1,
      })
      expect(listItem.lastMessage).toHaveLength(103) // 100 + '...'
    })
  })
})
