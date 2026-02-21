import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const LoadPage: React.FC = () => {
  const [loadData, setLoadData] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchLoadData();
    const interval = setInterval(fetchLoadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLoadData = async () => {
    try {
      const [dataResponse, forecastResponse, statsResponse, alertsResponse] = await Promise.all([
        axios.get('/load/latest'),
        axios.get('/load/forecast'),
        axios.get('/load/stats'),
        axios.get('/load/alerts?limit=5')
      ]);

      setLoadData(dataResponse.data);
      setForecast(forecastResponse.data);
      setStats(statsResponse.data);
      setAlerts(alertsResponse.data);
    } catch (error) {
      console.error('Error fetching load data:', error);
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

  const getStatusColor = (loadFactor: number) => {
    if (loadFactor > 95) return 'text-red-400 bg-red-500/20';
    if (loadFactor > 85) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const getStatusText = (loadFactor: number) => {
    if (loadFactor > 95) return 'Critical Load';
    if (loadFactor > 85) return 'High Demand';
    return 'Normal Load';
  };

  const currentLoadFactor = loadData ? (loadData.demand.current / loadData.demand.capacity) * 100 : 0;

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
            Load Forecasting
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            AI-powered demand prediction and grid management
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
            getStatusColor(currentLoadFactor)
          }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              currentLoadFactor > 95 ? 'bg-red-400' :
              currentLoadFactor > 85 ? 'bg-yellow-400' :
              'bg-green-400'
            }`}></div>
            <span className={`text-sm font-medium ${
              currentLoadFactor > 95 ? 'text-red-400' :
              currentLoadFactor > 85 ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              {getStatusText(currentLoadFactor)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Current Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
              : 'bg-white/20 border-white/30 hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${
              currentLoadFactor > 95 ? 'bg-red-500/20 text-red-400' :
              'bg-green-500/20 text-green-400'
            }`}>
              LIVE
            </span>
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Current Demand
          </h3>
          <p className="text-3xl font-bold text-blue-400 mb-1">
            {loadData?.demand.current || 0} MW
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            of {loadData?.demand.capacity || 0} MW capacity
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
              : 'bg-white/20 border-white/30 hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Generation
          </h3>
          <p className="text-3xl font-bold text-green-400 mb-1">
            {loadData?.generation.actual || 0} MW
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {loadData?.generation.efficiency || 0}% efficiency
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
              : 'bg-white/20 border-white/30 hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/20">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Load Factor
          </h3>
          <p className={`text-3xl font-bold mb-1 ${
            currentLoadFactor > 95 ? 'text-red-400' :
            currentLoadFactor > 85 ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {currentLoadFactor.toFixed(1)}%
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            of total capacity
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
              : 'bg-white/20 border-white/30 hover:border-white/40'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <AlertTriangle className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className={`text-lg font-semibold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Peak Forecast
          </h3>
          <p className="text-3xl font-bold text-purple-400 mb-1">
            {forecast?.forecast.peakLoad || 0} MW
          </p>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            at {forecast?.forecast.peakHour || 'N/A'}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demand vs Generation */}
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
              Demand vs Generation
            </h3>
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          
          {forecast?.historical ? (
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={forecast.historical}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Line 
                  type="monotone" 
                  dataKey="demand" 
                  stroke="#F59E0B" 
                  strokeWidth={3} 
                  name="Demand"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="generation" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  name="Generation"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* 24-Hour Forecast */}
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
              24-Hour Demand Forecast
            </h3>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          
          {forecast?.forecast.next24Hours ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecast.forecast.next24Hours.map((value: number, index: number) => ({
                hour: index,
                demand: value,
                capacity: 2100
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Area 
                  type="monotone" 
                  dataKey="demand" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="capacity" 
                  stroke="#EF4444" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </div>

      {/* Forecast Details & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Forecast Analysis */}
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
              AI Forecast Analysis
            </h3>
            <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
              Gemini AI
            </div>
          </div>
          
          {forecast ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Confidence Level
                  </span>
                  <span className="text-green-400 font-semibold">
                    {(forecast.forecast.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 bg-green-400 rounded-full transition-all duration-500"
                    style={{ width: `${forecast.forecast.confidence * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Average Demand
                  </div>
                  <div className="font-semibold text-blue-400">
                    {forecast.trends.averageDemand.toFixed(0)} MW
                  </div>
                </div>
                <div>
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Peak Demand
                  </div>
                  <div className="font-semibold text-yellow-400">
                    {forecast.trends.peakDemand} MW
                  </div>
                </div>
                <div>
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Min Demand
                  </div>
                  <div className="font-semibold text-green-400">
                    {forecast.trends.minDemand} MW
                  </div>
                </div>
                <div>
                  <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Peak Time
                  </div>
                  <div className="font-semibold text-purple-400">
                    {forecast.forecast.peakHour}
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-blue-400 font-semibold mb-2">Next 6 Hours</h4>
                <div className="grid grid-cols-6 gap-2 text-xs">
                  {forecast.forecast.next6Hours?.map((demand: number, index: number) => (
                    <div key={index} className="text-center">
                      <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        +{index + 1}h
                      </div>
                      <div className="font-semibold text-white">
                        {demand} MW
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* Load Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
              Load Alerts ({alerts.length})
            </h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          
          {alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
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
                          alert.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          alert.severity === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {alert.type}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs">
                        <span className={`${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          Load: {alert.loadFactor}%
                        </span>
                        <span className={`${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className={`w-12 h-12 mx-auto mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
              }`} />
              <p className={`${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                No load alerts - System operating normally
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LoadPage;