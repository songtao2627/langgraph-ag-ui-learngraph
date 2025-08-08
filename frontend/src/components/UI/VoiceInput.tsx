/**
 * Advanced Voice Input Component
 * Speech-to-text with real-time visualization
 */

import { useState, useRef, useEffect } from 'react';
import type { FC } from 'react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const VoiceInput: FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      recognition.onstart = () => {
        setIsListening(true);
        startAudioVisualization();
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
        
        if (finalTranscript) {
          onTranscript(finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        onError?.(event.error);
        setIsListening(false);
        stopAudioVisualization();
      };

      recognition.onend = () => {
        setIsListening(false);
        stopAudioVisualization();
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioVisualization();
    };
  }, [onTranscript, onError]);

  // Audio visualization
  const startAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      const updateAudioLevel = () => {
        if (!analyserRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255);
        
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      onError?.('无法访问麦克风');
    }
  };

  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  if (!isSupported) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        您的浏览器不支持语音输入
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Voice button with visualization */}
      <div className="relative">
        <button
          onClick={toggleListening}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isListening
              ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg scale-110'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105'
          }`}
        >
          <span className="text-lg">
            {isListening ? '🔴' : '🎤'}
          </span>
          
          {/* Audio level visualization */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" 
                 style={{ 
                   transform: `scale(${1 + audioLevel * 0.5})`,
                   opacity: audioLevel 
                 }} 
            />
          )}
        </button>
        
        {/* Status indicator */}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
        }`} />
      </div>

      {/* Transcript display */}
      {transcript && (
        <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20">
          <div className="text-sm text-gray-700">
            <span className="text-gray-500 text-xs">识别中:</span>
            <div className="mt-1 font-medium">{transcript}</div>
          </div>
        </div>
      )}

      {/* Audio waveform visualization */}
      {isListening && (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-blue-500 rounded-full transition-all duration-100"
              style={{
                height: `${8 + audioLevel * 20 + Math.sin(Date.now() / 200 + i) * 4}px`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};