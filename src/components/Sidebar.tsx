import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Camera, 
  MapPin, 
  Users,
  AlertTriangle,
  Settings,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Camera, label: 'CCTV Monitoring', path: '/cctv' },
    { icon: MapPin, label: 'Worker Tracking', path: '/tracking' },
    { icon: Users, label: 'Attendance', path: '/attendance' },
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="h-screen w-64 bg-indigo-900 text-white flex flex-col shadow-lg">
      <div className="p-6 border-b border-indigo-800 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">RealG</h1>
          <p className="text-sm text-indigo-300">Emergency Alert System</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-indigo-300 hover:text-white focus:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-800 text-white'
                      : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button className="flex items-center space-x-3 text-indigo-300 hover:text-white w-full px-4 py-3 rounded-lg transition-colors">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;