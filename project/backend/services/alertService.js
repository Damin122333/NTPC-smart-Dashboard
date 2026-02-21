import Emission from '../models/Emission.js';
import Maintenance from '../models/Maintenance.js';
import Load from '../models/Load.js';
import Ash from '../models/Ash.js';
import User from '../models/User.js';
import twilioService from './twilioService.js';

export const checkThresholds = async () => {
  try {
    // Get the latest data from each collection
    const latestEmission = await Emission.findOne().sort({ createdAt: -1 });
    const latestMaintenance = await Maintenance.findOne().sort({ createdAt: -1 });
    const latestLoad = await Load.findOne().sort({ createdAt: -1 });
    const latestAsh = await Ash.findOne().sort({ createdAt: -1 });

    // Get users who should receive alerts
    const alertUsers = await User.find({ 
      isActive: true, 
      $or: [
        { 'notifications.sms': true },
        { 'notifications.whatsapp': true }
      ]
    });

    // Check emission thresholds
    if (latestEmission) {
      await checkEmissionThresholds(latestEmission, alertUsers);
    }

    // Check maintenance thresholds
    if (latestMaintenance) {
      await checkMaintenanceThresholds(latestMaintenance, alertUsers);
    }

    // Check load thresholds
    if (latestLoad) {
      await checkLoadThresholds(latestLoad, alertUsers);
    }

    // Check ash thresholds
    if (latestAsh) {
      await checkAshThresholds(latestAsh, alertUsers);
    }

  } catch (error) {
    console.error('Error checking thresholds:', error);
  }
};

const checkEmissionThresholds = async (emission, users) => {
  const parameters = ['sox', 'nox', 'co2', 'pm', 'co'];
  
  for (const param of parameters) {
    const data = emission[param];
    if (data.value > data.threshold) {
      const message = twilioService.generateAlertMessage('emission', {
        parameter: param.toUpperCase(),
        value: data.value,
        unit: data.unit,
        threshold: data.threshold,
        location: emission.location || 'Main Stack'
      });

      // Send SMS alerts
      const smsUsers = users.filter(u => u.notifications.sms);
      if (smsUsers.length > 0) {
        await twilioService.sendAlert(smsUsers, message, 'sms');
      }

      // Send WhatsApp alerts  
      const whatsappUsers = users.filter(u => u.notifications.whatsapp);
      if (whatsappUsers.length > 0) {
        await twilioService.sendAlert(whatsappUsers, message, 'whatsapp');
      }

      // Update emission with alert
      if (!emission.alerts) emission.alerts = [];
      emission.alerts.push({
        parameter: param,
        message: `${param.toUpperCase()} exceeded threshold: ${data.value} > ${data.threshold} ${data.unit}`,
        severity: data.value > data.threshold * 1.2 ? 'High' : 'Medium',
        timestamp: new Date()
      });

      await emission.save();
      
      console.log(`🚨 Emission alert sent for ${param}: ${data.value} > ${data.threshold}`);
    }
  }
};

const checkMaintenanceThresholds = async (maintenance, users) => {
  const { parameters, thresholds } = maintenance;
  let criticalIssues = [];

  // Check temperature
  if (parameters.temperature > thresholds.temperature.max) {
    criticalIssues.push(`Temperature: ${parameters.temperature}°C > ${thresholds.temperature.max}°C`);
  }

  // Check vibration
  if (parameters.vibration > thresholds.vibration.max) {
    criticalIssues.push(`Vibration: ${parameters.vibration}mm/s > ${thresholds.vibration.max}mm/s`);
  }

  // Check pressure
  if (parameters.pressure > thresholds.pressure.max) {
    criticalIssues.push(`Pressure: ${parameters.pressure}bar > ${thresholds.pressure.max}bar`);
  }

  // Check efficiency
  if (parameters.efficiency < thresholds.efficiency.min) {
    criticalIssues.push(`Efficiency: ${parameters.efficiency}% < ${thresholds.efficiency.min}%`);
  }

  if (criticalIssues.length > 0) {
    const message = twilioService.generateAlertMessage('maintenance', {
      equipment: maintenance.equipment.name,
      riskLevel: 'High',
      issue: criticalIssues.join(', ')
    });

    // Send alerts
    const smsUsers = users.filter(u => u.notifications.sms);
    const whatsappUsers = users.filter(u => u.notifications.whatsapp);
    
    await Promise.all([
      twilioService.sendAlert(smsUsers, message, 'sms'),
      twilioService.sendAlert(whatsappUsers, message, 'whatsapp')
    ]);

    // Update maintenance record
    if (!maintenance.anomalies) maintenance.anomalies = [];
    criticalIssues.forEach(issue => {
      maintenance.anomalies.push({
        parameter: issue.split(':')[0],
        timestamp: new Date()
      });
    });

    await maintenance.save();
    
    console.log(`⚠️ Maintenance alert sent for ${maintenance.equipment.name}: ${criticalIssues.length} issues`);
  }
};

const checkLoadThresholds = async (load, users) => {
  const loadPercentage = (load.demand.current / load.demand.capacity) * 100;
  
  if (loadPercentage > 95) {
    const message = twilioService.generateAlertMessage('load', {
      currentLoad: load.demand.current,
      capacity: load.demand.capacity,
      status: 'Critical - Near Capacity'
    });

    // Send alerts
    const smsUsers = users.filter(u => u.notifications.sms);
    const whatsappUsers = users.filter(u => u.notifications.whatsapp);
    
    await Promise.all([
      twilioService.sendAlert(smsUsers, message, 'sms'),
      twilioService.sendAlert(whatsappUsers, message, 'whatsapp')
    ]);

    // Update load record
    if (!load.alerts) load.alerts = [];
    load.alerts.push({
      type: 'Critical Load',
      message: `Load at ${loadPercentage.toFixed(1)}% of capacity`,
      severity: 'Critical',
      timestamp: new Date()
    });

    await load.save();
    
    console.log(`📊 Load alert sent: ${loadPercentage.toFixed(1)}% capacity`);
  }
};

const checkAshThresholds = async (ash, users) => {
  const flyAshPercentage = (ash.flyAsh.storage.current / ash.flyAsh.storage.capacity) * 100;
  const bottomAshPercentage = (ash.bottomAsh.storage.current / ash.bottomAsh.storage.capacity) * 100;
  
  if (flyAshPercentage > 90 || bottomAshPercentage > 90) {
    const criticalType = flyAshPercentage > bottomAshPercentage ? 'Fly Ash' : 'Bottom Ash';
    const level = Math.max(flyAshPercentage, bottomAshPercentage);
    
    const message = twilioService.generateAlertMessage('ash', {
      type: criticalType,
      level: level.toFixed(1),
      action: 'Immediate disposal required'
    });

    // Send alerts
    const smsUsers = users.filter(u => u.notifications.sms);
    const whatsappUsers = users.filter(u => u.notifications.whatsapp);
    
    await Promise.all([
      twilioService.sendAlert(smsUsers, message, 'sms'),
      twilioService.sendAlert(whatsappUsers, message, 'whatsapp')
    ]);

    // Update ash record
    if (!ash.alerts) ash.alerts = [];
    ash.alerts.push({
      type: 'Storage Full',
      message: `${criticalType} storage at ${level.toFixed(1)}%`,
      priority: 'High',
      timestamp: new Date()
    });

    await ash.save();
    
    console.log(`🏭 Ash alert sent: ${criticalType} at ${level.toFixed(1)}% capacity`);
  }
};