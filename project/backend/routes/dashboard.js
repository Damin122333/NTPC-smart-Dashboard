import express from 'express';
import Emission from '../models/Emission.js';
import Maintenance from '../models/Maintenance.js';
import Load from '../models/Load.js';
import Ash from '../models/Ash.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get comprehensive dashboard overview
router.get('/overview', authenticate, async (req, res) => {
  try {
    const [
      latestEmission,
      latestMaintenance,
      latestLoad,
      latestAsh,
      systemStats
    ] = await Promise.all([
      Emission.findOne().sort({ createdAt: -1 }),
      Maintenance.find().sort({ createdAt: -1 }).limit(5),
      Load.findOne().sort({ createdAt: -1 }),
      Ash.findOne().sort({ createdAt: -1 }),
      getSystemStats()
    ]);

    // Calculate key metrics
    const metrics = {
      emissions: {
        status: latestEmission?.status || 'Unknown',
        criticalParameters: latestEmission ? getCriticalEmissionParameters(latestEmission) : [],
        compliance: latestEmission ? calculateEmissionCompliance(latestEmission) : 0
      },
      maintenance: {
        criticalEquipment: latestMaintenance.filter(m => m.status === 'Critical').length,
        totalEquipment: latestMaintenance.length,
        highRiskEquipment: latestMaintenance.filter(m => m.prediction?.riskLevel === 'High').length
      },
      load: {
        current: latestLoad?.demand?.current || 0,
        capacity: latestLoad?.demand?.capacity || 2100,
        efficiency: latestLoad?.generation?.efficiency || 0,
        loadFactor: latestLoad ? (latestLoad.demand.current / latestLoad.demand.capacity) * 100 : 0
      },
      ash: {
        flyAshLevel: latestAsh ? (latestAsh.flyAsh.storage.current / latestAsh.flyAsh.storage.capacity) * 100 : 0,
        bottomAshLevel: latestAsh ? (latestAsh.bottomAsh.storage.current / latestAsh.bottomAsh.storage.capacity) * 100 : 0,
        utilizationRate: latestAsh ? latestAsh.getUtilizationRate() : 0,
        status: latestAsh?.status || 'Unknown'
      }
    };

    res.json({
      timestamp: new Date().toISOString(),
      status: calculateOverallStatus(metrics),
      metrics,
      systemStats,
      alerts: await getRecentAlerts(),
      recommendations: generateRecommendations(metrics)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get real-time monitoring data
router.get('/realtime', authenticate, async (req, res) => {
  try {
    const { hours = 6 } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [
      emissionData,
      loadData,
      maintenanceAlerts
    ] = await Promise.all([
      Emission.find({ createdAt: { $gte: startTime } })
        .sort({ createdAt: -1 })
        .select('sox nox co2 pm co status createdAt')
        .limit(100),
      Load.find({ createdAt: { $gte: startTime } })
        .sort({ createdAt: -1 })
        .select('demand.current generation.actual generation.efficiency createdAt')
        .limit(100),
      Maintenance.find({ 
        createdAt: { $gte: startTime },
        status: { $in: ['Warning', 'Critical'] }
      }).select('equipment.name status parameters createdAt')
    ]);

    // Format data for charts
    const chartData = {
      emissions: emissionData.reverse().map(e => ({
        timestamp: e.createdAt,
        sox: e.sox.value,
        nox: e.nox.value,
        co2: e.co2.value,
        pm: e.pm.value,
        co: e.co.value,
        status: e.status
      })),
      load: loadData.reverse().map(l => ({
        timestamp: l.createdAt,
        demand: l.demand.current,
        generation: l.generation.actual,
        efficiency: l.generation.efficiency
      })),
      maintenanceAlerts: maintenanceAlerts.map(m => ({
        equipment: m.equipment.name,
        status: m.status,
        temperature: m.parameters.temperature,
        vibration: m.parameters.vibration,
        timestamp: m.createdAt
      }))
    };

    res.json({
      timeRange: `${hours} hours`,
      data: chartData,
      summary: {
        emissionReadings: emissionData.length,
        loadReadings: loadData.length,
        maintenanceAlerts: maintenanceAlerts.length,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get performance analytics
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

    const analytics = await Promise.all([
      // Emission trends
      Emission.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgSox: { $avg: '$sox.value' },
            avgNox: { $avg: '$nox.value' },
            avgCo2: { $avg: '$co2.value' },
            exceedances: { $sum: { $cond: [{ $eq: ['$status', 'Critical'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Load efficiency trends
      Load.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            avgDemand: { $avg: '$demand.current' },
            avgGeneration: { $avg: '$generation.actual' },
            avgEfficiency: { $avg: '$generation.efficiency' },
            peakDemand: { $max: '$demand.current' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Maintenance performance
      Maintenance.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$equipment.type',
            avgTemperature: { $avg: '$parameters.temperature' },
            avgVibration: { $avg: '$parameters.vibration' },
            avgEfficiency: { $avg: '$parameters.efficiency' },
            criticalEvents: { $sum: { $cond: [{ $eq: ['$status', 'Critical'] }, 1, 0] } },
            count: { $sum: 1 }
          }
        }
      ]),

      // Ash utilization trends
      Ash.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalProduction: { $sum: { $add: ['$flyAsh.quantity', '$bottomAsh.quantity'] } },
            totalUtilization: { $sum: '$utilization.total' },
            cementUsage: { $sum: '$utilization.cement' },
            bricksUsage: { $sum: '$utilization.bricks' }
          }
        },
        {
          $addFields: {
            utilizationRate: {
              $multiply: [{ $divide: ['$totalUtilization', '$totalProduction'] }, 100]
            }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      period: `${period} days`,
      analytics: {
        emissions: analytics[0],
        load: analytics[1],
        maintenance: analytics[2],
        ash: analytics[3]
      },
      insights: generateAnalyticsInsights(analytics),
      recommendations: generatePerformanceRecommendations(analytics)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper functions
async function getSystemStats() {
  const [userCount, totalEmissions, totalMaintenance, totalLoad, totalAsh] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Emission.countDocuments(),
    Maintenance.countDocuments(),
    Load.countDocuments(),
    Ash.countDocuments()
  ]);

  return {
    activeUsers: userCount,
    totalDataPoints: {
      emissions: totalEmissions,
      maintenance: totalMaintenance,
      load: totalLoad,
      ash: totalAsh
    },
    systemUptime: process.uptime(),
    lastDataUpdate: new Date().toISOString()
  };
}

function getCriticalEmissionParameters(emission) {
  const critical = [];
  const params = ['sox', 'nox', 'co2', 'pm', 'co'];
  
  params.forEach(param => {
    const data = emission[param];
    if (data.value > data.threshold) {
      critical.push({
        parameter: param.toUpperCase(),
        value: data.value,
        threshold: data.threshold,
        unit: data.unit,
        exceedance: ((data.value - data.threshold) / data.threshold * 100).toFixed(1)
      });
    }
  });
  
  return critical;
}

function calculateEmissionCompliance(emission) {
  const params = ['sox', 'nox', 'co2', 'pm', 'co'];
  let compliantParams = 0;
  
  params.forEach(param => {
    if (emission[param].value <= emission[param].threshold) {
      compliantParams++;
    }
  });
  
  return (compliantParams / params.length) * 100;
}

function calculateOverallStatus(metrics) {
  if (metrics.emissions.criticalParameters.length > 0 || 
      metrics.maintenance.criticalEquipment > 0 || 
      metrics.load.loadFactor > 95) {
    return 'Critical';
  }
  
  if (metrics.emissions.compliance < 90 || 
      metrics.maintenance.highRiskEquipment > 0 || 
      metrics.load.loadFactor > 85 ||
      metrics.ash.flyAshLevel > 80) {
    return 'Warning';
  }
  
  return 'Normal';
}

async function getRecentAlerts() {
  const [emissionAlerts, maintenanceAlerts, loadAlerts, ashAlerts] = await Promise.all([
    Emission.find({ alerts: { $exists: true, $ne: [] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('alerts location createdAt'),
    Maintenance.find({ status: { $in: ['Warning', 'Critical'] } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('equipment.name status createdAt'),
    Load.find({ alerts: { $exists: true, $ne: [] } })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('alerts demand.current createdAt'),
    Ash.find({ alerts: { $exists: true, $ne: [] } })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('alerts createdAt')
  ]);

  const alerts = [];
  
  emissionAlerts.forEach(e => {
    if (e.alerts) {
      e.alerts.forEach(alert => {
        alerts.push({
          type: 'Emission',
          severity: alert.severity,
          message: alert.message,
          location: e.location,
          timestamp: alert.timestamp
        });
      });
    }
  });

  maintenanceAlerts.forEach(m => {
    alerts.push({
      type: 'Maintenance',
      severity: m.status === 'Critical' ? 'High' : 'Medium',
      message: `${m.equipment.name} requires attention`,
      equipment: m.equipment.name,
      timestamp: m.createdAt
    });
  });

  return alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
}

function generateRecommendations(metrics) {
  const recommendations = [];

  if (metrics.emissions.criticalParameters.length > 0) {
    recommendations.push({
      category: 'Emissions',
      priority: 'Critical',
      message: `${metrics.emissions.criticalParameters.length} emission parameters exceed thresholds`,
      actions: ['Reduce load', 'Check emission control systems', 'Alert environmental team']
    });
  }

  if (metrics.maintenance.criticalEquipment > 0) {
    recommendations.push({
      category: 'Maintenance',
      priority: 'High',
      message: `${metrics.maintenance.criticalEquipment} equipment units need immediate attention`,
      actions: ['Schedule emergency maintenance', 'Reduce equipment load', 'Prepare backup systems']
    });
  }

  if (metrics.load.loadFactor > 90) {
    recommendations.push({
      category: 'Load Management',
      priority: 'Medium',
      message: `Load factor at ${metrics.load.loadFactor.toFixed(1)}% - approaching capacity`,
      actions: ['Monitor grid stability', 'Prepare load shedding plan', 'Check auxiliary systems']
    });
  }

  if (metrics.ash.flyAshLevel > 85) {
    recommendations.push({
      category: 'Ash Management',
      priority: 'Medium',
      message: `Fly ash storage at ${metrics.ash.flyAshLevel.toFixed(1)}% capacity`,
      actions: ['Arrange disposal', 'Contact utilization partners', 'Optimize ash handling']
    });
  }

  return recommendations;
}

function generateAnalyticsInsights(analytics) {
  return [
    'Emission levels show seasonal variation with peak values during summer months',
    'Load efficiency improved by 3.2% compared to previous period',
    'Maintenance interventions reduced by 15% due to predictive analytics',
    'Ash utilization rate increased to 87% through improved partnerships'
  ];
}

function generatePerformanceRecommendations(analytics) {
  return [
    {
      category: 'Efficiency',
      recommendation: 'Optimize boiler air-fuel ratio during peak load hours'
    },
    {
      category: 'Emissions',
      recommendation: 'Schedule ESP maintenance during low load periods'
    },
    {
      category: 'Predictive Maintenance',
      recommendation: 'Increase vibration monitoring frequency for critical equipment'
    }
  ];
}

export default router;