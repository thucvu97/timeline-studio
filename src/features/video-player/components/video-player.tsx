import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useProjectSettings } from "@/features/project-settings"
import { convertToAssetUrl } from "@/lib/tauri-utils"

import { PlayerControls } from "./player-controls"
import { usePlayer } from "../services/player-provider"

/**
 * Компонент медиа-плеера для воспроизведения видео
 */
export function VideoPlayer() {
  const {
    settings: { aspectRatio },
  } = useProjectSettings()
  const { video } = usePlayer()

  // Вычисляем соотношение сторон для AspectRatio
  const aspectRatioValue = aspectRatio.value.width / aspectRatio.value.height

  // Вычисляем стили для контейнера видео
  const containerStyle = {
    position: "relative" as const,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }

  if (!video?.path) {
    const file = {
      id: "no-video",
      path: "",
      name: "Нет видео",
      size: 0,
      type: "video/mp4",
    }
    return (
      <div className="media-player-container relative flex h-full flex-col">
        <div className="relative flex-1 bg-black" style={containerStyle}>
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-full w-full">
              <AspectRatio ratio={aspectRatioValue} className="bg-black">
                <div className="relative h-full w-full">
                  <video
                    key={file.id || "no-file"}
                    src={"#"}
                    controls={false}
                    autoPlay={false}
                    loop={false}
                    disablePictureInPicture
                    preload="auto"
                    tabIndex={0}
                    playsInline
                    muted={false}
                    className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                    style={{
                      position: "absolute" as const,
                      top: "0",
                      left: "0",
                      width: "100%",
                      height: "100%",
                      display: "block",
                      zIndex: 1,
                    }}
                  />
                </div>
              </AspectRatio>
            </div>
          </div>
        </div>
        <PlayerControls currentTime={0} file={file} />
      </div>
    )
  }

  return (
    <div className="media-player-container relative flex h-full flex-col">
      <div className="relative flex-1 bg-black" style={containerStyle}>
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-full w-full">
            <AspectRatio ratio={aspectRatioValue} className="bg-black">
              <div className="relative h-full w-full">
                <video
                  key={video.id || "no-video"}
                  src={convertToAssetUrl(video.path)}
                  controls={false}
                  autoPlay={false}
                  loop={false}
                  disablePictureInPicture
                  preload="auto"
                  tabIndex={0}
                  playsInline
                  muted={false}
                  className="absolute inset-0 h-full w-full object-cover focus:outline-none"
                  style={{
                    position: "absolute" as const,
                    top: "0",
                    left: "0",
                    width: "100%",
                    height: "100%",
                    display: "block",
                    zIndex: 1,
                  }}
                />
              </div>
            </AspectRatio>
          </div>
        </div>
      </div>
      <PlayerControls currentTime={0} file={video} />
    </div>
  )
}

VideoPlayer.displayName = "VideoPlayer"
