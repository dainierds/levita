import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';
import { useEvents } from '../../hooks/useEvents';
import { Calendar, CheckCircle, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const InicioAnciano: React.FC = () => {
    const { user } = useAuth();
    const { plans } = usePlans();
    const { events } = useEvents();

    // Logic to find next data
    const now = new Date();
    const nextPlan = plans
        .filter(p => !p.isActive && new Date(p.date) >= now)
        .filter(p => p.team.elder === user?.name || p.team.preacher === user?.name) // Simplified check
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const nextPreaching = plans
        .filter(p => !p.isActive && new Date(p.date) >= now)
        .filter(p => p.team.preacher === user?.name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

    const nextEvents = events
        .filter(e => new Date(e.date) >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 3);

    // Obtener fecha formateada
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="p-4 space-y-6">
            {/* Saludo */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    ¡Hola, {user?.name?.split(' ')[0]}! 👋
                </h1>
                <p className="text-gray-600 capitalize">{fechaActual}</p>
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-2 gap-4">
                {/* Próximo Turno */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5" />
                        <span className="text-sm font-medium">Próximo Turno</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {nextPlan ? new Date(nextPlan.date).getDate() : '--'}
                    </p>
                    <p className="text-xs text-blue-100 opacity-90">
                        {nextPlan ? new Date(nextPlan.date).toLocaleDateString('es-ES', { month: 'long' }) : 'Sin asignar'}
                    </p>
                </div>

                {/* Tareas Pendientes */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Tareas</span>
                    </div>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-xs text-green-100 opacity-90">Pendientes</p>
                </div>

                {/* Próxima Predicación */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Predicación</span>
                    </div>
                    <p className="text-3xl font-bold">
                        {nextPreaching ? new Date(nextPreaching.date).getDate() : '--'}
                    </p>
                    <p className="text-xs text-purple-100 opacity-90">{nextPreaching ? new Date(nextPreaching.date).toLocaleDateString('es-ES', { month: 'long' }) : 'Próxima'}</p>
                </div>

                {/* Última Asistencia */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium">Asistencia</span>
                    </div>
                    <p className="text-3xl font-bold">100%</p>
                    <p className="text-xs text-orange-100 opacity-90">Este mes</p>
                </div>
            </div>

            {/* Próximos Eventos */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Próximos Eventos
                </h2>

                {nextEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300 opacity-50" />
                        <p>No hay eventos próximos</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {nextEvents.map((evento) => (
                            <div key={evento.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="text-2xl w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">📅</div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-sm">{evento.title}</h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {new Date(evento.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Avisos Importantes */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-bold text-yellow-800 mb-1 text-sm">Aviso Importante</h3>
                        <p className="text-sm text-yellow-700 leading-relaxed">
                            Recuerda confirmar tu asistencia a la próxima reunión de ancianos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InicioAnciano;
