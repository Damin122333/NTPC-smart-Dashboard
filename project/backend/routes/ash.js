import express from 'express';
import Ash from '../models/Ash.js';
import { authenticate, authorize } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// Get all ash data
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;

    const ashData = await Ash.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Ash.countDocuments();

    res.json({
      ashData,
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

// Get latest ash data
router.get('/latest', authenticate, async (req, res) => {
  try {
    const ash = await Ash.findOne().sort({ createdAt: -1 });
    if (!ash) {
      return res.status(404).json({ message: 'No ash data found' });
    }

    // Calculate utilization rate
    const utilizationRate = ash.getUtilizationRate();

    res.json({
      ...ash.toObject(),
      utilizationRate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ash predictions and recommendations
router.get('/predictions', authenticate, async (req, res) => {
  try {
    const latest = await Ash.findOne().sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ message: 'No ash data found' });
    }

    // Generate predictions using Gemini AI
    const prediction = await geminiService.generatePrediction(latest, 'ash');
    
    // Update the ash record with prediction
    latest.prediction = {
      ...prediction,
      generatedBy: 'Gemini AI',
      generatedAt: new Date()
    };
    
    await latest.save();

    // Get historical data for trends
    const historicalData = await Ash.find()
      .sort({ createdAt: -1 })
      .limit(7)
      .select('flyAsh.quantity bottomAsh.quantity utilization.total createdAt');

    res.json({
      current: {
        flyAsh: latest.flyAsh,
        bottomAsh: latest.bottomAsh,
        utilization: latest.utilization,
        quality: latest.quality,
        status: latest.status
      },
      prediction: latest.prediction,
      historical: historicalData.reverse(),
      trends: {
        avgDailyProduction: historicalData.reduce((sum, d) => 
          sum + d.flyAsh.quantity + d.bottomAsh.quantity, 0) / historicalData.length,
        avgUtilization: historicalData.reduce((sum, d) => 
          sum + (d.utilization.total || 0), 0) / historicalData.length,
        utilizationRate: latest.getUtilizationRate()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ash utilization statistics
router.get('/utilization-stats', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      utilizationTrends,
      storageStats,
      qualityStats
    ] = await Promise.all([
      // Utilization trends over time
      Ash.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalProduction: { 
              $sum: { $add: ['$flyAsh.quantity', '$bottomAsh.quantity'] }
            },
            totalUtilization: { $sum: '$utilization.total' },
            cementUsage: { $sum: '$utilization.cement' },
            bricksUsage: { $sum: '$utilization.bricks' },
            roadsUsage: { $sum: '$utilization.roads' },
            embankmentsUsage: { $sum: '$utilization.embankments' }
          }
        },
        {
          $addFields: {
            utilizationRate: {
              $multiply: [
                { $divide: ['$totalUtilization', '$totalProduction'] },
                100
              ]
            }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Storage level statistics
      Ash.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            avgFlyAshStorage: { 
              $avg: { 
                $divide: [
                  '$flyAsh.storage.current', 
                  '$flyAsh.storage.capacity'
                ]
              }
            },
            avgBottomAshStorage: {
              $avg: {
                $divide: [
                  '$bottomAsh.storage.current',
                  '$bottomAsh.storage.capacity'
                ]
              }
            },
            maxFlyAshStorage: { $max: '$flyAsh.storage.current' },
            maxBottomAshStorage: { $max: '$bottomAsh.storage.current' }
          }
        }
      ]),

      // Quality grade distribution
      Ash.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$quality.grade',
            count: { $sum: 1 },
            avgFineness: { $avg: '$quality.fineness' },
            avgLoi: { $avg: '$quality.loi' }
          }
        }
      ])
    ]);

    res.json({
      period: `${days} days`,
      utilizationTrends,
      storage: storageStats[0] || null,
      quality: qualityStats,
      summary: {
        totalDays: utilizationTrends.length,
        averageUtilizationRate: utilizationTrends.reduce((sum, day) => 
          sum + (day.utilizationRate || 0), 0) / utilizationTrends.length,
        bestUtilizationDay: utilizationTrends.reduce((best, day) => 
          day.utilizationRate > (best?.utilizationRate || 0) ? day : best, null)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new ash data
router.post('/', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const ash = new Ash(req.body);
    await ash.save();

    res.status(201).json({
      message: 'Ash data created successfully',
      ash
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update ash data
router.put('/:id', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const ash = await Ash.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!ash) {
      return res.status(404).json({ message: 'Ash data not found' });
    }

    res.json({
      message: 'Ash data updated successfully',
      ash
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get ash alerts
router.get('/alerts', authenticate, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const ashData = await Ash.find({ 
      alerts: { $exists: true, $ne: [] }
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('alerts flyAsh bottomAsh createdAt');

    const alerts = [];
    ashData.forEach(ash => {
      if (ash.alerts && ash.alerts.length > 0) {
        ash.alerts.forEach(alert => {
          alerts.push({
            ...alert.toObject(),
            flyAshLevel: ((ash.flyAsh.storage.current / ash.flyAsh.storage.capacity) * 100).toFixed(1),
            bottomAshLevel: ((ash.bottomAsh.storage.current / ash.bottomAsh.storage.capacity) * 100).toFixed(1),
            ashId: ash._id
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

// Get disposal recommendations
router.get('/disposal-recommendations', authenticate, async (req, res) => {
  try {
    const latest = await Ash.findOne().sort({ createdAt: -1 });
    if (!latest) {
      return res.status(404).json({ message: 'No ash data found' });
    }

    const flyAshLevel = (latest.flyAsh.storage.current / latest.flyAsh.storage.capacity) * 100;
    const bottomAshLevel = (latest.bottomAsh.storage.current / latest.bottomAsh.storage.capacity) * 100;

    const recommendations = [];

    if (flyAshLevel > 80) {
      recommendations.push({
        type: 'Fly Ash Disposal',
        priority: flyAshLevel > 90 ? 'Critical' : 'High',
        message: `Fly ash storage at ${flyAshLevel.toFixed(1)}% capacity`,
        actions: [
          'Contact cement manufacturers for bulk purchase',
          'Arrange transportation for road construction projects',
          'Coordinate with brick manufacturers'
        ]
      });
    }

    if (bottomAshLevel > 75) {
      recommendations.push({
        type: 'Bottom Ash Disposal',
        priority: bottomAshLevel > 90 ? 'Critical' : 'Medium',
        message: `Bottom ash storage at ${bottomAshLevel.toFixed(1)}% capacity`,
        actions: [
          'Schedule embankment filling projects',
          'Coordinate with construction companies',
          'Consider landfilling options'
        ]
      });
    }

    // Quality-based recommendations
    if (latest.quality.grade === 'Grade I') {
      recommendations.push({
        type: 'Quality Optimization',
        priority: 'Medium',
        message: 'High quality fly ash available',
        actions: [
          'Market to premium cement manufacturers',
          'Consider export opportunities',
          'Price premium for Grade I ash'
        ]
      });
    }

    res.json({
      currentStatus: {
        flyAshLevel: flyAshLevel.toFixed(1),
        bottomAshLevel: bottomAshLevel.toFixed(1),
        quality: latest.quality,
        utilizationRate: latest.getUtilizationRate()
      },
      recommendations,
      prediction: latest.prediction,
      urgentActions: recommendations.filter(r => r.priority === 'Critical').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;