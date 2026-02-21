import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, TrendingUp, AlertTriangle, Recycle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const AshPage: React.FC = () => {
  const [ashData, setAshData] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [utilizationStats, setUtilizationStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    fetchAshData();
    const interval = setInterval(fetchAshData, 45000); // Refresh every 45 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAshData = async () => {
    try {
      const [dataResponse, predictionsResponse, statsResponse, alertsResponse, recommendationsResponse] = await Promise.all([
        axios.get('/ash/latest'),
        axios.get('/ash/predictions'),
        axios.get('/ash/utilization-stats'),
        axios.get('/ash/alerts?limit=5'),
        axios.get('/ash/disposal-recommendations')
      ]);

      setAshData(dataResponse.data);
      setPredictions(predictionsResponse.data);
      setUtilizationStats(statsResponse.data);
      setAlerts(alertsResponse.data);
      setRecommendations(recommendationsResponse.data);
    } catch (error) {
      console.error('Error fetching ash data:', error);
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return 'text-red-400 bg-red-500/20';
      case 'High Storage': return 'text-yellow-400 bg-yellow-500/20';
      case 'Normal': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const StorageCard: React.FC<{ 
    title: string; 
    current: number; 
    capacity: number; 
    unit: string;
    color: string;
  }> = ({ title, current, capacity, unit, color }) => {
    const percentage = (current / capacity) * 100;
    
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
            {title}
          </h3>
          <div className={`p-2 rounded-xl`} style={{ backgroundColor: `${color}20` }}>
            <Trash2 className="w-5 h-5" style={{ color }} />
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold" style={{ color }}>
                {current.toLocaleString()}
              </span>
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {unit}
              </span>
            </div>
            <div className={`text-xs ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
            }`}>
              Capacity: {capacity.toLocaleString()} {unit}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500"
              style={{ 
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: percentage > 90 ? '#EF4444' : percentage > 75 ? '#F59E0B' : color
              }}
            />
          </div>
          
          <div className="flex justify-between text-sm">
            <span className={`${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {percentage.toFixed(1)}% full
            </span>
            {percentage > 85 && (
              <span className="text-red-400 font-semibold text-xs">
                HIGH LEVEL
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const utilizationData = ashData ? [
    { name: 'Cement', value: ashData.utilization.cement, color: '#3B82F6' },
    { name: 'Bricks', value: ashData.utilization.bricks, color: '#10B981' },
    { name: 'Roads', value: ashData.utilization.roads, color: '#F59E0B' },
    { name: 'Embankments', value: ashData.utilization.embankments, color: '#EF4444' },
  ] : [];

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
            Ash Management
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Intelligent ash disposal and utilization optimization
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl ${
            ashData ? getStatusColor(ashData.status) : 'bg-gray-500/20 text-gray-400'
          }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${
              ashData?.status === 'Critical' ? 'bg-red-400' :
              ashData?.status === 'High Storage' ? 'bg-yellow-400' :
              'bg-green-400'
            }`}></div>
            <span className="text-sm font-medium">
              {ashData?.status || 'Unknown'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Storage Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ashData && (
          <>
            <StorageCard
              title="Fly Ash Storage"
              current={ashData.flyAsh.storage.current}
              capacity={ashData.flyAsh.storage.capacity}
              unit="tonnes"
              color="#3B82F6"
            />
            <StorageCard
              title="Bottom Ash Storage"
              current={ashData.bottomAsh.storage.current}
              capacity={ashData.bottomAsh.storage.capacity}
              unit="tonnes"
              color="#10B981"
            />
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
                  Utilization Rate
                </h3>
                <div className="p-2 rounded-xl bg-purple-500/20">
                  <Recycle className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {ashData.utilizationRate}%
                </div>
                <div className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total ash utilized
                </div>
                <div className="mt-4 text-xs">
                  <div className="flex justify-between">
                    <span>Daily Production:</span>
                    <span className="font-semibold">
                      {(ashData.flyAsh.quantity + ashData.bottomAsh.quantity).toLocaleString()} tonnes
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Daily Utilization:</span>
                    <span className="font-semibold text-purple-400">
                      {ashData.utilization.total.toLocaleString()} tonnes
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilization Breakdown */}
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
              Utilization Breakdown
            </h3>
            <Recycle className="w-5 h-5 text-purple-400" />
          </div>
          
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Pie
                  data={utilizationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {utilizationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex-1 space-y-3">
              {utilizationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {item.name}
                    </span>
                  </div>
                  <span className="font-semibold" style={{ color: item.color }}>
                    {item.value.toLocaleString()}t
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Utilization Trends */}
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
              Utilization Trends
            </h3>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          
          {utilizationStats?.utilizationTrends ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={utilizationStats.utilizationTrends.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="_id" 
                  tickFormatter={(value) => format(new Date(value), 'MM/dd')}
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Line 
                  type="monotone" 
                  dataKey="utilizationRate" 
                  stroke="#8B5CF6" 
                  strokeWidth={3}
                  dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Predictions & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Predictions */}
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
              AI Disposal Predictions
            </h3>
            <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
              Gemini AI
            </div>
          </div>
          
          {predictions ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Disposal Needed
                  </span>
                  <span className={`font-semibold ${
                    predictions.prediction.disposalNeeded ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {predictions.prediction.disposalNeeded ? 'YES' : 'NO'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Days to Capacity
                  </span>
                  <span className="font-semibold text-yellow-400">
                    {predictions.prediction.daysToCapacity} days
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                    Market Demand
                  </span>
                  <span className={`font-semibold ${
                    predictions.prediction.marketDemand === 'High' ? 'text-green-400' :
                    predictions.prediction.marketDemand === 'Medium' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {predictions.prediction.marketDemand}
                  </span>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Recommended Utilization:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {predictions.prediction.recommendedUtilization?.map((item: string, index: number) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl">
                <h4 className="text-blue-400 font-semibold mb-2">Quality Assessment</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Grade
                    </div>
                    <div className="font-semibold text-green-400">
                      {ashData?.quality.grade}
                    </div>
                  </div>
                  <div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Fineness
                    </div>
                    <div className="font-semibold text-blue-400">
                      {ashData?.quality.fineness} m²/kg
                    </div>
                  </div>
                  <div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      LOI
                    </div>
                    <div className="font-semibold text-yellow-400">
                      {ashData?.quality.loi}%
                    </div>
                  </div>
                  <div>
                    <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Moisture
                    </div>
                    <div className="font-semibold text-purple-400">
                      {ashData?.quality.moisture}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* Disposal Recommendations */}
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
              Disposal Recommendations
            </h3>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
          </div>
          
          {recommendations ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {recommendations.currentStatus.flyAshLevel}%
                  </div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Fly Ash Level
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {recommendations.currentStatus.bottomAshLevel}%
                  </div>
                  <div className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Bottom Ash Level
                  </div>
                </div>
              </div>
              
              {recommendations.recommendations?.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.recommendations.map((rec: any, index: number) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border ${
                        rec.priority === 'Critical' ? 'bg-red-500/10 border-red-500/20' :
                        rec.priority === 'High' ? 'bg-yellow-500/10 border-yellow-500/20' :
                        'bg-blue-500/10 border-blue-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${
                          rec.priority === 'Critical' ? 'text-red-400' :
                          rec.priority === 'High' ? 'text-yellow-400' :
                          'text-blue-400'
                        }`}>
                          {rec.type}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          rec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                          rec.priority === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {rec.priority}
                        </span>
                      </div>
                      
                      <p className={`text-sm mb-3 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {rec.message}
                      </p>
                      
                      <div className="space-y-1">
                        {rec.actions?.map((action: string, actionIndex: number) => (
                          <div key={actionIndex} className={`text-xs flex items-center space-x-2 ${
                            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span className="w-1 h-1 bg-current rounded-full"></span>
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Recycle className={`w-12 h-12 mx-auto mb-4 ${
                    theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <p className={`${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    No immediate disposal actions required
                  </p>
                </div>
              )}
              
              {recommendations.urgentActions > 0 && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-semibold">
                      {recommendations.urgentActions} urgent action(s) required
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AshPage;