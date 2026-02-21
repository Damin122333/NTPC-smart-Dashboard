import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Sun, 
  LogOut, 
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { createPortal } from 'react-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { alerts, unreadCount } = useNotifications();
  const [showAlerts, setShowAlerts] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'Critical':
      case 'High':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'Medium':
      case 'Warning':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <header className={`backdrop-blur-xl border-b p-4 transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gray-900/20 border-white/10'
        : 'bg-white/20 border-white/30'
    }`}>
      <div className="flex items-center justify-between">
        {/* Current Time & Status */}
        <div className="flex items-center space-x-6">
          <div className={`text-sm ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            <p className="font-medium">
              {currentTime.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-lg font-mono">
              {currentTime.toLocaleTimeString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              System Online
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          {/* Alerts */}
          <div className="">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAlerts(!showAlerts)}
              className={`p-2 rounded-xl transition-all duration-200 relative ${
                theme === 'dark'
                  ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                  : 'hover:bg-white/30 text-gray-600 hover:text-gray-800'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>

            {/* {showAlerts && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`absolute right-0 mt-2 w-80 backdrop-blur-xl rounded-2xl border shadow-xl z-50 ${
                  theme === 'dark'
                    ? 'bg-gray-900/90 border-white/10'
                    : 'bg-white/90 border-white/30'
                }`}
              >
                <div className="p-4 border-b border-white/10">
                  <h3 className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    Recent Alerts ({alerts.length})
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert, index) => (
                      <div 
                        key={index} 
                        className={`p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {getAlertIcon(alert.severity)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {alert.message}
                            </p>
                            <p className="text-xs opacity-70">
                              {alert.type} • {new Date(alert.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No recent alerts</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )} */}
           

{showAlerts &&
  createPortal(
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`fixed top-16 right-4 w-80 backdrop-blur-xl rounded-2xl border shadow-xl z-[9999] ${
        theme === 'dark'
          ? 'bg-gray-900/90 border-white/10'
          : 'bg-white/90 border-white/30'
      }`}
    >
      <div className="p-4 border-b border-white/10">
        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
          Recent Alerts ({alerts.length})
        </h3>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {alerts.length > 0 ? (
          alerts.slice(0, 5).map((alert, index) => (
            <div 
              key={index} 
              className={`p-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getAlertIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{alert.message}</p>
                  <p className="text-xs opacity-70">
                    {alert.type} • {new Date(alert.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent alerts</p>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  )
}


          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all duration-200 ${
              theme === 'dark'
                ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                : 'hover:bg-white/30 text-gray-600 hover:text-gray-800'
            }`}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </motion.button>

          {/* User Menu */}
          <div className={`flex items-center space-x-3 px-4 py-2 rounded-xl ${
            theme === 'dark' ? 'bg-white/10' : 'bg-white/30'
          }`}>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                {user?.name}
              </p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {user?.role}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={logout}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                theme === 'dark'
                  ? 'hover:bg-red-500/20 text-gray-300 hover:text-red-400'
                  : 'hover:bg-red-500/20 text-gray-600 hover:text-red-600'
              }`}
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;