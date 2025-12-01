
import React, { useState, useEffect } from 'react';
import { ServicePlan, ChurchSettings, DayOfWeek, User, Role } from '../types';
import { User as UserIcon, Mic2, Music, Mic, Sparkles, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useNotification } from './NotificationSystem';

interface RosterViewProps {
    plans: ServicePlan[];
    setPlans: React.Dispatch<React.SetStateAction<ServicePlan[]>>;
    settings: ChurchSettings;
    users: User[];
}

const ROLES_CONFIG = [
    { key: 'elder', roleType: 'ELDER' as Role, label: 'Ancianos', icon: UserIcon, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { key: 'preacher', roleType: 'PREACHER' as Role, label: 'Predicadores', icon: Mic2, color: 'bg-violet-50 text-violet-600', border: 'border-violet-100' },
    { key: 'musicDirector', roleType: 'MUSIC' as Role, label: 'Música', icon: Music, color: 'bg-pink-50 text-pink-600', border: 'border-pink-100' },
    { key: 'audioOperator', roleType: 'AUDIO' as Role, label: 'Audio', icon: Mic, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
];

const RosterView: React.FC<RosterViewProps> = ({ plans, setPlans, settings, users }) => {
    const { addNotification } = useNotification();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedRoleTab, setSelectedRoleTab] = useState('elder');

    // --- Date Logic ---
    const getMonthName = (date: Date) => date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const getServiceDaysInMonth = () => {
        const days: Date[] = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);

        while (date.getMonth() === month) {
            // Check if this day of week is a Roster Day (e.g., 'Domingo')
            const dayName = date.toLocaleString('es-ES', { weekday: 'long' });
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

            if (settings.rosterDays.includes(capitalizedDay as DayOfWeek)) {
                days.push(new Date(date));
            }
            date.setDate(date.getDate() + 1);
        }
        return days;
    };

    const serviceDates = getServiceDaysInMonth();

    // --- Helper to get assigned person for a specific date and role ---
    const getAssignment = (date: Date, roleKey: string) => {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD matches plan date format roughly or simplified
        const localDateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const plan = plans.find(p => p.date === localDateStr);
        if (!plan) return null;
        return (plan.team as any)[roleKey];
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, user: User) => {
        e.dataTransfer.setData('userId', user.id);
        e.dataTransfer.setData('userName', user.name);
        // Determine the mapped key for the user's role
        const config = ROLES_CONFIG.find(r => r.roleType === user.role);
        if (config) {
            e.dataTransfer.setData('roleKey', config.key);
        }
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent, date: Date, targetRoleKey: string) => {
        e.preventDefault();
        const volName = e.dataTransfer.getData('userName');
        const droppedRoleKey = e.dataTransfer.getData('roleKey');

        // Validation: Can only drop if roles match
        // Note: The drag source roleKey must match the drop targetRoleKey
        if (droppedRoleKey !== targetRoleKey) {
            addNotification('warning', 'Rol Incorrecto', `No puedes asignar esta persona a la posición de ${targetRoleKey}`);
            return;
        }

        updateAssignment(date, targetRoleKey, volName);
    };

    const updateAssignment = (date: Date, roleKey: string, name: string) => {
        const localDateStr = date.toLocaleDateString('en-CA');

        setPlans(prevPlans => {
            const existingPlanIndex = prevPlans.findIndex(p => p.date === localDateStr);
            if (existingPlanIndex >= 0) {
                // Update existing
                const newPlans = [...prevPlans];
                newPlans[existingPlanIndex] = {
                    ...newPlans[existingPlanIndex],
                    team: {
                        ...newPlans[existingPlanIndex].team,
                        [roleKey]: name
                    }
                };
                return newPlans;
            } else {
                // Create new plan scaffold
                const newPlan: ServicePlan = {
                    id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Servicio ${localDateStr}`,
                    date: localDateStr,
                    startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                    isActive: false,
                    items: [], // Empty liturgy
                    team: {
                        elder: '', preacher: '', musicDirector: '', audioOperator: '',
                        [roleKey]: name // Assign the dropped user
                    }
                };
                return [...prevPlans, newPlan];
            }
        });
    };

    // --- Auto Assign Logic ---
    const handleAutoAssign = () => {
        const targetRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);

        if (!targetRoleConfig) {
            addNotification('error', 'Error', 'Selecciona una pestaña de rol válida.');
            return;
        }

        addNotification('info', 'Autocompletando...', `Asignando turnos de ${targetRoleConfig.label} para este mes.`);

        let updatesCount = 0;

        const newPlans = [...plans];

        serviceDates.forEach(date => {
            const localDateStr = date.toLocaleDateString('en-CA');
            let planIndex = newPlans.findIndex(p => p.date === localDateStr);
            let plan = planIndex >= 0 ? newPlans[planIndex] : {
                id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                title: `Servicio ${localDateStr}`,
                date: localDateStr,
                startTime: '10:00',
                isActive: false,
                items: [],
                team: { elder: '', preacher: '', musicDirector: '', audioOperator: '' }
            };

            const roleKey = targetRoleConfig.key as keyof typeof plan.team;

            // Only assign if the specific role slot is empty
            if (!plan.team[roleKey]) {
                // Find candidates specifically for this role
                const candidates = users.filter(u => u.role === targetRoleConfig.roleType);

                if (candidates.length > 0) {
                    // Ensure randomness but try not to repeat same person consecutive weeks if possible (simple random for now)
                    const randomUser = candidates[Math.floor(Math.random() * candidates.length)];
                    plan.team[roleKey] = randomUser.name;
                    updatesCount++;
                }
            }

            if (planIndex >= 0) {
                newPlans[planIndex] = plan as ServicePlan;
            } else {
                newPlans.push(plan as ServicePlan);
            }
        });

        setPlans(newPlans);

        setTimeout(() => {
            if (updatesCount > 0) {
                addNotification('success', 'Completado', `Se asignaron ${updatesCount} turnos de ${targetRoleConfig.label}.`);
            } else {
                addNotification('info', 'Sin cambios', `No habían espacios vacíos de ${targetRoleConfig.label} o no hay voluntarios disponibles.`);
            }
        }, 500);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const currentRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);

    // Filter users based on selected Tab
    // currentRoleConfig.roleType is what we need to match against user.role
    const availableVolunteers = users.filter(u => u.role === currentRoleConfig?.roleType);

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-6 h-screen flex flex-col overflow-hidden pb-4">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Itinerario de Turnos</h2>
                    <p className="text-slate-500">Arrastra y asigna roles a los servicios del calendario.</p>
                </div>
            </div>

            {/* Role Tabs */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar p-2 flex-shrink-0">
                {ROLES_CONFIG.map(role => (
                    <button
                        key={role.key}
                        onClick={() => setSelectedRoleTab(role.key)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all border ${selectedRoleTab === role.key
                            ? `${role.color} ${role.border} shadow-sm ring-1 ring-offset-2 ring-offset-slate-50`
                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                            }`}
                    >
                        <role.icon size={20} />
                        <span className="font-bold">{role.label}</span>
                    </button>
                ))}
            </div>

            {/* Main Content: Split View */}
            <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">

                {/* Left Col: Source List (Scrollable) */}
                <div className="lg:w-64 flex-shrink-0 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800">Disponibles</h3>
                        <p className="text-xs text-slate-400">Arrastra al calendario</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
                        {availableVolunteers.length > 0 ? (
                            availableVolunteers.map(vol => (
                                <div
                                    key={vol.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, vol)}
                                    className="bg-slate-50 hover:bg-white border border-slate-100 p-4 rounded-2xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentRoleConfig?.color.replace('text-', 'bg-').split(' ')[0]} text-white`}>
                                            {vol.name.charAt(0)}
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">{vol.name}</span>
                                    </div>
                                    <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400" />
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-4 text-xs text-slate-400">
                                No hay usuarios con el rol <span className="font-bold">{currentRoleConfig?.label}</span>.
                                <br />Ve a Gestión de Usuarios para crearlos.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Col: Calendar Grid (Scrollable) */}
                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">

                    {/* Toolbar */}
                    <div className="p-6 flex justify-between items-center border-b border-slate-50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                            <h3 className="text-xl font-bold text-slate-800 capitalize w-48 text-center">{getMonthName(currentDate)}</h3>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                                Historial
                            </button>
                            <button
                                onClick={handleAutoAssign}
                                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2"
                            >
                                <Sparkles size={14} /> Auto Asignar {currentRoleConfig?.label}
                            </button>
                            <button className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200">
                                + Asignar Manual
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {serviceDates.map(date => {
                                const dateNum = date.getDate();
                                const dayName = date.toLocaleString('es-ES', { weekday: 'long' });

                                return (
                                    <div key={date.toISOString()} className="border border-slate-100 rounded-3xl p-5 hover:shadow-lg transition-shadow bg-white">
                                        <div className="mb-4">
                                            <span className="text-sm font-bold text-slate-800 capitalize">{dayName} <span className="text-2xl ml-1">{dateNum}</span></span>
                                        </div>

                                        {/* Slot Container */}
                                        <div className="space-y-3">
                                            <div
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDrop(e, date, selectedRoleTab)}
                                                className={`
                                            h-32 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2
                                            ${getAssignment(date, selectedRoleTab)
                                                        ? 'border-indigo-200 bg-indigo-50/30'
                                                        : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
                                                    }
                                        `}
                                            >
                                                {getAssignment(date, selectedRoleTab) ? (
                                                    <>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${currentRoleConfig?.color.replace('text-', 'bg-').split(' ')[0]} text-white`}>
                                                            {getAssignment(date, selectedRoleTab)?.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-700">{getAssignment(date, selectedRoleTab)}</span>
                                                        <button
                                                            onClick={() => updateAssignment(date, selectedRoleTab, '')}
                                                            className="text-[10px] text-red-400 font-bold hover:underline"
                                                        >
                                                            Remover
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-xs text-slate-400">Arrastra un miembro aquí</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {serviceDates.length === 0 && (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                No hay servicios configurados para este mes.
                            </div>
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
};

export default RosterView;
