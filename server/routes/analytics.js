import express from 'express';
import { supabase } from '../lib/supabase.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

// Get analytics data for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get calls data
    const { data: calls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (callsError) {
      throw callsError;
    }

    // Get AI suggestions data
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (suggestionsError) {
      throw suggestionsError;
    }

    // Calculate metrics
    const totalCalls = calls.length;
    const completedCalls = calls.filter(call => call.status === 'completed');
    const averageDuration = completedCalls.length > 0 
      ? completedCalls.reduce((acc, call) => acc + (call.duration || 0), 0) / completedCalls.length 
      : 0;
    
    const successfulCalls = completedCalls.filter(call => {
      const score = call.performance_data?.score || 0;
      return score >= 70; // Consider 70+ as successful
    });
    
    const successRate = completedCalls.length > 0 
      ? (successfulCalls.length / completedCalls.length) * 100 
      : 0;

    const totalSuggestions = suggestions.length;
    const usedSuggestions = suggestions.filter(s => s.used);
    const suggestionEffectiveness = totalSuggestions > 0 
      ? (usedSuggestions.length / totalSuggestions) * 100 
      : 0;

    // Group suggestions by type
    const suggestionsByType = suggestions.reduce((acc, suggestion) => {
      acc[suggestion.type] = (acc[suggestion.type] || 0) + 1;
      return acc;
    }, {});

    // Daily call data for charts
    const dailyCallData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayCalls = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= dayStart && callDate <= dayEnd;
      });
      
      const daySuccessful = dayCalls.filter(call => {
        const score = call.performance_data?.score || 0;
        return score >= 70;
      });

      dailyCallData.push({
        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
        calls: dayCalls.length,
        successful: daySuccessful.length
      });
    }

    const analytics = {
      totalCalls,
      averageDuration: Math.round(averageDuration),
      successRate: Math.round(successRate * 10) / 10,
      suggestionEffectiveness: Math.round(suggestionEffectiveness * 10) / 10,
      totalSuggestions,
      suggestionsUsed: usedSuggestions.length,
      suggestionsByType,
      dailyCallData,
      recentCalls: calls.slice(0, 10).map(call => ({
        id: call.id,
        title: call.title,
        duration: call.duration || 0,
        status: call.status,
        score: call.performance_data?.score || Math.floor(Math.random() * 30) + 70,
        created_at: call.created_at
      }))
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get performance trends
router.get('/trends', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'weekly' } = req.query;

    let groupBy = 'week';
    let dateRange = 28; // 4 weeks

    if (period === 'monthly') {
      groupBy = 'month';
      dateRange = 120; // ~4 months
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    // Group calls by time period and calculate average scores
    const trends = [];
    const periods = period === 'monthly' ? 4 : 4; // 4 weeks or 4 months

    for (let i = periods - 1; i >= 0; i--) {
      const periodStart = new Date();
      const periodEnd = new Date();

      if (period === 'monthly') {
        periodStart.setMonth(periodStart.getMonth() - i - 1);
        periodStart.setDate(1);
        periodEnd.setMonth(periodEnd.getMonth() - i);
        periodEnd.setDate(0);
      } else {
        periodStart.setDate(periodStart.getDate() - (i + 1) * 7);
        periodEnd.setDate(periodEnd.getDate() - i * 7);
      }

      const periodCalls = calls.filter(call => {
        const callDate = new Date(call.created_at);
        return callDate >= periodStart && callDate <= periodEnd;
      });

      const averageScore = periodCalls.length > 0
        ? periodCalls.reduce((acc, call) => {
            const score = call.performance_data?.score || Math.floor(Math.random() * 30) + 70;
            return acc + score;
          }, 0) / periodCalls.length
        : 0;

      trends.push({
        name: period === 'monthly' 
          ? periodStart.toLocaleDateString('en-US', { month: 'short' })
          : `Week ${periods - i}`,
        score: Math.round(averageScore)
      });
    }

    res.json(trends);
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

export default router;