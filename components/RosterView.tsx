
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ServicePlan, ChurchSettings, DayOfWeek, User, Role, ShiftTeam, MusicTeam } from '../types';
import { User as UserIcon, Mic2, Music, Mic, Sparkles, ChevronLeft, ChevronRight, GripVertical, Users, Settings, Plus } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import TeamManager from './TeamManager';
import { db } from '../services/firebase';
import { collection, query, getDocs } from 'firebase/firestore';

interface RosterViewProps {
    plans: ServicePlan[];
    savePlan: (plan: ServicePlan) => Promise<any>;
    settings: ChurchSettings;
    users: User[];
    onSaveSettings: (settings: ChurchSettings) => Promise<void>;
}

const ROLES_CONFIG = [
    { key: 'elder', roleType: 'ELDER' as Role, label: 'Ancianos', icon: UserIcon, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { key: 'preacher', roleType: 'PREACHER' as Role, label: 'Predicadores', icon: Mic2, color: 'bg-violet-50 text-violet-600', border: 'border-violet-100' },
    { key: 'musicDirector', roleType: 'MUSIC' as Role, label: 'Música', icon: Music, color: 'bg-pink-50 text-pink-600', border: 'border-pink-100' },
    { key: 'audioOperator', roleType: 'AUDIO' as Role, label: 'Audio', icon: Mic, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
    { key: 'teams', roleType: 'TEAM' as any, label: 'Equipos', icon: Users, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100' },
];

const RosterView: React.FC<RosterViewProps> = ({ plans, savePlan, settings, users, onSaveSettings }) => {
    const { addNotification } = useNotification();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { role, user } = useAuth();
    const [selectedRoleTab, setSelectedRoleTab] = useState('elder');
    const [showTeamManager, setShowTeamManager] = useState(false);

    // Music Groups State
    const [musicGroups, setMusicGroups] = useState<MusicTeam[]>([]);

    // Permission Logic
    const canEdit = role === 'ADMIN' || role === 'SUPER_ADMIN' || (role === 'ELDER' && selectedRoleTab === 'elder');


    // --- Fetch Music Groups ---
    useEffect(() => {
        const fetchMusicGroups = async () => {
            if (!user?.tenantId) return;
            try {
                const q = query(collection(db, 'tenants', user.tenantId, 'music_teams'));
                const snapshot = await getDocs(q);
                const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTeam));

                // Deduplicate by members to create "Unique Groups"
                const unique: MusicTeam[] = [];
                const seen = new Set<string>();

                teams.forEach(t => {
                    const key = [...t.memberIds].sort().join(',');
                    if (!seen.has(key) && t.memberIds.length > 0) {
                        seen.add(key);
                        unique.push(t); // Keep one representative
                    }
                });
                setMusicGroups(unique);
            } catch (error) {
                console.error("Error loading music groups", error);
            }
        };
        fetchMusicGroups();
    }, [user?.tenantId]);

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
    const getPlanForDate = (date: Date) => {
        const localDateStr = date.toLocaleDateString('en-CA');
        const dayPlans = plans.filter(p => p.date === localDateStr);
        if (dayPlans.length === 0) return null;
        return dayPlans.find(p => p.isActive) || dayPlans[0];
    };

    const getAssignment = (date: Date, roleKey: string) => {
        const plan = getPlanForDate(date);
        if (!plan) return null;
        return (plan.team as any)[roleKey];
    };

    // --- Drag & Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, item: User | ShiftTeam | MusicTeam, type: 'USER' | 'TEAM' | 'MUSIC_GROUP') => {
        if (!canEdit) return; // Prevent drag if not allowed
        e.dataTransfer.setData('type', type);

        if (type === 'USER') {
            const user = item as User;
            e.dataTransfer.setData('userId', user.id);
            e.dataTransfer.setData('userName', user.name);
            // Determine the mapped key for the user's role
            const config = ROLES_CONFIG.find(r => r.roleType === user.role);
            if (config) {
                e.dataTransfer.setData('roleKey', config.key);
            }
        } else if (type === 'MUSIC_GROUP') {
            const group = item as MusicTeam;
            e.dataTransfer.setData('groupId', group.id);
            e.dataTransfer.setData('groupData', JSON.stringify(group));
            e.dataTransfer.setData('roleKey', 'musicDirector'); // Target role
        } else {
            const team = item as ShiftTeam;
            e.dataTransfer.setData('teamId', team.id);
            e.dataTransfer.setData('teamData', JSON.stringify(team));
        }
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!canEdit) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (e: React.DragEvent, date: Date, targetRoleKey: string) => {
        if (!canEdit) return;
        e.preventDefault();

        const type = e.dataTransfer.getData('type');

        if (type === 'TEAM') {
            if (targetRoleKey !== 'teams') {
                // Allow dropping team anywhere? Or only when tab is Teams?
            }
            const teamData = JSON.parse(e.dataTransfer.getData('teamData')) as ShiftTeam;
            applyTeam(date, teamData);
            return;
        }

        if (type === 'MUSIC_GROUP') {
            if (targetRoleKey !== 'musicDirector') {
                addNotification('warning', 'Rol Incorrecto', 'Solo puedes asignar Grupos de Música en la pestaña de Música.');
                return;
            }
            const groupData = JSON.parse(e.dataTransfer.getData('groupData')) as MusicTeam;
            applyMusicGroup(date, groupData);
            return;
        }

        // User Drop Logic
        const volName = e.dataTransfer.getData('userName');
        const droppedRoleKey = e.dataTransfer.getData('roleKey');

        if (droppedRoleKey !== targetRoleKey) {
            addNotification('warning', 'Rol Incorrecto', `No puedes asignar esta persona a la posición de ${targetRoleKey}`);
            return;
        }

        updateAssignment(date, targetRoleKey, volName);
    };

    const applyMusicGroup = async (date: Date, group: MusicTeam) => {
        // Resolve member names
        const memberNames = group.memberIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean) as string[];

        if (memberNames.length === 0) return;

        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);

        let planToSave: ServicePlan;

        // Logic: Assign first member as "Director" (for legacy view compatibility) and ALL as "musicians"
        const newMusicData = {
            musicDirector: memberNames[0], // Leader/First
            musicians: memberNames
        };

        if (existingPlan) {
            planToSave = {
                ...existingPlan,
                team: {
                    ...existingPlan.team,
                    ...newMusicData
                }
            };
        } else {
            planToSave = {
                id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                title: `Servicio ${localDateStr}`,
                date: localDateStr,
                startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                isActive: false,
                items: [],
                tenantId: user?.tenantId,
                team: {
                    elder: '', preacher: '', audioOperator: '',
                    ...newMusicData
                },
                isRosterDraft: true
            };
        }

        try {
            await savePlan(planToSave);
            addNotification('success', 'Grupo Asignado', `Se asignaron ${memberNames.length} músicos.`);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo asignar el grupo.');
        }
    };

    const applyTeam = async (date: Date, team: ShiftTeam) => {
        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);

        let planToSave: ServicePlan;

        // Merge team members into existing team or new team
        const newTeamMembers = {
            elder: team.members.elder || '',
            preacher: team.members.preacher || '',
            musicDirector: team.members.musicDirector || '',
            audioOperator: team.members.audioOperator || '',
            teamName: team.name
        };

        if (existingPlan) {
            planToSave = {
                ...existingPlan,
                team: {
                    ...existingPlan.team,
                    ...newTeamMembers
                }
            };
        } else {
            planToSave = {
                id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                title: `Servicio ${localDateStr}`,
                date: localDateStr,
                startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                isActive: false,
                items: [],
                tenantId: user?.tenantId,
                team: newTeamMembers,
                isRosterDraft: true
            };
        }

        try {
            await savePlan(planToSave);
            addNotification('success', 'Equipo Asignado', `Se asignó el ${team.name}.`);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo asignar el equipo.');
        }
    };

    const updateAssignment = async (date: Date, roleKey: string, name: string) => {
        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);

        let planToSave: ServicePlan;

        if (existingPlan) {
            // Check if we are "Removing" (name is empty).
            // If removing musicDirector, we should probably clear musicians too?
            // Let's explicitly clear musicians if removing musicDirector
            const extraClears = (roleKey === 'musicDirector' && name === '') ? { musicians: [] } : {};

            planToSave = {
                ...existingPlan,
                team: {
                    ...existingPlan.team,
                    [roleKey]: name,
                    ...extraClears
                }
            };
        } else {
            planToSave = {
                id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                title: `Servicio ${localDateStr}`,
                date: localDateStr,
                startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                isActive: false,
                items: [],
                tenantId: user?.tenantId,
                team: {
                    elder: '', preacher: '', musicDirector: '', audioOperator: '',
                    [roleKey]: name
                },
                isRosterDraft: true
            };
        }

        try {
            await savePlan(planToSave);
            addNotification('success', 'Guardado', 'Asignación actualizada.');
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo guardar la asignación.');
        }
    };

    // --- Auto Assign Logic ---
    const handleAutoAssign = async () => {
        const targetRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);

        if (!targetRoleConfig || targetRoleConfig.key === 'teams') {
            addNotification('error', 'Error', 'Selecciona un rol específico para auto-asignar (no Equipos).');
            return;
        }

        // Skip for Music Groups for now as it's complex
        if (targetRoleConfig.key === 'musicDirector') {
            addNotification('info', 'Manual', 'Por favor asigna los grupos de música manualmente.');
            return;
        }

        addNotification('info', 'Autocompletando...', `Asignando turnos de ${targetRoleConfig.label} para este mes.`);

        let updatesCount = 0;
        const promises: Promise<any>[] = [];

        // Track locally modified plans to prevent duplicates during this batch
        const batchPlans = [...plans];

        // Helper to find candidate with least assignments
        const getBestCandidate = (candidates: User[], roleKey: string) => {
            if (candidates.length === 0) return null;

            // Count assignments in the last 60 days
            const usageCount: Record<string, number> = {};
            candidates.forEach(c => usageCount[c.id] = 0);

            const twoMonthsAgo = new Date();
            twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

            plans.forEach(p => {
                if (new Date(p.date) >= twoMonthsAgo) {
                    const assignedName = (p.team as any)[roleKey];
                    if (assignedName) {
                        const user = candidates.find(c => c.name === assignedName);
                        if (user) usageCount[user.id]++;
                    }
                }
            });

            // Also count assignments in the CURRENT batch to balance this month
            batchPlans.forEach(p => {
                const assignedName = (p.team as any)[roleKey];
                if (assignedName) {
                    const user = candidates.find(c => c.name === assignedName);
                    if (user) usageCount[user.id]++;
                }
            });

            // Sort by usage (asc) -> random
            const sorted = [...candidates].sort((a, b) => {
                const countDiff = usageCount[a.id] - usageCount[b.id];
                if (countDiff !== 0) return countDiff;
                return Math.random() - 0.5;
            });

            return sorted[0];
        };

        for (const date of serviceDates) {
            const localDateStr = date.toLocaleDateString('en-CA');

            // Check in batchPlans first (which starts as copy of plans)
            let plan = batchPlans.find(p => p.date === localDateStr);

            // If plan doesn't exist, create scaffold
            if (!plan) {
                plan = {
                    id: `auto-${Math.random().toString(36).substr(2, 9)}`,
                    title: `Servicio ${localDateStr}`,
                    date: localDateStr,
                    startTime: settings.meetingTimes[date.toLocaleDateString('es-ES', { weekday: 'long' }) as DayOfWeek] || '10:00',
                    isActive: false,
                    items: [],
                    tenantId: user?.tenantId,
                    team: { elder: '', preacher: '', musicDirector: '', audioOperator: '' },
                    isRosterDraft: true
                };
                batchPlans.push(plan); // Add to batch so next iteration sees it
            }

            const roleKey = targetRoleConfig.key as keyof typeof plan.team;

            // Only assign if the specific role slot is empty
            if (!plan.team[roleKey]) {
                // Find candidates specifically for this role
                const candidates = users.filter(u => u.role === targetRoleConfig.roleType);

                const bestCandidate = getBestCandidate(candidates, roleKey);

                if (bestCandidate) {
                    // Create a new object to save
                    const updatedPlan = {
                        ...plan,
                        team: {
                            ...plan.team,
                            [roleKey]: bestCandidate.name
                        }
                    };

                    // Update batchPlans
                    const idx = batchPlans.findIndex(p => p.id === plan!.id);
                    if (idx >= 0) batchPlans[idx] = updatedPlan;

                    promises.push(savePlan(updatedPlan));
                    updatesCount++;
                }
            }
        }

        try {
            await Promise.all(promises);
            if (updatesCount > 0) {
                addNotification('success', 'Completado', `Se asignaron ${updatesCount} turnos de ${targetRoleConfig.label} equitativamente.`);
            } else {
                addNotification('info', 'Sin cambios', `No habían espacios vacíos de ${targetRoleConfig.label} o no hay voluntarios disponibles.`);
            }
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'Hubo un problema al guardar los cambios automáticos.');
        }
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const currentRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);

    // Filter users based on selected Tab
    // Updated Logic: Include Music Groups

    let availableList: (User | ShiftTeam | MusicTeam)[] = [];

    if (selectedRoleTab === 'teams') {
        availableList = settings.teams || [];
    } else if (selectedRoleTab === 'musicDirector') {
        // Combine Groups and Individuals? Or just Groups?
        // User requested Groups. Let's show Groups FIRST, then Users.
        const folks = users.filter(u => u.role === currentRoleConfig?.roleType);
        availableList = [...musicGroups, ...folks];
    } else {
        availableList = users.filter(u => u.role === currentRoleConfig?.roleType);
    }

    const availableItems = availableList;

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-1 h-screen flex flex-col overflow-hidden pb-4">
            {/* Spacer for Global Header */}
            <div className="h-2 md:h-4 w-full flex-shrink-0"></div>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Itinerario de Turnos</h2>
                    <p className="text-slate-500">Arrastra y asigna roles a los servicios del calendario.</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowTeamManager(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Settings size={18} /> Gestionar Equipos
                    </button>
                )}
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
                        {availableItems.length > 0 ? (
                            availableItems.map((item: any) => {
                                const isTeam = selectedRoleTab === 'teams';
                                const isMusicGroup = selectedRoleTab === 'musicDirector' && 'memberIds' in item;

                                const team = item as ShiftTeam;
                                const group = item as MusicTeam;
                                const user = item as User;

                                return (
                                    <div
                                        key={isMusicGroup ? `group-${group.id}` : (isTeam ? team.id : user.id)}
                                        draggable={canEdit}
                                        onDragStart={(e) => handleDragStart(e, item, isMusicGroup ? 'MUSIC_GROUP' : (isTeam ? 'TEAM' : 'USER'))}
                                        className={`bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all group flex items-center justify-between ${canEdit ? 'hover:bg-white cursor-grab active:cursor-grabbing hover:shadow-md' : 'opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {isMusicGroup ? (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-pink-500 text-white flex-shrink-0`}>
                                                    <Users size={14} />
                                                </div>
                                            ) : (
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentRoleConfig?.color.replace('text-', 'bg-').split(' ')[0]} text-white flex-shrink-0`}>
                                                    {isTeam ? <Users size={14} /> : user.name.charAt(0)}
                                                </div>
                                            )}

                                            <div className="overflow-hidden">
                                                {isMusicGroup ? (
                                                    <>
                                                        <span className="text-xs font-bold text-slate-700 block truncate">Grupo de Música</span>
                                                        <span className="text-[10px] text-slate-400 block truncate">
                                                            {group.memberIds.length} miembros ({users.find(u => u.id === group.memberIds[0])?.name.split(' ')[0]}...)
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-700 truncate block">{isTeam ? team.name : user.name}</span>
                                                )}
                                            </div>
                                        </div>
                                        {canEdit && <GripVertical size={16} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center p-4 text-xs text-slate-400">
                                No hay {selectedRoleTab === 'teams' ? 'equipos' : 'usuarios'} disponibles.
                                <br />
                                {selectedRoleTab === 'teams' ? 'Crea uno en Gestionar Equipos.' : 'Ve a Gestión de Usuarios.'}
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
                            {canEdit && selectedRoleTab !== 'teams' && selectedRoleTab !== 'musicDirector' && (
                                <button
                                    onClick={handleAutoAssign}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> Auto Asignar {currentRoleConfig?.label}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {serviceDates.map(date => {
                                const dateNum = date.getDate();
                                const dayName = date.toLocaleString('es-ES', { weekday: 'long' });

                                const plan = getPlanForDate(date);
                                const assignedValue = getAssignment(date, selectedRoleTab);
                                // Check for musicians array if in music tab
                                const musicians = (selectedRoleTab === 'musicDirector' && plan?.team?.musicians) ? plan.team.musicians : null;


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
                                            min-h-[8rem] rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 p-2
                                            ${(selectedRoleTab !== 'teams' && assignedValue)
                                                        ? 'border-indigo-200 bg-indigo-50/30'
                                                        : canEdit ? 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50' : 'border-slate-100 bg-slate-50/50'
                                                    }
                                        `}
                                            >
                                                {selectedRoleTab === 'teams' ? (
                                                    getAssignment(date, 'teamName') ? (
                                                        <>
                                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm bg-indigo-500 text-white">
                                                                <Users size={20} />
                                                            </div>
                                                            <span className="font-bold text-slate-700">{getAssignment(date, 'teamName')}</span>
                                                            <div className="flex gap-1 justify-center mt-1">
                                                                {['elder', 'preacher', 'musicDirector', 'audioOperator'].map(r => {
                                                                    const val = getAssignment(date, r);
                                                                    return val ? (
                                                                        <div key={r} className="w-1.5 h-1.5 rounded-full bg-indigo-300" title={`${r}: ${val}`} />
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <p className="text-xs text-slate-400 mb-2">Arrastra un equipo para asignar todos los roles.</p>
                                                            {/* Preview current assignments */}
                                                            <div className="flex gap-1 justify-center">
                                                                {['elder', 'preacher', 'musicDirector', 'audioOperator'].map(r => {
                                                                    const val = getAssignment(date, r);
                                                                    return val ? (
                                                                        <div key={r} className="w-2 h-2 rounded-full bg-slate-300" title={`${r}: ${val}`} />
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </div>
                                                    )
                                                ) : assignedValue ? (
                                                    <>
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${currentRoleConfig?.color.replace('text-', 'bg-').split(' ')[0]} text-white flex-shrink-0`}>
                                                            {assignedValue.charAt(0)}
                                                        </div>

                                                        {/* Specialized View for Music Group */}
                                                        {musicians ? (
                                                            <div className="text-center">
                                                                <span className="font-bold text-slate-700 text-sm">{assignedValue}</span>
                                                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                                                    {musicians.slice(0, 3).map((m: string) => ( // Use slice to avoid overflow
                                                                        <span key={m} className="text-[10px] bg-white/50 px-1 rounded text-slate-500">{m.split(' ')[0]}</span>
                                                                    ))}
                                                                    {musicians.length > 3 && <span className="text-[10px] text-slate-400">+{musicians.length - 3}</span>}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="font-bold text-slate-700 text-center">{assignedValue}</span>
                                                        )}

                                                        {canEdit && (
                                                            <button
                                                                onClick={() => updateAssignment(date, selectedRoleTab, '')}
                                                                className="text-[10px] text-red-400 font-bold hover:underline"
                                                            >
                                                                Remover
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-xs text-slate-400 text-center">{canEdit ? 'Arrastra un miembro aquí' : 'Sin asignar'}</p>
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

            {showTeamManager && (
                <TeamManager
                    settings={settings}
                    users={users}
                    onSave={onSaveSettings}
                    onClose={() => setShowTeamManager(false)}
                />
            )}
        </div>
    );
};

export default RosterView;
