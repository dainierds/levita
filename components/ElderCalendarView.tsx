import React from 'react';

const ElderCalendarView: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-24 md:pb-0">
            <div className="bg-white p-6 rounded-b-[2.5rem] shadow-sm border-b border-slate-100 min-h-[300px]">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-xl text-slate-800 tracking-tight">Itinerario del Mes</h3>
                    <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold capitalize border border-indigo-100">
                        {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                    No hay itinerario para este mes
                </div>
            </div>
        </div>
    );
};

export default ElderCalendarView;
