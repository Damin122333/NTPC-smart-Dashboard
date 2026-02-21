import axios from 'axios';

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  async generatePrediction(data, type) {
    if (!this.apiKey) {
      console.warn('Gemini API key not provided, using mock predictions');
      return this.getMockPrediction(type);
    }

    try {
      const prompt = this.buildPrompt(data, type);
      
      const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      const prediction = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return this.parsePrediction(prediction, type);
    } catch (error) {
      console.error('Gemini API error:', error.response?.data || error.message);
      return this.getMockPrediction(type);
    }
  }

  buildPrompt(data, type) {
    switch (type) {
      case 'maintenance':
        return `
As a thermal power plant maintenance expert, analyze this equipment data and provide predictions:

Equipment: ${data.equipment?.name} (${data.equipment?.type})
Temperature: ${data.parameters?.temperature}°C (Max: ${data.thresholds?.temperature?.max}°C)
Vibration: ${data.parameters?.vibration} mm/s (Max: ${data.thresholds?.vibration?.max} mm/s)
Pressure: ${data.parameters?.pressure} bar (Max: ${data.thresholds?.pressure?.max} bar)
Efficiency: ${data.parameters?.efficiency}% (Min: ${data.thresholds?.efficiency?.min}%)

Provide a JSON response with:
{
  "riskLevel": "Low/Medium/High",
  "maintenanceDue": "YYYY-MM-DD",
  "recommendedActions": ["action1", "action2"],
  "confidenceScore": 0.85
}
        `;

      case 'load':
        return `
As a power grid analyst, predict electricity demand based on this data:

Current Demand: ${data.demand?.current} MW
Current Generation: ${data.generation?.actual} MW
Capacity: ${data.demand?.capacity} MW
Temperature: ${data.factors?.weather?.temperature}°C
Time: ${data.factors?.timeOfDay}:00
Day of Week: ${data.factors?.dayOfWeek}
Season: ${data.factors?.season}

Provide JSON response with:
{
  "next6Hours": [MW values for next 6 hours],
  "next24Hours": [MW values for next 24 hours], 
  "peakHour": "HH:00",
  "peakLoad": MW_value,
  "confidence": 0.9
}
        `;

      case 'ash':
        return `
As an ash management expert, analyze this thermal power plant ash data:

Fly Ash: ${data.flyAsh?.quantity} tonnes (Storage: ${data.flyAsh?.storage?.current}/${data.flyAsh?.storage?.capacity})
Bottom Ash: ${data.bottomAsh?.quantity} tonnes (Storage: ${data.bottomAsh?.storage?.current}/${data.bottomAsh?.storage?.capacity})
Current Utilization: ${data.utilization?.total} tonnes
Quality Grade: ${data.quality?.grade}

Provide JSON response with:
{
  "disposalNeeded": true/false,
  "daysToCapacity": number,
  "recommendedUtilization": ["cement", "bricks", "roads"],
  "marketDemand": "High/Medium/Low"
}
        `;

      default:
        return 'Analyze this power plant data and provide operational insights.';
    }
  }

  parsePrediction(response, type) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
    }

    return this.getMockPrediction(type);
  }

  getMockPrediction(type) {
    switch (type) {
      case 'maintenance':
        return {
          riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          maintenanceDue: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          recommendedActions: [
            'Schedule routine inspection',
            'Monitor vibration levels',
            'Check lubrication systems',
            'Verify cooling systems'
          ].slice(0, Math.floor(Math.random() * 3) + 1),
          confidenceScore: 0.75 + Math.random() * 0.2
        };

      case 'load':
        const baseLoad = 1800 + Math.random() * 400;
        return {
          next6Hours: Array(6).fill(0).map((_, i) => Math.round(baseLoad + Math.sin(i) * 100 + Math.random() * 50)),
          next24Hours: Array(24).fill(0).map((_, i) => Math.round(baseLoad + Math.sin(i/4) * 200 + Math.random() * 100)),
          peakHour: `${Math.floor(Math.random() * 24)}:00`,
          peakLoad: Math.round(baseLoad + 200 + Math.random() * 100),
          confidence: 0.8 + Math.random() * 0.15
        };

      case 'ash':
        return {
          disposalNeeded: Math.random() > 0.7,
          daysToCapacity: Math.floor(Math.random() * 60) + 10,
          recommendedUtilization: ['cement', 'bricks', 'roads', 'embankments'].slice(0, Math.floor(Math.random() * 3) + 1),
          marketDemand: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
        };

      default:
        return { message: 'Prediction not available' };
    }
  }
}

export default new GeminiService();