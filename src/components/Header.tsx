import React from 'react';
import { Bell, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 flex items-center justify-between p-4 lg:px-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg lg:text-xl font-semibold text-gray-800">Emergency Alert Dashboard</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-700 hidden sm:inline">Admin User</span>
          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User size={18} className="text-indigo-600" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;