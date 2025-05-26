import { vi } from "vitest";

/**
 * Утилиты для тестирования аудио компонентов в Tauri приложении
 */

/**
 * Создает мок для аудио файла с реалистичными данными
 */
export function createMockAudioFile(options: {
  name?: string;
  path?: string;
  duration?: number;
  size?: number;
} = {}) {
  const {
    name = "test-audio.mp3",
    path = "/path/to/test-audio.mp3",
    duration = 180,
    size = 1024 * 1024 * 3, // 3MB
  } = options;

  return {
    id: `audio-${Math.random().toString(36).substring(2, 11)}`,
    name,
    path,
    isVideo: false,
    isAudio: true,
    isImage: false,
    duration,
    size,
  };
}

/**
 * Создает мок для аудио данных (Uint8Array)
 */
export function createMockAudioData(size = 1024): Uint8Array {
  // Создаем реалистичные MP3 данные
  const data = new Uint8Array(size);

  // ID3 header
  data[0] = 0x49; // 'I'
  data[1] = 0x44; // 'D'
  data[2] = 0x33; // '3'
  data[3] = 0x03; // Version
  data[4] = 0x00; // Revision
  data[5] = 0x00; // Flags

  // MP3 frame header
  data[10] = 0xFF;
  data[11] = 0xFB;
  data[12] = 0x90;
  data[13] = 0x00;

  // Заполняем остальные данные случайными значениями
  for (let i = 14; i < size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }

  return data;
}

/**
 * Мокает Tauri readFile для возврата аудио данных
 */
export function mockTauriReadFile() {
  const { readFile } = vi.hoisted(() => ({
    readFile: vi.fn(),
  }));

  readFile.mockImplementation((path: string) => {
    console.log(`[Mock] Reading file: ${path}`);
    return Promise.resolve(createMockAudioData());
  });

  return readFile;
}

/**
 * Мокает convertFileSrc для Tauri
 */
export function mockTauriConvertFileSrc() {
  const { convertFileSrc } = vi.hoisted(() => ({
    convertFileSrc: vi.fn(),
  }));

  convertFileSrc.mockImplementation((path: string) => {
    return `tauri://localhost/${path.replace(/^\//, '')}`;
  });

  return convertFileSrc;
}

/**
 * Создает полный мок для Web Audio API
 */
export function createWebAudioMocks() {
  const mockAudioContext = vi.fn().mockImplementation(() => {
    const mockSource = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const mockDestination = {
      stream: new MediaStream(),
    };

    return {
      createMediaElementSource: vi.fn().mockReturnValue(mockSource),
      createMediaStreamDestination: vi.fn().mockReturnValue(mockDestination),
      destination: {},
      close: vi.fn().mockResolvedValue(undefined),
      state: 'running',
      sampleRate: 44100,
    };
  });

  const mockMediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    state: 'inactive',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  // Добавляем статический метод
  (mockMediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

  return {
    AudioContext: mockAudioContext,
    MediaRecorder: mockMediaRecorder,
  };
}

/**
 * Создает мок для HTMLAudioElement с расширенной функциональностью
 */
export function createAudioElementMock() {
  const audioElement = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    currentTime: 0,
    duration: 180,
    paused: true,
    ended: false,
    volume: 1,
    muted: false,
    playbackRate: 1,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    src: '',
  };

  return audioElement;
}

/**
 * Симулирует загрузку аудио файла
 */
export async function simulateAudioLoad(audioElement: HTMLAudioElement) {
  // Симулируем событие loadedmetadata
  const loadedEvent = new Event('loadedmetadata');
  audioElement.dispatchEvent(loadedEvent);

  // Ждем небольшую задержку для имитации загрузки
  await new Promise(resolve => setTimeout(resolve, 50));
}

/**
 * Симулирует воспроизведение аудио
 */
export async function simulateAudioPlay(audioElement: HTMLAudioElement) {
  // Обновляем состояние
  Object.defineProperty(audioElement, 'paused', {
    value: false,
    writable: true,
    configurable: true,
  });

  const playEvent = new Event('play');
  audioElement.dispatchEvent(playEvent);

  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Симулирует паузу аудио
 */
export async function simulateAudioPause(audioElement: HTMLAudioElement) {
  // Обновляем состояние
  Object.defineProperty(audioElement, 'paused', {
    value: true,
    writable: true,
    configurable: true,
  });

  const pauseEvent = new Event('pause');
  audioElement.dispatchEvent(pauseEvent);

  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Симулирует окончание воспроизведения
 */
export async function simulateAudioEnd(audioElement: HTMLAudioElement) {
  // Создаем мок объект с нужными свойствами
  Object.defineProperty(audioElement, 'paused', {
    value: true,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(audioElement, 'ended', {
    value: true,
    writable: true,
    configurable: true,
  });

  Object.defineProperty(audioElement, 'currentTime', {
    value: audioElement.duration || 0,
    writable: true,
    configurable: true,
  });

  const endedEvent = new Event('ended');
  audioElement.dispatchEvent(endedEvent);

  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Симулирует ошибку загрузки аудио
 */
export async function simulateAudioError(audioElement: HTMLAudioElement, errorCode = 4) {
  // Создаем кастомное событие с правильной структурой
  const errorEvent = new CustomEvent('error', {
    detail: {
      error: {
        code: errorCode,
        message: 'Mock audio error',
      },
    },
  });

  // Добавляем error свойство к аудио элементу
  Object.defineProperty(audioElement, 'error', {
    value: {
      code: errorCode,
      message: 'Mock audio error',
    },
    writable: true,
    configurable: true,
  });

  audioElement.dispatchEvent(errorEvent);

  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Создает полный набор моков для тестирования аудио компонентов
 */
export function setupAudioTestEnvironment() {
  const webAudioMocks = createWebAudioMocks();
  const readFileMock = mockTauriReadFile();
  const convertFileSrcMock = mockTauriConvertFileSrc();

  // Мокаем URL API
  const createObjectURLMock = vi.fn().mockImplementation(() => {
    return `blob:mock-url-${Math.random().toString(36).substring(2, 11)}`;
  });

  const revokeObjectURLMock = vi.fn();

  return {
    webAudio: webAudioMocks,
    tauri: {
      readFile: readFileMock,
      convertFileSrc: convertFileSrcMock,
    },
    url: {
      createObjectURL: createObjectURLMock,
      revokeObjectURL: revokeObjectURLMock,
    },
    cleanup: () => {
      vi.clearAllMocks();
    },
  };
}

/**
 * Ждет инициализации аудио контекста (имитирует setTimeout в компоненте)
 */
export async function waitForAudioContextInit(delay = 150) {
  await new Promise(resolve => setTimeout(resolve, delay));
}
