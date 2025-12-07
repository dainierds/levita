import React from 'react';
import { Bell } from 'lucide-react';

const ElderNotifications: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-8 max-w-md mx-auto md:my-8 md:rounded-[2.5rem] md:overflow-hidden md:min-h-[800px] md:border md:border-slate-200 md:shadow-2xl">
            <div className="p-4 md:p-8 space-y-4">
                <div className="flex items-center gap-3 mb-6">
                    <Bell className="text-indigo-600" size={24} />
                    <h2 className="text-xl font-bold text-slate-800">Notificaciones</h2>
                </div>

                <div className="bg-white rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 min-h-[300px]">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <Bell size={32} />
                    </div>
                    <p className="text-slate-400 font-medium">No tienes notificaciones</p>
                </div>

                <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-3 mb-1">
                        <Bell size={20} />
                        <h3 className="font-bold">Recordatorios Activos</h3>
                    </div>
                    <p className="text-indigo-100 text-sm opacity-90">Recibirás notificaciones antes de tus turnos.</p>
                </div>
            </div>
        </div>
    );
};

export default ElderNotifications;
