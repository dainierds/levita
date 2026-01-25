import React from 'react';

import { Menu, User as UserIcon, X, Bell } from 'lucide-react';
import { User } from '../types';
import PWAInstallButton from './PWAInstallButton';
import UserProfileMenu from './UserProfileMenu';

interface ElderHeaderProps {
    user: User;
    onMenuClick: () => void;
    isMenuOpen?: boolean; // Optional if we want to toggle icon
}

const ElderHeader: React.FC<ElderHeaderProps> = ({ user, onMenuClick, isMenuOpen }) => {
    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 sticky top-0 z-50 shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* Left Side: Name  */}
                <div>
                    <button
                        onClick={onMenuClick}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-2 inline-block md:hidden"
                    >
                        {isMenuOpen ? <X className="text-white" size={24} /> : <Menu className="text-white" size={24} />}
                    </button>
                    <div className="inline-block">
                        <h1 className="font-bold text-base leading-tight">{user.name}</h1>
                        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Anciano</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <PWAInstallButton variant="icon" className="bg-white/10 text-white hover:bg-white/20" />
                <UserProfileMenu
                    user={user}
                    roleLabel="Anciano"
                    variant="simple"
                    className="text-slate-800"
                />
            </div>
        </div>
    );
};

export default ElderHeader;
