import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import twilioService from '../services/twilioService.js';

const router = express.Router();

// Send SMS to specific users
router.post('/send-sms', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { userIds, message, urgent = false } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message content required' });
    }

    // Get users
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
      'notifications.sms': true
    }).select('name phone notifications');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No eligible users found' });
    }

    // Add urgency prefix if needed
    const finalMessage = urgent ? `🚨 URGENT - ${message}` : message;

    // Send SMS
    const results = await twilioService.sendAlert(users, finalMessage, 'sms');

    res.json({
      message: 'SMS notifications sent',
      results,
      summary: {
        attempted: users.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send WhatsApp to specific users
router.post('/send-whatsapp', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { userIds, message, urgent = false } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array required' });
    }

    if (!message) {
      return res.status(400).json({ message: 'Message content required' });
    }

    // Get users
    const users = await User.find({
      _id: { $in: userIds },
      isActive: true,
      'notifications.whatsapp': true
    }).select('name phone notifications');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No eligible users found' });
    }

    // Add urgency prefix if needed
    const finalMessage = urgent ? `🚨 URGENT - ${message}` : message;

    // Send WhatsApp
    const results = await twilioService.sendAlert(users, finalMessage, 'whatsapp');

    res.json({
      message: 'WhatsApp notifications sent',
      results,
      summary: {
        attempted: users.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Broadcast message to all users
router.post('/broadcast', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { message, type = 'both', urgent = false, departments = [] } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message content required' });
    }

    let query = { isActive: true };
    
    // Filter by departments if specified
    if (departments.length > 0) {
      query.department = { $in: departments };
    }

    // Get all eligible users
    const users = await User.find(query).select('name phone notifications department');

    if (users.length === 0) {
      return res.status(404).json({ message: 'No eligible users found' });
    }

    // Add urgency and broadcast prefix
    const finalMessage = urgent ? 
      `🚨 URGENT BROADCAST - ${message}` : 
      `📢 NTPC BROADCAST - ${message}`;

    const results = [];

    // Send SMS if requested
    if (type === 'sms' || type === 'both') {
      const smsUsers = users.filter(u => u.notifications.sms);
      if (smsUsers.length > 0) {
        const smsResults = await twilioService.sendAlert(smsUsers, finalMessage, 'sms');
        results.push(...smsResults.map(r => ({ ...r, type: 'sms' })));
      }
    }

    // Send WhatsApp if requested
    if (type === 'whatsapp' || type === 'both') {
      const whatsappUsers = users.filter(u => u.notifications.whatsapp);
      if (whatsappUsers.length > 0) {
        const whatsappResults = await twilioService.sendAlert(whatsappUsers, finalMessage, 'whatsapp');
        results.push(...whatsappResults.map(r => ({ ...r, type: 'whatsapp' })));
      }
    }

    res.json({
      message: 'Broadcast sent successfully',
      results,
      summary: {
        totalUsers: users.length,
        attempted: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        departments: departments.length || 'All',
        type,
        urgent
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification templates
router.get('/templates', authenticate, async (req, res) => {
  try {
    const templates = [
      {
        id: 'emission_alert',
        name: 'Emission Threshold Alert',
        category: 'Emergency',
        template: 'EMISSION ALERT: {parameter} level exceeded at {location}. Current: {value} {unit}, Threshold: {threshold} {unit}. Immediate action required.'
      },
      {
        id: 'maintenance_due',
        name: 'Maintenance Due Notice',
        category: 'Maintenance',
        template: 'MAINTENANCE DUE: {equipment} requires {type} maintenance. Risk Level: {risk}. Schedule within {days} days.'
      },
      {
        id: 'load_warning',
        name: 'High Load Warning',
        category: 'Operations',
        template: 'LOAD WARNING: Current demand {current}MW approaching capacity {capacity}MW. Load factor at {percentage}%.'
      },
      {
        id: 'ash_disposal',
        name: 'Ash Disposal Alert',
        category: 'Environment',
        template: 'ASH DISPOSAL: {type} storage at {level}% capacity. Disposal arrangements required within {days} days.'
      },
      {
        id: 'shift_handover',
        name: 'Shift Handover Notice',
        category: 'Operations',
        template: 'SHIFT HANDOVER: {from_shift} to {to_shift}. Key updates: {updates}. Contact {supervisor} for queries.'
      },
      {
        id: 'emergency_shutdown',
        name: 'Emergency Shutdown Alert',
        category: 'Emergency',
        template: 'EMERGENCY SHUTDOWN: Unit {unit} emergency shutdown initiated. Reason: {reason}. ETA for restart: {eta}.'
      }
    ];

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get notification statistics
router.get('/stats', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // This would typically come from a notifications log table
    // For now, return mock statistics
    const stats = {
      period: `${days} days`,
      totalSent: Math.floor(Math.random() * 500) + 100,
      smsCount: Math.floor(Math.random() * 300) + 50,
      whatsappCount: Math.floor(Math.random() * 200) + 25,
      successRate: Math.floor(Math.random() * 10) + 90, // 90-100%
      categories: {
        Emergency: Math.floor(Math.random() * 50) + 10,
        Maintenance: Math.floor(Math.random() * 80) + 20,
        Operations: Math.floor(Math.random() * 100) + 30,
        Environment: Math.floor(Math.random() * 30) + 5
      },
      userPreferences: await User.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            smsEnabled: { 
              $sum: { $cond: ['$notifications.sms', 1, 0] }
            },
            whatsappEnabled: { 
              $sum: { $cond: ['$notifications.whatsapp', 1, 0] }
            },
            emailEnabled: { 
              $sum: { $cond: ['$notifications.email', 1, 0] }
            }
          }
        }
      ]),
      recentFailures: [
        {
          phone: '+91XXXXXXXX',
          reason: 'Invalid number',
          timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        }
      ]
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Test notification system
router.post('/test', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { phone, type = 'sms' } = req.body;

    if (!phone) {
      return res.status(400).json({ message: 'Phone number required for test' });
    }

    const testMessage = `NTPC System Test - ${new Date().toLocaleString()}\n\nThis is a test message to verify the notification system is working properly.`;

    let result;
    if (type === 'whatsapp') {
      result = await twilioService.sendWhatsApp(phone, testMessage);
    } else {
      result = await twilioService.sendSMS(phone, testMessage);
    }

    res.json({
      message: `Test ${type.toUpperCase()} sent`,
      result,
      testDetails: {
        phone,
        type,
        timestamp: new Date().toISOString(),
        success: result.success
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;