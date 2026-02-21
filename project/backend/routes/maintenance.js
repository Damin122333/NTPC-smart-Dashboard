import express from 'express';
import Maintenance from '../models/Maintenance.js';
import { authenticate, authorize } from '../middleware/auth.js';
import geminiService from '../services/geminiService.js';

const router = express.Router();

// Get all maintenance data
router.get('/', authenticate, async (req, res) => {
  try {
    const { equipmentType, status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (equipmentType) query['equipment.type'] = equipmentType;
    if (status) query.status = status;

    const maintenance = await Maintenance.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Maintenance.countDocuments(query);

    res.json({
      maintenance,
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

// Get latest maintenance data for each equipment
router.get('/latest', authenticate, async (req, res) => {
  try {
    const latestByEquipment = await Maintenance.aggregate([
      {
        $sort: { 'equipment.id': 1, createdAt: -1 }
      },
      {
        $group: {
          _id: '$equipment.id',
          latest: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latest' }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.json(latestByEquipment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get maintenance predictions
router.get('/predictions', authenticate, async (req, res) => {
  try {
    const { equipmentId } = req.query;
    
    let query = {};
    if (equipmentId) query['equipment.id'] = equipmentId;

    const maintenanceData = await Maintenance.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    if (!maintenanceData.length) {
      return res.status(404).json({ message: 'No maintenance data found' });
    }

    const latest = maintenanceData[0];
    
    // Generate prediction using Gemini AI
    const prediction = await geminiService.generatePrediction(latest, 'maintenance');
    
    // Update the maintenance record with prediction
    latest.prediction = {
      ...prediction,
      generatedBy: 'Gemini AI',
      generatedAt: new Date()
    };
    
    await latest.save();

    res.json({
      equipmentId: latest.equipment.id,
      equipmentName: latest.equipment.name,
      currentStatus: latest.status,
      prediction: latest.prediction,
      historicalData: maintenanceData.slice(1, 6) // Last 5 records for context
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get maintenance statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [
      equipmentStats,
      statusStats,
      riskStats,
      recentAnomalies
    ] = await Promise.all([
      // Equipment type statistics
      Maintenance.aggregate([
        {
          $group: {
            _id: '$equipment.type',
            count: { $sum: 1 },
            avgTemperature: { $avg: '$parameters.temperature' },
            avgVibration: { $avg: '$parameters.vibration' },
            avgEfficiency: { $avg: '$parameters.efficiency' },
            criticalCount: {
              $sum: { $cond: [{ $eq: ['$status', 'Critical'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // Status distribution
      Maintenance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Risk level distribution  
      Maintenance.aggregate([
        {
          $group: {
            _id: '$prediction.riskLevel',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Recent anomalies
      Maintenance.find({
        anomalies: { $exists: true, $ne: [] }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('equipment anomalies createdAt')
    ]);

    res.json({
      equipmentTypes: equipmentStats,
      statusDistribution: statusStats,
      riskDistribution: riskStats,
      recentAnomalies,
      summary: {
        totalEquipment: equipmentStats.length,
        criticalEquipment: statusStats.find(s => s._id === 'Critical')?.count || 0,
        highRiskEquipment: riskStats.find(r => r._id === 'High')?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new maintenance record
router.post('/', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const maintenance = new Maintenance(req.body);
    await maintenance.save();

    res.status(201).json({
      message: 'Maintenance record created successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update maintenance record
router.put('/:id', authenticate, authorize('Admin', 'Engineer'), async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!maintenance) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    res.json({
      message: 'Maintenance record updated successfully',
      maintenance
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get maintenance schedule
router.get('/schedule', authenticate, async (req, res) => {
  try {
    const upcomingMaintenance = await Maintenance.find({
      'prediction.maintenanceDue': { $gte: new Date() },
      status: { $ne: 'Maintenance' }
    })
      .sort({ 'prediction.maintenanceDue': 1 })
      .limit(20);

    const overdueMainte = await Maintenance.find({
      'prediction.maintenanceDue': { $lt: new Date() },
      status: { $ne: 'Maintenance' }
    })
      .sort({ 'prediction.maintenanceDue': 1 })
      .limit(10);

    res.json({
      upcoming: upcomingMaintenance,
      overdue: overdueMainte,
      summary: {
        upcomingCount: upcomingMaintenance.length,
        overdueCount: overdueMainte.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;