import OpenAI from 'openai';
import config from '../config/config.js';

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY
    });
    this.conversationContexts = new Map();
  }

  // Generate AI suggestions based on conversation context
  async generateSuggestion(callId, transcriptHistory, documentContext = '', userPreferences = {}) {
    try {
      const context = this.buildConversationContext(transcriptHistory, documentContext);
      const systemPrompt = this.buildSystemPrompt(userPreferences);

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        temperature: 0.7,
        max_tokens: 200,
        functions: [
          {
            name: 'generate_sales_suggestion',
            description: 'Generate a contextual sales suggestion',
            parameters: {
              type: 'object',
              properties: {
                suggestion: {
                  type: 'string',
                  description: 'The sales suggestion text'
                },
                type: {
                  type: 'string',
                  enum: ['objection_handling', 'closing', 'question', 'pricing', 'feature_highlight', 'rapport_building', 'next_steps', 'follow_up'],
                  description: 'The type of suggestion'
                },
                confidence: {
                  type: 'number',
                  description: 'Confidence score between 0 and 1'
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of why this suggestion is relevant'
                },
                priority: {
                  type: 'string',
                  enum: ['low', 'medium', 'high', 'urgent'],
                  description: 'Priority level of the suggestion'
                }
              },
              required: ['suggestion', 'type', 'confidence']
            }
          }
        ],
        function_call: { name: 'generate_sales_suggestion' }
      });

      const functionCall = completion.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'generate_sales_suggestion') {
        const suggestionData = JSON.parse(functionCall.arguments);
        
        return {
          id: Date.now().toString(),
          callId,
          text: suggestionData.suggestion,
          type: suggestionData.type,
          confidence: suggestionData.confidence,
          reasoning: suggestionData.reasoning,
          priority: suggestionData.priority || 'medium',
          context: this.extractRelevantContext(transcriptHistory),
          timestamp: new Date(),
          used: false,
          triggerContext: {
            lastTranscripts: transcriptHistory.slice(-3).map(t => t.text),
            conversationPhase: this.detectConversationPhase(transcriptHistory)
          }
        };
      }

      throw new Error('Failed to generate structured suggestion');
    } catch (error) {
      console.error('Failed to generate AI suggestion:', error);
      throw error;
    }
  }

  // Analyze conversation sentiment and engagement
  async analyzeConversation(transcriptHistory) {
    try {
      const conversationText = transcriptHistory
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Analyze this sales conversation and provide insights on sentiment, engagement, and key topics discussed.'
          },
          {
            role: 'user',
            content: conversationText
          }
        ],
        functions: [
          {
            name: 'analyze_conversation',
            description: 'Analyze conversation metrics',
            parameters: {
              type: 'object',
              properties: {
                sentiment: {
                  type: 'string',
                  enum: ['positive', 'neutral', 'negative'],
                  description: 'Overall conversation sentiment'
                },
                engagement_level: {
                  type: 'number',
                  description: 'Engagement level from 0 to 10'
                },
                key_topics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Main topics discussed'
                },
                objections_raised: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Client objections identified'
                },
                buying_signals: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Positive buying signals detected'
                },
                next_steps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended next steps'
                },
                conversation_phase: {
                  type: 'string',
                  enum: ['opening', 'discovery', 'presentation', 'objection', 'closing', 'follow_up'],
                  description: 'Current phase of the sales conversation'
                },
                emotional_state: {
                  type: 'string',
                  enum: ['excited', 'interested', 'neutral', 'concerned', 'frustrated'],
                  description: 'Detected emotional state of the prospect'
                }
              },
              required: ['sentiment', 'engagement_level', 'key_topics']
            }
          }
        ],
        function_call: { name: 'analyze_conversation' }
      });

      const functionCall = completion.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'analyze_conversation') {
        return JSON.parse(functionCall.arguments);
      }

      throw new Error('Failed to analyze conversation');
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      throw error;
    }
  }

  // Process documents for context building
  async processDocumentForContext(documentContent, documentType) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract key sales-relevant information from this document that could be useful during sales calls.'
          },
          {
            role: 'user',
            content: `Document Type: ${documentType}\n\nContent: ${documentContent}`
          }
        ],
        functions: [
          {
            name: 'extract_sales_context',
            description: 'Extract sales-relevant information',
            parameters: {
              type: 'object',
              properties: {
                key_features: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key product features'
                },
                benefits: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Main benefits'
                },
                pricing_info: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Pricing information'
                },
                use_cases: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Common use cases'
                },
                competitive_advantages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Competitive advantages'
                },
                objection_responses: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      objection: { type: 'string' },
                      response: { type: 'string' }
                    }
                  },
                  description: 'Common objections and responses'
                },
                target_audience: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Target audience segments'
                },
                success_stories: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Customer success stories or case studies'
                }
              },
              required: ['key_features', 'benefits']
            }
          }
        ],
        function_call: { name: 'extract_sales_context' }
      });

      const functionCall = completion.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'extract_sales_context') {
        return JSON.parse(functionCall.arguments);
      }

      throw new Error('Failed to process document');
    } catch (error) {
      console.error('Failed to process document:', error);
      throw error;
    }
  }

  // Generate meeting summary
  async generateMeetingSummary(transcriptHistory, meetingData) {
    try {
      const conversationText = transcriptHistory
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Generate a comprehensive summary of this sales call including key points, outcomes, and action items.'
          },
          {
            role: 'user',
            content: `Meeting: ${meetingData.title}\nDuration: ${meetingData.duration} minutes\n\nTranscript:\n${conversationText}`
          }
        ],
        functions: [
          {
            name: 'generate_meeting_summary',
            description: 'Generate a comprehensive meeting summary',
            parameters: {
              type: 'object',
              properties: {
                executive_summary: {
                  type: 'string',
                  description: 'Brief executive summary of the meeting'
                },
                key_points: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key points discussed'
                },
                decisions_made: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Decisions made during the meeting'
                },
                action_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      task: { type: 'string' },
                      assignee: { type: 'string' },
                      due_date: { type: 'string' }
                    }
                  },
                  description: 'Action items with assignees and due dates'
                },
                next_steps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Recommended next steps'
                },
                sentiment_analysis: {
                  type: 'object',
                  properties: {
                    overall_sentiment: { type: 'string' },
                    client_interest_level: { type: 'string' },
                    likelihood_to_close: { type: 'string' }
                  }
                },
                topics_covered: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Main topics covered in the meeting'
                }
              },
              required: ['executive_summary', 'key_points', 'action_items']
            }
          }
        ],
        function_call: { name: 'generate_meeting_summary' }
      });

      const functionCall = completion.choices[0].message.function_call;
      if (functionCall && functionCall.name === 'generate_meeting_summary') {
        return JSON.parse(functionCall.arguments);
      }

      throw new Error('Failed to generate meeting summary');
    } catch (error) {
      console.error('Failed to generate meeting summary:', error);
      throw error;
    }
  }

  // Detect conversation phase
  detectConversationPhase(transcriptHistory) {
    const recentText = transcriptHistory.slice(-5).map(t => t.text).join(' ').toLowerCase();
    
    if (recentText.includes('hello') || recentText.includes('introduction') || recentText.includes('nice to meet')) {
      return 'opening';
    } else if (recentText.includes('tell me about') || recentText.includes('what do you') || recentText.includes('how does')) {
      return 'discovery';
    } else if (recentText.includes('feature') || recentText.includes('benefit') || recentText.includes('solution')) {
      return 'presentation';
    } else if (recentText.includes('but') || recentText.includes('concern') || recentText.includes('however')) {
      return 'objection';
    } else if (recentText.includes('price') || recentText.includes('contract') || recentText.includes('sign')) {
      return 'closing';
    } else {
      return 'discovery';
    }
  }

  // Build conversation context for AI
  buildConversationContext(transcriptHistory, documentContext) {
    const recentTranscript = transcriptHistory.slice(-10); // Last 10 entries
    const conversationText = recentTranscript
      .map(entry => `${entry.speaker}: ${entry.text}`)
      .join('\n');

    return `
Recent Conversation:
${conversationText}

Available Context:
${documentContext}

Please provide a helpful sales suggestion based on the current conversation flow and context.
    `.trim();
  }

  // Build system prompt based on user preferences
  buildSystemPrompt(preferences = {}) {
    const basePrompt = `You are an expert AI sales assistant helping during live sales calls. Your role is to provide timely, contextual suggestions to help close deals and handle objections effectively.

Guidelines:
- Provide specific, actionable suggestions
- Consider the conversation flow and timing
- Be concise but helpful
- Focus on moving the sale forward
- Handle objections with empathy and facts
- Suggest relevant questions to uncover needs
- Recommend appropriate closing techniques
- Provide pricing guidance when relevant`;

    const customizations = [];
    
    if (preferences.industry) {
      customizations.push(`Industry focus: ${preferences.industry}`);
    }
    
    if (preferences.suggestionStyle) {
      customizations.push(`Suggestion style: ${preferences.suggestionStyle}`);
    }
    
    if (preferences.aggressiveness) {
      customizations.push(`Sales approach: ${preferences.aggressiveness}`);
    }

    return customizations.length > 0 
      ? `${basePrompt}\n\nCustomizations:\n${customizations.join('\n')}`
      : basePrompt;
  }

  // Extract relevant context from transcript
  extractRelevantContext(transcriptHistory) {
    const recent = transcriptHistory.slice(-3);
    return recent.map(entry => entry.text).join(' ');
  }

  // Update conversation context
  updateConversationContext(callId, newTranscript) {
    const existing = this.conversationContexts.get(callId) || [];
    const updated = [...existing, newTranscript].slice(-50); // Keep last 50 entries
    this.conversationContexts.set(callId, updated);
  }

  // Clear conversation context
  clearConversationContext(callId) {
    this.conversationContexts.delete(callId);
  }

  // Generate follow-up email
  async generateFollowUpEmail(transcriptHistory, meetingData) {
    try {
      const conversationText = transcriptHistory
        .map(entry => `${entry.speaker}: ${entry.text}`)
        .join('\n');

      const completion = await this.openai.chat.completions.create({
        model: config.OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'Generate a professional follow-up email based on the sales call conversation.'
          },
          {
            role: 'user',
            content: `Meeting: ${meetingData.title}\n\nConversation:\n${conversationText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Failed to generate follow-up email:', error);
      throw error;
    }
  }
}

const aiService = new AIService();
export default aiService;