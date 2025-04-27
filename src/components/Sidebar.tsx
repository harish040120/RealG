import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Camera,
  MapPin,
  Users,
  AlertTriangle,
  Settings,
  LogOut,
  X,
} from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Camera, label: "CCTV Monitoring", path: "/cctv" },
    { icon: MapPin, label: "Worker Tracking", path: "/tracking" },
    { icon: Users, label: "Attendance", path: "/attendance" },
    { icon: AlertTriangle, label: "Alerts", path: "/alerts" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div className="h-screen w-64 bg-[#0E0E0E] text-white flex flex-col shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#00D4FF] tracking-widest">
            RealG
          </h1>
          <p className="text-sm text-[#7B8591]">Emergency Alert System</p>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-[#7B8591] hover:text-white focus:outline-none"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-4">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-[#00D4FF] text-[#0E0E0E] shadow-md"
                      : "text-[#7B8591] hover:bg-[#1F1F1F] hover:text-white"
                  }`
                }
              >
                <item.icon size={22} className="text-[#00D4FF]" />
                <span className="text-sm font-semibold">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-[#1F1F1F]">
        <button className="flex items-center space-x-3 text-[#7B8591] hover:text-white w-full px-4 py-3 rounded-lg transition-all duration-300 hover:bg-[#1F1F1F]">
          <LogOut size={22} />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
