import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Send, Users, MessageSquare, Smartphone, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const NotificationsPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'sms' | 'whatsapp' | 'both'>('both');
  const [urgent, setUrgent] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, templatesResponse, statsResponse] = await Promise.all([
        axios.get('/auth/users'), // This endpoint would need to be created
        axios.get('/notifications/templates'),
        axios.get('/notifications/stats')
      ]);

      // Mock users data since we don't have the endpoint
      const mockUsers = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@ntpc.co.in',
          role: 'Engineer',
          department: 'Operations',
          phone: '+918595841676',
          notifications: { sms: true, whatsapp: true, email: true }
        },
        {
          _id: '2',
          name: 'Jane Smith',
          email: 'jane@ntpc.co.in',
          role: 'Admin',
          department: 'Management',
          phone: '+919876543211',
          notifications: { sms: true, whatsapp: false, email: true }
        },
        {
          _id: '3',
          name: 'Mike Johnson',
          email: 'mike@ntpc.co.in',
          role: 'Engineer',
          department: 'Maintenance',
          phone: '+919876543212',
          notifications: { sms: false, whatsapp: true, email: true }
        }
      ];

      setUsers(mockUsers);
      setTemplates(templatesResponse.data.templates);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setSending(true);
    try {
      let endpoint = '';
      if (messageType === 'sms') {
        endpoint = '/notifications/send-sms';
      } else if (messageType === 'whatsapp') {
        endpoint = '/notifications/send-whatsapp';
      } else {
        endpoint = '/notifications/broadcast';
      }

      const response = await axios.post(endpoint, {
        userIds: selectedUsers,
        message,
        urgent,
        type: messageType
      });

      toast.success(`Notification sent to ${response.data.summary.successful} users`);
      setMessage('');
      setSelectedUsers([]);
      setUrgent(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      const response = await axios.post('/notifications/broadcast', {
        message,
        type: messageType,
        urgent
      });

      toast.success(`Broadcast sent to ${response.data.summary.successful} users`);
      setMessage('');
      setUrgent(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const handleTestNotification = async () => {
    const testPhone = '+918595841676'; // Demo phone number
    setSending(true);
    try {
      const response = await axios.post('/notifications/test', {
        phone: testPhone,
        type: messageType === 'both' ? 'sms' : messageType
      });

      if (response.data.result.success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error('Test notification failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Test failed');
    } finally {
      setSending(false);
    }
  };

  const useTemplate = (template: any) => {
    setMessage(template.template);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

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
            Notification Center
          </h1>
          <p className={`${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Send SMS and WhatsApp alerts to plant personnel
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleTestNotification}
            disabled={sending}
            className={`px-4 py-2 rounded-xl border transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-500/30 border-blue-500/50 text-blue-700 hover:bg-blue-500/40'
            }`}
          >
            Test System
          </button>
        </div>
      </motion.div>

      {/* Statistics */}
      {stats && (
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
                <Send className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Total Sent
            </h3>
            <p className="text-3xl font-bold text-blue-400 mb-1">
              {stats.totalSent}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Last {stats.period}
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
                <MessageSquare className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              SMS Count
            </h3>
            <p className="text-3xl font-bold text-green-400 mb-1">
              {stats.smsCount}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Text messages
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
                <Smartphone className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              WhatsApp Count
            </h3>
            <p className="text-3xl font-bold text-yellow-400 mb-1">
              {stats.whatsappCount}
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              WhatsApp messages
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
                <Users className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className={`text-lg font-semibold mb-1 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Success Rate
            </h3>
            <p className="text-3xl font-bold text-purple-400 mb-1">
              {stats.successRate}%
            </p>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Delivery success
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Composer */}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Compose Message
              </h3>
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            
            <div className="space-y-4">
              {/* Message Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Message Type
                </label>
                <div className="flex space-x-4">
                  {[
                    { value: 'sms', label: 'SMS Only', icon: MessageSquare },
                    { value: 'whatsapp', label: 'WhatsApp Only', icon: Smartphone },
                    { value: 'both', label: 'Both', icon: Send }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMessageType(value as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                        messageType === value
                          ? theme === 'dark'
                            ? 'bg-blue-500/20 border-blue-500/40 text-blue-400'
                            : 'bg-blue-500/30 border-blue-500/50 text-blue-700'
                          : theme === 'dark'
                            ? 'bg-gray-700/20 border-white/10 text-gray-300 hover:bg-gray-700/30'
                            : 'bg-gray-200/30 border-gray-300/30 text-gray-700 hover:bg-gray-200/40'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgent Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setUrgent(!urgent)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
                    urgent
                      ? 'bg-red-500/20 border-red-500/40 text-red-400'
                      : theme === 'dark'
                        ? 'bg-gray-700/20 border-white/10 text-gray-300 hover:bg-gray-700/30'
                        : 'bg-gray-200/30 border-gray-300/30 text-gray-700 hover:bg-gray-200/40'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm">Mark as Urgent</span>
                </button>
              </div>

              {/* Message Input */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Message Content
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={6}
                  className={`w-full px-4 py-3 rounded-xl border backdrop-blur-xl resize-none ${
                    theme === 'dark'
                      ? 'bg-gray-900/50 border-white/10 text-white placeholder-gray-400'
                      : 'bg-white/50 border-white/30 text-gray-800 placeholder-gray-500'
                  } focus:outline-none focus:border-blue-500/50`}
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {message.length}/160 characters
                  </span>
                  {urgent && (
                    <span className="text-xs text-red-400 font-semibold">
                      🚨 URGENT MESSAGE
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={handleSendNotification}
                  disabled={sending || !message.trim() || selectedUsers.length === 0}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    sending || !message.trim() || selectedUsers.length === 0
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40'
                  }`}
                >
                  {sending ? <LoadingSpinner /> : <Send className="w-4 h-4" />}
                  <span>Send to Selected ({selectedUsers.length})</span>
                </button>
                
                <button
                  onClick={handleBroadcast}
                  disabled={sending || !message.trim()}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    sending || !message.trim()
                      ? 'bg-gray-500/20 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40'
                  }`}
                >
                  {sending ? <LoadingSpinner /> : <Users className="w-4 h-4" />}
                  <span>Broadcast to All</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* User Selection & Templates */}
        <div className="space-y-6">
          {/* User Selection */}
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
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Select Recipients
              </h3>
              <Users className="w-5 h-5 text-green-400" />
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user._id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedUsers.includes(user._id)
                      ? theme === 'dark'
                        ? 'bg-blue-500/20 border-blue-500/40'
                        : 'bg-blue-500/30 border-blue-500/50'
                      : theme === 'dark'
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                  onClick={() => {
                    if (selectedUsers.includes(user._id)) {
                      setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                    } else {
                      setSelectedUsers([...selectedUsers, user._id]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {user.name}
                      </div>
                      <div className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {user.role} • {user.department}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {user.notifications.sms && (
                        <MessageSquare className="w-3 h-3 text-green-400" />
                      )}
                      {user.notifications.whatsapp && (
                        <Smartphone className="w-3 h-3 text-yellow-400" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  if (selectedUsers.length === users.length) {
                    setSelectedUsers([]);
                  } else {
                    setSelectedUsers(users.map(u => u._id));
                  }
                }}
                className={`text-sm ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                } transition-colors`}
              >
                {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </motion.div>

          {/* Message Templates */}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Quick Templates
              </h3>
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300'
                      : 'bg-white/10 border-white/20 hover:bg-white/20 text-gray-700'
                  }`}
                >
                  <div className="font-medium text-sm">{template.name}</div>
                  <div className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    {template.category}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;