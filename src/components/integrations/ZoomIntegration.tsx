import React, { useEffect, useState } from 'react';
import { Video, Settings, Users, Mic, MicOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import APIService from '../../services/apiService';

interface ZoomIntegrationProps {
  callId: string;
  onMeetingStart?: (meetingData: any) => void;
  onMeetingEnd?: () => void;
}

declare global {
  interface Window {
    ZoomMtg: any;
  }
}

export const ZoomIntegration: React.FC<ZoomIntegrationProps> = ({
  callId,
  onMeetingStart,
  onMeetingEnd
}) => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isMeetingActive, setIsMeetingActive] = useState(false);
  const [meetingData, setMeetingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Zoom Web SDK
    const loadZoomSDK = () => {
      if (window.ZoomMtg) {
        setIsSDKLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://source.zoom.us/2.18.0/lib/vendor/react.min.js';
      script.onload = () => {
        const zoomScript = document.createElement('script');
        zoomScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js';
        zoomScript.onload = () => {
          const mainScript = document.createElement('script');
          mainScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js';
          mainScript.onload = () => {
            const sdkScript = document.createElement('script');
            sdkScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js';
            sdkScript.onload = () => {
              const finalScript = document.createElement('script');
              finalScript.src = 'https://source.zoom.us/zoom-meeting-2.18.0.min.js';
              finalScript.onload = () => {
                setIsSDKLoaded(true);
              };
              document.head.appendChild(finalScript);
            };
            document.head.appendChild(sdkScript);
          };
          document.head.appendChild(mainScript);
        };
        document.head.appendChild(zoomScript);
      };
      document.head.appendChild(script);
    };

    loadZoomSDK();
  }, []);

  const createMeeting = async () => {
    try {
      setIsLoading(true);
      
      const meetingData = {
        topic: `AI Sales Call - ${callId}`,
        startTime: new Date().toISOString(),
        duration: 60,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const meeting = await APIService.createZoomMeeting('me', meetingData);
      setMeetingData(meeting);
      
      if (onMeetingStart) {
        onMeetingStart(meeting);
      }
    } catch (error) {
      console.error('Failed to create Zoom meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeeting = async (meetingNumber: string, password: string) => {
    if (!isSDKLoaded || !window.ZoomMtg) {
      console.error('Zoom SDK not loaded');
      return;
    }

    try {
      setIsLoading(true);

      // Generate SDK signature
      const { signature } = await APIService.generateZoomSDKSignature(meetingNumber, 0);

      // Initialize Zoom SDK
      window.ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
      window.ZoomMtg.preLoadWasm();
      window.ZoomMtg.prepareWebSDK();

      // Join meeting
      window.ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: () => {
          window.ZoomMtg.join({
            signature,
            meetingNumber,
            userName: 'AI Sales Assistant User',
            apiKey: process.env.REACT_APP_ZOOM_SDK_KEY,
            userEmail: '',
            passWord: password,
            success: (success: any) => {
              console.log('Joined Zoom meeting successfully', success);
              setIsMeetingActive(true);
            },
            error: (error: any) => {
              console.error('Failed to join Zoom meeting', error);
            }
          });
        },
        error: (error: any) => {
          console.error('Failed to initialize Zoom SDK', error);
        }
      });
    } catch (error) {
      console.error('Failed to join meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const leaveMeeting = () => {
    if (window.ZoomMtg) {
      window.ZoomMtg.leaveMeeting({
        success: () => {
          setIsMeetingActive(false);
          if (onMeetingEnd) {
            onMeetingEnd();
          }
        }
      });
    }
  };

  if (!isSDKLoaded) {
    return (
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Zoom SDK...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Video className="h-6 w-6 text-primary-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Zoom Integration</h3>
            <p className="text-sm text-gray-600">
              {isMeetingActive ? 'Meeting in progress' : 'Ready to start or join meeting'}
            </p>
          </div>
        </div>
        <div className={`
          w-3 h-3 rounded-full
          ${isMeetingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}
        `} />
      </div>

      {!isMeetingActive ? (
        <div className="space-y-4">
          {meetingData ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Meeting Created</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Meeting ID:</span>
                  <span className="ml-2 font-mono">{meetingData.meetingId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Password:</span>
                  <span className="ml-2 font-mono">{meetingData.password}</span>
                </div>
                <div>
                  <span className="text-gray-600">Join URL:</span>
                  <a 
                    href={meetingData.joinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-primary-600 hover:text-primary-700 underline"
                  >
                    Open in Zoom App
                  </a>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => joinMeeting(meetingData.meetingId, meetingData.password)}
                  loading={isLoading}
                  className="flex-1"
                >
                  Join via Web SDK
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => window.open(meetingData.joinUrl, '_blank')}
                >
                  Open in App
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={createMeeting}
                loading={isLoading}
                className="w-full"
              >
                <Video className="h-4 w-4 mr-2" />
                Create New Meeting
              </Button>
              
              <div className="text-center text-gray-500">or</div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Meeting ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <input
                  type="password"
                  placeholder="Meeting Password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Button
                  variant="secondary"
                  className="w-full"
                  disabled={isLoading}
                >
                  Join Existing Meeting
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-3" />
              <span className="text-green-800 font-medium">Meeting Active</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              AI assistance is monitoring your call and providing real-time suggestions.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Mic className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Video className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Users className="h-4 w-4" />
              </button>
            </div>
            
            <Button
              variant="error"
              onClick={leaveMeeting}
              size="sm"
            >
              Leave Meeting
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};