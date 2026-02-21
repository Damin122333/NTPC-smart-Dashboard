import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    equipment: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, required: true }, // 'Boiler', 'Turbine', 'Generator', etc.
      location: String,
    },
    parameters: {
      temperature: { type: Number, required: true }, // °C
      vibration: { type: Number, required: true }, // mm/s
      pressure: { type: Number, required: true }, // bar
      efficiency: Number, // %
      runtime: Number, // hours
    },
    thresholds: {
      temperature: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 550 },
      },
      vibration: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 4.5 },
      },
      pressure: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 180 },
      },
      efficiency: {
        min: { type: Number, default: 85 },
        max: { type: Number, default: 100 },
      },
    },
    prediction: {
      riskLevel: { type: String, enum: ["Low", "Medium", "High"] },
      maintenanceDue: Date,
      recommendedActions: [String],
      confidenceScore: Number,
      generatedBy: { type: String, default: "Gemini AI" },
    },
    status: {
      type: String,
      enum: ["Operational", "Warning", "Critical", "Maintenance"],
      default: "Operational",
    },
    anomalies: [
      {
        parameter: String,
        expectedValue: Number,
        actualValue: Number,
        deviation: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for equipment queries
maintenanceSchema.index({ "equipment.id": 1, createdAt: -1 });
maintenanceSchema.index({ "prediction.riskLevel": 1 });

export default mongoose.model("Maintenance", maintenanceSchema);
