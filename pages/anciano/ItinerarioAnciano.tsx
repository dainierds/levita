import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';
import { Calendar, User, Star } from 'lucide-react';

const ItinerarioAnciano: React.FC = () => {
    const { user } = useAuth();
    const { plans, loading } = usePlans();
    const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const yearActual = new Date().getFullYear();

    // Filtrar itinerario por mes
    const itinerario = plans
        .filter(plan => {
            const d = new Date(plan.date);
            return d.getMonth() === mesSeleccionado && d.getFullYear() === yearActual;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    Itinerario de Predicación
                </h1>

                {/* Selector de mes */}
                <select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-slate-50 font-medium text-slate-700"
                >
                    {meses.map((mes, index) => (
                        <option key={index} value={index}>{mes} {yearActual}</option>
                    ))}
                </select>
            </div>

            {/* Lista de predicaciones */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : itinerario.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-100">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No hay predicaciones programadas este mes</p>
                    </div>
                ) : (
                    itinerario.map((item) => {
                        const esMiTurno = item.team.preacher === user?.name;
                        const fecha = new Date(item.date); // Use item.date string or date object. plans usually has ISO string. Add T00... if needed or assume format.
                        // Assuming item.date is "YYYY-MM-DD" per my other components.
                        // If it is "YYYY-MM-DD", new Date(item.date) works in most browsers but timezone might be UTC. 
                        // Better to parse parts if needed. I'll stick to new Date(item.date + 'T12:00:00').

                        const d = new Date(item.date + 'T12:00:00'); // Force noon to avoid timezone shift

                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-2xl p-4 shadow-lg border-l-4 transition-transform hover:scale-[1.01] ${esMiTurno ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold shadow-sm ${esMiTurno ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                <span className="text-lg leading-none">{d.getDate()}</span>
                                                <span className="text-[10px] uppercase font-normal opacity-80">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">
                                                    {d.toLocaleDateString('es-ES', { weekday: 'long' })}
                                                </p>
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2 pl-1">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className={`font-bold text-sm ${esMiTurno ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {item.team.preacher || 'Por asignar'}
                                            </span>
                                            {esMiTurno && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full font-bold uppercase tracking-wider">
                                                    TÚ
                                                </span>
                                            )}
                                        </div>

                                        {/* Check if title exists if not use generic */}
                                        <div className="pl-1">
                                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                                                📖 {item.title || 'Servicio Dominical'}
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ItinerarioAnciano;
