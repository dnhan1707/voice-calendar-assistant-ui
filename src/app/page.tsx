'use client'

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false); // Google Sign-In state
  const [accessToken, setAccessToken] = useState<string | null>(null); // Store the access token
  const [refreshToken, setRefreshToken] = useState<string | null>(null); // Store the refresh token
  const [isPaused, setIsPaused] = useState<boolean>(false); // Track if speech is paused
  const router = useRouter(); 

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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
      console.log(event);
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

  const sendOpenai = async () => {
    if (!userSpeech) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/chatbot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_input: userSpeech, access_token: accessToken }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
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
  };

  const speakText = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  const pauseText = () => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  };

  const resumeText = () => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  };

  const stopText = () => {
    window.speechSynthesis.cancel()
    setAiResponse("");
    setIsPaused(false);
  }

  const signIn = () => {
    window.location.href = 'http://localhost:8000/auth/login'; // Redirect to backend OAuth login
  };

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    if (token && refreshToken) {
      setAccessToken(token);
      setRefreshToken(refreshToken);
      setIsSignedIn(true);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const fetchGoogleCalendar = async () => {
    if (!accessToken) {
      console.log("Auth not found");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/calendar/?access_token=${accessToken}&refresh_token=${refreshToken}`);
      const data = await response.json();
      console.log(data);
      setAiResponse(`You have ${data.length} events on your calendar.`);
    } catch (error) {
      console.error('Error fetching Google Calendar:', error);
    }
  };

  const handleAuthRedirect = async () => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      localStorage.setItem('access_token', accessToken); // Store access token
      localStorage.setItem('refresh_token', refreshToken); // Store refresh token
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setIsSignedIn(true);
      router.push('/'); // Redirect back to home after login
    }
  };

  useEffect(() => {
    handleAuthRedirect();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">
          Voice Assistant
        </h1>
        <div className="flex justify-center">
          {!isSignedIn ? (
            <button
              onClick={signIn}
              className="bg-gray-300 p-4 rounded-full font-medium transition-all"
            >
              Sign in with Google
            </button>
          ) : (
            <button
              onClick={fetchGoogleCalendar}
              className="bg-green-300 p-4 rounded-full font-medium transition-all"
            >
              Fetch Google Calendar Events
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex justify-center">
            <button
              onClick={toggleListening}
              className={`px-6 py-3 rounded-full font-medium transition-all ${isListening ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
            >
              {isListening ? 'Stop Listening' : 'Start Listening'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
            <p className="text-gray-700 text-lg">{userSpeech || "Your speech will appear here..."}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 min-h-[150px]">
            <p className="text-gray-700 text-lg">{aiResponse || "AI response..."}</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <button
            onClick={sendOpenai}
            disabled={isLoading || !userSpeech}
            className="bg-gray-300 p-4 rounded-full font-medium transition-all"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
          <button
            onClick={pauseText}
            disabled={isPaused}
            className="bg-yellow-300 p-4 rounded-full font-medium transition-all"
          >
            Pause
          </button>
          <button
            onClick={resumeText}
            disabled={!isPaused}
            className="bg-green-300 p-4 rounded-full font-medium transition-all"
          >
            Resume
          </button>
        </div>
      </div>
    </main>
  );
}