import { assign, createMachine } from "xstate";

import { MediaFile } from "@/types/media";

export interface PlayerContextType {
  video: MediaFile | null;
  currentTime: number;
  duration: number;
  volume: number;

  isPlaying: boolean;
  isSeeking: boolean;
  isChangingCamera: boolean;
  isRecording: boolean;
  isVideoLoading: boolean;
  isVideoReady: boolean;
  isResizableMode: boolean; // Флаг, указывающий, что шаблоны должны быть resizable
}

// Начальный контекст для машины состояний плеера
// Значение громкости будет заменено на значение из пользовательских настроек в провайдере
const initialContext: PlayerContextType = {
  video: null,
  currentTime: 0,
  isPlaying: false,
  isSeeking: false,
  isChangingCamera: false,
  isRecording: false,
  isVideoLoading: false,
  isVideoReady: false,
  isResizableMode: true, // По умолчанию включен режим resizable
  duration: 0,
  volume: 100, // Значение по умолчанию, будет заменено из пользовательских настроек
};

interface SetCurrentTimeEvent {
  type: "setCurrentTime";
  currentTime: number;
}

interface SetIsPlayingEvent {
  type: "setIsPlaying";
  isPlaying: boolean;
}

interface SetIsSeekingEvent {
  type: "setIsSeeking";
  isSeeking: boolean;
}

interface SetIsChangingCameraEvent {
  type: "setIsChangingCamera";
  isChangingCamera: boolean;
}

interface SetIsRecordingEvent {
  type: "setIsRecording";
  isRecording: boolean;
}

interface SetDurationEvent {
  type: "setDuration";
  duration: number;
}

interface SetVolumeEvent {
  type: "setVolume";
  volume: number;
}

interface SetVideoEvent {
  type: "setVideo";
  video: MediaFile;
}

interface SetVideoLoadingEvent {
  type: "setVideoLoading";
  isVideoLoading: boolean;
}

interface SetVideoReadyEvent {
  type: "setVideoReady";
  isVideoReady: boolean;
}

interface SetIsResizableModeEvent {
  type: "setIsResizableMode";
  isResizableMode: boolean;
}

export type PlayerEvent =
  | SetCurrentTimeEvent
  | SetIsPlayingEvent
  | SetIsSeekingEvent
  | SetIsChangingCameraEvent
  | SetIsRecordingEvent
  | SetDurationEvent
  | SetVolumeEvent
  | SetVideoEvent
  | SetVideoLoadingEvent
  | SetVideoReadyEvent
  | SetIsResizableModeEvent;

export const playerMachine = createMachine({
  id: "player",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            // Добавляем логирование
            ({ event }) => {
              console.log(
                `[PlayerMachine] Установлено видео: ${event.video?.id}, path=${event.video?.path}`,
              );
            },
          ],
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
      },
    },
    loading: {
      on: {
        setVideoReady: {
          target: "ready",
          actions: [
            assign({ isVideoReady: true, isVideoLoading: false }),
            // Добавляем логирование
            ({ context }) => {
              console.log(
                `[PlayerMachine] Видео ${context.video?.id} готово к воспроизведению`,
              );
            },
          ],
        },
        setVideoLoading: {
          actions: assign({
            isVideoLoading: ({ event }) => event.isVideoLoading,
          }),
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
      },
    },
    ready: {
      on: {
        setVideo: {
          target: "loading",
          actions: [
            assign({ video: ({ event }) => event.video }),
            assign({ isVideoLoading: true }),
            // Добавляем логирование
            ({ event }) => {
              console.log(
                `[PlayerMachine] Установлено видео в состоянии ready: ${event.video?.id}, path=${event.video?.path}`,
              );
            },
          ],
        },
        setIsPlaying: {
          actions: assign({ isPlaying: ({ event }) => event.isPlaying }),
        },
        setCurrentTime: {
          actions: assign({ currentTime: ({ event }) => event.currentTime }),
        },
        setIsSeeking: {
          actions: assign({ isSeeking: ({ event }) => event.isSeeking }),
        },
        setIsChangingCamera: {
          actions: assign({
            isChangingCamera: ({ event }) => event.isChangingCamera,
          }),
        },
        setIsRecording: {
          actions: assign({ isRecording: ({ event }) => event.isRecording }),
        },
        setDuration: {
          actions: assign({ duration: ({ event }) => event.duration }),
        },
        setVolume: {
          actions: assign({ volume: ({ event }) => event.volume }),
        },
        setIsResizableMode: {
          actions: assign({
            isResizableMode: ({ event }) => event.isResizableMode,
          }),
        },
      },
    },
  },
});
