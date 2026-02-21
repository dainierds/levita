import React, { useState, useEffect } from 'react';
import { ChurchSettings, ServicePlan, User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Users, X, User as UserIcon, Mic2, Mic, CheckCircle2, BookOpen } from 'lucide-react';

interface TeamManagerProps {
    settings: ChurchSettings;
    plans: ServicePlan[];
    onClose: () => void;
}

const ROLES = [
    { key: 'elder', translationKey: 'role.elder', icon: UserIcon },
    { key: 'preacher', translationKey: 'role.preacher', icon: Mic2 },
    { key: 'sabbathSchoolTeacher', translationKey: 'role.sabbathSchoolTeacher', icon: BookOpen },
    { key: 'audioOperator', translationKey: 'role.audioOperator', icon: Mic },
];

const TeamManager: React.FC<TeamManagerProps> = ({ settings, plans, onClose }) => {
    const { t, language } = useLanguage();
    const [upcomingPlans, setUpcomingPlans] = useState<{ dayName: string; date: Date; plan: ServicePlan | null }[]>([]);

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
        setUpcomingPlans(calculated);
    };

    const getNextDayOfWeek = (dayName: string) => {
        const daysMap: { [key: string]: number } = {
            'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
        };
        const targetDay = daysMap[dayName];
        const date = new Date();
        const currentDay = date.getDay();

        if (targetDay === undefined) return date;

        let daysUntil = targetDay - currentDay;
        if (daysUntil < 0) daysUntil += 7;

        date.setDate(date.getDate() + daysUntil);
        return date;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-5xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col border border-white/20">

                <div className="flex justify-between items-center mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Users className="text-indigo-600" size={32} />
                            {t('team_manager.title') || "Equipo de Turno"}
                        </h3>
                        <p className="text-slate-500 mt-1 ml-11">
                            {t('team_manager.subtitle') || "Asignaciones automáticas basadas en el calendario de turnos."}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                        {upcomingPlans.map(({ dayName, date, plan }) => (
                            <div key={dayName} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col group hover:border-indigo-100 transition-colors">
                                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center text-indigo-600">
                                            <span className="text-2xl font-bold">{date.getDate()}</span>
                                            <span className="text-[10px] font-bold uppercase text-slate-400">{date.toLocaleString(language || 'es', { month: 'short' }).replace('.', '')}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-2xl font-bold text-slate-800 capitalize">{dayName}</h4>
                                                {plan?.isActive && (
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                        <CheckCircle2 size={10} /> {t('common.active') || "ACTIVO"}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">
                                                {t('team_manager.next_service') || "Próximo Servicio"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 grid grid-cols-1 gap-6">
                                    {ROLES.map(role => {
                                        const assignedName = plan ? (plan.team as any)[role.key] : '';

                                        return (
                                            <div key={role.key} className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    <role.icon size={12} className="text-indigo-400" />
                                                    {t(role.translationKey)}
                                                </label>
                                                <div className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-between group/item hover:bg-indigo-50/50 transition-colors">
                                                    {assignedName ? (
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                                {assignedName.charAt(0)}
                                                            </div>
                                                            <span className="text-lg font-bold text-slate-700">{assignedName}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 font-medium italic">{t('common.tbd') || "por definir"}</span>
                                                    )}
                                                    {assignedName && (
                                                        <CheckCircle2 size={18} className="text-indigo-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    )}
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
