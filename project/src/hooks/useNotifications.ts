import { useState, useEffect } from 'react';
import axios from 'axios';

interface Alert {
  type: string;
  severity: string;
  message: string;
  timestamp: string;
  location?: string;
  equipment?: string;
}

export const useNotifications = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        // Fetch recent alerts from different endpoints
        const [emissionAlerts, maintenanceAlerts, loadAlerts, ashAlerts] = await Promise.all([
          axios.get('/emissions/alerts?limit=5'),
          axios.get('/maintenance?status=Critical&limit=3'),
          axios.get('/load/alerts?limit=3'),
          axios.get('/ash/alerts?limit=3')
        ]);

        const allAlerts: Alert[] = [];

        // Process emission alerts
        emissionAlerts.data.forEach((alert: any) => {
          allAlerts.push({
            type: 'Emission',
            severity: alert.severity || 'Medium',
            message: alert.message,
            timestamp: alert.timestamp,
            location: alert.location
          });
        });

        // Process maintenance alerts
        maintenanceAlerts.data.maintenance.forEach((maintenance: any) => {
          if (maintenance.status === 'Critical' || maintenance.status === 'Warning') {
            allAlerts.push({
              type: 'Maintenance',
              severity: maintenance.status === 'Critical' ? 'High' : 'Medium',
              message: `${maintenance.equipment.name} requires attention`,
              timestamp: maintenance.createdAt,
              equipment: maintenance.equipment.name
            });
          }
        });

        // Process load alerts
        loadAlerts.data.forEach((alert: any) => {
          allAlerts.push({
            type: 'Load',
            severity: alert.severity || 'Medium',
            message: alert.message,
            timestamp: alert.timestamp
          });
        });

        // Process ash alerts
        ashAlerts.data.forEach((alert: any) => {
          allAlerts.push({
            type: 'Ash',
            severity: alert.priority === 'High' ? 'High' : 'Medium',
            message: alert.message,
            timestamp: alert.timestamp
          });
        });

        // Sort by timestamp descending
        allAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setAlerts(allAlerts.slice(0, 10)); // Keep latest 10 alerts
        setUnreadCount(allAlerts.filter(alert => 
          alert.severity === 'High' || alert.severity === 'Critical'
        ).length);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { alerts, unreadCount };
};