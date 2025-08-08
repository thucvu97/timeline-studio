import { beforeEach, describe, expect, it, vi } from "vitest"
import { AIDIContainer } from "../di-container"

describe("AIDIContainer", () => {
  let container: AIDIContainer

  beforeEach(() => {
    // Создаем новый контейнер для каждого теста
    container = AIDIContainer.createTestInstance()
  })

  describe("Service Registration", () => {
    it("should register singleton service", async () => {
      const mockService = { name: "TestService", value: 42 }

      container.registerSingleton("TestService", () => mockService)

      const instance1 = await container.resolve<typeof mockService>("TestService")
      const instance2 = await container.resolve<typeof mockService>("TestService")

      expect(instance1).toBe(instance2) // Должен быть тот же экземпляр
      expect(instance1).toEqual(mockService)
    })

    it("should register transient service", async () => {
      let counter = 0

      container.registerTransient("CounterService", () => ({
        id: ++counter,
      }))

      const instance1 = await container.resolve<{ id: number }>("CounterService")
      const instance2 = await container.resolve<{ id: number }>("CounterService")

      expect(instance1).not.toBe(instance2) // Разные экземпляры
      expect(instance1.id).toBe(1)
      expect(instance2.id).toBe(2)
    })

    it("should handle async factory functions", async () => {
      container.registerSingleton("AsyncService", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { async: true }
      })

      const instance = await container.resolve("AsyncService")
      expect(instance).toEqual({ async: true })
    })
  })

  describe("Dependency Resolution", () => {
    it("should resolve dependencies automatically", async () => {
      // Регистрируем зависимости
      container.registerSingleton("Database", () => ({
        name: "TestDB",
        connect: vi.fn(),
      }))

      container.registerSingleton("Cache", () => ({
        name: "TestCache",
        get: vi.fn(),
        set: vi.fn(),
      }))

      // Регистрируем сервис с зависимостями
      container.registerSingleton(
        "UserService",
        (db: any, cache: any) => ({
          name: "UserService",
          database: db,
          cache: cache,
        }),
        ["Database", "Cache"],
      )

      const userService = await container.resolve<any>("UserService")

      expect(userService.name).toBe("UserService")
      expect(userService.database.name).toBe("TestDB")
      expect(userService.cache.name).toBe("TestCache")
    })

    it("should resolve nested dependencies", async () => {
      // A зависит от B, B зависит от C
      container.registerSingleton("ServiceC", () => ({ name: "C" }))

      container.registerSingleton("ServiceB", (c: any) => ({ name: "B", dependency: c }), ["ServiceC"])

      container.registerSingleton("ServiceA", (b: any) => ({ name: "A", dependency: b }), ["ServiceB"])

      const serviceA = await container.resolve<any>("ServiceA")

      expect(serviceA.name).toBe("A")
      expect(serviceA.dependency.name).toBe("B")
      expect(serviceA.dependency.dependency.name).toBe("C")
    })
  })

  describe("Circular Dependency Detection", () => {
    it("should detect direct circular dependency", async () => {
      // A зависит от B, B зависит от A
      container.registerSingleton("ServiceA", (b: any) => ({ name: "A", dep: b }), ["ServiceB"])

      container.registerSingleton("ServiceB", (a: any) => ({ name: "B", dep: a }), ["ServiceA"])

      await expect(container.resolve("ServiceA")).rejects.toThrow("Circular dependency detected")
    })

    it("should detect indirect circular dependency", async () => {
      // A -> B -> C -> A
      container.registerSingleton("ServiceA", (_b: any) => ({ name: "A" }), ["ServiceB"])

      container.registerSingleton("ServiceB", (_c: any) => ({ name: "B" }), ["ServiceC"])

      container.registerSingleton("ServiceC", (_a: any) => ({ name: "C" }), ["ServiceA"])

      await expect(container.resolve("ServiceA")).rejects.toThrow("Circular dependency detected")
    })
  })

  describe("Error Handling", () => {
    it("should throw error for unregistered service", async () => {
      await expect(container.resolve("NonExistent")).rejects.toThrow("Service 'NonExistent' not registered")
    })

    it("should throw error for missing dependencies", async () => {
      container.registerSingleton("ServiceWithMissingDep", (dep: any) => ({ dep }), ["MissingDependency"])

      await expect(container.resolve("ServiceWithMissingDep")).rejects.toThrow(
        "Service 'MissingDependency' not registered",
      )
    })

    it("should handle factory errors", async () => {
      container.registerSingleton("ErrorService", () => {
        throw new Error("Factory error")
      })

      await expect(container.resolve("ErrorService")).rejects.toThrow("Factory error")
    })
  })

  describe("Lifecycle Management", () => {
    it("should cache singleton instances", async () => {
      const factory = vi.fn(() => ({ singleton: true }))
      container.registerSingleton("CachedService", factory)

      await container.resolve("CachedService")
      await container.resolve("CachedService")
      await container.resolve("CachedService")

      expect(factory).toHaveBeenCalledTimes(1)
    })

    it("should create new transient instances", async () => {
      const factory = vi.fn(() => ({ transient: true }))
      container.registerTransient("TransientService", factory)

      await container.resolve("TransientService")
      await container.resolve("TransientService")
      await container.resolve("TransientService")

      expect(factory).toHaveBeenCalledTimes(3)
    })
  })

  describe("Utility Methods", () => {
    it("should check if service is registered", () => {
      expect(container.has("TestService")).toBe(false)

      container.registerSingleton("TestService", () => ({}))

      expect(container.has("TestService")).toBe(true)
    })

    it("should get already resolved singleton", async () => {
      container.registerSingleton("GetTest", () => ({ value: 123 }))

      // Сначала resolve
      const resolved = await container.resolve<any>("GetTest")

      // Затем get должен вернуть тот же экземпляр
      const gotten = container.get<any>("GetTest")

      expect(gotten).toBe(resolved)
      expect(gotten.value).toBe(123)
    })

    it("should throw error for unresolved service", () => {
      container.registerSingleton("UnresolvedTest", () => ({}))

      expect(() => container.get("UnresolvedTest")).toThrow(
        "Service 'UnresolvedTest' not yet resolved. Use resolve() first.",
      )
    })
  })

  describe("Integration with AI Services", () => {
    it("should register and resolve AI provider chain", async () => {
      // Мокируем базовые сервисы
      const mockApiKeyLoader = { getApiKey: vi.fn(() => "test-key") }
      const mockModelConfig = { getModels: vi.fn(() => []) }

      container.registerSingleton("ApiKeyLoader", () => mockApiKeyLoader)
      container.registerSingleton("ModelConfig", () => mockModelConfig)

      // Регистрируем провайдера с зависимостями
      container.registerSingleton(
        "ClaudeProvider",
        (keyLoader: any, config: any) => ({
          name: "claude",
          apiKey: keyLoader.getApiKey(),
          models: config.getModels(),
        }),
        ["ApiKeyLoader", "ModelConfig"],
      )

      const provider = await container.resolve<any>("ClaudeProvider")

      expect(provider.name).toBe("claude")
      expect(provider.apiKey).toBe("test-key")
      expect(mockApiKeyLoader.getApiKey).toHaveBeenCalled()
      expect(mockModelConfig.getModels).toHaveBeenCalled()
    })
  })

  describe("Configuration and Initialization", () => {
    it("should accept configuration", () => {
      const config = {
        providers: {
          claude: { apiKey: "test" },
        },
      }

      container.configure(config)

      // Конфигурация должна быть доступна через метод
      const retrievedConfig = (container as any).config
      expect(retrievedConfig).toEqual(config)
    })

    it("should initialize container", async () => {
      const initSpy = vi.spyOn(container, "initialize")

      await container.initialize()

      expect(initSpy).toHaveBeenCalled()
    })
  })

  describe("Advanced Patterns", () => {
    it("should support factory pattern", async () => {
      // Регистрируем фабрику
      container.registerSingleton("ServiceFactory", () => ({
        create: (type: string) => ({ type, id: Math.random() }),
      }))

      const factory = await container.resolve<any>("ServiceFactory")

      const service1 = factory.create("TypeA")
      const service2 = factory.create("TypeB")

      expect(service1.type).toBe("TypeA")
      expect(service2.type).toBe("TypeB")
      expect(service1.id).not.toBe(service2.id)
    })

    it("should support decorator pattern", async () => {
      // Базовый сервис
      container.registerSingleton("BaseService", () => ({
        getData: () => "base data",
      }))

      // Декоратор
      container.registerSingleton(
        "DecoratedService",
        (base: any) => ({
          getData: () => `decorated: ${base.getData()}`,
        }),
        ["BaseService"],
      )

      const decorated = await container.resolve<any>("DecoratedService")

      expect(decorated.getData()).toBe("decorated: base data")
    })
  })
})
