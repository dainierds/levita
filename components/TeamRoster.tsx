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
                    {/* Roles Grid */}
                        <div className="p-8 grid grid-cols-2 gap-6">x-4 py-3.5 font-bold text-slate-700 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:bg-slate-100 transition-colors appearance-none"
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
                        </div >

    {!currentService.plan && (
        <div className="px-8 pb-8 text-center">
            <p className="text-xs text-slate-300 italic">
                Al seleccionar un miembro, se creará automáticamente el itinerario para este día.
            </p>
        </div>
    )}

                    </div >
                </div >

            </div >
        </div >
    );
};

export default TeamRoster;
