import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

const VoiceNotePlayer = ({ audioUrl, duration = 0, title = "Owner's Audio Care Guide", compact = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio playback error:', err);
      });
    }
  };

  const handleReset = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!audioUrl) return null;

  const progressPercent = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 p-1.5 px-3 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
        <button
          type="button"
          onClick={togglePlay}
          className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition flex-shrink-0"
          title={isPlaying ? 'Pause voice guide' : 'Play voice guide'}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
        </button>
        <span className="font-semibold text-emerald-900 dark:text-emerald-200 text-[11px] font-mono">
          {isPlaying ? formatSeconds(currentTime) : `${totalDuration || 15}s Audio`}
        </span>
      </div>
    );
  }

  return (
    <div className="p-3.5 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/80 dark:from-emerald-950/40 dark:via-slate-900/60 dark:to-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl space-y-2.5 shadow-2xs">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
            <Volume2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {title}
            </span>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Listen to owner's usage & care tips before pickup
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-emerald-200/80 dark:border-emerald-800/50">
          {formatSeconds(currentTime)} / {formatSeconds(totalDuration || 15)}
        </span>
      </div>

      {/* Progress Track and Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xs transition flex-shrink-0"
          title={isPlaying ? 'Pause' : 'Play audio note'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        {/* Progress Bar & Wave Visualizer */}
        <div className="flex-1 space-y-1">
          <div className="w-full bg-emerald-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Animated Waveform bars */}
          <div className="flex items-center justify-between gap-0.5 px-0.5 h-3 overflow-hidden opacity-70">
            {[40, 70, 30, 90, 60, 100, 50, 80, 45, 95, 60, 85, 35, 75, 55, 90, 65, 40].map((height, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isPlaying ? 'bg-emerald-600 animate-pulse' : 'bg-gray-300 dark:bg-slate-700'
                }`}
                style={{ height: `${isPlaying ? Math.max(20, (height * (Math.sin(i + currentTime) + 1.2)) / 2) : height * 0.4}%` }}
              />
            ))}
          </div>
        </div>

        {currentTime > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition"
            title="Replay from start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceNotePlayer;
