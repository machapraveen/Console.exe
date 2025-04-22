import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../src/context/AuthContext';
import Dashboard from '../../src/pages/Dashboard';
import { getNotifications, getNotificationStats, deleteNotification } from '../../src/services/api';
import toast from 'react-hot-toast';

// Mock the API service
jest.mock('../../src/services/api', () => ({
  getNotifications: jest.fn(),
  getNotificationStats: jest.fn(),
  deleteNotification: jest.fn()
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the auth context
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      name: 'Test User',
      email: 'test@example.com',
      apiKey: 'test-api-key'
    }
  }),
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset mocks
    getNotifications.mockReset();
    getNotificationStats.mockReset();
    deleteNotification.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
    
    // Mock window.confirm
    window.confirm = jest.fn().mockImplementation(() => true);
  });

  test('renders loading state initially', () => {
    // Mock API calls that never resolve
    getNotifications.mockImplementation(() => new Promise(() => {}));
    getNotificationStats.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );
    
    // Check for loading indicators
    expect(screen.getAllByRole('img')[0]).toHaveClass('animate-spin');
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
    
    const mockStats = {
      overall: {
        total: 245,
        sent: 220,
        rateLimited: 15,
        failed: 10
      },
      timeRanges: {
        last24Hours: 15,
        last7Days: 85
      }
    };
    
    getNotifications.mockResolvedValue({ notifications: mockNotifications });
    getNotificationStats.mockResolvedValue(mockStats);
    
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
    
    // Check stats
    expect(screen.getByText('15')).toBeInTheDocument(); // Last 24h
  });

  test('renders empty state when no notifications', async () => {
    // Mock empty notification data
    getNotifications.mockResolvedValue({ notifications: [] });
    getNotificationStats.mockResolvedValue({
      overall: { total: 0, sent: 0, rateLimited: 0, failed: 0 },
      timeRanges: { last24Hours: 0, last7Days: 0 }
    });
    
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
    getNotificationStats.mockResolvedValue({
      overall: { total: 0, sent: 0, rateLimited: 0, failed: 0 },
      timeRanges: { last24Hours: 0, last7Days: 0 }
    });
    
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
    getNotificationStats.mockResolvedValue({
      overall: { total: 0, sent: 0, rateLimited: 0, failed: 0 },
      timeRanges: { last24Hours: 0, last7Days: 0 }
    });
    
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