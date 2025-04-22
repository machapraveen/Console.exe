import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword, regenerateApiKey } from '../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, setUser } = useAuth();
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [settingsData, setSettingsData] = useState({
    rateLimit: user?.settings?.rateLimit || 5,
    callEnabled: user?.settings?.callEnabled || false,
    retryEnabled: user?.settings?.retryEnabled || true,
    retryDelay: user?.settings?.retryDelay || 5
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState({
    profile: false,
    settings: false,
    password: false,
    apiKey: false
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSettingsChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSettingsData({
      ...settingsData,
      [e.target.name]: value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading({ ...loading, profile: true });
      const response = await updateProfile({
        name: profileData.name,
        phone: profileData.phone
      });
      setUser({
        ...user,
        name: response.user.name,
        phone: response.user.phone
      });
      toast.success('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading({ ...loading, settings: true });
      const response = await updateProfile({
        settings: {
          rateLimit: parseInt(settingsData.rateLimit),
          callEnabled: settingsData.callEnabled,
          retryEnabled: settingsData.retryEnabled,
          retryDelay: parseInt(settingsData.retryDelay)
        }
      });
      setUser({
        ...user,
        settings: response.user.settings
      });
      toast.success('Settings updated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setLoading({ ...loading, settings: false });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading({ ...loading, password: true });
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password changed successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  const handleRegenerateApiKey = async () => {
    if (!window.confirm('Are you sure you want to regenerate your API key? This will invalidate your current key and require updating all your applications.')) {
      return;
    }

    try {
      setLoading({ ...loading, apiKey: true });
      const response = await regenerateApiKey();
      setUser({
        ...user,
        apiKey: response.apiKey
      });
      toast.success('API key regenerated successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate API key');
      toast.error(err.response?.data?.error || 'Failed to regenerate API key');
    } finally {
      setLoading({ ...loading, apiKey: false });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1">
              <input
                id="name"
                name="name"
                type="text"
                value={profileData.name}
                onChange={handleProfileChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="mt-1">
              <input
                id="phone"
                name="phone"
                type="tel"
                value={profileData.phone}
                onChange={handleProfileChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                International format required (e.g., +1234567890)
              </p>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading.profile}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading.profile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* API Key Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Key</h2>
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                Your API Key
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={user?.apiKey || ''}
                  readOnly
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {showApiKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Use this key to authenticate API requests from your applications.
          </p>
        </div>
        <button
          onClick={handleRegenerateApiKey}
          disabled={loading.apiKey}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading.apiKey ? 'Regenerating...' : 'Regenerate API Key'}
        </button>
      </div>

      {/* Notification Settings */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div>
            <label htmlFor="rateLimit" className="block text-sm font-medium text-gray-700">
              Rate Limit (minutes)
            </label>
            <div className="mt-1">
              <input
                id="rateLimit"
                name="rateLimit"
                type="number"
                min="1"
                max="60"
                value={settingsData.rateLimit}
                onChange={handleSettingsChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum time between notifications for similar errors (1-60 minutes)
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="callEnabled"
              name="callEnabled"
              type="checkbox"
              checked={settingsData.callEnabled}
              onChange={handleSettingsChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="callEnabled" className="ml-2 block text-sm text-gray-900">
              Enable phone calls for urgent notifications
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="retryEnabled"
              name="retryEnabled"
              type="checkbox"
              checked={settingsData.retryEnabled}
              onChange={handleSettingsChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="retryEnabled" className="ml-2 block text-sm text-gray-900">
              Enable notification retry
            </label>
          </div>

          {settingsData.retryEnabled && (
            <div>
              <label htmlFor="retryDelay" className="block text-sm font-medium text-gray-700">
                Retry Delay (minutes)
              </label>
              <div className="mt-1">
                <input
                  id="retryDelay"
                  name="retryDelay"
                  type="number"
                  min="1"
                  max="30"
                  value={settingsData.retryDelay}
                  onChange={handleSettingsChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Time to wait before retrying a notification (1-30 minutes)
                </p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading.settings}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading.settings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <div className="mt-1">
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1">
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading.password}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading.password ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;