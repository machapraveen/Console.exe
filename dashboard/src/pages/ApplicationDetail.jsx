// dashboard/src/pages/ApplicationDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication, updateApplication, addRecipient, updateRecipient, deleteRecipient, activateRecipient, deactivateRecipient } from '../services/api';
import RecipientForm from '../components/RecipientForm';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getApplication(id);
        setApplication(data);
      } catch (err) {
        setError('Failed to load application');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleNameChange = async (e) => {
    const newName = e.target.value;
    try {
      await updateApplication(id, { name: newName });
      setApplication({
        ...application,
        name: newName
      });
    } catch (err) {
      setError('Failed to update application name');
      console.error(err);
    }
  };

  const handleAddRecipient = async (formData) => {
    try {
      const response = await addRecipient(id, formData);
      setApplication(response.application);
      setShowAddForm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateRecipient = async (formData) => {
    try {
      const response = await updateRecipient(id, editingRecipient._id, formData);
      setApplication(response.application);
      setEditingRecipient(null);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteRecipient = async (recipientId) => {
    if (!window.confirm('Are you sure you want to delete this recipient?')) {
      return;
    }

    try {
      const response = await deleteRecipient(id, recipientId);
      setApplication(response.application);
    } catch (err) {
      setError('Failed to delete recipient');
      console.error(err);
    }
  };

  const toggleRecipientStatus = async (recipientId, currentStatus) => {
    try {
      let response;
      if (currentStatus) {
        response = await deactivateRecipient(id, recipientId);
      } else {
        response = await activateRecipient(id, recipientId);
      }
      setApplication(response.application);
    } catch (err) {
      setError(`Failed to ${currentStatus ? 'deactivate' : 'activate'} recipient`);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate('/applications')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p>Application not found.</p>
        <button
          onClick={() => navigate('/applications')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Application Details</h1>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            onClick={() => navigate('/applications')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      {/* Application Name */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="mb-4">
          <label htmlFor="applicationName" className="block text-sm font-medium text-gray-700">
            Application Name
          </label>
          <input
            type="text"
            id="applicationName"
            value={application.name}
            onChange={handleNameChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <div className="text-sm text-gray-500">
          <p>Application ID: {application._id}</p>
          <p>Created: {new Date(application.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Recipients */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recipients</h2>
          {!showAddForm && !editingRecipient && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Add Recipient
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingRecipient) && (
          <div className="mb-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-md font-medium text-gray-900 mb-4">
              {editingRecipient ? 'Edit Recipient' : 'Add New Recipient'}
            </h3>
            <RecipientForm
              onSubmit={editingRecipient ? handleUpdateRecipient : handleAddRecipient}
              initialData={editingRecipient || {}}
              buttonText={editingRecipient ? 'Update Recipient' : 'Add Recipient'}
            />
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingRecipient(null);
              }}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Recipients List */}
        {application.recipients && application.recipients.length > 0 ? (
          <div className="overflow-hidden ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Phone
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {application.recipients.map((recipient) => (
                  <tr key={recipient._id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {recipient.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {recipient.phone}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        recipient.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {recipient.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button
                        onClick={() => setEditingRecipient(recipient)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRecipient(recipient._id)}
                        className="text-red-600 hover:text-red-900 mr-2"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => toggleRecipientStatus(recipient._id, recipient.isActive)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {recipient.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No recipients yet. Add someone to receive notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;