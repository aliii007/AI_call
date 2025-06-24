import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { TranscriptEntry, AISuggestion } from '../types';

interface WebSocketData {
  transcript: TranscriptEntry[];
  suggestions: AISuggestion[];
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useWebSocket = (callId?: string, userId?: string) => {
  const [data, setData] = useState<WebSocketData>({
    transcript: [],
    suggestions: [],
    isConnected: false,
    connectionStatus: 'disconnected'
  });
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!callId || !userId) return;

    // Initialize socket connection
    const initializeSocket = () => {
      setData(prev => ({ ...prev, connectionStatus: 'connecting' }));

      socketRef.current = io('http://localhost:3001', {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected:', socket.id);
        setData(prev => ({ 
          ...prev, 
          isConnected: true, 
          connectionStatus: 'connected' 
        }));

        // Join the call room
        socket.emit('joinCall', { callId, userId });
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setData(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionStatus: 'disconnected' 
        }));

        // Attempt to reconnect after 3 seconds
        if (reason === 'io server disconnect') {
          return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          socket.connect();
        }, 3000);
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setData(prev => ({ 
          ...prev, 
          isConnected: false, 
          connectionStatus: 'error' 
        }));
      });

      // Real-time transcript events
      socket.on('newTranscript', (transcript: TranscriptEntry) => {
        console.log('New transcript received:', transcript);
        setData(prev => ({
          ...prev,
          transcript: [...prev.transcript.slice(-50), transcript]
        }));
      });

      // AI suggestion events
      socket.on('newSuggestion', (suggestion: AISuggestion) => {
        console.log('New AI suggestion received:', suggestion);
        setData(prev => ({
          ...prev,
          suggestions: [...prev.suggestions.slice(-10), suggestion]
        }));
      });

      // Suggestion usage events
      socket.on('suggestionUsed', ({ suggestionId }: { suggestionId: string }) => {
        setData(prev => ({
          ...prev,
          suggestions: prev.suggestions.map(s => 
            s.id === suggestionId ? { ...s, used: true } : s
          )
        }));
      });

      // Meeting events
      socket.on('meetingStarted', ({ meetingId }: { meetingId: string }) => {
        console.log('Meeting started:', meetingId);
      });

      socket.on('meetingEnded', ({ meetingId }: { meetingId: string }) => {
        console.log('Meeting ended:', meetingId);
      });

      socket.on('participantJoined', ({ participant }: { participant: any }) => {
        console.log('Participant joined:', participant);
      });

      socket.on('participantLeft', ({ participant }: { participant: any }) => {
        console.log('Participant left:', participant);
      });

      // Error events
      socket.on('transcriptionError', ({ error }: { error: string }) => {
        console.error('Transcription error:', error);
      });

      socket.on('error', ({ message }: { message: string }) => {
        console.error('Socket error:', message);
      });
    };

    initializeSocket();

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current) {
        socketRef.current.emit('leaveCall', { callId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [callId, userId]);

  // Helper functions
  const markSuggestionUsed = (suggestionId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('useSuggestion', { suggestionId, callId });
    }
  };

  const requestSuggestion = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('requestSuggestion', { callId, userId });
    }
  };

  const sendTranscript = (transcript: Omit<TranscriptEntry, 'id' | 'timestamp'>) => {
    if (socketRef.current && socketRef.current.connected) {
      const fullTranscript: TranscriptEntry = {
        ...transcript,
        id: Date.now().toString(),
        timestamp: new Date()
      };
      
      socketRef.current.emit('transcript', fullTranscript);
    }
  };

  return { 
    ...data, 
    markSuggestionUsed, 
    requestSuggestion, 
    sendTranscript,
    socket: socketRef.current
  };
};