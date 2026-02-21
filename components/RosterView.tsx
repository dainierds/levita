import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ServicePlan, ChurchSettings, DayOfWeek, User, Role, ShiftTeam, MusicTeam } from '../types';
import { User as UserIcon, Mic2, Music, Mic, Sparkles, ChevronLeft, ChevronRight, GripVertical, Users, Settings, Plus, BookOpen } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import TeamManager from './TeamManager';
import { db } from '../services/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { parsePreacherScheduleFromDocument, PreacherAssignment } from '../services/geminiService';

interface RosterViewProps {
    plans: ServicePlan[];
    savePlan: (plan: ServicePlan) => Promise<any>;
    settings: ChurchSettings;
    users: User[];
    onSaveSettings: (settings: ChurchSettings) => Promise<void>;
}

const ROLES_CONFIG = [
    { key: 'elder', roleType: 'ELDER' as Role, translationKey: 'role.elder', defaultLabel: 'Ancianos', icon: UserIcon, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
    { key: 'sabbathSchoolTeacher', roleType: 'TEACHER' as Role, translationKey: 'role.teacher', defaultLabel: 'Maestros ES', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
    { key: 'preacher', roleType: 'PREACHER' as Role, translationKey: 'role.preacher', defaultLabel: 'Predicadores', icon: Mic2, color: 'bg-violet-50 text-violet-600', border: 'border-violet-100' },
    { key: 'audioOperator', roleType: 'AUDIO' as Role, translationKey: 'role.audio', defaultLabel: 'Audio', icon: Mic, color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
];

const RosterView: React.FC<RosterViewProps> = ({ plans, savePlan, settings, users, onSaveSettings }) => {
    const { addNotification } = useNotification();
    const { t, language } = useLanguage();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { role, user } = useAuth();
    const [selectedRoleTab, setSelectedRoleTab] = useState('elder');
    const [showTeamManager, setShowTeamManager] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // AI Import Handler
    const handleImportPreachers = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        addNotification('info', t('roster.processing') || 'Procesando...', t('roster.ai_reading') || 'La IA está leyendo el documento. Por favor espera.');

        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const assignments = await parsePreacherScheduleFromDocument(file, year, month);

            console.log("AI Parsed Assignments:", assignments);

            if (assignments.length === 0) {
                addNotification('warning', t('roster.no_results_title') || 'Sin resultados', t('roster.no_results_desc') || 'No se encontraron asignaciones válidas en el documento.');
                setIsImporting(false);
                return;
            }

            let successCount = 0;
            const affectedDates: string[] = [];

            for (const item of assignments) {
                const [y, m, d] = item.date.split('-').map(Number);
                const itemDate = new Date(y, m - 1, d);
                await updateAssignment(itemDate, 'preacher', item.preacher);
                successCount++;
                affectedDates.push(item.date);
            }

            const distinctMonths = new Set(affectedDates.map(d => d.slice(0, 7))).size;
            addNotification('success', t('roster.import_success') || 'Importación Exitosa', t('roster.import_stats', { count: successCount.toString(), months: distinctMonths.toString() }) || `Se asignaron ${successCount} turnos.`);

        } catch (error: any) {
            console.error("Import Error:", error);
            addNotification('error', t('roster.import_error') || 'Error de Importación', error.message || 'No se pudo procesar el documento.');
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const [musicGroups, setMusicGroups] = useState<MusicTeam[]>([]);
    const canEdit = role === 'ADMIN' || role === 'SUPER_ADMIN' || (role === 'ELDER' && selectedRoleTab === 'elder');

    useEffect(() => {
        const fetchMusicGroups = async () => {
            if (!user?.tenantId) return;
            try {
                const q = query(collection(db, 'tenants', user.tenantId, 'music_teams'));
                const snapshot = await getDocs(q);
                const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTeam));

                const unique: MusicTeam[] = [];
                const seen = new Set<string>();

                teams.forEach(t => {
                    const key = [...t.memberIds].sort().join(',');
                    if (!seen.has(key) && t.memberIds.length > 0) {
                        seen.add(key);
                        unique.push(t);
                    }
                });
                setMusicGroups(unique);
            } catch (error) {
                console.error("Error loading music groups", error);
            }
        };
        fetchMusicGroups();
    }, [user?.tenantId]);

    const getMonthName = (date: Date) => date.toLocaleString(language || 'es', { month: 'long', year: 'numeric' });

    const getServiceDaysInMonth = () => {
        const days: Date[] = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const date = new Date(year, month, 1);

        while (date.getMonth() === month) {
            // Using 'es-ES' for logic consistency with settings if keys are Spanish
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

    const handleDragStart = (e: React.DragEvent, item: User | ShiftTeam | MusicTeam, type: 'USER' | 'TEAM' | 'MUSIC_GROUP') => {
        if (!canEdit) return;
        e.dataTransfer.setData('type', type);

        if (type === 'USER') {
            const user = item as User;
            e.dataTransfer.setData('userId', user.id);
            e.dataTransfer.setData('userName', user.name);
            const config = ROLES_CONFIG.find(r => r.roleType === user.role);
            if (config) {
                e.dataTransfer.setData('roleKey', config.key);
            }
        } else if (type === 'MUSIC_GROUP') {
            const group = item as MusicTeam;
            e.dataTransfer.setData('groupId', group.id);
            e.dataTransfer.setData('groupData', JSON.stringify(group));
            e.dataTransfer.setData('roleKey', 'musicDirector');
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
            const teamData = JSON.parse(e.dataTransfer.getData('teamData')) as ShiftTeam;
            applyTeam(date, teamData);
            return;
        }

        if (type === 'MUSIC_GROUP') {
            if (targetRoleKey !== 'musicDirector') {
                addNotification('warning', t('roster.wrong_role') || 'Rol Incorrecto', t('roster.music_group_warning') || 'Solo puedes asignar Grupos de Música en la pestaña de Música.');
                return;
            }
            const groupData = JSON.parse(e.dataTransfer.getData('groupData')) as MusicTeam;
            applyMusicGroup(date, groupData);
            return;
        }

        const volName = e.dataTransfer.getData('userName');
        const droppedRoleKey = e.dataTransfer.getData('roleKey');

        if (droppedRoleKey !== targetRoleKey) {
            addNotification('warning', t('roster.wrong_role') || 'Rol Incorrecto', t('roster.role_mismatch_warning', { role: targetRoleKey }) || `No puedes asignar esta persona a la posición de ${targetRoleKey}`);
            return;
        }

        updateAssignment(date, targetRoleKey, volName);
    };

    const applyMusicGroup = async (date: Date, group: MusicTeam) => {
        const memberNames = group.memberIds.map(id => users.find(u => u.id === id)?.name).filter(Boolean) as string[];

        if (memberNames.length === 0) return;

        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);
        let planToSave: ServicePlan;

        const newMusicData = {
            musicDirector: memberNames[0],
            musicians: memberNames
        };

        if (existingPlan) {
            planToSave = {
                ...existingPlan,
                team: { ...existingPlan.team, ...newMusicData }
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
                team: { elder: '', preacher: '', audioOperator: '', ...newMusicData },
                isRosterDraft: true
            };
        }

        try {
            await savePlan(planToSave);
            addNotification('success', t('roster.group_assigned') || 'Grupo Asignado', t('roster.assigned_musicians', { count: memberNames.length.toString() }) || `Se asignaron ${memberNames.length} músicos.`);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', t('common.error_generic') || 'No se pudo guardar.');
        }
    };

    const applyTeam = async (date: Date, team: ShiftTeam) => {
        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);
        let planToSave: ServicePlan;

        const newTeamMembers = {
            elder: team.members.elder || '',
            preacher: team.members.preacher || '',
            musicDirector: team.members.musicDirector || '',
            audioOperator: team.members.audioOperator || '',
            sabbathSchoolTeacher: team.members.sabbathSchoolTeacher || '',
            teamName: team.name
        };

        if (existingPlan) {
            planToSave = {
                ...existingPlan,
                team: { ...existingPlan.team, ...newTeamMembers }
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
            addNotification('success', t('roster.team_assigned') || 'Equipo Asignado', t('roster.assigned_team_name', { name: team.name }) || `Se asignó el ${team.name}.`);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', t('common.error_generic') || 'No se pudo guardar.');
        }
    };

    const updateAssignment = async (date: Date, roleKey: string, name: string) => {
        const localDateStr = date.toLocaleDateString('en-CA');
        const existingPlan = getPlanForDate(date);
        let planToSave: ServicePlan;

        if (existingPlan) {
            const extraClears = (roleKey === 'musicDirector' && name === '') ? { musicians: [] } : {};
            planToSave = {
                ...existingPlan,
                team: { ...existingPlan.team, [roleKey]: name, ...extraClears }
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
                team: { elder: '', preacher: '', musicDirector: '', audioOperator: '', [roleKey]: name },
                isRosterDraft: true
            };
        }

        try {
            await savePlan(planToSave);
            addNotification('success', t('common.saved') || 'Guardado', t('roster.assignment_updated') || 'Asignación actualizada.');
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', t('common.error_generic') || 'No se pudo guardar.');
        }
    };

    const [showAutoAssignModal, setShowAutoAssignModal] = useState(false);

    const handleAutoAssignClick = () => {
        setShowAutoAssignModal(true);
    };

    const confirmAutoAssign = async (selectedDayName: string) => {
        const targetRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);
        if (!targetRoleConfig || targetRoleConfig.key === 'teams') return;

        setShowAutoAssignModal(false);
        addNotification('info', t('roster.auto_assigning') || 'Autocompletando...', t('roster.assigning_turns') || 'Asignando turnos...');

        const poolIds = settings.dayPools?.[selectedDayName]?.[targetRoleConfig.key] || [];

        if (poolIds.length === 0) {
            addNotification('warning', t('roster.empty_pool') || 'Poceta Vacía', t('roster.no_volunteers') || `No hay voluntarios configurados para ${selectedDayName}.`);
            return;
        }

        const poolUsers = users.filter(u => poolIds.includes(u.id));

        let updatesCount = 0;
        const promises: Promise<any>[] = [];
        const batchPlans = [...plans];
        const usageCount: Record<string, number> = {};
        poolUsers.forEach(u => usageCount[u.id] = 0);

        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

        plans.forEach(p => {
            if (new Date(p.date) >= twoMonthsAgo) {
                const assignedName = (p.team as any)[targetRoleConfig.key];
                const u = poolUsers.find(user => user.name === assignedName);
                if (u) usageCount[u.id]++;
            }
        });

        const targetDates = serviceDates.filter(d => {
            const dayName = d.toLocaleString('es-ES', { weekday: 'long' });
            const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            return capitalized === selectedDayName;
        });

        for (const date of targetDates) {
            const localDateStr = date.toLocaleDateString('en-CA');
            let plan = batchPlans.find(p => p.date === localDateStr);

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
                batchPlans.push(plan);
            }

            if (!plan.team[targetRoleConfig.key as keyof typeof plan.team]) {
                const sortedCandidates = [...poolUsers].sort((a, b) => {
                    const diff = usageCount[a.id] - usageCount[b.id];
                    if (diff !== 0) return diff;
                    return Math.random() - 0.5;
                });

                if (sortedCandidates.length > 0) {
                    const selected = sortedCandidates[0];
                    usageCount[selected.id]++;

                    const updatedPlan = {
                        ...plan,
                        team: { ...plan.team, [targetRoleConfig.key]: selected.name }
                    };

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
                addNotification('success', t('roster.assign_complete') || 'Asignación Completada', t('roster.assigned_count', { count: updatesCount.toString() }) || `Se asignaron ${updatesCount} turnos.`);
            } else {
                addNotification('info', t('roster.no_changes') || 'Sin Cambios', t('roster.no_new_assignments') || `No se requirieron asignaciones nuevas.`);
            }
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', t('common.error_generic') || 'Fallo al guardar.');
        }
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const currentRoleConfig = ROLES_CONFIG.find(r => r.key === selectedRoleTab);
    const handleBucketDrop = async (e: React.DragEvent, targetDay: string) => {
        if (!canEdit) return;
        e.preventDefault();
        const userId = e.dataTransfer.getData('userId');
        if (!userId) return;

        const roleKey = currentRoleConfig?.key;
        if (!roleKey) return;

        const currentPools = settings.dayPools || {};
        const dayPool = currentPools[targetDay] || {};
        const rolePool = dayPool[roleKey] || [];

        if (!rolePool.includes(userId)) {
            const newSettings = {
                ...settings,
                dayPools: {
                    ...currentPools,
                    [targetDay]: { ...dayPool, [roleKey]: [...rolePool, userId] }
                }
            };
            await onSaveSettings(newSettings);
            addNotification('success', t('common.added') || 'Agregado', t('roster.user_added_pool') || 'Usuario agregado al grupo.');
        }
    };

    const removeFromBucket = async (day: string, userId: string) => {
        if (!canEdit) return;
        const roleKey = currentRoleConfig?.key;
        if (!roleKey) return;

        const currentPools = settings.dayPools || {};
        const dayPool = currentPools[day] || {};
        const rolePool = dayPool[roleKey] || [];

        const newSettings = {
            ...settings,
            dayPools: {
                ...currentPools,
                [day]: { ...dayPool, [roleKey]: rolePool.filter(id => id !== userId) }
            }
        };
        await onSaveSettings(newSettings);
    };

    const roleUsers = users.filter(u => u.role === currentRoleConfig?.roleType);
    const isMusicTab = selectedRoleTab === 'musicDirector';
    const isTeamsTab = selectedRoleTab === 'teams';
    const showGroupsColumn = !isMusicTab && !isTeamsTab;

    return (
        <div className="p-4 md:p-8 max-w-full mx-auto space-y-1 h-screen flex flex-col overflow-hidden pb-4">
            <div className="h-2 md:h-4 w-full flex-shrink-0"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{t('roster.title') || "Itinerario de Turnos"}</h2>
                    <p className="text-slate-500">{t('roster.subtitle') || "Arrastra y asigna roles a los servicios del calendario."}</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setShowTeamManager(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Settings size={18} /> {t('roster.manage_teams') || "Gestionar Equipos"}
                    </button>
                )}
            </div>

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
                        <span className="font-bold">{t(role.translationKey) || role.defaultLabel}</span>
                    </button>
                ))}
            </div>

            <div className={`flex-1 min-h-0 grid gap-6 ${showGroupsColumn ? 'grid-cols-1 lg:grid-cols-[260px_260px_1fr]' : 'grid-cols-1 lg:grid-cols-[260px_1fr]'}`}>

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="font-bold text-xl text-slate-800">{t('roster.available') || "Disponible"}</h3>
                        <p className="text-xs text-slate-400">{t('roster.drag_hint') || "Arrastra a un Grupo o al Calendario"}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">

                        {isTeamsTab && settings.teams?.map(team => (
                            <div
                                key={team.id}
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, team, 'TEAM')}
                                className="bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all group flex items-center gap-3 hover:bg-white cursor-grab active:cursor-grabbing hover:shadow-md"
                            >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-indigo-500 text-white flex-shrink-0">
                                    <Users size={14} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 truncate block">{team.name}</span>
                            </div>
                        ))}

                        {!isTeamsTab && roleUsers.map(user => (
                            <div
                                key={user.id}
                                draggable={canEdit}
                                onDragStart={(e) => handleDragStart(e, user, 'USER')}
                                className={`bg-white border border-slate-100 p-3 rounded-2xl transition-all group flex items-center gap-3 ${canEdit ? 'hover:border-indigo-200 cursor-grab active:cursor-grabbing hover:shadow-md' : 'opacity-60 cursor-not-allowed'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentRoleConfig?.color.replace('text-', 'bg-').split(' ')[0]} text-white flex-shrink-0`}>
                                    {user.name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-slate-700 truncate block">{user.name}</span>
                            </div>
                        ))}

                        {!isTeamsTab && roleUsers.length === 0 && (
                            <div className="text-center p-8 text-slate-400 text-sm">
                                {t('roster.no_users_role') || "No hay usuarios con este rol."}
                            </div>
                        )}
                    </div>
                </div>

                {showGroupsColumn && (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800">{t('roster.groups') || "Grupos"}</h3>
                            <p className="text-xs text-slate-400">{t('roster.groups_subtitle') || "Organiza voluntarios por día"}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                            {(!isTeamsTab && !isMusicTab) ? settings.meetingDays.map(day => {
                                const poolIds = settings.dayPools?.[day]?.[currentRoleConfig?.key || ''] || [];
                                const poolUsers = users.filter(u => poolIds.includes(u.id));

                                return (
                                    <div
                                        key={day}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleBucketDrop(e, day)}
                                        className="space-y-2 transition-colors duration-200 rounded-3xl p-2 hover:bg-slate-50"
                                    >
                                        <div className="flex items-center gap-2 mb-2 px-2">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{day}</h4>
                                            <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{poolUsers.length}</span>
                                        </div>

                                        {poolUsers.length === 0 ? (
                                            <div className="border-2 border-dashed border-slate-100 rounded-2xl p-4 text-center">
                                                <p className="text-[10px] text-slate-400">{t('roster.drag_here') || "Arrastra aquí"}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {poolUsers.map(user => (
                                                    <div
                                                        key={`${day}-${user.id}`}
                                                        draggable={canEdit}
                                                        onDragStart={(e) => handleDragStart(e, user, 'USER')}
                                                        className="bg-white border border-slate-100 p-2 pl-3 rounded-2xl flex items-center justify-between group hover:shadow-sm"
                                                    >
                                                        <span className="text-xs font-bold text-slate-600 truncate">{user.name}</span>
                                                        {canEdit && (
                                                            <button
                                                                onClick={() => removeFromBucket(day, user.id)}
                                                                className="text-slate-300 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Plus size={14} className="rotate-45" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 p-6">
                                    <Sparkles className="mb-2 opacity-50" />
                                    <p className="text-xs">{t('roster.view_restricted') || "Esta vista solo está disponible para roles individuales."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div className="p-6 flex justify-between items-center border-b border-slate-50 flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
                            <h3 className="text-xl font-bold text-slate-800 capitalize w-48 text-center">{getMonthName(currentDate)}</h3>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight size={20} /></button>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl border border-slate-200">
                                {t('common.history') || "Historial"}
                            </button>
                            {canEdit && selectedRoleTab === 'preacher' && (
                                <label className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-colors">
                                    <Sparkles size={14} /> {t('roster.import_ai') || "Importar Lista IA"}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf,.docx"
                                        className="hidden"
                                        onChange={handleImportPreachers}
                                        disabled={isImporting}
                                    />
                                </label>
                            )}

                            {canEdit && selectedRoleTab !== 'teams' && selectedRoleTab !== 'musicDirector' && selectedRoleTab !== 'preacher' && (
                                <button
                                    onClick={handleAutoAssignClick}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-2"
                                >
                                    <Sparkles size={14} /> {t('roster.auto_assign') || "Auto Asignar"} {t(currentRoleConfig?.translationKey || '') || currentRoleConfig?.defaultLabel}
                                </button>
                            )}
                        </div>
                    </div>

                    {isImporting && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                            <Sparkles size={48} className="text-emerald-500 animate-pulse mb-4" />
                            <h3 className="text-xl font-bold text-emerald-800">{t('roster.analyzing') || "Analizando Documento..."}</h3>
                            <p className="text-sm text-slate-500">{t('roster.extracting') || "Extrayendo itinerario de predicación"}</p>
                        </div>
                    )}

                    {showAutoAssignModal && (
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                            <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{t('roster.select_day') || "Selecciona un Día"}</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    {t('roster.select_day_hint') || "¿Para qué día de reunión deseas auto-asignar voluntarios?"}
                                </p>

                                <div className="space-y-3">
                                    {settings.meetingDays.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => confirmAutoAssign(day)}
                                            className="w-full p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl flex items-center justify-between group transition-all"
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-indigo-700 capitalize">{day}</span>
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <Sparkles size={14} className="text-indigo-500" />
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowAutoAssignModal(false)}
                                    className="mt-6 w-full py-3 text-slate-400 font-bold hover:text-slate-600"
                                >
                                    {t('common.cancel') || "Cancelar"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {serviceDates.map(date => {
                                const dateNum = date.getDate();
                                const dayName = date.toLocaleString(language || 'es', { weekday: 'long' });

                                const plan = getPlanForDate(date);
                                const assignedValue = getAssignment(date, selectedRoleTab);
                                const musicians = (selectedRoleTab === 'musicDirector' && plan?.team?.musicians) ? plan.team.musicians : null;

                                return (
                                    <div key={date.toISOString()} className="border border-slate-100 rounded-3xl p-5 hover:shadow-lg transition-shadow bg-white">
                                        <div className="mb-4">
                                            <span className="text-sm font-bold text-slate-800 capitalize">{dayName} <span className="text-2xl ml-1">{dateNum}</span></span>
                                        </div>

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
                                                                {['elder', 'sabbathSchoolTeacher', 'preacher', 'musicDirector', 'audioOperator'].map(r => {
                                                                    const val = getAssignment(date, r);
                                                                    return val ? (
                                                                        <div key={r} className="w-1.5 h-1.5 rounded-full bg-indigo-300" title={`${r}: ${val}`} />
                                                                    ) : null;
                                                                })}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <p className="text-xs text-slate-400 mb-2">{t('roster.drag_team_hint') || "Arrastra un equipo para asignar todos los roles."}</p>
                                                            <div className="flex gap-1 justify-center">
                                                                {['elder', 'sabbathSchoolTeacher', 'preacher', 'musicDirector', 'audioOperator'].map(r => {
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

                                                        {musicians ? (
                                                            <div className="text-center">
                                                                <span className="font-bold text-slate-700 text-sm">{assignedValue}</span>
                                                                <div className="flex flex-wrap justify-center gap-1 mt-1">
                                                                    {musicians.slice(0, 3).map((m: string) => (
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
                                                                {t('common.remove') || "Remover"}
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-xs text-slate-400 text-center">{canEdit ? (t('roster.drag_member_hint') || 'Arrastra un miembro aquí') : (t('roster.unassigned') || 'Sin asignar')}</p>
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
                                {t('roster.no_services') || "No hay servicios configurados para este mes."}
                            </div>
                        )}
                    </div>

                </div>

            </div>

            {showTeamManager && (
                <TeamManager
                    settings={settings}
                    plans={plans}
                    onClose={() => setShowTeamManager(false)}
                />
            )}
        </div>
    );
};

export default RosterView;
