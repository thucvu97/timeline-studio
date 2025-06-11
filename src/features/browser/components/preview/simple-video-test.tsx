import { useEffect, useState } from "react"

import { convertFileSrc } from "@tauri-apps/api/core"

import { useVideoServerStatus, useVideoStreaming } from "@/features/media/hooks/use-video-streaming"
import { MediaFile } from "@/features/media/types/media"

interface SimpleVideoTestProps {
  file: MediaFile
}

export function SimpleVideoTest({ file }: SimpleVideoTestProps) {
  const [videoSrc, setVideoSrc] = useState<string>("")
  const [status, setStatus] = useState<string>("initializing")
  const [useHttpServer, setUseHttpServer] = useState(false)

  // Use HTTP streaming hooks
  const {
    videoUrl: httpUrl,
    isLoading: httpLoading,
    error: httpError,
  } = useVideoStreaming(useHttpServer ? file.path : undefined)
  const isServerRunning = useVideoServerStatus()

  useEffect(() => {
    console.log("[SimpleVideoTest] File path:", file.path)

    if (useHttpServer) {
      if (httpUrl) {
        console.log("[SimpleVideoTest] HTTP URL:", httpUrl)
        setVideoSrc(httpUrl)
        setStatus("http-url-set")
      } else if (httpLoading) {
        setStatus("http-loading")
      } else if (httpError) {
        setStatus(`http-error: ${httpError.message}`)
      }
    } else {
      // Use asset protocol with proper encoding
      try {
        // Try to decode path first if it's already encoded
        const decodedPath = decodeURIComponent(file.path)
        const pathToUse = decodedPath !== file.path ? decodedPath : file.path
        const url = convertFileSrc(pathToUse)
        console.log("[SimpleVideoTest] Converted URL:", url)
        setVideoSrc(url)
        setStatus("url-set")
      } catch (e) {
        // Fallback to original path
        const url = convertFileSrc(file.path)
        console.log("[SimpleVideoTest] Fallback URL:", url)
        setVideoSrc(url)
        setStatus("url-set-fallback")
      }
    }
  }, [file.path, useHttpServer, httpUrl, httpLoading, httpError])

  return (
    <div
      style={{
        width: "400px",
        padding: "10px",
        border: "2px solid #ccc",
        borderRadius: "8px",
        backgroundColor: "#f5f5f5",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <button
          onClick={() => setUseHttpServer(!useHttpServer)}
          style={{
            padding: "5px 10px",
            marginRight: "10px",
            backgroundColor: useHttpServer ? "#4CAF50" : "#f44336",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {useHttpServer ? "HTTP Server" : "Asset Protocol"}
        </button>
        <span style={{ fontSize: "12px", color: "#666", marginRight: "10px" }}>Status: {status}</span>
        <span style={{ fontSize: "12px", color: isServerRunning ? "#4CAF50" : "#f44336" }}>
          Server: {isServerRunning ? "Running" : "Not Running"}
        </span>
      </div>

      <div style={{ marginBottom: "10px", fontSize: "10px", wordBreak: "break-all" }}>
        <div>
          <strong>Path:</strong> {file.path}
        </div>
        <div>
          <strong>URL:</strong> {videoSrc}
        </div>
      </div>

      <div
        style={{
          width: "100%",
          height: "200px",
          border: "1px solid #999",
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        {videoSrc && (
          <video
            key={videoSrc} // Force remount on URL change
            src={videoSrc}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
            controls
            preload="metadata"
            onLoadStart={() => {
              console.log("[SimpleVideoTest] Load started")
              setStatus("loading")
            }}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget
              console.log("[SimpleVideoTest] Metadata loaded:", {
                duration: video.duration,
                width: video.videoWidth,
                height: video.videoHeight,
              })
              setStatus("metadata-loaded")
            }}
            onLoadedData={() => {
              console.log("[SimpleVideoTest] Data loaded")
              setStatus("data-loaded")
            }}
            onCanPlay={() => {
              console.log("[SimpleVideoTest] Can play")
              setStatus("can-play ✓")
            }}
            onError={(e) => {
              const video = e.currentTarget as HTMLVideoElement
              console.error("[SimpleVideoTest] Error:", {
                error: video.error,
                errorCode: video.error?.code,
                errorMessage: video.error?.message,
                src: video.src,
                networkState: video.networkState,
                readyState: video.readyState,
              })
              setStatus(`error: ${video.error?.code} - ${video.error?.message || "unknown"}`)
            }}
          />
        )}
      </div>
    </div>
  )
}
