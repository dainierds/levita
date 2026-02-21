import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User, ChurchSettings, ServicePlan, DayOfWeek, Role } from '../types';
import { UserCheck, Mic2, Music, Mic, ChevronRight, Calendar, Info, CheckCircle2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamRosterProps {
    settings: ChurchSettings;
    plans: ServicePlan[];
}

const ROLES_CONFIG = [
    { key: 'elder', translationKey: 'role.elder', icon: UserCheck, color: 'text-blue-500 bg-blue-50', border: 'border-blue-100' },
    { key: 'sabbathSchoolTeacher', translationKey: 'role.teacher', icon: BookOpen, color: 'text-emerald-500 bg-emerald-50', border: 'border-emerald-100' },
    { key: 'preacher', translationKey: 'role.preacher', icon: Mic2, color: 'text-purple-500 bg-purple-50', border: 'border-purple-100' },
    { key: 'audioOperator', translationKey: 'role.audio', icon: Mic, color: 'text-orange-500 bg-orange-50', border: 'border-orange-100' },
];

const TeamRoster: React.FC<TeamRosterProps> = ({ settings, plans }) => {
    const { t, language } = useLanguage();
    const { user: currentUser } = useAuth();
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [upcomingServices, setUpcomingServices] = useState<{ dayName: string; date: Date; plan: ServicePlan | null }[]>([]);

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
        if (targetDay === undefined) return date;

        const currentDay = date.getDay();

        let daysUntil = targetDay - currentDay;
        // If today matches, show today. If past, show next week.
        if (daysUntil < 0) daysUntil += 7;

        date.setDate(date.getDate() + daysUntil);
        return date;
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
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-8 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <UserCheck className="text-indigo-600" size={40} />
                        {t('team_manager.title') || "Equipo de Turno"}
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 ml-1 pt-1 border-t border-slate-100 inline-block">
                        {t('team_manager.subtitle') || "Asignaciones automáticas basadas en el calendario de turnos."}
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* LEFT: Service Selector (Tabs) */}
                <div className="w-full lg:w-80 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Próximos Servicios</h3>
                    {upcomingServices.map((service, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveDayIdx(idx)}
                            className={`flex items-center gap-4 p-4 rounded-[2.5rem] text-left transition-all group relative overflow-hidden ${activeDayIdx === idx
                                ? 'bg-white shadow-2xl shadow-indigo-100 ring-1 ring-indigo-100 translate-x-1'
                                : 'bg-white/50 hover:bg-white hover:shadow-lg text-slate-500 border border-transparent'
                                }`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${activeDayIdx === idx
                                ? 'bg-indigo-600 text-white border-indigo-400 rotate-3'
                                : 'bg-slate-50 text-slate-400 border-slate-200 group-hover:border-indigo-200'
                                }`}>
                                <span className="text-xl font-black">{service.date.getDate()}</span>
                                <span className="text-[9px] font-black uppercase tracking-tighter">{service.date.toLocaleString(language || 'es', { month: 'short' }).replace('.', '')}</span>
                            </div>

                            <div className="flex-1">
                                <h4 className={`font-black text-lg capitalize tracking-tight ${activeDayIdx === idx ? 'text-indigo-900' : 'text-slate-600'}`}>
                                    {service.dayName}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${activeDayIdx === idx ? 'text-indigo-500' : 'text-slate-400'}`}>
                                        {service.plan ? 'Programado' : 'Sin asignar'}
                                    </span>
                                    {service.plan?.isActive && (
                                        <span className="flex items-center gap-1 text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full animate-pulse">
                                            <CheckCircle2 size={8} /> LIVE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {activeDayIdx === idx && (
                                <motion.div layoutId="active-indicator" className="absolute right-0 top-2 bottom-2 w-1.5 bg-indigo-600 rounded-l-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* RIGHT: Team Editor Card */}
                <div className="flex-1 w-full">
                    <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[500px] flex flex-col group/card">

                        {/* Card Header */}
                        <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center relative">
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black text-slate-800 capitalize flex items-center gap-3 tracking-tight">
                                    Equipo del {currentService.dayName}
                                    {currentService.plan?.isActive && (
                                        <span className="bg-green-500 text-white text-[11px] px-3 py-1.5 rounded-full font-black shadow-lg shadow-green-200 animate-pulse">
                                            EN VIVO
                                        </span>
                                    )}
                                </h3>
                                <p className="text-slate-400 text-lg font-bold mt-1 tracking-tight">
                                    {currentService.date.toLocaleDateString(language || 'es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                            </div>
                            <Calendar className="absolute right-10 top-10 text-slate-100 w-24 h-24 rotate-12 -z-0 opacity-50 group-hover/card:scale-110 group-hover/card:text-indigo-50 transition-all duration-700" />
                        </div>

                        {/* Roles Grid */}
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {ROLES_CONFIG.map(roleItem => {
                                const assignedName = currentService.plan ? (currentService.plan.team as any)[roleItem.key] : '';

                                return (
                                    <div key={roleItem.key} className={`p-8 rounded-[2.5rem] border-2 transition-all duration-300 hover:scale-[1.02] ${roleItem.border} bg-white group/item shadow-sm hover:shadow-xl hover:shadow-slate-100`}>
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover/item:rotate-6 ${roleItem.color}`}>
                                                <roleItem.icon size={28} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t(roleItem.translationKey) || roleItem.key}</span>
                                                <span className="font-black text-xl text-slate-800 tracking-tight leading-none mt-1">{t(`role.${roleItem.key}`) || roleItem.key}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 flex items-center justify-between group-hover/item:bg-white group-hover/item:border-indigo-100 transition-colors">
                                            {assignedName ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100">
                                                        {assignedName.charAt(0)}
                                                    </div>
                                                    <span className="text-xl font-black text-slate-700 tracking-tight">{assignedName}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 font-bold italic text-lg tracking-tight">{t('common.tbd') || "por definir"}</span>
                                            )}
                                            {assignedName && (
                                                <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                                                    <CheckCircle2 size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!currentService.plan && (
                            <div className="px-10 pb-10 text-center">
                                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 inline-flex items-center gap-3">
                                    <Info className="text-amber-500" size={18} />
                                    <p className="text-xs text-amber-700 font-bold tracking-tight">
                                        No hay información disponible para este día en el calendario de turnos.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default TeamRoster;
