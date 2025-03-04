"use client"

import { useEffect, useRef, useState } from "react"
import Plyr from "plyr"
import "plyr/dist/plyr.css"
import Hls from "hls.js"

interface VideoPlayerProps {
  streamUrl: string
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [hasAudio, setHasAudio] = useState(true)

  useEffect(() => {
    if (!videoRef.current) return

    const initializePlayer = () => {
      playerRef.current = new Plyr(videoRef.current!, {
        controls: [
          'play-large',
          'play',
          'volume',
          'current-time',
          'progress',
          'settings',
          'fullscreen',
        ],
        settings: ['quality', 'speed'],
        volume: 0.5,
      })
    }

    initializePlayer()

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy()
      }
    }
  }, [])

  useEffect(() => {
    if (!videoRef.current) return

    let hls: Hls | null = null
    
    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        startLevel: 0,
        //@ts-ignore
        enableWebAudio: true,
        audioTrackContainerExt: '#EXT-X-MEDIA',
        audioTrackSwitching: true,
        autoStartLoad: true
      })

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        // Check for audio tracks
        const hasAudio = data.levels.some(level => level.audioCodec)
        setHasAudio(hasAudio)
        
        if (hasAudio) {
          videoRef.current?.play().catch(error => {
            console.log('Autoplay prevented:', error)
          })
        }
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          error: data.error?.message,
          url: data.url,
          context: data.context?.url
        })
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error - trying to recover')
              hls?.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error - restarting')
              hls?.recoverMediaError()
              break
            default:
              hls?.destroy()
              break
          }
        }
      })

      hls.loadSource(streamUrl)
      hls.attachMedia(videoRef.current)
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = streamUrl
    }

    return () => {
      hls?.destroy()
    }
  }, [streamUrl])

  return (
    <div className="aspect-video bg-black rounded-xl overflow-hidden relative group">
      <video
        ref={videoRef}
        className={`w-full h-full ${hasAudio ? 'plyr' : 'basic-video'}`}
        crossOrigin="anonymous"
        playsInline
        controls={!hasAudio}
      >
        <source src={streamUrl} type="application/x-mpegURL" />
      </video>
    </div>
  )
}

