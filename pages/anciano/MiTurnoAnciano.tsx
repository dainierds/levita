import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';
import { Calendar, User, Clock, MapPin } from 'lucide-react';

const MiTurnoAnciano: React.FC = () => {
    const { user } = useAuth();
    const { plans, loading } = usePlans();

    const myTurns = plans
        .filter(p => !p.isActive && new Date(p.date) >= new Date())
        .filter(p => p.team.elder === user?.name || p.team.preacher === user?.name || p.team.musicDirector === user?.name || p.team.audioOperator === user?.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Mis Turnos Asignados
                </h1>
                <p className="text-gray-500 text-sm mt-1">Próximas responsabilidades de servicio.</p>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8">Cargando...</div>
                ) : myTurns.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                        <p className="text-gray-400">No tienes turnos próximos.</p>
                    </div>
                ) : (
                    myTurns.map(turn => (
                        <div key={turn.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-100 group">
                            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-lg">{turn.title || 'Servicio General'}</h3>
                                    <p className="text-xs text-blue-100 opacity-90 font-medium uppercase tracking-wider">
                                        {new Date(turn.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Calendar size={20} />
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>{turn.startTime} - Llegada 30 min antes</span>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-700">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span className="font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                        Rol: {turn.team.elder === user?.name ? 'Anciano de Turno' :
                                            turn.team.preacher === user?.name ? 'Predicador' : 'Asignado'}
                                    </span>
                                </div>

                                {turn.description && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500 italic">
                                        "{turn.description}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MiTurnoAnciano;
