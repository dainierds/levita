
import React, { useRef, useState } from 'react';
import { LayoutDashboard, Calendar, FileText, Users, Settings, Church, UserPlus, Bell, BarChart3, Camera, Loader2, UserCheck, BookOpen, Heart, Library, Music } from 'lucide-react';
import { Role, SubscriptionTier, TIER_FEATURES, User } from '../types';
import { db } from '../services/firebase';
import { uploadFile } from '../services/storageService';
import { doc, updateDoc } from 'firebase/firestore';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  role: Role;
  tier: SubscriptionTier;
  user: User;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, role, tier, user }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (role === 'MEMBER' || role === 'VISITOR' || role === 'SUPER_ADMIN') return null;

  const allowedFeatures = TIER_FEATURES[tier];

  // 1. Define all possible items
  const allMenuItems = [
    { id: 'dashboard', label: t('menu.dashboard'), icon: LayoutDashboard },
    { id: 'planner', label: t('menu.planner'), icon: FileText },
    { id: 'team', label: t('menu.team'), icon: UserCheck },
    { id: 'music_dept', label: 'Dep. Música', icon: Music }, // New Item
    { id: 'sermons', label: t('menu.sermons'), icon: BookOpen },
    { id: 'roster', label: t('menu.roster'), icon: Users },
    { id: 'prayers', label: t('menu.prayers'), icon: Heart },
    { id: 'statistics', label: t('menu.statistics'), icon: BarChart3 },
    { id: 'resources', label: t('menu.resources'), icon: Library },
    { id: 'events', label: t('menu.events'), icon: Calendar },
    { id: 'notifications', label: t('menu.notifications'), icon: Bell },
    { id: 'users', label: t('menu.users'), icon: UserPlus },
    { id: 'voting_admin', label: 'Votación (Admin)', icon: Users }, // New
    { id: 'settings', label: t('menu.settings'), icon: Settings },
  ];

  // 2. Define Permissions Helper
  const getPermissionsForRole = (r: Role): string[] => {
    switch (r) {
      case 'ADMIN': return ['dashboard', 'planner', 'team', 'music_dept', 'sermons', 'roster', 'prayers', 'statistics', 'events', 'notifications', 'users', 'voting_admin', 'settings'];
      case 'ELDER': return ['dashboard', 'planner', 'team', 'sermons', 'roster', 'prayers', 'statistics'];
      case 'LEADER': return ['dashboard', 'planner', 'team', 'music_dept', 'roster', 'events'];
      case 'BOARD': return ['dashboard'];
      case 'AUDIO':
      case 'MUSIC':
      case 'PREACHER':
      case 'TEACHER': // Added Teacher
        return ['planner', 'team', 'roster'];
      default: return [];
    }
  };

  // 3. Aggregate Permissions from Primary and Secondary Roles
  const allUserRoles = [role, ...(user.secondaryRoles || [])];
  const allowedIds = Array.from(new Set(
    allUserRoles.flatMap(r => getPermissionsForRole(r))
  ));

  // 3. Filter by Tier (Feature Flags)
  const tierAllowed = TIER_FEATURES[tier];

  const menuItems = allMenuItems.filter(item =>
    allowedIds.includes(item.id) &&
    (item.id === 'dashboard' || item.id === 'planner' || item.id === 'roster' ? true : tierAllowed.includes(item.id))
  );

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Use the centralized storage service
      const uploaded = await uploadFile(file);

      // Update the user document in Firestore
      await updateDoc(doc(db, 'users', user.id), {
        photoUrl: uploaded.url
      });

      // Note: The app should automatically reflect this if it's listening to user changes
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert("Error al subir la imagen. Verifica tus permisos o intenta de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="hidden md:flex flex-col w-64 h-screen bg-white fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white font-bold overflow-hidden">
          <img src="/logo.png" alt="Levita" className="w-full h-full object-cover" />
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
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-5 border border-slate-100 relative group">

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={handleImageClick}>
            <div className="relative">
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : role.charAt(0)}
                </div>
              )}

              {/* Overlay for hover effect */}
              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {isUploading ? <Loader2 size={12} className="text-white animate-spin" /> : <Camera size={12} className="text-white" />}
              </div>
            </div>

            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-700 truncate max-w-[100px]" title={user.name}>{user.name || 'Usuario'}</p>
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
