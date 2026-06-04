import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from "react";
import YouTube from "react-youtube";
import "./CustomVideoPlayer.css";

// SVG Icons
const PlayIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const FullscreenIcon = () => (
  <svg viewBox="0 0 24 24">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const m = Math.floor(timeInSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(timeInSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const CustomVideoPlayer = forwardRef(({ videoId, onPlayStateChange }, ref) => {
  const containerRef = useRef(null);
  const internalPlayerRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [maxTimeWatched, setMaxTimeWatched] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Expose play/pause to the parent (AutoControlledVideo)
  useImperativeHandle(ref, () => ({
    playVideo: () => {
      if (internalPlayerRef.current) {
        internalPlayerRef.current.playVideo();
      }
    },
    pauseVideo: () => {
      if (internalPlayerRef.current) {
        internalPlayerRef.current.pauseVideo();
      }
    }
  }));

  const onReady = (event) => {
    internalPlayerRef.current = event.target;
    setDuration(event.target.getDuration());
    event.target.setPlaybackRate(playbackRate);
    event.target.playVideo();
  };

  const onStateChange = (event) => {
    // 1 is playing, 2 is paused
    if (event.data === 1) {
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    } else if (event.data === 2) {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    }
  };

  // Poll for time updates since react-youtube doesn't have an onTimeUpdate event
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(async () => {
        if (internalPlayerRef.current) {
          const time = await internalPlayerRef.current.getCurrentTime();
          setCurrentTime(time);
          if (time > maxTimeWatched) {
            setMaxTimeWatched(time);
          }
        }
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxTimeWatched]);

  const togglePlay = () => {
    if (!internalPlayerRef.current) return;
    if (isPlaying) {
      internalPlayerRef.current.pauseVideo();
    } else {
      internalPlayerRef.current.playVideo();
    }
  };

  const handleProgressClick = (e) => {
    if (!internalPlayerRef.current || duration === 0) return;
    
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const requestedTime = percent * duration;

    // Prevent forwarding: only allow seeking if requestedTime <= maxTimeWatched
    if (requestedTime <= maxTimeWatched) {
      internalPlayerRef.current.seekTo(requestedTime, true);
      setCurrentTime(requestedTime);
    } else {
      // Snap to maxTimeWatched if trying to forward
      internalPlayerRef.current.seekTo(maxTimeWatched, true);
      setCurrentTime(maxTimeWatched);
    }
  };

  const handleSpeedChange = (e) => {
    const speed = parseFloat(e.target.value);
    setPlaybackRate(speed);
    if (internalPlayerRef.current) {
      internalPlayerRef.current.setPlaybackRate(speed);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration ? (maxTimeWatched / duration) * 100 : 0;

  return (
    <div className="custom-player-wrapper" ref={containerRef}>
      <div className="video-container">
        <YouTube
          videoId={videoId}
          onReady={onReady}
          onStateChange={onStateChange}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              controls: 0,
              disablekb: 1,
              modestbranding: 1,
              rel: 0,
              showinfo: 0,
              fs: 0, // Disable YouTube's native fullscreen
              iv_load_policy: 3, // Hide video annotations
            },
          }}
        />
        {/* Transparent overlay intercepts all clicks meant for the iframe */}
        <div className="click-interceptor" onClick={togglePlay}></div>
      </div>

      <div className="custom-controls">
        <div className="progress-bar-container" onClick={handleProgressClick}>
          <div className="progress-bar-buffer" style={{ width: `${bufferPercent}%` }}></div>
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
        
        <div className="controls-row">
          <div className="controls-left">
            <button className="control-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="controls-right">
            <select className="speed-select" value={playbackRate} onChange={handleSpeedChange} title="Playback Speed">
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
            <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomVideoPlayer;
