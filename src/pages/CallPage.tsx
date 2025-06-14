import React from 'react';
import { CallInterface } from '../components/call/CallInterface';

export const CallPage: React.FC = () => {
  // In a real app, this would come from route params or context
  const callId = 'call-123';

  return <CallInterface callId={callId} />;
};