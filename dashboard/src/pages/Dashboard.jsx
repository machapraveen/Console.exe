// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotifications } from '../services/api';
import NotificationList from '../components/NotificationList';
import QuickSetup from '../components/QuickSetup';

const Dashboard = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data.notifications);
      } catch (err) {
        setError('Failed to load notifications');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </div>

      {!user?.apiKey && (
        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-700">
          <p>You need to complete your setup to start receiving notifications.</p>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Notifications</h2>
            
            {loading ? (
              <div className="py-10 text-center">
                <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : error ? (
              <div className="text-red-600 py-4">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="text-gray-500 py-8 text-center">
                <p>No notifications yet. When errors occur, they'll appear here.</p>
              </div>
            ) : (
              <NotificationList notifications={notifications} />
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <QuickSetup apiKey={user?.apiKey} />
          
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Stats</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Last 24h</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {notifications.filter(n => 
                    new Date(n.createdAt) > new Date(Date.now() - 86400000)
                  ).length}
                </p>
              </div>
              
              <div className="border rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500">Rate-Limited</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {notifications.filter(n => n.status === 'rate-limited').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;