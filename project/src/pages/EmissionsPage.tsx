import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

interface EmissionData {
  sox: { value: number; threshold: number; unit: string };
  nox: { value: number; threshold: number; unit: string };
  co2: { value: number; threshold: number; unit: string };
  pm: { value: number; threshold: number; unit: string };
  co: { value: number; threshold: number; unit: string };
  status: string;
  createdAt: string;
}

const EmissionsPage: React.FC = () => {
  const [emissionData, setEmissionData] = useState<EmissionData[]>([]);
  const [latest, setLatest] = useState<EmissionData | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6'); // hours
  const { theme } = useTheme();

  useEffect(() => {
    fetchEmissionData();
    const interval = setInterval(fetchEmissionData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchEmissionData = async () => {
    try {
      const [dataResponse, latestResponse, statsResponse, alertsResponse] = await Promise.all([
        axios.get(`/emissions/range?hours=${timeRange}`),
        axios.get('/emissions/latest'),
        axios.get('/emissions/stats'),
        axios.get('/emissions/alerts?limit=10')
      ]);

      setEmissionData(dataResponse.data.slice(-50)); // Keep last 50 readings
      setLatest(latestResponse.data);
      setStats(statsResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error fetching emission data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const getParameterColor = (param: string) => {
    const colors: { [key: string]: string } = {
      sox: '#3B82F6',
      nox: '#10B981',
      co2: '#F59E0B',
      pm: '#EF4444',
      co: '#8B5CF6'
    };
    return colors[param] || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-400 bg-red-500/20';
      case 'Warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'Normal': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const ParameterCard: React.FC<{ 
    param: string; 
    data: { value: number; threshold: number; unit: string };
    label: string;
  }> = ({ param, data, label }) => {
    const isExceeded = data.value > data.threshold;
    const percentage = (data.value / data.threshold) * 100;
    
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
            : 'bg-white/20 border-white/30 hover:border-white/40'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            {label}
          </h3>
          {isExceeded ? (
            <AlertTriangle className="w-5 h-5 text-red-400" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-400" />
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold ${
                isExceeded ? 'text-red-400' : 'text-green-400'
              }`}>
                {data.value}
              </span>
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {data.unit}
              </span>
            </div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Threshold: {data.threshold} {data.unit}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isExceeded ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs">
            <span className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {percentage.toFixed(1)}% of threshold
            </span>
            {isExceeded && (
              <span className="text-red-400 font-semibold">
                EXCEEDED
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

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
            Emission Monitoring
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Real-time environmental compliance tracking
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={`px-4 py-2 rounded-xl border backdrop-blur-xl ${
              theme === 'dark'
                ? 'bg-gray-900/50 border-white/10 text-white'
                : 'bg-white/50 border-white/30 text-gray-800'
            }`}
          >
            <option value="1">Last 1 hour</option>
            <option value="6">Last 6 hours</option>
            <option value="24">Last 24 hours</option>
            <option value="168">Last week</option>
          </select>
          
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
            latest?.status === 'Normal' ? 'bg-green-500/20' :
            latest?.status === 'Warning' ? 'bg-yellow-500/20' :
            'bg-red-500/20'
          }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              latest?.status === 'Normal' ? 'bg-green-400' :
              latest?.status === 'Warning' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              latest?.status === 'Normal' ? 'text-green-400' :
              latest?.status === 'Warning' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {latest?.status || 'Unknown'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Current Parameters */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ParameterCard param="sox" data={latest.sox} label="SOx" />
          <ParameterCard param="nox" data={latest.nox} label="NOx" />
          <ParameterCard param="co2" data={latest.co2} label="CO₂" />
          <ParameterCard param="pm" data={latest.pm} label="PM" />
          <ParameterCard param="co" data={latest.co} label="CO" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emissions Trend */}
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
              Emission Trends
            </h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={emissionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="createdAt" 
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
              />
              <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              <Line 
                type="monotone" 
                dataKey="sox.value" 
                stroke={getParameterColor('sox')} 
                strokeWidth={2} 
                name="SOx"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="nox.value" 
                stroke={getParameterColor('nox')} 
                strokeWidth={2} 
                name="NOx"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="pm.value" 
                stroke={getParameterColor('pm')} 
                strokeWidth={2} 
                name="PM"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Compliance Statistics */}
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
              Daily Compliance
            </h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          
          {stats?.today ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {((stats.today.count - (stats.summary?.criticalAlerts || 0)) / stats.today.count * 100).toFixed(1)}%
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Compliance Rate
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-400 mb-2">
                    {stats.summary?.criticalAlerts || 0}
                  </div>
                  <div className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Critical Alerts
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Avg SOx
                  </span>
                  <span className="font-semibold text-blue-400">
                    {stats.today.avgSox?.toFixed(1)} mg/Nm³
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Avg NOx
                  </span>
                  <span className="font-semibold text-green-400">
                    {stats.today.avgNox?.toFixed(1)} mg/Nm³
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Avg CO₂
                  </span>
                  <span className="font-semibold text-yellow-400">
                    {stats.today.avgCo2?.toFixed(1)} kg/MWh
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Alerts */}
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
            Recent Alerts ({alerts.length})
          </h3>
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border transition-all duration-200 hover:bg-white/5 ${
                  theme === 'dark' ? 'border-white/10' : 'border-white/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        getStatusColor(alert.severity)
                      }`}>
                        {alert.severity}
                      </span>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {alert.parameter}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {alert.message}
                    </p>
                    <p className={`text-xs mt-2 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {alert.location} • {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className={`w-12 h-12 mx-auto mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
            }`} />
            <p className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              No recent alerts - All parameters within limits
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EmissionsPage;