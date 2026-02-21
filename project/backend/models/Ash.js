import mongoose from 'mongoose';

const ashSchema = new mongoose.Schema({
  flyAsh: {
    quantity: { type: Number, required: true }, // tonnes
    storage: {
      current: Number, // tonnes
      capacity: { type: Number, default: 50000 } // tonnes
    },
    composition: {
      silica: Number, // %
      alumina: Number, // %
      iron: Number, // %
      lime: Number // %
    }
  },
  bottomAsh: {
    quantity: { type: Number, required: true }, // tonnes
    storage: {
      current: Number, // tonnes  
      capacity: { type: Number, default: 15000 } // tonnes
    }
  },
  utilization: {
    cement: { type: Number, default: 0 }, // tonnes
    bricks: { type: Number, default: 0 }, // tonnes
    roads: { type: Number, default: 0 }, // tonnes
    embankments: { type: Number, default: 0 }, // tonnes
    total: Number // tonnes
  },
  prediction: {
    disposalNeeded: Boolean,
    daysToCapacity: Number,
    recommendedUtilization: [String],
    marketDemand: String,
    generatedBy: { type: String, default: 'Gemini AI' }
  },
  quality: {
    grade: { type: String, enum: ['Grade I', 'Grade II', 'Grade III'] },
    moisture: Number, // %
    fineness: Number, // m²/kg specific surface
    loi: Number // Loss on Ignition %
  },
  alerts: [{
    type: String, // 'Storage Full', 'Quality Issue', 'Disposal Required'
    message: String,
    priority: { type: String, enum: ['Low', 'Medium', 'High'] },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['Normal', 'High Storage', 'Critical', 'Quality Issue'],
    default: 'Normal'
  }
}, {
  timestamps: true
});

// Calculate utilization percentage
ashSchema.methods.getUtilizationRate = function() {
  const total = this.flyAsh.quantity + this.bottomAsh.quantity;
  const utilized = this.utilization.total || 0;
  return total > 0 ? Math.round((utilized / total) * 100) : 0;
};

export default mongoose.model('Ash', ashSchema);