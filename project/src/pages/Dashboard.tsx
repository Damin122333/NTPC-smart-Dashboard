import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  Gauge,
  Factory,
  Wrench,
  Trash2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface DashboardMetrics {
  emissions: {
    status: string;
    criticalParameters: any[];
    compliance: number;
  };
  maintenance: {
    criticalEquipment: number;
    totalEquipment: number;
    highRiskEquipment: number;
  };
  load: {
    current: number;
    capacity: number;
    efficiency: number;
    loadFactor: number;
  };
  ash: {
    flyAshLevel: number;
    bottomAshLevel: number;
    utilizationRate: number;
    status: string;
  };
}

const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewResponse, realtimeResponse] = await Promise.all([
          axios.get('/dashboard/overview'),
          axios.get('/dashboard/realtime?hours=6')
        ]);

        setMetrics(overviewResponse.data.metrics);
        setRealtimeData(realtimeResponse.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

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
      case 'Warning': return 'text-yellow-400 bg-yellow-500/20';
      case 'Normal': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  const StatusCard: React.FC<{ 
    title: string; 
    value: string; 
    status: string; 
    icon: React.ReactNode;
    subtitle?: string;
  }> = ({ title, value, status, icon, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`backdrop-blur-xl rounded-2xl p-6 border transition-all duration-300 ${
        theme === 'dark'
          ? 'bg-gray-900/20 border-white/10 hover:border-white/20'
          : 'bg-white/20 border-white/30 hover:border-white/40'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${
          status === 'Critical' ? 'bg-red-500/20' :
          status === 'Warning' ? 'bg-yellow-500/20' :
          'bg-blue-500/20'
        }`}>
          {icon}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>
      
      <h3 className={`text-lg font-semibold mb-1 ${
        theme === 'dark' ? 'text-white' : 'text-gray-800'
      }`}>
        {title}
      </h3>
      
      <p className={`text-2xl font-bold mb-1 ${
        status === 'Critical' ? 'text-red-400' :
        status === 'Warning' ? 'text-yellow-400' :
        'text-green-400'
      }`}>
        {value}
      </p>
      
      {subtitle && (
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {subtitle}
        </p>
      )}
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
            Power Plant Overview
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Real-time monitoring and analytics dashboard
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className={`text-sm ${
            theme === 'dark' ? 'text-green-400' : 'text-green-600'
          }`}>
            Live Data
          </span>
        </div>
      </motion.div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard
          title="Emissions"
          value={`${metrics?.emissions.compliance.toFixed(1)}%`}
          status={metrics?.emissions.status || 'Normal'}
          icon={<Activity className="w-6 h-6 text-blue-400" />}
          subtitle="Compliance Rate"
        />
        
        <StatusCard
          title="Load Factor"
          value={`${metrics?.load.loadFactor.toFixed(1)}%`}
          status={metrics?.load.loadFactor > 95 ? 'Critical' : metrics?.load.loadFactor > 85 ? 'Warning' : 'Normal'}
          icon={<Zap className="w-6 h-6 text-yellow-400" />}
          subtitle={`${metrics?.load.current} / ${metrics?.load.capacity} MW`}
        />
        
        <StatusCard
          title="Critical Equipment"
          value={`${metrics?.maintenance.criticalEquipment}`}
          status={metrics?.maintenance.criticalEquipment > 0 ? 'Critical' : 'Normal'}
          icon={<Wrench className="w-6 h-6 text-red-400" />}
          subtitle={`${metrics?.maintenance.totalEquipment} Total Units`}
        />
        
        <StatusCard
          title="Ash Storage"
          value={`${metrics?.ash.flyAshLevel.toFixed(1)}%`}
          status={metrics?.ash.status || 'Normal'}
          icon={<Trash2 className="w-6 h-6 text-purple-400" />}
          subtitle="Fly Ash Level"
        />
      </div>

      {/* Charts Grid */}
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
              Emission Levels
            </h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          
          {realtimeData?.emissions ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realtimeData.emissions.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Line type="monotone" dataKey="sox" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="nox" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pm" stroke="#F59E0B" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* Load Demand */}
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
              Load Demand vs Generation
            </h3>
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          
          {realtimeData?.load ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={realtimeData.load.slice(-20)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Line type="monotone" dataKey="demand" stroke="#F59E0B" strokeWidth={2} name="Demand" />
                <Line type="monotone" dataKey="generation" stroke="#10B981" strokeWidth={2} name="Generation" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* Equipment Status */}
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
              Equipment Status
            </h3>
            <Wrench className="w-5 h-5 text-red-400" />
          </div>
          
          {realtimeData?.maintenanceAlerts ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realtimeData.maintenanceAlerts}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="equipment" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                />
                <YAxis stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <Bar dataKey="temperature" fill="#3B82F6" />
                <Bar dataKey="vibration" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <LoadingSpinner />
            </div>
          )}
        </motion.div>

        {/* System Health Overview */}
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
              System Health
            </h3>
            <Gauge className="w-5 h-5 text-green-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {metrics?.emissions.compliance.toFixed(0)}%
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Environmental Compliance
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {metrics?.load.efficiency.toFixed(0)}%
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Generation Efficiency
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">
                {metrics?.ash.utilizationRate}%
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Ash Utilization
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {metrics?.maintenance.totalEquipment - metrics?.maintenance.criticalEquipment}
              </div>
              <div className={`text-sm ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Healthy Equipment
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`backdrop-blur-xl rounded-2xl p-6 border ${
          theme === 'dark'
            ? 'bg-gray-900/20 border-white/10'
            : 'bg-white/20 border-white/30'
        }`}
      >
        <h3 className={`text-xl font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-800'
        }`}>
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
            theme === 'dark'
              ? 'bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20'
              : 'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30'
          }`}>
            <Activity className="w-6 h-6 text-blue-400 mb-2" />
            <div className="text-sm font-semibold text-blue-400">View Emissions</div>
          </button>
          
          <button className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
            theme === 'dark'
              ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
              : 'bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30'
          }`}>
            <Zap className="w-6 h-6 text-yellow-400 mb-2" />
            <div className="text-sm font-semibold text-yellow-400">Load Forecast</div>
          </button>
          
          <button className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
            theme === 'dark'
              ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
              : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/30'
          }`}>
            <Wrench className="w-6 h-6 text-red-400 mb-2" />
            <div className="text-sm font-semibold text-red-400">Maintenance</div>
          </button>
          
          <button className={`p-4 rounded-xl text-left transition-all duration-200 hover:scale-105 ${
            theme === 'dark'
              ? 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20'
              : 'bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30'
          }`}>
            <Trash2 className="w-6 h-6 text-purple-400 mb-2" />
            <div className="text-sm font-semibold text-purple-400">Ash Management</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;