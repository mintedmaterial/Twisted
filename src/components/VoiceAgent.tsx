'use client';

import { Conversation } from '@elevenlabs/client';
import { useCallback, useRef, useState } from 'react';

export default function VoiceAgent() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const conversationRef = useRef<Conversation | null>(null);

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation session
      const conversation = await Conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_4901kd1hbf8keec91akr5trg8czn',
        connectionType: 'websocket', // or 'webrtc'
        onConnect: () => {
          console.log('Connected to ElevenLabs agent');
          setIsConnected(true);
          setIsSpeaking(true);
        },
        onDisconnect: () => {
          console.log('Disconnected from ElevenLabs agent');
          setIsConnected(false);
          setIsSpeaking(false);
        },
        onMessage: (message) => {
          console.log('Agent message:', message);
        },
        onError: (error) => {
          console.error('Agent error:', error);
        },
      });

      conversationRef.current = conversation;
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Unable to access microphone. Please grant permission and try again.');
    }
  }, []);

  const endConversation = useCallback(async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
      conversationRef.current = null;
      setIsSpeaking(false);
      setIsConnected(false);
    }
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Voice Agent Button */}
      <button
        onClick={isSpeaking ? endConversation : startConversation}
        className={`
          relative group
          w-16 h-16 rounded-full
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          ${isSpeaking
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : isConnected
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-amber-700 hover:bg-amber-800'
          }
        `}
        aria-label={isSpeaking ? 'End conversation' : 'Start voice conversation'}
      >
        {/* Microphone Icon */}
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {isSpeaking ? (
            // Stop icon when speaking
            <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
          ) : (
            // Microphone icon when not speaking
            <>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </>
          )}
        </svg>

        {/* Pulsing ring effect when speaking */}
        {isSpeaking && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
        )}

        {/* Tooltip */}
        <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {isSpeaking ? 'End conversation' : 'Talk to us'}
        </span>
      </button>

      {/* Status indicator */}
      {isConnected && !isSpeaking && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
      )}
    </div>
  );
}
