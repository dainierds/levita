import React from 'react';
import { Bell } from 'lucide-react';

const ElderNotifications: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-32 md:pb-8 max-w-md mx-auto md:my-8 md:min-h-[800px] pt-6 px-4">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Bell size={16} /> Notificaciones
            </h2>

            <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-sm mb-6 min-h-[200px]">
                <div className="w-12 h-12 text-slate-300 mb-2">
                    <Bell size={48} strokeWidth={1.5} />
                </div>
                <p className="text-slate-400 font-medium text-xs">No tienes notificaciones</p>
            </div>

            <div className="bg-[#6366f1] rounded-2xl p-4 flex items-center gap-3 text-white shadow-indigo-200 shadow-lg">
                <div className="p-2 bg-white/20 rounded-full">
                    <Bell size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">Recordatorios Activos</h3>
                    <p className="text-[10px] text-indigo-100 font-medium">Recibirás notificaciones antes de tus turnos</p>
                </div>
            </div>
        </div>
    );
};

export default ElderNotifications;
