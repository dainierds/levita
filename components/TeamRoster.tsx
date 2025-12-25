import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings, ServicePlan, DayOfWeek } from '../types';
import { UserCheck, Mic2, Music, Mic, ChevronRight, Calendar, Info, CheckCircle2, BookOpen } from 'lucide-react';

interface TeamRosterProps {
    users: User[];
    settings: ChurchSettings;
    plans: ServicePlan[];
    savePlan: (plan: ServicePlan) => Promise<any>;
    onSaveSettings: (settings: ChurchSettings) => Promise<void>;
}

const ROLES_CONFIG = [
    { key: 'elder', label: 'Anciano de Turno', icon: UserCheck, color: 'text-blue-500 bg-blue-50', border: 'border-blue-100', role: 'ELDER' },
    { key: 'sabbathSchoolTeacher', label: 'Maestro de ES', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50', border: 'border-emerald-100', role: 'TEACHER' },
    { key: 'preacher', label: 'Predicador', icon: Mic2, color: 'text-purple-500 bg-purple-50', border: 'border-purple-100', role: 'PREACHER' },
    { key: 'audioOperator', label: 'Operador de Audio', icon: Mic, color: 'text-orange-500 bg-orange-50', border: 'border-orange-100', role: 'AUDIO' },
];

const TeamRoster: React.FC<TeamRosterProps> = ({ users, settings, plans, savePlan }) => {
    // Logic similar to TeamManager: Display ONE card/view per Meeting Day
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [upcomingServices, setUpcomingServices] = useState<{ dayName: string; date: Date; plan: ServicePlan | null }[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate dates on mount
    useEffect(() => {
        calculateUpcomingDates();
    }, [settings.meetingDays, plans]);

    const calculateUpcomingDates = () => {
        const calculated = settings.meetingDays.map(dayName => {
            const date = getNextDayOfWeek(dayName);
            const localDateStr = date.toLocaleDateString('en-CA');
            const foundPlan = plans.find(p => p.date === localDateStr);
            return {
                dayName,
                date,
                plan: foundPlan || null
            };
        });
        setUpcomingServices(calculated);
    };

    const getNextDayOfWeek = (dayName: string) => {
        const daysMap: { [key: string]: number } = {
            'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };
        const targetDay = daysMap[dayName];
        const date = new Date();
        const currentDay = date.getDay();

        let daysUntil = targetDay - currentDay;
        // If today matches, show today. If past, show next week.
        if (daysUntil < 0) daysUntil += 7;

        date.setDate(date.getDate() + daysUntil);
        return date;
    };

    const handleAssignmentChange = async (serviceIdx: number, roleKey: string, userName: string) => {
        setLoading(true);
        try {
            const service = upcomingServices[serviceIdx];
            const localDateStr = service.date.toLocaleDateString('en-CA');

            let planToSave: ServicePlan;

            if (service.plan) {
                planToSave = {
                    ...service.plan,
                    team: {
                        ...service.plan.team,
                        [roleKey]: userName
                    }
                };
            } else {
                planToSave = {
                    id: `auto-roster-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Servicio ${localDateStr}`,
                    date: localDateStr,
                    startTime: settings.meetingTimes[service.date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                    isActive: false,
                    items: [],
                    tenantId: users[0]?.tenantId || '',
                    team: {
                        elder: '', preacher: '', musicDirector: '', audioOperator: '',
                        [roleKey]: userName
                    },
                    isRosterDraft: true
                };
            }

            await savePlan(planToSave);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const currentService = upcomingServices[activeDayIdx]; // Derived state

    if (upcomingServices.length === 0) {
        return (
            <div className="p-8 text-center text-slate-400">
                <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay días de reunión configurados.</p>
                <p className="text-sm">Ve a Configuración para agregar días de culto.</p>
            </div>
        );
    }

    if (!currentService) return <div className="p-8 text-center text-gray-400">Cargando...</div>;

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-8">

            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <UserCheck className="text-indigo-600" size={32} />
                    Equipo de Turno
                </h2>
                <p className="text-slate-500">Gestión de roles para los próximos servicios.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* LEFT: Service Selector (Tabs) */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Próximos Servicios</h3>
                    {upcomingServices.map((service, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveDayIdx(idx)}
                            className={`flex items-center gap-4 p-4 rounded-[2rem] text-left transition-all group relative overflow-hidden ${activeDayIdx === idx
                                ? 'bg-white shadow-xl shadow-indigo-100 ring-2 ring-indigo-500'
                                : 'bg-slate-50 hover:bg-white hover:shadow-md text-slate-500'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-colors ${activeDayIdx === idx
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-400 border-slate-200 group-hover:border-indigo-200'
                                }`}>
                                <span className="text-xl font-bold">{service.date.getDate()}</span>
                                <span className="text-[9px] font-bold uppercase">{service.date.toLocaleString('es-ES', { month: 'short' }).replace('.', '')}</span>
                            </div>

                            <div className="flex-1">
                                <h4 className={`font-bold text-lg capitalize ${activeDayIdx === idx ? 'text-indigo-900' : 'text-slate-600'}`}>
                                    {service.dayName}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${activeDayIdx === idx ? 'text-indigo-500' : 'text-slate-400'}`}>
                                        {service.plan ? 'Programado' : 'Sin asignar'}
                                    </span>
                                    {service.plan?.isActive && (
                                        <span className="flex items-center gap-1 text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                                            <CheckCircle2 size={8} /> LIVE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {activeDayIdx === idx && (
                                <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-indigo-500" />
                            )}
                        </button>
                    ))}
                </div>

                {/* RIGHT: Team Editor Card */}
                <div className="flex-1 w-full">
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">

                        {/* Card Header */}
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 capitalize flex items-center gap-2">
                                    Equipo del {currentService.dayName}
                                    {currentService.plan?.isActive && (
                                        <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-lg shadow-green-200">
                                            EN VIVO
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-400 font-medium">
                                    {currentService.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                        </div>

                        {/* Roles Grid */}
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ROLES_CONFIG.map(role => {
                                const assignedName = currentService.plan ? (currentService.plan.team as any)[role.key] : '';
                                const roleUsers = users.filter(u => u.role === role.role);
                                // Sort A-Z
                                roleUsers.sort((a, b) => a.name.localeCompare(b.name));

                                return (
                                    <div key={role.key} className={`p-5 rounded-3xl border transition-all hover:shadow-md ${role.border} bg-white group`}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${role.color}`}>
                                                <role.icon size={20} />
                                            </div>
                                            <span className="font-bold text-slate-700">{role.label}</span>
                                        </div>

                                        <div className="relative">
                                            <select
                                                value={assignedName || ''}
                                                onChange={(e) => handleAssignmentChange(activeDayIdx, role.key, e.target.value)}
                                                disabled={loading}
                                                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3.5 font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:bg-slate-100 transition-colors appearance-none"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {roleUsers.map(u => (
                                                    <option key={u.id} value={u.name}>{u.name}</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!currentService.plan && (
                            <div className="px-8 pb-8 text-center">
                                <p className="text-xs text-slate-300 italic">
                                    Al seleccionar un miembro, se creará automáticamente el itinerario para este día.
                                </p>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

                    </div >
                </div >

            </div >
        </div >
    );
};

export default TeamRoster;
