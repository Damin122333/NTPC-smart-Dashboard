import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building, Shield, Bell, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    notifications: {
      email: user?.notifications?.email || true,
      sms: user?.notifications?.sms || true,
      whatsapp: user?.notifications?.whatsapp || false
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfile(formData);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (type: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: value
      }
    }));
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
            Profile Settings
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Manage your account information and notification preferences
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
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
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/20">
                <User className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Personal Information
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border backdrop-blur-xl ${
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-white/10 text-white placeholder-gray-400'
                        : 'bg-white/50 border-white/30 text-gray-800 placeholder-gray-500'
                    } focus:outline-none focus:border-blue-500/50`}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border backdrop-blur-xl opacity-60 cursor-not-allowed ${
                      theme === 'dark'
                        ? 'bg-gray-900/30 border-white/10 text-gray-400'
                        : 'bg-white/30 border-white/20 text-gray-600'
                    }`}
                  />
                </div>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                }`}>
                  Email cannot be changed. Contact administrator if needed.
                </p>
              </div>

              {/* Phone */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border backdrop-blur-xl ${
                      theme === 'dark'
                        ? 'bg-gray-900/50 border-white/10 text-white placeholder-gray-400'
                        : 'bg-white/50 border-white/30 text-gray-800 placeholder-gray-500'
                    } focus:outline-none focus:border-blue-500/50`}
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Account Details & Notifications */}
        <div className="space-y-6">
          {/* Account Details */}
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
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Account Details
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Role
                  </span>
                </div>
                <span className={`text-sm font-semibold ${
                  user?.role === 'Admin' ? 'text-red-400' :
                  user?.role === 'Engineer' ? 'text-blue-400' :
                  'text-green-400'
                }`}>
                  {user?.role}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Department
                  </span>
                </div>
                <span className="text-sm font-semibold text-purple-400">
                  {user?.department}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-yellow-400" />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-400">
                  Active
                </span>
              </div>
            </div>
          </motion.div>

          {/* Notification Preferences */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl rounded-2xl p-6 border ${
              theme === 'dark'
                ? 'bg-gray-900/20 border-white/10'
                : 'bg-white/20 border-white/30'
            }`}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Bell className="w-6 h-6 text-yellow-400" />
              </div>
              <h2 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Notifications
              </h2>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'Email Notifications', icon: Mail, color: 'text-blue-400' },
                { key: 'sms', label: 'SMS Alerts', icon: Phone, color: 'text-green-400' },
                { key: 'whatsapp', label: 'WhatsApp Messages', icon: Phone, color: 'text-yellow-400' }
              ].map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {label}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(key, !formData.notifications[key as keyof typeof formData.notifications])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.notifications[key as keyof typeof formData.notifications]
                        ? 'bg-blue-500'
                        : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.notifications[key as keyof typeof formData.notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className={`mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl ${
              theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
            }`}>
              <p className="text-xs">
                <strong>Note:</strong> Critical system alerts will always be sent regardless of these preferences to ensure safety compliance.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;