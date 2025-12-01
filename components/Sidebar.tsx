import React from 'react';
import { LayoutDashboard, Calendar, FileText, Users, Settings, Church, UserPlus, Bell, BarChart3 } from 'lucide-react';
import { Role, SubscriptionTier, TIER_FEATURES } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  role: Role;
  tier: SubscriptionTier;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, role, tier }) => {
  if (role === 'MEMBER' || role === 'VISITOR' || role === 'SUPER_ADMIN') return null;

  const allowedFeatures = TIER_FEATURES[tier];

  // 1. Define all possible items
  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'planner', label: 'Orden de Cultos', icon: FileText },
    { id: 'roster', label: 'Turnos', icon: Users },
    { id: 'statistics', label: 'Estadísticas', icon: BarChart3 }, // New Item
    { id: 'events', label: 'Eventos Admin', icon: Calendar },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'users', label: 'Usuarios & Email', icon: UserPlus },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  // 2. Filter by Role Strictness
  let allowedIds: string[] = [];

  switch (role) {
    case 'ADMIN':
      allowedIds = ['dashboard', 'planner', 'roster', 'events', 'notifications', 'users', 'settings', 'statistics'];
      break;
    case 'ELDER':
      allowedIds = ['dashboard', 'planner', 'roster'];
      break;
    case 'AUDIO':
    case 'MUSIC':
    case 'PREACHER':
      // Technical and Ministry roles only need Planner and Roster
      allowedIds = ['planner', 'roster'];
      break;
    default:
      allowedIds = [];
  }

  // 3. Filter by Tier (Feature Flags)
  // Even if role allows it, tier must allow it
  const tierAllowed = TIER_FEATURES[tier];

  const menuItems = allMenuItems.filter(item =>
    allowedIds.includes(item.id) &&
    (item.id === 'dashboard' || item.id === 'planner' || item.id === 'roster' ? true : tierAllowed.includes(item.id))
  );

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white shadow-xl fixed left-0 top-0 z-50 rounded-r-4xl">
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Church size={20} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">LEVITA</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl transition-all duration-300 group ${isActive
                ? 'bg-indigo-50 text-indigo-600 shadow-sm font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mb-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-5 border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
              {role.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Usuario</p>
              <p className="text-xs text-slate-400">{role}</p>
            </div>
          </div>
          <div className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-1 rounded-lg inline-block border border-slate-100">
            Plan {tier}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
