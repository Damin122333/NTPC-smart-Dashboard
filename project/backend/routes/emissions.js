import express from 'express';
import Emission from '../models/Emission.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all emissions data with pagination
router.get('/', authenticate, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const emissions = await Emission.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Emission.countDocuments();

    res.json({
      emissions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get latest emission data
router.get('/latest', authenticate, async (req, res) => {
  try {
    const emission = await Emission.findOne().sort({ createdAt: -1 });
    if (!emission) {
      return res.status(404).json({ message: 'No emission data found' });
    }
    res.json(emission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emission data for specific time range
router.get('/range', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, parameter } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const emissions = await Emission.find(query).sort({ createdAt: -1 });

    // If specific parameter requested, extract that data
    if (parameter && ['sox', 'nox', 'co2', 'pm', 'co'].includes(parameter)) {
      const parameterData = emissions.map(emission => ({
        timestamp: emission.createdAt,
        value: emission[parameter].value,
        threshold: emission[parameter].threshold,
        unit: emission[parameter].unit
      }));
      return res.json({ parameter, data: parameterData });
    }

    res.json(emissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emission statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [todayStats, yesterdayStats, weeklyStats] = await Promise.all([
      Emission.aggregate([
        { $match: { createdAt: { $gte: yesterday } } },
        {
          $group: {
            _id: null,
            avgSox: { $avg: '$sox.value' },
            avgNox: { $avg: '$nox.value' },
            avgCo2: { $avg: '$co2.value' },
            avgPm: { $avg: '$pm.value' },
            avgCo: { $avg: '$co.value' },
            maxSox: { $max: '$sox.value' },
            maxNox: { $max: '$nox.value' },
            maxCo2: { $max: '$co2.value' },
            maxPm: { $max: '$pm.value' },
            maxCo: { $max: '$co.value' },
            count: { $sum: 1 }
          }
        }
      ]),
      Emission.aggregate([
        { 
          $match: { 
            createdAt: { 
              $gte: new Date(yesterday.getTime() - 24 * 60 * 60 * 1000),
              $lt: yesterday
            } 
          } 
        },
        {
          $group: {
            _id: null,
            avgSox: { $avg: '$sox.value' },
            avgNox: { $avg: '$nox.value' },
            avgCo2: { $avg: '$co2.value' },
            avgPm: { $avg: '$pm.value' },
            avgCo: { $avg: '$co.value' }
          }
        }
      ]),
      Emission.aggregate([
        { 
          $match: { 
            createdAt: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgSox: { $avg: '$sox.value' },
            avgNox: { $avg: '$nox.value' },
            avgCo2: { $avg: '$co2.value' },
            avgPm: { $avg: '$pm.value' },
            avgCo: { $avg: '$co.value' },
            alerts: { $sum: { $cond: [{ $eq: ['$status', 'Critical'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      today: todayStats[0] || null,
      yesterday: yesterdayStats[0] || null,
      weekly: weeklyStats,
      summary: {
        totalReadings: todayStats[0]?.count || 0,
        criticalAlerts: weeklyStats.reduce((sum, day) => sum + day.alerts, 0)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new emission data (for manual entry)
router.post('/', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const emission = new Emission(req.body);
    await emission.save();

    res.status(201).json({
      message: 'Emission data created successfully',
      emission
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get emission alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const emissions = await Emission.find({ 
      alerts: { $exists: true, $ne: [] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('alerts location plantId createdAt');

    const alerts = [];
    emissions.forEach(emission => {
      if (emission.alerts && emission.alerts.length > 0) {
        emission.alerts.forEach(alert => {
          alerts.push({
            ...alert.toObject(),
            location: emission.location,
            plantId: emission.plantId,
            emissionId: emission._id
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

export default router;