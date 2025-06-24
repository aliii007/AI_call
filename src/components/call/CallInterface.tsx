import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Settings,
  Maximize2,
  Minimize2,
  Volume2
} from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../contexts/AuthContext';
import { TranscriptDisplay } from './TranscriptDisplay';
import { AISuggestionPanel } from './AISuggestionPanel';
import { CallControls } from './CallControls';
import { Card } from '../ui/Card';

interface CallInterfaceProps {
  callId: string;
  isOverlayMode?: boolean;
}

export const CallInterface: React.FC<CallInterfaceProps> = ({ 
  callId, 
  isOverlayMode = false 
}) => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { transcript, suggestions, isConnected, markSuggestionUsed } = useWebSocket(
    callId, 
    user?._id
  );

  const handleEndCall = () => {
    setIsCallActive(false);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    setIsVideoOff(!isVideoOff);
  };

  if (!isCallActive) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Card className="text-center p-8">
          <Phone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Call Ended</h2>
          <p className="text-gray-600">Your AI-assisted call has ended. Check analytics for insights.</p>
        </Card>
      </div>
    );
  }

  if (isOverlayMode && isMinimized) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 w-80"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm font-medium">Call Active</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="text-xs text-gray-600 mb-3">
          {transcript.length > 0 && transcript[transcript.length - 1].text}
        </div>
        <CallControls
          isMuted={isMuted}
          isVideoOff={isVideoOff}
          onToggleMute={handleToggleMute}
          onToggleVideo={handleToggleVideo}
          onEndCall={handleEndCall}
          compact
        />
      </motion.div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Main Call Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Call Status Header */}
          <Card className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse mr-3" />
              <div>
                <h2 className="font-semibold text-gray-900">Sales Call - Acme Corp</h2>
                <p className="text-sm text-gray-600">
                  Connected • {isConnected ? 'AI Active' : 'AI Connecting...'}
                </p>
              </div>
            </div>
            {isOverlayMode && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            )}
          </Card>

          {/* Video/Audio Placeholder */}
          <Card className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white">
            <div className="text-center">
              {isVideoOff ? (
                <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-50" />
              ) : (
                <Video className="h-16 w-16 mx-auto mb-4" />
              )}
              <p className="text-lg font-medium">Video Call Integration</p>
              <p className="text-sm opacity-75">AI monitoring in progress...</p>
            </div>
          </Card>

          {/* Call Controls */}
          <CallControls
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMute={handleToggleMute}
            onToggleVideo={handleToggleVideo}
            onEndCall={handleEndCall}
          />
        </div>

        {/* AI Assistant Panel */}
        <div className="space-y-4">
          <AISuggestionPanel 
            suggestions={suggestions} 
            onUseSuggestion={markSuggestionUsed}
          />
          <TranscriptDisplay transcript={transcript} />
        </div>
      </div>
    </div>
  );
};