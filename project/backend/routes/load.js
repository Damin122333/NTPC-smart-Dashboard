import express from 'express';
import Load from '../models/Load.js';
import { authenticate, authorize } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// Get all load data
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50, startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const loads = await Load.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Load.countDocuments(query);

    res.json({
      loads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get latest load data
router.get('/latest', authenticate, async (req, res) => {
  try {
    const load = await Load.findOne().sort({ createdAt: -1 });
    if (!load) {
      return res.status(404).json({ message: 'No load data found' });
    }
    res.json(load);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get load forecasting
router.get('/forecast', authenticate, async (req, res) => {
  try {
    const historicalData = await Load.find()
      .sort({ createdAt: -1 })
      .limit(24); // Last 24 hours of data

    if (!historicalData.length) {
      return res.status(404).json({ message: 'Insufficient historical data' });
    }

    const latest = historicalData[0];
    
    // Generate forecast using Gemini AI
    const forecast = await geminiService.generatePrediction(latest, 'load');
    
    // Update the latest record with forecast
    latest.forecast = {
      ...forecast,
      generatedBy: 'Gemini AI',
      generatedAt: new Date()
    };
    
    await latest.save();

    // Prepare response with historical trend
    const hourlyData = historicalData.reverse().map(load => ({
      timestamp: load.createdAt,
      demand: load.demand.current,
      generation: load.generation.actual,
      efficiency: load.generation.efficiency
    }));

    res.json({
      current: {
        demand: latest.demand.current,
        generation: latest.generation.actual,
        capacity: latest.demand.capacity,
        efficiency: latest.generation.efficiency
      },
      forecast: latest.forecast,
      historical: hourlyData,
      trends: {
        averageDemand: hourlyData.reduce((sum, d) => sum + d.demand, 0) / hourlyData.length,
        averageGeneration: hourlyData.reduce((sum, d) => sum + d.generation, 0) / hourlyData.length,
        peakDemand: Math.max(...hourlyData.map(d => d.demand)),
        minDemand: Math.min(...hourlyData.map(d => d.demand))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get load statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      todayStats,
      weeklyStats,
      monthlyTrends,
      alerts
    ] = await Promise.all([
      // Today's statistics
      Load.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        {
          $group: {
            _id: null,
            avgDemand: { $avg: '$demand.current' },
            maxDemand: { $max: '$demand.current' },
            minDemand: { $min: '$demand.current' },
            avgGeneration: { $avg: '$generation.actual' },
            avgEfficiency: { $avg: '$generation.efficiency' },
            count: { $sum: 1 }
          }
        }
      ]),

      // Weekly hourly breakdown
      Load.aggregate([
        { $match: { createdAt: { $gte: weekAgo } } },
        {
          $group: {
            _id: { $hour: '$createdAt' },
            avgDemand: { $avg: '$demand.current' },
            avgGeneration: { $avg: '$generation.actual' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // Monthly trends
      Load.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgDemand: { $avg: '$demand.current' },
            maxDemand: { $max: '$demand.current' },
            avgGeneration: { $avg: '$generation.actual' },
            loadFactor: { $avg: { $divide: ['$demand.current', '$demand.capacity'] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Recent alerts
      Load.find({ 
        alerts: { $exists: true, $ne: [] }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('alerts createdAt demand.current demand.capacity')
    ]);

    res.json({
      today: todayStats[0] || null,
      hourlyPattern: weeklyStats,
      monthlyTrends,
      recentAlerts: alerts,
      summary: {
        currentLoadFactor: todayStats[0] ? (todayStats[0].avgDemand / 2100) * 100 : 0,
        peakDemandToday: todayStats[0]?.maxDemand || 0,
        averageEfficiency: todayStats[0]?.avgEfficiency || 0,
        totalAlerts: alerts.reduce((sum, load) => sum + (load.alerts?.length || 0), 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new load data
router.post('/', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const load = new Load(req.body);
    await load.save();

    res.status(201).json({
      message: 'Load data created successfully',
      load
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get load alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const loads = await Load.find({ 
      alerts: { $exists: true, $ne: [] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('alerts demand.current demand.capacity createdAt');

    const alerts = [];
    loads.forEach(load => {
      if (load.alerts && load.alerts.length > 0) {
        load.alerts.forEach(alert => {
          alerts.push({
            ...alert.toObject(),
            currentDemand: load.demand.current,
            capacity: load.demand.capacity,
            loadFactor: ((load.demand.current / load.demand.capacity) * 100).toFixed(1),
            loadId: load._id
          });
        });
      }
    });

    // Sort by timestamp descending
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get peak demand analysis
router.get('/peak-analysis', authenticate, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const peakAnalysis = await Load.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            hour: { $hour: '$createdAt' }
          },
          avgDemand: { $avg: '$demand.current' },
          maxDemand: { $max: '$demand.current' },
          avgGeneration: { $avg: '$generation.actual' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          hourlyData: {
            $push: {
              hour: '$_id.hour',
              avgDemand: '$avgDemand',
              maxDemand: '$maxDemand',
              avgGeneration: '$avgGeneration'
            }
          },
          peakHour: { $max: '$maxDemand' },
          peakTime: { $max: '$_id.hour' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      analysis: peakAnalysis,
      period: `${days} days`,
      summary: {
        totalDays: peakAnalysis.length,
        averagePeak: peakAnalysis.reduce((sum, day) => sum + day.peakHour, 0) / peakAnalysis.length,
        commonPeakHours: peakAnalysis.map(day => day.peakTime)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;