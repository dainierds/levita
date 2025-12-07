import React from 'react';

const ElderCalendarView: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#f3f4f6] pb-32 md:pb-8 max-w-md mx-auto md:my-8 md:min-h-[800px] pt-6">
            <div className="bg-white mx-4 rounded-3xl p-6 shadow-sm min-h-[180px]">
                <div className="flex justify-between items-start mb-12">
                    <h3 className="font-bold text-lg text-slate-900 tracking-tight">Itinerario del Mes</h3>
                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold capitalize">
                        {new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="text-center text-slate-400 font-medium text-xs">
                    No hay itinerario para este mes
                </div>
            </div>
        </div>
    );
};

export default ElderCalendarView;
