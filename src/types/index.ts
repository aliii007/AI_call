export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface Call {
  id: string;
  title: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'active' | 'completed' | 'scheduled';
  participants: string[];
  transcript: TranscriptEntry[];
  suggestions: AISuggestion[];
  performance: CallPerformance;
}

export interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
}

export interface AISuggestion {
  id: string;
  type: 'objection_handling' | 'closing' | 'question' | 'pricing' | 'feature_highlight';
  text: string;
  confidence: number;
  context: string;
  timestamp: Date;
  used: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'url' | 'text';
  url?: string;
  content?: string;
  uploadDate: Date;
  processed: boolean;
  embeddings?: number[];
  tags: string[];
}

export interface CallPerformance {
  talkTimeRatio: number;
  questionsAsked: number;
  objectionsHandled: number;
  suggestionsUsed: number;
  sentimentScore: number;
  keywordsMentioned: string[];
}

export interface Analytics {
  totalCalls: number;
  averageDuration: number;
  successRate: number;
  topPerformers: string[];
  commonObjections: string[];
  suggestionEffectiveness: number;
}