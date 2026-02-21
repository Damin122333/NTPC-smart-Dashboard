import mongoose from 'mongoose';

const emissionSchema = new mongoose.Schema({
  sox: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/Nm³' },
    threshold: { type: Number, default: 200 }
  },
  nox: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/Nm³' },
    threshold: { type: Number, default: 300 }
  },
  co2: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'kg/MWh' },
    threshold: { type: Number, default: 950 }
  },
  pm: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/Nm³' },
    threshold: { type: Number, default: 30 }
  },
  co: {
    value: { type: Number, required: true },
    unit: { type: String, default: 'mg/Nm³' },
    threshold: { type: Number, default: 100 }
  },
  location: {
    type: String,
    required: true,
    default: 'Main Stack'
  },
  plantId: {
    type: String,
    required: true,
    default: 'NTPC-01'
  },
  status: {
    type: String,
    enum: ['Normal', 'Warning', 'Critical'],
    default: 'Normal'
  },
  alerts: [{
    parameter: String,
    message: String,
    severity: { type: String, enum: ['Low', 'Medium', 'High'] },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
emissionSchema.index({ createdAt: -1 });
emissionSchema.index({ plantId: 1, createdAt: -1 });

export default mongoose.model('Emission', emissionSchema);