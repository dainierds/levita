import React, { useState, useEffect } from 'react';
import { ChurchSettings, ServicePlan, User, DayOfWeek } from '../types';
import { Users, X, Calendar, User as UserIcon, Mic2, Music, Mic, ChevronRight, Edit2, CheckCircle2, MousePointer2 } from 'lucide-react';

interface TeamManagerProps {
    settings: ChurchSettings;
    users: User[];
    plans: ServicePlan[];
    savePlan: (plan: ServicePlan) => Promise<any>;
    onSave: (settings: ChurchSettings) => Promise<void>;
    onClose: () => void;
}

const ROLES = [
    { key: 'elder', label: 'Anciano', icon: UserIcon, role: 'ELDER' },
    { key: 'preacher', label: 'Predicador', icon: Mic2, role: 'PREACHER' },
    { key: 'esMaster', label: 'Maestro de ES', icon: MousePointer2, role: 'ES_MASTER' }, // Updated from musicDirector
    { key: 'audioOperator', label: 'Audio', icon: Mic, role: 'AUDIO' },
];

const TeamManager: React.FC<TeamManagerProps> = ({ settings, users, plans, savePlan, onSave, onClose }) => {
    // We strictly follow the rule: One team/card per Meeting Day
    const [upcomingPlans, setUpcomingPlans] = useState<{ dayName: string; date: Date; plan: ServicePlan | null }[]>([]);
    const [loading, setLoading] = useState(false);

    // Calculate dates on mount
    useEffect(() => {
        calculateUpcomingDates();
    }, [settings.meetingDays, plans]);

    const calculateUpcomingDates = () => {
        const calculated = settings.meetingDays.map(dayName => {
            const date = getNextDayOfWeek(dayName);
            const localDateStr = date.toLocaleDateString('en-CA');
            const foundPlan = plans.find(p => p.date === localDateStr); // Match exact date
            return {
                dayName,
                date,
                plan: foundPlan || null
            };
        });
        setUpcomingPlans(calculated);
    };

    const getNextDayOfWeek = (dayName: string) => {
        const daysMap: { [key: string]: number } = {
            'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };
        const targetDay = daysMap[dayName];
        const date = new Date();
        const currentDay = date.getDay();

        let daysUntil = targetDay - currentDay;
        if (daysUntil <= 0) { // If today is the day, assume NEXT week? Or Today? 
            // Usually "Upcoming" includes today if service hasn't happened.
            // Let's assume if daysUntil < 0 (past in week), add 7. If 0 (today), keep 0.
            if (daysUntil < 0) daysUntil += 7;
        }
        date.setDate(date.getDate() + daysUntil);
        return date;
    };

    const handleAssignmentChange = async (plan: ServicePlan | null, date: Date, roleKey: string, userName: string) => {
        setLoading(true);
        try {
            const localDateStr = date.toLocaleDateString('en-CA');

            // If plan exists, update it. If not, CREATE it.
            let planToSave: ServicePlan;

            if (plan) {
                planToSave = {
                    ...plan,
                    team: {
                        ...plan.team,
                        [roleKey]: userName
                    }
                };
            } else {
                // Create skeleton plan
                planToSave = {
                    id: `auto-team-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Servicio ${localDateStr}`,
                    date: localDateStr,
                    startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                    isActive: false,
                    items: [],
                    tenantId: users[0]?.tenantId || '', // Fallback tenant
                    team: {
                        elder: '', preacher: '', musicDirector: '', audioOperator: '',
                        [roleKey]: userName
                    },
                    isRosterDraft: true
                };
            }

            await savePlan(planToSave);
            // Refresh local state handled by parent re-render (plans prop update)
        } catch (error) {
            console.error("Failed to update plan", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col border border-white/20">

                <div className="flex justify-between items-center mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="text-indigo-600" size={32} />
                            Gestión de Equipos
                        </h3>
                        <p className="text-slate-500 mt-1 ml-11">
                            Crea los equipos de la semana. El más cercano será el activo por defecto.
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {upcomingPlans.map(({ dayName, date, plan }) => (
                            <div key={dayName} className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group hover:border-indigo-100 transition-colors">
                                {/* Header Card */}
                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center text-indigo-600">
                                            <span className="text-2xl font-bold">{date.getDate()}</span>
                                            <span className="text-[10px] font-bold uppercase text-slate-400">{date.toLocaleString('es-ES', { month: 'short' }).replace('.', '')}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-2xl font-bold text-slate-800 capitalize">{dayName}</h4>
                                                {plan?.isActive && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> ACTIVO
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">
                                                Próximo Servicio
                                            </p>
                                        </div>
                                    </div>
                                    {plan && (
                                        <button className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                </div>

                                {/* Form Grid */}
                                <div className="p-8 grid grid-cols-1 gap-6">
                                    {ROLES.map(role => {
                                        const assignedName = plan ? (plan.team as any)[role.key] : '';
                                        const roleUsers = users.filter(u => u.role === role.role);

                                        return (
                                            <div key={role.key} className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <role.icon size={12} className="text-indigo-400" />
                                                    {role.label}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={assignedName || ''}
                                                        onChange={(e) => handleAssignmentChange(plan, date, role.key, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer hover:bg-white transition-colors"
                                                        disabled={loading}
                                                    >
                                                        <option value="">-- Sin Asignar --</option>
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
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeamManager;
