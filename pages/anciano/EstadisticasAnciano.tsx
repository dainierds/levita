import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePlans } from '../../hooks/usePlans';
import { BarChart3, TrendingUp, Calendar, Clock, Activity } from 'lucide-react';

const EstadisticasAnciano: React.FC = () => {
    const { user } = useAuth();
    const { plans } = usePlans();

    // Calculate Stats
    const now = new Date();
    const pastPlans = plans.filter(p => new Date(p.date) < now && (p.team.elder === user?.name || p.team.preacher === user?.name));

    const totalServices = pastPlans.length;
    const preached = pastPlans.filter(p => p.team.preacher === user?.name).length;
    const thisYear = pastPlans.filter(p => new Date(p.date).getFullYear() === now.getFullYear()).length;

    return (
        <div className="p-4 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h1 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Mis Estadísticas
                </h1>
                <p className="text-gray-500 text-sm">Resumen de actividad ministerial.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {/* Card 1 */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium mb-1">Veces Predicado</p>
                            <h2 className="text-4xl font-bold">{preached}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <TrendingUp size={32} />
                        </div>
                    </div>
                    {/* Decorative circle */}
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* Card 2 */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Turnos Cumplidos</p>
                            <h2 className="text-4xl font-bold">{totalServices}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Activity size={32} />
                        </div>
                    </div>
                </div>

                {/* Card 3 */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <p className="text-emerald-100 text-sm font-medium mb-1">Actividad Anual ({now.getFullYear()})</p>
                            <h2 className="text-4xl font-bold">{thisYear}</h2>
                        </div>
                        <div className="bg-white/20 p-3 rounded-xl">
                            <Calendar size={32} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EstadisticasAnciano;
