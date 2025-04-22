// src/components/NotificationList.jsx
import React from 'react';
import { formatDistance } from 'date-fns';

const NotificationList = ({ notifications }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Sent
          </span>
        );
      case 'rate-limited':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Rate Limited
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {notifications.map((notification) => (
          <li key={notification._id} className="py-4">
            <div className="flex items-start space-x-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{notification.message}</p>
                <p className="text-sm text-gray-500">
                  {formatDistance(new Date(notification.createdAt), new Date(), { addSuffix: true })}
                </p>
                {notification.context && Object.keys(notification.context).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    {Object.entries(notification.context).map(([key, value]) => (
                      <span key={key} className="mr-2">
                        <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                {getStatusBadge(notification.status)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationList;
