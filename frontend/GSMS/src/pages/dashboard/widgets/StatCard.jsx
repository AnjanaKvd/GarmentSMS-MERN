import React from 'react';

const StatCard = ({ title, value, icon, color, suffix }) => {
  // Define color classes based on the color prop
  const colorClasses = {
    indigo: 'bg-indigo-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500'
  };

  const bgColorClass = colorClasses[color] || 'bg-indigo-500';

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bgColorClass} rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}{suffix && <span className="text-sm ml-1 text-gray-500">{suffix}</span>}
              </div>
            </dd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;