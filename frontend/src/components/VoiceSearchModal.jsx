import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Globe2, ArrowRight, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES, mapRegionalVoiceToKeywords } from '../utils/regionalKeywords';
import { useToast } from '../context/ToastContext';

const VoiceSearchModal = ({ isOpen, onClose, onSearchSubmit }) => {
  const toast = useToast();
  const [selectedLang, setSelectedLang] = useState(() => {
    return localStorage.getItem('shareit_voice_lang') || 'en-IN';
  });
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [notice, setNotice] = useState('');
  const recognitionRef = useRef(null);

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  // Battle-tested startVoice pattern (identical to working ai-grievance-system)
  const startVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      toast.warning('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = selectedLang || 'en-IN';

      let finalAccumulated = transcript;

      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalAccumulated += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(finalAccumulated);
        setInterimTranscript(interim);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.warn('Speech recognition notice:', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setNotice('Microphone access was not granted. Please check your browser microphone permission.');
        } else if (event.error === 'no-speech') {
          // Normal timeout on pause
        } else {
          setNotice('');
        }
      };

      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
      setNotice('');
    } catch (err) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  };

  // Clean cleanup on modal open / close
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setNotice('');
    }
    return () => {
      stopVoice();
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    localStorage.setItem('shareit_voice_lang', langCode);
    stopVoice();
    setTranscript('');
    setInterimTranscript('');
    setNotice('');
  };

  const handleApplySearch = (customQuery = null) => {
    const rawText = customQuery || transcript || interimTranscript;
    if (!rawText.trim()) {
      toast.warning('Please speak into the microphone or type your search.');
      return;
    }

    stopVoice();
    const mapped = mapRegionalVoiceToKeywords(rawText.trim());

    toast.success(
      mapped.matchedTerm
        ? `🎙️ Recognized "${mapped.original}" ➔ Mapped to "${mapped.mappedKeyword}"`
        : `🎙️ Searching for "${mapped.original}"`
    );

    onSearchSubmit(mapped);
    onClose();
  };

  if (!isOpen) return null;

  const currentDisplaySpeech = (transcript + (interimTranscript ? ` ${interimTranscript}` : '')).trim();
  const mappedPreview = currentDisplaySpeech ? mapRegionalVoiceToKeywords(currentDisplaySpeech) : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Multilingual Voice Search"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Regional Voice Search
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full">
                  100% Free
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Speak in your preferred Indian language or dialect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selection Chips */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
            <Globe2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Select Speaking Language:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Central Audio Waves & Mic Animation */}
        <div className="p-6 text-center space-y-5">
          <div className="relative flex flex-col items-center justify-center py-2">
            {/* Concentric Pulsing Waves */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-ping" />
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopVoice : startVoice}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 cursor-pointer ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 scale-105 ring-8 ring-red-400/30 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-105 shadow-emerald-600/30 ring-4 ring-emerald-500/20'
                }`}
                title={isListening ? 'Tap to pause' : 'Tap to start speaking'}
              >
                {isListening ? <MicOff className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center justify-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-ping' : 'bg-emerald-600'}`} />
                {isListening
                  ? `Listening in ${selectedLangObj.nativeName} (${selectedLangObj.name})...`
                  : 'Tap the microphone to speak'}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isListening ? 'Speak now... Your words will appear below' : 'Speak in your preferred language or type manually'}
              </p>
            </div>
          </div>

          {notice && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-2 px-3 rounded-xl">
              {notice}
            </p>
          )}

          {/* Real-Time Live Transcript Preview or Manual Edit */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 text-left space-y-2 min-h-[90px] flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                {isListening && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />}
                Live Transcription / Search Text:
              </span>
              {currentDisplaySpeech && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  ✓ Ready
                </span>
              )}
            </div>
            <input
              type="text"
              value={currentDisplaySpeech}
              onChange={(e) => {
                setTranscript(e.target.value);
                setInterimTranscript('');
              }}
              placeholder={isListening ? 'Speak now... 🎤 Your words will appear here' : 'Speak or type items (e.g. DSLR Camera, Tent)...'}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-gray-900 dark:text-white outline-none placeholder-gray-400"
            />

            {/* Smart Dialect Mapping Badge */}
            {mappedPreview && mappedPreview.matchedTerm && (
              <div className="pt-2 border-t border-gray-200 dark:border-slate-800 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span>
                  Detected dialect: <strong>"{mappedPreview.matchedTerm}"</strong> ➔ Auto-mapped to catalog:{' '}
                  <strong>"{mappedPreview.mappedKeyword}"</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 bg-gray-50 dark:bg-slate-800/40 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setTranscript('');
              setInterimTranscript('');
              setNotice('');
            }}
            disabled={!currentDisplaySpeech && !notice}
            className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-40 transition"
          >
            Clear Text
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleApplySearch()}
              disabled={!currentDisplaySpeech}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Search Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceSearchModal;
