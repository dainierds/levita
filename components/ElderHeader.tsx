import React from 'react';
import { User } from '../types';
import { Menu } from 'lucide-react';

interface ElderHeaderProps {
    user: User;
    onMenuClick: () => void;
}

const ElderHeader: React.FC<ElderHeaderProps> = ({ user, onMenuClick }) => {
    return (
        <div className="md:hidden bg-indigo-600 px-6 pt-8 pb-6 shadow-xl relative z-40">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-indigo-500 border-2 border-indigo-300 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight">{user.name}</h2>
                        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Anciano</p>
                    </div>
                </div>

                <button onClick={onMenuClick} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </div>
        </div>
    );
};
export default ElderHeader;
