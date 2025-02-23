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
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    if (!userSpeech){return}

    try {
      const response = await fetch('http://localhost:8000/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({user_input: userSpeech})
      })

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const data = await response.json();
      setAiResponse(data.content);

      speakText(data.content);
    } catch (error) {
      console.error('Error:', error);
      setAiResponse('Sorry, something went wrong.');
    } finally {
      setIsLoading(false);
    }
  }
  async function speakText(text: string) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US'; // Language (change if needed)
    speech.rate = 1; // Speaking speed (0.1 - 2)
    speech.pitch = 1; // Voice pitch (0 - 2)

    window.speechSynthesis.speak(speech);
  };

  async function signIn() {
    window.location.href = 'http://localhost:8000/auth/login';
  };



  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Voice Assistant
        </h1>
        <div className="">
          <div className="flex">
            <button
                onClick={signIn}
                className={`bg-gray-300 p-4 rounded-full font-medium transition-all`}
              >
                Sign in
            </button>
          </div>
        </div>
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
                disabled={isLoading || !userSpeech}
                className={`
                  bg-gray-300 p-4 rounded-full font-medium transition-all
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}
                  ${!userSpeech ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}