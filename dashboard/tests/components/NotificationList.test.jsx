import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationList from '../../src/components/NotificationList';

describe('NotificationList Component', () => {
  const mockNotifications = [
    {
      _id: '1',
      message: 'Test error 1',
      status: 'sent',
      createdAt: new Date().toISOString(),
      context: { userId: '123', amount: 50 }
    },
    {
      _id: '2',
      message: 'Test error 2',
      status: 'rate-limited',
      createdAt: new Date().toISOString()
    },
    {
      _id: '3',
      message: 'Test error 3',
      status: 'failed',
      createdAt: new Date().toISOString()
    }
  ];

  test('renders notifications correctly', () => {
    render(<NotificationList notifications={mockNotifications} />);
    
    expect(screen.getByText('Test error 1')).toBeInTheDocument();
    expect(screen.getByText('Test error 2')).toBeInTheDocument();
    expect(screen.getByText('Test error 3')).toBeInTheDocument();
    
    expect(screen.getByText('Sent')).toBeInTheDocument();
    expect(screen.getByText('Rate Limited')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  test('renders context information when available', () => {
    render(<NotificationList notifications={mockNotifications} />);
    
    expect(screen.getByText(/userId:/i)).toBeInTheDocument();
    expect(screen.getByText(/amount:/i)).toBeInTheDocument();
  });

  test('renders empty state when no notifications', () => {
    render(<NotificationList notifications={[]} />);
    
    expect(screen.getByText(/no notifications yet/i)).toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<NotificationList notifications={mockNotifications} onDelete={onDelete} />);
    
    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);
    
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});