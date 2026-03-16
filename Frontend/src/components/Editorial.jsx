import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Volume2, VolumeX, Maximize, Settings } from 'lucide-react';

const Editorial = ({ secureUrl, thumbnailUrl, duration }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // If no video URL is provided, show a message
  if (!secureUrl) {
    return (
      <div className="flex items-center justify-center w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg bg-base-200 py-16">
        <div className="text-center">
          <div className="mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-base-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-base-content mb-2">Video Solution Not Available</p>
          <p className="text-base-500 text-sm">The editorial video for this problem will be available soon.</p>
        </div>
      </div>
    );
  }

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      try {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error('Play error:', error);
              setIsPlaying(false);
            });
          }
        }
        setIsPlaying(!isPlaying);
      } catch (error) {
        console.error('Play/Pause error:', error);
        setIsPlaying(false);
      }
    }
  };

  const handlePlaybackSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume > 0 && isMuted) {
        setIsMuted(false);
      } else if (newVolume === 0 && !isMuted) {
        setIsMuted(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  // Update current time during playback
  useEffect(() => {
    const video = videoRef.current;
    
    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-lg bg-black"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={secureUrl}
        poster={thumbnailUrl}
        onClick={togglePlayPause}
        className="w-full aspect-video bg-black cursor-pointer"
      />
      
      {/* Video Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/40 to-transparent p-4 transition-opacity duration-200 ${
          isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-3 w-full">
          <span className="text-white text-xs font-medium whitespace-nowrap">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = Number(e.target.value);
              }
            }}
            className="range range-primary range-xs flex-1"
          />
          <span className="text-white text-xs font-medium whitespace-nowrap">
            {formatTime(duration || 0)}
          </span>
        </div>

        {/* Control Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Left Controls: Play & Skip */}
          <div className="flex items-center gap-1">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="btn btn-circle btn-sm btn-primary"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} />
              )}
            </button>

            {/* Skip Backward */}
            <button
              onClick={() => skipTime(-2)}
              className="btn btn-ghost btn-sm text-white hover:bg-white/20"
              title="Skip backward 2s"
            >
              -2s
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skipTime(2)}
              className="btn btn-ghost btn-sm text-white hover:bg-white/20"
              title="Skip forward 2s"
            >
              +2s
            </button>
          </div>

          {/* Right Controls: Volume, Speed, Fullscreen */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Volume Control */}
            <div className="flex items-center gap-1 group">
              <button
                onClick={toggleMute}
                className="btn btn-ghost btn-sm text-white hover:bg-white/20"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX size={16} />
                ) : (
                  <Volume2 size={16} />
                )}
              </button>
              
              {/* Volume Slider */}
              <div className="hidden group-hover:flex items-center gap-1 bg-black/70 px-2 py-1 rounded">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="range range-primary range-xs w-20"
                />
                <span className="text-white text-xs min-w-fit">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            {/* Playback Speed */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="btn btn-ghost btn-sm text-white hover:bg-white/20 flex items-center gap-1"
                title="Playback speed"
              >
                <Settings size={16} />
                <span className="text-xs font-bold">{playbackSpeed}x</span>
              </button>

              {/* Speed Menu */}
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 border border-white/20 rounded-lg shadow-lg z-50 backdrop-blur-sm">
                  <div className="flex flex-col p-2 gap-1 min-w-max">
                    {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => handlePlaybackSpeed(speed)}
                        className={`px-4 py-1.5 text-sm rounded transition-all ${
                          playbackSpeed === speed
                            ? 'bg-primary text-primary-content font-bold'
                            : 'text-white hover:bg-white/10'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-ghost btn-sm text-white hover:bg-white/20"
              title="Fullscreen"
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Editorial;