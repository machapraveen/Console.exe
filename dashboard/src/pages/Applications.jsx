import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getApplications, createApplication, deleteApplication } from '../services/api';
import toast from 'react-hot-toast';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getApplications();
      setApplications(data.applications);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApplication = async (e) => {
    e.preventDefault();
    
    if (!newAppName.trim()) {
      toast.error('Application name is required');
      return;
    }
    
    try {
      setFormLoading(true);
      const response = await createApplication({ name: newAppName });
      setApplications([...applications, response.application]);
      setNewAppName('');
      setShowCreateForm(false);
      toast.success('Application created successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create application');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteApplication = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteApplication(id);
      setApplications(applications.filter(app => app._id !== id));
      toast.success('Application deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete application');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Application
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Application</h2>
          <form onSubmit={handleCreateApplication}>
            <div className="mb-4">
              <label htmlFor="appName" className="block text-sm font-medium text-gray-700">
                Application Name
              </label>
              <input
                type="text"
                id="appName"
                name="appName"
                value={newAppName}
                onChange={(e) => setNewAppName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="My Application"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {formLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No applications yet. Create your first application to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {applications.map((app) => (
            <div key={app._id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 truncate">{app.name}</h3>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-500">
                  Recipients: {app.recipients ? app.recipients.length : 0}
                </p>
                <p className="text-sm text-gray-500">
                  Created: {new Date(app.createdAt).toLocaleDateString()}
                </p>
                {app.notificationCount !== undefined && (
                  <p className="text-sm text-gray-500">
                    Notifications: {app.notificationCount}
                  </p>
                )}
              </div>
              <div className="px-6 py-3 bg-gray-50 flex justify-between">
                <Link
                  to={`/applications/${app._id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  View Details
                </Link>
                {app.name !== 'Default Application' && (
                  <button
                    onClick={() => handleDeleteApplication(app._id, app.name)}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Applications;