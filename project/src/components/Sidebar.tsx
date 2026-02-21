import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Activity, 
  Wrench, 
  Zap, 
  Trash2, 
  Bell, 
  User,
  Factory,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard', adminOnly: false },
  { path: '/emissions', icon: Activity, label: 'Emissions', adminOnly: false },
  { path: '/maintenance', icon: Wrench, label: 'Maintenance', adminOnly: false },
  { path: '/load', icon: Zap, label: 'Load Forecast', adminOnly: false },
  { path: '/ash', icon: Trash2, label: 'Ash Management', adminOnly: false },
  { path: '/notifications', icon: Bell, label: 'Notifications', adminOnly: true },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { theme } = useTheme();

  const filteredItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div className={`fixed left-0 top-0 h-full w-64 backdrop-blur-xl border-r transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gray-900/20 border-white/10'
        : 'bg-white/20 border-white/30'
    }`}>
      <div className="p-6">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3 mb-8"
        >
          <div className={`p-2 rounded-xl ${
            theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-500/30'
          }`}>
            <Factory className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              NTPC Smart
            </h1>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Dashboard
            </p>
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="space-y-2">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? theme === 'dark'
                        ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10'
                        : 'bg-blue-500/30 text-blue-700 shadow-lg shadow-blue-500/20'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                        : 'text-gray-600 hover:bg-white/30 hover:text-gray-800'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* User Profile Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <Link
            to="/profile"
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              location.pathname === '/profile'
                ? theme === 'dark'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-500/30 text-blue-700'
                : theme === 'dark'
                  ? 'text-gray-300 hover:bg-white/10 hover:text-white'
                  : 'text-gray-600 hover:bg-white/30 hover:text-gray-800'
            }`}
          >
            <User className="w-5 h-5" />
            <div>
              <p className="font-medium text-sm">{user?.name}</p>
              <p className={`text-xs ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {user?.role}
              </p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Sidebar;