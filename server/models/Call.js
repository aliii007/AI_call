import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Call must belong to a user']
  },
  title: {
    type: String,
    required: [true, 'Call title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  meetingId: {
    type: String,
    sparse: true
  },
  platform: {
    type: String,
    enum: ['zoom', 'meet', 'teams', 'other'],
    default: 'other'
  },
  participants: [{
    name: { type: String, required: true },
    email: { type: String },
    role: { type: String, enum: ['host', 'participant'], default: 'participant' },
    joinedAt: { type: Date },
    leftAt: { type: Date }
  }],
  performanceData: {
    score: { type: Number, min: 0, max: 100 },
    talkTimeRatio: { type: Number, min: 0, max: 1 },
    questionsAsked: { type: Number, default: 0 },
    objectionsHandled: { type: Number, default: 0 },
    suggestionsUsed: { type: Number, default: 0 },
    sentimentScore: { type: Number, min: -1, max: 1 },
    keywordsMentioned: [String],
    engagementLevel: { type: Number, min: 0, max: 10 }
  },
  recording: {
    url: String,
    duration: Number,
    size: Number,
    format: String
  },
  notes: {
    type: String,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  tags: [String]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
callSchema.index({ user: 1, createdAt: -1 });
callSchema.index({ status: 1 });
callSchema.index({ startTime: 1 });
callSchema.index({ platform: 1 });
callSchema.index({ meetingId: 1 }, { sparse: true });

// Virtual for call transcripts
callSchema.virtual('transcripts', {
  ref: 'Transcript',
  localField: '_id',
  foreignField: 'call'
});

// Virtual for AI suggestions
callSchema.virtual('suggestions', {
  ref: 'AISuggestion',
  localField: '_id',
  foreignField: 'call'
});

// Virtual for calculated duration
callSchema.virtual('calculatedDuration').get(function() {
  if (this.endTime && this.startTime) {
    return Math.floor((this.endTime - this.startTime) / 1000); // in seconds
  }
  return this.duration;
});

// Pre-save middleware to calculate duration
callSchema.pre('save', function(next) {
  if (this.endTime && this.startTime && !this.duration) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

// Static method to get user's call statistics
callSchema.statics.getUserStats = async function(userId, timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);

  const stats = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalCalls: { $sum: 1 },
        completedCalls: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        averageDuration: { $avg: '$duration' },
        averageScore: { $avg: '$performanceData.score' },
        totalSuggestionsUsed: { $sum: '$performanceData.suggestionsUsed' }
      }
    }
  ]);

  return stats[0] || {
    totalCalls: 0,
    completedCalls: 0,
    averageDuration: 0,
    averageScore: 0,
    totalSuggestionsUsed: 0
  };
};

export default mongoose.model('Call', callSchema);