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

const Notification = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === 'success' ? 'bg-green-50' : 
                 type === 'error' ? 'bg-red-50' : 
                 type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50';

  const textColor = type === 'success' ? 'text-green-800' : 
                   type === 'error' ? 'text-red-800' : 
                   type === 'warning' ? 'text-yellow-800' : 'text-blue-800';

  const borderColor = type === 'success' ? 'border-green-400' : 
                     type === 'error' ? 'border-red-400' : 
                     type === 'warning' ? 'border-yellow-400' : 'border-blue-400';

  return (
    <div className={`fixed top-4 right-4 px-4 py-3 rounded-md border ${bgColor} ${borderColor} ${textColor} z-50`}>
      <div className="flex">
        <div className="py-1">
          <svg className="h-6 w-6 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {type === 'success' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />}
            {type === 'error' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />}
            {type === 'warning' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />}
            {type === 'info' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
          </svg>
        </div>
        <div>
          <p className="font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Notification;