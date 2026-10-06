import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, UploadCloud, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const MAX_RECORDING_SECONDS = 30;

const VoiceNoteRecorder = ({ existingUrl, existingDuration, onAudioUploaded, onAudioRemoved }) => {
  const toast = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(existingUrl || null);
  const [duration, setDuration] = useState(existingDuration || 0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const previewAudioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg('Voice recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;

      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const localPreviewUrl = URL.createObjectURL(blob);
        setAudioUrl(localPreviewUrl);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_RECORDING_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      setErrorMsg('Microphone permission required to record audio.');
      toast.warning('Please allow microphone access to record voice instructions.');
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((e) => console.error(e));
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    try {
      const file = new File([audioBlob], `voice-guide-${Date.now()}.webm`, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const serverUrl = res.data?.fileUrl;
      const recDuration = recordingSeconds || 15;
      setDuration(recDuration);
      toast.success('Voice care note recorded and uploaded! 🎙️');
      if (onAudioUploaded) {
        onAudioUploaded({ voiceNoteUrl: serverUrl, voiceNoteDuration: recDuration });
      }
    } catch (err) {
      console.error('Failed to upload audio:', err);
      toast.error('Failed to upload voice recording. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (previewAudioRef.current) previewAudioRef.current.pause();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setDuration(0);
    setIsRecording(false);
    setIsPlayingPreview(false);
    if (onAudioRemoved) onAudioRemoved();
    toast.info('Voice care note removed.');
  };

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-gray-200 dark:border-slate-700/80 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              10-Sec Voice Care Instructions (Audio Guide)
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Speak quick usage or safety tips so neighbors know how to handle your item properly
            </p>
          </div>
        </div>

        {audioUrl && !isRecording && (
          <button
            type="button"
            onClick={handleRemove}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
            title="Remove voice note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Recording in progress */}
      {isRecording && (
        <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 animate-ping" />
            <span className="text-xs font-bold text-red-700 dark:text-red-300">
              Recording... {recordingSeconds}s / {MAX_RECORDING_SECONDS}s
            </span>
          </div>

          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            <Square className="w-3.5 h-3.5" />
            Stop Recording
          </button>
        </div>
      )}

      {/* Audio recorded but not uploaded yet */}
      {!isRecording && audioBlob && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <audio
            ref={previewAudioRef}
            src={audioUrl}
            onEnded={() => setIsPlayingPreview(false)}
            className="hidden"
          />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition flex-shrink-0 shadow-2xs"
            >
              {isPlayingPreview ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Recorded Voice Note ({recordingSeconds || 15}s)
              </span>
              <p className="text-[10px] text-gray-400">Play preview before saving</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startRecording}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition"
            >
              Re-record
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isUploading ? 'Saving...' : 'Confirm Voice Note'}
            </button>
          </div>
        </div>
      )}

      {/* Audio already saved / confirmed */}
      {!isRecording && !audioBlob && audioUrl && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              ✓ Voice guide saved ({duration || 15}s audio attached to item)
            </span>
          </div>
          <button
            type="button"
            onClick={startRecording}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-800"
          >
            Replace
          </button>
        </div>
      )}

      {/* Initial state: Tap to record */}
      {!isRecording && !audioBlob && !audioUrl && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full py-2.5 px-4 bg-white dark:bg-slate-900 border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 transition flex items-center justify-center gap-2 shadow-2xs"
        >
          <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span>Tap to Record Quick 10-30s Audio Guide</span>
        </button>
      )}
    </div>
  );
};

export default VoiceNoteRecorder;
