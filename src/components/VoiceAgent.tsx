'use client';

import { Conversation } from '@elevenlabs/client';
import Image from 'next/image';
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
          w-20 h-20 rounded-full
          flex items-center justify-center
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          overflow-hidden
          border-4
          ${isSpeaking
            ? 'border-red-500 animate-pulse'
            : isConnected
            ? 'border-green-500'
            : 'border-amber-700 hover:border-amber-600'
          }
        `}
        aria-label={isSpeaking ? 'End conversation' : 'Start voice conversation'}
      >
        {/* Avatar Image */}
        <div className="absolute inset-0">
          <Image
            src="/agent-avatar.jpg"
            alt="Twisted Custom Leather Voice Agent"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Overlay when speaking */}
        {isSpeaking && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-40 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white animate-pulse"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="6" y="6" width="12" height="12" />
            </svg>
          </div>
        )}

        {/* Pulsing ring effect when speaking */}
        {isSpeaking && (
          <span className="absolute -inset-1 rounded-full border-4 border-red-400 animate-ping opacity-75" />
        )}

        {/* Tooltip */}
        <span className="absolute bottom-full mb-2 right-0 whitespace-nowrap px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          {isSpeaking ? 'End conversation' : 'Talk to us'}
        </span>
      </button>

      {/* Status indicator */}
      {isConnected && !isSpeaking && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      )}
    </div>
  );
}
