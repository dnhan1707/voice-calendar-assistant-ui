'use client'
import { useState, useEffect, useCallback } from 'react';
import './globals.css';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function Home() {
  // Remove the redundant isRecording state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [userSpeech, setUserSpeech] = useState<string>("I'm ready to help");
  const [assistantResponse, setAssistantResponse] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const textToSpeech = (text: string) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'en-US';
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  }

  const sendToServer = async(query: string) => {
    try {
      const response = await fetch("http://localhost:8000/chatbot/event", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body:JSON.stringify({
          query: query
        })
      })
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      const data = await response.json();
      setAssistantResponse(data); 
      textToSpeech(data)
      return data;

    } catch (error) {
      console.error("Error sending data to server:", error);
      setAssistantResponse("Sorry, I couldn't connect to the server.");
      return null;
    }  finally {
      setIsProcessing(false);
    }
  }

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
      setUserSpeech("I'm ready to hear you")
    };

    // Add speech recognition end handling
    recognition.onend = () => {
      setIsListening(false);
      setUserSpeech("I'm ready to hear you")
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [recognition]);

  // Add silence detection
  useEffect(() => {
    if (!recognition || !isListening) return;
    
    let silenceTimer: NodeJS.Timeout;
    
    // Set up silence detection
    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      
      silenceTimer = setTimeout(async () => {
        // Stop listening after 2 seconds of silence
        if (isListening) {
          recognition.stop();
          setIsListening(false);
          
          // Only send to server if there's meaningful content
          if (userSpeech && 
              userSpeech !== "Listening..." && 
              userSpeech !== "I'm ready to hear you") {
            setIsProcessing(true);
            await sendToServer(userSpeech);
          }
          
          setUserSpeech("I'm ready to hear you");
        }
      }, 2000);
    };
    
    // Start the silence timer when listening begins
    resetSilenceTimer();
    
    // Add an event listener for speech detection to reset timer
    const handleSpeechDetection = () => {
      resetSilenceTimer();
    };
    
    if (recognition) {
      recognition.onresult = (event: any) => {
        handleSpeechDetection();
        
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        setUserSpeech(transcript);
      };
    }
    
    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
    };
  }, [recognition, isListening, userSpeech]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
      setUserSpeech("I'm ready to hear you")
    } else {
      recognition?.start();
      setIsListening(true);
      setUserSpeech("Listening...");
    }
  }, [isListening, recognition]);

  return (
    <div className='full-screen'>
      <div className='intro-welcome-text-container'>
        <p className='intro-welcome'>
          Hi, Welcome to your personal 
          <span className='assistant-text highlight'>calendar assistant!</span>
        </p>
      </div>
      
      <div className='mic-container'>
        <div 
          className={`mic-button ${isListening ? 'recording' : ''} ${isProcessing ? 'processing' : ''}`}
          onClick={toggleListening}
        >
          {isProcessing ? (
            <div className="loading-spinner"></div>
          ) : (
            <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
          )}
        </div>
      </div>
  
      <div className='userspeech-container'>
        <div className="user-query">
          {userSpeech}
        </div>
        
        {assistantResponse && (
          <div className="assistant-response">
            <strong>Assistant:</strong> {assistantResponse}
          </div>
        )}
      </div>
    </div>
  )
}