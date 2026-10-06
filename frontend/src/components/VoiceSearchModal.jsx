import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, Globe2, AlertCircle, ArrowRight, Check } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState('');
  const recognitionRef = useRef(null);

  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setErrorMessage('');
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already started or busy
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
    }
  };

  // Initialize SpeechRecognition instance
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Android Browser.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage('');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            currentFinal += result[0].transcript + ' ';
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (currentFinal) {
          setTranscript((prev) => (prev ? `${prev} ${currentFinal}` : currentFinal).trim());
        }
        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMessage('Microphone access denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'no-speech') {
          // Normal timeout, keep listening
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch {
        // Ignore start error
      }
    } catch {
      setErrorMessage('Could not initialize microphone. Please check browser settings.');
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, [isOpen, selectedLang]);

  const handleLanguageChange = (langCode) => {
    setSelectedLang(langCode);
    localStorage.setItem('shareit_voice_lang', langCode);
    stopListening();
    setTranscript('');
    setInterimTranscript('');
  };

  const handleApplySearch = (customQuery = null) => {
    const rawText = customQuery || transcript || interimTranscript;
    if (!rawText.trim()) {
      toast.warning('No speech detected. Please speak into the microphone.');
      return;
    }

    stopListening();
    const mapped = mapRegionalVoiceToKeywords(rawText.trim());

    toast.success(
      mapped.matchedTerm
        ? `🎙️ Recognized "${mapped.original}" ➔ Mapped to "${mapped.mappedKeyword}"`
        : `🎙️ Searching for "${mapped.original}"`
    );

    // Pass the combined or mapped search query to parent
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fade-in"
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
          {errorMessage ? (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300 text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center py-2">
              {/* Concentric Pulsing Audio Waves */}
              <div className="relative flex items-center justify-center">
                {isListening && (
                  <>
                    <div className="absolute w-28 h-28 rounded-full bg-emerald-500/10 animate-ping" />
                    <div className="absolute w-20 h-20 rounded-full bg-emerald-500/20 animate-pulse" />
                  </>
                )}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
                    isListening
                      ? 'bg-emerald-600 hover:bg-emerald-700 scale-105 ring-4 ring-emerald-400/30'
                      : 'bg-slate-500 hover:bg-slate-600'
                  }`}
                  title={isListening ? 'Tap to pause' : 'Tap to start recording'}
                >
                  {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <MicOff className="w-8 h-8" />}
                </button>
              </div>

              <div className="mt-4 space-y-1">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                  {isListening
                    ? `Listening in ${selectedLangObj.nativeName} (${selectedLangObj.name})...`
                    : 'Tap microphone to start speaking'}
                </span>
                <p className="text-[11px] text-gray-400">
                  Speak clearly into your phone or PC microphone
                </p>
              </div>
            </div>
          )}

          {/* Real-Time Live Transcript Preview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-800 text-left space-y-2 min-h-[85px] flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Live Speech Transcript:
            </span>
            <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
              {currentDisplaySpeech || (
                <span className="text-gray-400 italic font-normal text-xs">
                  "Listening... speak into your microphone..."
                </span>
              )}
            </div>

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
            }}
            disabled={!currentDisplaySpeech}
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
