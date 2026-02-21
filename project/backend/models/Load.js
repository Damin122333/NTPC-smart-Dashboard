import mongoose from 'mongoose';

const loadSchema = new mongoose.Schema({
  demand: {
    current: { type: Number, required: true }, // MW
    predicted: Number, // MW
    capacity: { type: Number, default: 2100 } // MW
  },
  generation: {
    actual: { type: Number, required: true }, // MW
    scheduled: Number, // MW
    efficiency: Number // %
  },
  forecast: {
    next6Hours: [Number],
    next24Hours: [Number],
    peakHour: String,
    peakLoad: Number,
    generatedBy: { type: String, default: 'Gemini AI' },
    confidence: Number
  },
  factors: {
    weather: {
      temperature: Number, // °C
      humidity: Number, // %
      condition: String
    },
    timeOfDay: Number, // 0-23
    dayOfWeek: Number, // 0-6
    season: String,
    holidays: Boolean
  },
  alerts: [{
    type: String, // 'Overload', 'Underutilization', 'Peak Demand'
    message: String,
    severity: { type: String, enum: ['Info', 'Warning', 'Critical'] },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['Normal', 'High Demand', 'Critical Load', 'Maintenance Mode'],
    default: 'Normal'
  }
}, {
  timestamps: true
});

// Index for time-based queries
loadSchema.index({ createdAt: -1 });
loadSchema.index({ 'demand.current': -1 });

export default mongoose.model('Load', loadSchema);