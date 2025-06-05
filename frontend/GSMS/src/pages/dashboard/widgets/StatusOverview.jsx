import React from 'react';

const StatusOverview = ({ title, items }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
              </div>
              <div className="ml-4">
                <div className="relative w-48 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute top-0 left-0 h-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="ml-4 w-12 text-right">
                <p className="text-sm font-medium text-gray-900">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusOverview;