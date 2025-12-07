import React from 'react';
import { Menu, User as UserIcon, X } from 'lucide-react'; // Added X if needed for toggle state
import { User } from '../types';

interface ElderHeaderProps {
    user: User;
    onMenuClick: () => void;
    isMenuOpen?: boolean; // Optional if we want to toggle icon
}

const ElderHeader: React.FC<ElderHeaderProps> = ({ user, onMenuClick, isMenuOpen }) => {
    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 sticky top-0 z-50 shadow-lg text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                    {/* Use Avatar or Icon */}
                    <UserIcon size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-base leading-tight">{user.name}</h1>
                    <p className="text-indigo-200 text-xs font-medium uppercase tracking-wide">Anciano</p>
                </div>
            </div>

            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
                {isMenuOpen ? <X className="text-white" size={24} /> : <Menu className="text-white" size={24} />}
            </button>
        </div>
    );
};

export default ElderHeader;
