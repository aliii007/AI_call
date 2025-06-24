import { AssemblyAI } from 'assemblyai';
import config from '../config/config.js';

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
        wordBoost: ['sales', 'product', 'pricing', 'demo', 'contract', 'budget', 'ROI', 'solution'],
        boostParam: 'high',
        encoding: 'pcm_s16le'
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
            words: transcript.words || [],
            startTime: transcript.audio_start || 0,
            endTime: transcript.audio_end || 0
          };
          onTranscript(transcriptData);
        }
      });

      rt.on('error', (error) => {
        console.error('Real-time transcription error:', error);
        onError(error);
      });

      rt.on('close', () => {
        console.log('Real-time transcription connection closed');
        this.activeTranscriptions.delete(callId);
      });

      await rt.connect();
      this.activeTranscriptions.set(callId, rt);
      
      console.log(`✅ Real-time transcription started for call ${callId}`);
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
      try {
        await rt.close();
        this.activeTranscriptions.delete(callId);
        console.log(`✅ Real-time transcription stopped for call ${callId}`);
      } catch (error) {
        console.error('Error stopping real-time transcription:', error);
      }
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
        iab_categories: true,
        content_safety: true,
        language_code: options.language || config.TRANSCRIPTION_LANGUAGE,
        word_boost: options.wordBoost || ['sales', 'product', 'pricing', 'demo', 'contract', 'budget'],
        boost_param: 'high',
        punctuate: true,
        format_text: true,
        dual_channel: options.dualChannel || false
      });

      return {
        id: transcript.id,
        text: transcript.text,
        confidence: transcript.confidence,
        speakers: this.processSpeakerLabels(transcript.utterances),
        highlights: transcript.auto_highlights_result?.results || [],
        sentiment: transcript.sentiment_analysis_results || [],
        entities: transcript.entities || [],
        categories: transcript.iab_categories_result?.summary || {},
        contentSafety: transcript.content_safety_labels?.summary || {},
        summary: transcript.summary,
        chapters: transcript.chapters || []
      };
    } catch (error) {
      console.error('Failed to transcribe audio file:', error);
      throw error;
    }
  }

  // Transcribe audio from URL
  async transcribeAudioUrl(audioUrl, options = {}) {
    try {
      const transcript = await this.client.transcripts.transcribe({
        audio_url: audioUrl,
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
      console.error('Failed to transcribe audio URL:', error);
      throw error;
    }
  }

  // Get transcription status
  async getTranscriptionStatus(transcriptId) {
    try {
      const transcript = await this.client.transcripts.get(transcriptId);
      return {
        id: transcript.id,
        status: transcript.status,
        error: transcript.error,
        confidence: transcript.confidence,
        audio_duration: transcript.audio_duration
      };
    } catch (error) {
      console.error('Failed to get transcription status:', error);
      throw error;
    }
  }

  // Delete transcription
  async deleteTranscription(transcriptId) {
    try {
      await this.client.transcripts.delete(transcriptId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete transcription:', error);
      throw error;
    }
  }

  // Get transcript paragraphs
  async getTranscriptParagraphs(transcriptId) {
    try {
      const paragraphs = await this.client.transcripts.paragraphs(transcriptId);
      return paragraphs.paragraphs || [];
    } catch (error) {
      console.error('Failed to get transcript paragraphs:', error);
      throw error;
    }
  }

  // Get transcript sentences
  async getTranscriptSentences(transcriptId) {
    try {
      const sentences = await this.client.transcripts.sentences(transcriptId);
      return sentences.sentences || [];
    } catch (error) {
      console.error('Failed to get transcript sentences:', error);
      throw error;
    }
  }

  // Search transcript
  async searchTranscript(transcriptId, words) {
    try {
      const results = await this.client.transcripts.wordSearch(transcriptId, words);
      return results.matches || [];
    } catch (error) {
      console.error('Failed to search transcript:', error);
      throw error;
    }
  }

  // Detect speaker from transcript data
  detectSpeaker(transcript) {
    // Enhanced speaker detection logic
    const speakerPatterns = {
      'Sales Rep': [
        'I think', 'We can', 'Our product', 'Let me show', 'I\'d like to',
        'Our solution', 'We offer', 'I can help', 'Let me explain',
        'Our company', 'We provide', 'I recommend', 'We specialize'
      ],
      'Client': [
        'We need', 'Our budget', 'Can you', 'What about', 'We\'re looking',
        'Our company', 'We have', 'We want', 'Our team', 'We\'re interested',
        'Our current', 'We use', 'We\'re considering', 'Our requirements'
      ]
    };

    const text = transcript.text.toLowerCase();
    
    for (const [speaker, patterns] of Object.entries(speakerPatterns)) {
      if (patterns.some(pattern => text.includes(pattern.toLowerCase()))) {
        return speaker;
      }
    }

    // Default to alternating speakers if no pattern matches
    return 'Speaker';
  }

  // Process speaker labels from AssemblyAI
  processSpeakerLabels(utterances) {
    if (!utterances) return [];
    
    return utterances.map(utterance => ({
      speaker: `Speaker ${utterance.speaker}`,
      text: utterance.text,
      start: utterance.start,
      end: utterance.end,
      confidence: utterance.confidence,
      words: utterance.words || []
    }));
  }

  // Analyze transcript sentiment
  async analyzeTranscriptSentiment(transcriptText) {
    try {
      // This could be enhanced with additional sentiment analysis
      const words = transcriptText.toLowerCase().split(' ');
      
      const positiveWords = ['great', 'excellent', 'perfect', 'love', 'amazing', 'fantastic', 'wonderful'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'disappointing'];
      
      const positiveCount = words.filter(word => positiveWords.includes(word)).length;
      const negativeCount = words.filter(word => negativeWords.includes(word)).length;
      
      let sentiment = 'neutral';
      let score = 0;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = (positiveCount - negativeCount) / words.length;
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = (negativeCount - positiveCount) / words.length * -1;
      }
      
      return {
        sentiment,
        score,
        positiveWords: positiveCount,
        negativeWords: negativeCount
      };
    } catch (error) {
      console.error('Failed to analyze sentiment:', error);
      throw error;
    }
  }

  // Extract key phrases from transcript
  extractKeyPhrases(transcriptText) {
    try {
      // Simple key phrase extraction
      const sentences = transcriptText.split(/[.!?]+/);
      const keyPhrases = [];
      
      const importantKeywords = [
        'budget', 'price', 'cost', 'roi', 'return on investment',
        'decision maker', 'timeline', 'implementation', 'integration',
        'features', 'benefits', 'solution', 'problem', 'challenge',
        'competitor', 'alternative', 'comparison'
      ];
      
      sentences.forEach(sentence => {
        const lowerSentence = sentence.toLowerCase();
        importantKeywords.forEach(keyword => {
          if (lowerSentence.includes(keyword)) {
            keyPhrases.push({
              phrase: sentence.trim(),
              keyword: keyword,
              importance: this.calculatePhraseImportance(sentence, keyword)
            });
          }
        });
      });
      
      return keyPhrases.sort((a, b) => b.importance - a.importance).slice(0, 10);
    } catch (error) {
      console.error('Failed to extract key phrases:', error);
      return [];
    }
  }

  // Calculate phrase importance
  calculatePhraseImportance(sentence, keyword) {
    const length = sentence.length;
    const keywordWeight = {
      'budget': 10, 'price': 10, 'cost': 10, 'roi': 9,
      'decision maker': 9, 'timeline': 8, 'implementation': 7,
      'features': 6, 'benefits': 7, 'solution': 8
    };
    
    return (keywordWeight[keyword] || 5) * (100 / length);
  }
}

const transcriptionService = new TranscriptionService();
export default transcriptionService;