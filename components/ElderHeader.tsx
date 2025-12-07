import React from 'react';
import { Menu, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface ElderHeaderProps {
    user: User;
    onMenuClick: () => void;
}

const ElderHeader: React.FC<ElderHeaderProps> = ({ user, onMenuClick }) => {
    return (
        <div className="bg-[#6366f1] p-4 flex items-center justify-between shadow-md text-white sticky top-0 z-40">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20">
                    <span className="font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                    <h1 className="font-bold text-base leading-tight">{user.name}</h1>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Anciano</p>
                </div>
            </div>

            <button
                onClick={onMenuClick}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
                <Menu className="text-white" size={24} />
            </button>
        </div>
    );
};

export default ElderHeader;
