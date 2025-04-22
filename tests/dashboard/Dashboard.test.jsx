// tests/dashboard/Dashboard.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../dashboard/src/context/AuthContext';
import Dashboard from '../../dashboard/src/pages/Dashboard';
import { getNotifications } from '../../dashboard/src/services/api';

// Mock the API service
jest.mock('../../dashboard/src/services/api', () => ({
  getNotifications: jest.fn()
}));

// Mock the auth context
jest.mock('../../dashboard/src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      email: 'test@example.com',
      apiKey: 'test-api-key'
    }
  }),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    getNotifications.mockReset();
  });

  test('renders loading state initially', () => {
    // Mock API call that never resolves
    getNotifications.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('renders notifications when data is loaded', async () => {
    // Mock notification data
    const mockNotifications = [
      {
        _id: '1',
        message: 'Test error 1',
        status: 'sent',
        createdAt: new Date().toISOString(),
        context: { userId: '123' }
      },
      {
        _id: '2',
        message: 'Test error 2',
        status: 'rate-limited',
        createdAt: new Date().toISOString()
      }
    ];
    
    getNotifications.mockResolvedValue({ notifications: mockNotifications });
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test error 1')).toBeInTheDocument();
      expect(screen.getByText('Test error 2')).toBeInTheDocument();
    });
    
    // Check status badges
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Rate Limited')).toBeInTheDocument();
  });

  test('renders empty state when no notifications', async () => {
    // Mock empty notification data
    getNotifications.mockResolvedValue({ notifications: [] });
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
    });
  });

  test('renders error state when API fails', async () => {
    // Mock API error
    getNotifications.mockRejectedValue(new Error('API error'));
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument();
    });
  });

  test('displays API key in setup instructions', async () => {
    getNotifications.mockResolvedValue({ notifications: [] });
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/quick setup/i)).toBeInTheDocument();
      expect(screen.getByText(/your api key/i)).toBeInTheDocument();
      expect(screen.getByText('test-api-key')).toBeInTheDocument();
    });
  });
});