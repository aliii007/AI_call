const { AssemblyAI } = require('assemblyai');
const config = require('../config/config');

class TranscriptionService {
  constructor() {
    this.client = new AssemblyAI({
      apiKey: config.ASSEMBLYAI_API_KEY
    });
    this.activeTranscriptions = new Map();
  }

  // Start real-time transcription
  async startRealTimeTranscription(callId, onTranscript, onError) {
    try {
      const rt = this.client.realtime.createService({
        sampleRate: 16000,
        wordBoost: ['sales', 'product', 'pricing', 'demo', 'contract', 'budget'],
        boostParam: 'high'
      });

      rt.on('transcript', (transcript) => {
        if (transcript.message_type === 'FinalTranscript') {
          const transcriptData = {
            id: Date.now().toString(),
            callId,
            text: transcript.text,
            confidence: transcript.confidence,
            speaker: this.detectSpeaker(transcript),
            timestamp: new Date(),
            words: transcript.words || []
          };
          onTranscript(transcriptData);
        }
      });

      rt.on('error', onError);

      await rt.connect();
      this.activeTranscriptions.set(callId, rt);
      
      return rt;
    } catch (error) {
      console.error('Failed to start real-time transcription:', error);
      throw error;
    }
  }

  // Stop real-time transcription
  async stopRealTimeTranscription(callId) {
    const rt = this.activeTranscriptions.get(callId);
    if (rt) {
      await rt.close();
      this.activeTranscriptions.delete(callId);
    }
  }

  // Process audio file for transcription
  async transcribeAudioFile(audioFilePath, options = {}) {
    try {
      const transcript = await this.client.transcripts.transcribe({
        audio: audioFilePath,
        speaker_labels: true,
        auto_highlights: true,
        sentiment_analysis: true,
        entity_detection: true,
        language_code: options.language || config.TRANSCRIPTION_LANGUAGE,
        word_boost: options.wordBoost || ['sales', 'product', 'pricing'],
        boost_param: 'high'
      });

      return {
        id: transcript.id,
        text: transcript.text,
        confidence: transcript.confidence,
        speakers: this.processSpeakerLabels(transcript.utterances),
        highlights: transcript.auto_highlights_result?.results || [],
        sentiment: transcript.sentiment_analysis_results || [],
        entities: transcript.entities || []
      };
    } catch (error) {
      console.error('Failed to transcribe audio file:', error);
      throw error;
    }
  }

  // Detect speaker from transcript data
  detectSpeaker(transcript) {
    // Simple speaker detection logic - can be enhanced with voice recognition
    const speakerPatterns = {
      'You': ['I think', 'We can', 'Our product', 'Let me show'],
      'Client': ['We need', 'Our budget', 'Can you', 'What about']
    };

    for (const [speaker, patterns] of Object.entries(speakerPatterns)) {
      if (patterns.some(pattern => transcript.text.includes(pattern))) {
        return speaker;
      }
    }

    return 'Unknown';
  }

  // Process speaker labels from AssemblyAI
  processSpeakerLabels(utterances) {
    if (!utterances) return [];
    
    return utterances.map(utterance => ({
      speaker: `Speaker ${utterance.speaker}`,
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      confidence: utterance.confidence
    }));
  }

  // Get transcription status
  async getTranscriptionStatus(transcriptId) {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      return {
        id: transcript.id,
        status: transcript.status,
        error: transcript.error
      };
    } catch (error) {
      console.error('Failed to get transcription status:', error);
      throw error;
    }
  }
}

module.exports = new TranscriptionService();