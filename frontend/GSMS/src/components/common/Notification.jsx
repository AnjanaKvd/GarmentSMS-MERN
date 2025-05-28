// src/components/common/Notification.jsx
import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Create a context for notifications
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'success', duration = 5000, action = null) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, action }]);

    if (duration !== Infinity) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const value = {
    showNotification,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`flex items-center p-4 rounded-md shadow-lg max-w-md transform transition-all animate-slideIn
              ${notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' : ''}
              ${notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : ''}
              ${notification.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
              ${notification.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' : ''}`
            }
          >
            <div className="flex-1">
              <p className={`text-sm font-medium
                ${notification.type === 'success' ? 'text-green-800' : ''}
                ${notification.type === 'error' ? 'text-red-800' : ''}
                ${notification.type === 'info' ? 'text-blue-800' : ''}
                ${notification.type === 'warning' ? 'text-yellow-800' : ''}`
              }>
                {notification.message}
              </p>
              
              {notification.action && (
                <a 
                  href={notification.action.href} 
                  onClick={(e) => {
                    e.preventDefault();
                    notification.action.onClick();
                    removeNotification(notification.id);
                  }}
                  className={`mt-1 text-sm font-medium underline
                    ${notification.type === 'success' ? 'text-green-700' : ''}
                    ${notification.type === 'error' ? 'text-red-700' : ''}
                    ${notification.type === 'info' ? 'text-blue-700' : ''}
                    ${notification.type === 'warning' ? 'text-yellow-700' : ''}`
                  }
                >
                  {notification.action.text}
                </a>
              )}
            </div>
            
            <button 
              onClick={() => removeNotification(notification.id)}
              className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};