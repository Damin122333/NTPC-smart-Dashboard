import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wrench, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const MaintenancePage: React.FC = () => {
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    fetchMaintenanceData();
    const interval = setInterval(fetchMaintenanceData, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const [dataResponse, statsResponse, scheduleResponse] = await Promise.all([
        axios.get('/maintenance/latest'),
        axios.get('/maintenance/stats'),
        axios.get('/maintenance/schedule')
      ]);

      setMaintenanceData(dataResponse.data);
      setStats(statsResponse.data);
      setSchedule(scheduleResponse.data);
      
      if (dataResponse.data.length > 0 && !selectedEquipment) {
        setSelectedEquipment(dataResponse.data[0].equipment.id);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async (equipmentId: string) => {
    try {
      const response = await axios.get(`/maintenance/predictions?equipmentId=${equipmentId}`);
      setPredictions(response.data);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  useEffect(() => {
    if (selectedEquipment) {
      fetchPredictions(selectedEquipment);
    }
  }, [selectedEquipment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-400 bg-red-500/20';
      case 'Warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'Operational': return 'text-green-400 bg-green-500/20';
      case 'Maintenance': return 'text-blue-400 bg-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const EquipmentCard: React.FC<{ equipment: any }> = ({ equipment }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => setSelectedEquipment(equipment.equipment.id)}
      className={`backdrop-blur-xl rounded-2xl p-6 border cursor-pointer transition-all duration-300 ${
        selectedEquipment === equipment.equipment.id
          ? theme === 'dark'
            ? 'bg-blue-500/20 border-blue-500/40'
            : 'bg-blue-500/30 border-blue-500/50'
          : theme === 'dark'
            ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
            : 'bg-white/20 border-white/30 hover:border-white/40'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {equipment.equipment.name}
          </h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {equipment.equipment.type} • {equipment.equipment.location}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(equipment.status)}`}>
          {equipment.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Temperature
          </div>
          <div className={`font-semibold ${
            equipment.parameters.temperature > equipment.thresholds.temperature.max
              ? 'text-red-400'
              : 'text-green-400'
          }`}>
            {equipment.parameters.temperature}°C
          </div>
        </div>
        <div>
          <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Vibration
          </div>
          <div className={`font-semibold ${
            equipment.parameters.vibration > equipment.thresholds.vibration.max
              ? 'text-red-400'
              : 'text-green-400'
          }`}>
            {equipment.parameters.vibration} mm/s
          </div>
        </div>
        <div>
          <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Efficiency
          </div>
          <div className={`font-semibold ${
            equipment.parameters.efficiency < equipment.thresholds.efficiency.min
              ? 'text-red-400'
              : 'text-green-400'
          }`}>
            {equipment.parameters.efficiency}%
          </div>
        </div>
        <div>
          <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Runtime
          </div>
          <div className="font-semibold text-blue-400">
            {Math.round(equipment.parameters.runtime / 24)} days
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-3xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Predictive Maintenance
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            AI-powered equipment health monitoring and maintenance forecasting
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {stats && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
              stats.summary.criticalEquipment > 0 ? 'bg-red-500/20' :
              stats.summary.highRiskEquipment > 0 ? 'bg-yellow-500/20' :
              'bg-green-500/20'
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${
                stats.summary.criticalEquipment > 0 ? 'bg-red-400' :
                stats.summary.highRiskEquipment > 0 ? 'bg-yellow-400' :
                'bg-green-400'
              }`}></div>
              <span className={`text-sm font-medium ${
                stats.summary.criticalEquipment > 0 ? 'text-red-400' :
                stats.summary.highRiskEquipment > 0 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {stats.summary.criticalEquipment > 0 ? 'Critical Issues' :
                 stats.summary.highRiskEquipment > 0 ? 'High Risk' :
                 'All Systems Healthy'}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Equipment Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenanceData.map((equipment, index) => (
          <EquipmentCard key={equipment.equipment.id} equipment={equipment} />
        ))}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Parameters Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10'
              : 'bg-white/20 border-white/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Equipment Parameters
            </h3>
            <Wrench className="w-5 h-5 text-blue-400" />
          </div>
          
          {predictions ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div>
                  <h4 className="font-semibold text-white">{predictions.equipmentName}</h4>
                  <p className={`text-sm ${getRiskColor(predictions.prediction.riskLevel)}`}>
                    Risk Level: {predictions.prediction.riskLevel}
                  </p>
                </div>
                <div className={`text-right text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <div>Confidence: {(predictions.prediction.confidenceScore * 100).toFixed(1)}%</div>
                  {predictions.prediction.maintenanceDue && (
                    <div>Due: {format(new Date(predictions.prediction.maintenanceDue), 'MMM dd, yyyy')}</div>
                  )}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={predictions.historicalData?.slice(0, 5) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis 
                    dataKey="createdAt" 
                    tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                    stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  />
                  <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                  <Bar dataKey="parameters.temperature" fill="#3B82F6" name="Temperature" />
                  <Bar dataKey="parameters.vibration" fill="#F59E0B" name="Vibration" />
                </BarChart>
              </ResponsiveContainer>
              
              {predictions.prediction.recommendedActions && (
                <div className="space-y-2">
                  <h5 className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Recommended Actions:
                  </h5>
                  <ul className="space-y-1">
                    {predictions.prediction.recommendedActions.map((action: string, index: number) => (
                      <li key={index} className={`text-sm flex items-center space-x-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* Maintenance Schedule */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10'
              : 'bg-white/20 border-white/30'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Maintenance Schedule
            </h3>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          
          {schedule ? (
            <div className="space-y-4">
              {/* Overdue */}
              {schedule.overdue?.length > 0 && (
                <div>
                  <h4 className="text-red-400 font-semibold mb-3 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Overdue ({schedule.overdue.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {schedule.overdue.slice(0, 3).map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="font-medium text-white">{item.equipment.name}</div>
                        <div className="text-sm text-red-400">
                          Due: {format(new Date(item.prediction.maintenanceDue), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Upcoming */}
              <div>
                <h4 className="text-yellow-400 font-semibold mb-3 flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Upcoming ({schedule.upcoming?.length || 0})</span>
                </h4>
                <div className="space-y-2">
                  {schedule.upcoming?.slice(0, 5).map((item: any, index: number) => (
                    <div key={index} className="p-3 bg-white/5 rounded-lg">
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {item.equipment.name}
                      </div>
                      <div className="text-sm text-yellow-400">
                        Due: {format(new Date(item.prediction.maintenanceDue), 'MMM dd, yyyy')}
                      </div>
                      <div className={`text-xs ${getRiskColor(item.prediction.riskLevel)}`}>
                        Risk: {item.prediction.riskLevel}
                      </div>
                    </div>
                  )) || (
                    <div className={`text-center py-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      No upcoming maintenance scheduled
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </div>

      {/* Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={`backdrop-blur-xl rounded-2xl p-6 border ${
          theme === 'dark'
            ? 'bg-gray-900/20 border-white/10'
            : 'bg-white/20 border-white/30'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Equipment Performance Overview
          </h3>
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {stats.summary.totalEquipment - stats.summary.criticalEquipment}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Healthy Equipment
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {stats.summary.criticalEquipment}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Critical Issues
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {stats.summary.highRiskEquipment}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                High Risk Equipment
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {stats.equipmentTypes?.reduce((sum: number, type: any) => 
                  sum + Math.round(type.avgEfficiency || 0), 0) / (stats.equipmentTypes?.length || 1)}%
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Average Efficiency
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MaintenancePage;