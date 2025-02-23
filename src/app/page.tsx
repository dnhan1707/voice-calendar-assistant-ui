'use client'

import { useState, useEffect, useCallback } from "react";
import { OpenaiResponse } from "./type";

// Type definitions for Speech Recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Home() {
  const [userSpeech, setUserSpeech] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [aiResponse, setAiResponse] = useState<string>("");

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition =   window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        setRecognition(recognition);
      }
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setUserSpeech(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
    }
  }, [isListening, recognition]);

  async function sendOpenai() {
    
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Voice Assistant
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={toggleListening}
              className={`
                px-6 py-3 rounded-full font-medium transition-all
                ${isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
            <p className="text-gray-700 text-lg">
              {userSpeech || "Your speech will appear here..."}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
            <p className="text-gray-700 text-lg">
              {aiResponse || "AI response..."}
            </p>
          </div>

          {!recognition && (
            <p className="text-red-500 text-center">
              Speech recognition is not supported in this browser.
            </p>
          )}
        </div>

        <div className="">
          <div className="flex">
            <button
              onClick={sendOpenai}
              className={`bg-gray-300 p-4 rounded-full font-medium transition-all`}>
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}