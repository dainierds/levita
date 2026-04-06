import React, { useState, useEffect, useRef } from 'react';
import { User, MusicTeam, SubscriptionTier, Role, ChurchSettings } from '../types';
import { Calendar, Music, User as UserIcon, X, Edit, Check, ChevronLeft, ChevronRight, Upload, Loader2, Info } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore'; 
import { useAuth } from '../context/AuthContext';
import { parseMusicScheduleFromDocument, MusicAssignmentResult } from '../services/geminiService';

interface MusicDepartmentProps {
    users: User[];
    tier: SubscriptionTier;
    role?: Role;
    settings?: ChurchSettings;
}

const MusicDepartment: React.FC<MusicDepartmentProps> = ({ users, tier, role = 'ADMIN', settings }) => {
    const { user } = useAuth();
    // Allow edit if ADMIN, or if LEADER/BOARD has 'MUSIC' secondary role
    const hasMusicRole = user?.secondaryRoles?.includes('MUSIC');
    const readOnly = (role === 'LEADER' || role === 'BOARD') && !hasMusicRole;
    
    const { addNotification } = useNotification();
    const [teams, setTeams] = useState<MusicTeam[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Filter only MUSIC role users and sort alphabetically
    const musicUsers = users
        .filter(u => u.role === 'MUSIC' || u.secondaryRoles?.includes('MUSIC'))
        .sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        fetchTeams();
    }, [user?.tenantId]);

    const fetchTeams = async () => {
        if (!user?.tenantId) return;
        try {
            const q = query(
                collection(db, 'tenants', user.tenantId, 'music_teams'),
                orderBy('date', 'asc')
            );
            const snapshot = await getDocs(q);
            const fetchedTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTeam));
            setTeams(fetchedTeams);
        } catch (error) {
            console.error("Error fetching music teams:", error);
            addNotification('error', 'Error', 'No se pudieron cargar los equipos de música.');
        } finally {
            setLoading(false);
        }
    };

    // Calendar Navigation
    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentDate(newDate);
    };

    const getMonthName = () => {
        const month = currentDate.toLocaleString('es-ES', { month: 'long' });
        return month.charAt(0).toUpperCase() + month.slice(1) + ' de ' + currentDate.getFullYear();
    };

    const getServiceDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days: Date[] = [];
        
        // Use meetingDays if available, default to Saturday and Tuesday based on the doc upload examples
        const daysOfWeek = settings?.meetingDays?.length ? settings.meetingDays : ['Saturday', 'Tuesday'];
        
        const dayMap: { [key: string]: number } = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };
        const allowedDays = daysOfWeek.map((d: string) => dayMap[d]);

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            if (allowedDays.includes(date.getDay())) {
                days.push(date);
            }
        }
        return days;
    };

    const formatDateForDB = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    };

    // Update Firebase
    const updateTeamField = async (dateStr: string, field: 'memberIds' | 'soloist1' | 'soloist2', value: string, action: 'add' | 'remove') => {
        if (!user?.tenantId) return;
        const existingTeam = teams.find(t => t.date === dateStr);
        
        if (existingTeam) {
            const currentList = Array.isArray(existingTeam[field]) ? existingTeam[field] : (existingTeam[field] ? [existingTeam[field] as string] : []);
            let newList = [...currentList];
            if (action === 'add' && !newList.includes(value)) newList.push(value);
            if (action === 'remove') newList = newList.filter(v => v !== value);
            
            await updateDoc(doc(db, 'tenants', user.tenantId, 'music_teams', existingTeam.id), {
                [field]: newList
            });
            setTeams(teams.map(t => t.id === existingTeam.id ? { ...t, [field]: newList } : t));
        } else {
            if (action === 'remove') return;
            const newDoc = {
                date: dateStr,
                memberIds: field === 'memberIds' ? [value] : [],
                soloist1: field === 'soloist1' ? [value] : [],
                soloist2: field === 'soloist2' ? [value] : [],
                note: '',
                tenantId: user.tenantId
            };
            const docRef = await addDoc(collection(db, 'tenants', user.tenantId, 'music_teams'), newDoc);
            setTeams([...teams, { id: docRef.id, ...newDoc } as MusicTeam]);
        }
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, sourceId: string) => {
        e.dataTransfer.setData('sourceId', sourceId);
    };

    const handleDrop = async (e: React.DragEvent, dateStr: string, field: 'memberIds' | 'soloist1' | 'soloist2') => {
        e.preventDefault();
        const droppedId = e.dataTransfer.getData('sourceId');
        if (!droppedId || readOnly) return;
        await updateTeamField(dateStr, field, droppedId, 'add');
    };

    const handleRemoveItem = async (dateStr: string, field: 'memberIds' | 'soloist1' | 'soloist2', idToRemove: string) => {
        if (readOnly) return;
        await updateTeamField(dateStr, field, idToRemove, 'remove');
    };

    // AI Import
    const handleImportAI = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.tenantId) return;

        setIsProcessingAI(true);
        addNotification('info', 'Analizando Documento', 'La IA está leyendo y organizando los músicos...', 0);

        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            const parsedResults = await parseMusicScheduleFromDocument(file, year, month);

            // Fetch the latest teams again just in case
            const q = query(collection(db, 'tenants', user.tenantId, 'music_teams'), orderBy('date', 'asc'));
            const snapshot = await getDocs(q);
            const currentTeams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTeam));

            const batch = writeBatch(db);
            const updatedTeamsLocal = [...currentTeams];

            for (const assignment of parsedResults) {
                // Determine logic for resolving string names to user IDs
                // If a name exactly matches a user, use the ID. Otherwise use the string text.
                const resolveNames = (names: string[]) => {
                    return names.map(name => {
                        const matchedUser = users.find(u => u.name.toLowerCase().includes(name.toLowerCase()));
                        return matchedUser ? matchedUser.id : name; 
                    });
                };

                const resolvedMain = resolveNames(assignment.mainGroup || []);
                const resolvedSS = resolveNames(assignment.specialSS || []);
                const resolvedDivine = resolveNames(assignment.specialDivine || []);

                // Skip if entirely empty
                if (!resolvedMain.length && !resolvedSS.length && !resolvedDivine.length) continue;

                const existingTeamIndex = updatedTeamsLocal.findIndex(t => t.date === assignment.date);
                const existingTeam = existingTeamIndex >= 0 ? updatedTeamsLocal[existingTeamIndex] : null;

                if (existingTeam) {
                    // Update existing
                    const newTeamData = {
                        ...existingTeam,
                        memberIds: [...new Set([...(existingTeam.memberIds || []), ...resolvedMain])],
                        soloist1: [...new Set([...(existingTeam.soloist1 || []), ...resolvedSS])],
                        soloist2: [...new Set([...(existingTeam.soloist2 || []), ...resolvedDivine])]
                    };
                    const docRef = doc(db, 'tenants', user.tenantId, 'music_teams', existingTeam.id);
                    batch.update(docRef, {
                        memberIds: newTeamData.memberIds,
                        soloist1: newTeamData.soloist1,
                        soloist2: newTeamData.soloist2
                    });
                    updatedTeamsLocal[existingTeamIndex] = newTeamData as MusicTeam;
                } else {
                    // Create new
                    const newDocRef = doc(collection(db, 'tenants', user.tenantId, 'music_teams'));
                    const newTeamData = {
                        date: assignment.date,
                        memberIds: resolvedMain,
                        soloist1: resolvedSS,
                        soloist2: resolvedDivine,
                        note: '',
                        tenantId: user.tenantId
                    };
                    batch.set(newDocRef, newTeamData);
                    updatedTeamsLocal.push({ id: newDocRef.id, ...newTeamData } as MusicTeam);
                }
            }

            await batch.commit();
            setTeams(updatedTeamsLocal);
            addNotification('success', 'Importación Exitosa', 'Las asignaciones de música se han interpretado y añadido.', 5000);

        } catch (error: any) {
            console.error('Error with AI Sync:', error);
            addNotification('error', 'Error en IA', error.message || 'No se pudo interpretar el documento.', 5000);
        } finally {
            setIsProcessingAI(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const serviceDays = getServiceDaysInMonth();

    // Helper to render user chips
    const renderMemberChips = (list: string[], dateStr: string, field: 'memberIds' | 'soloist1' | 'soloist2') => {
        if (!list || list.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 opacity-60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        Arrastra un miembro aquí
                    </span>
                </div>
            );
        }

        return (
            <div className="flex flex-wrap gap-2">
                {list.map(memberId => {
                    const matchedUser = users.find(u => u.id === memberId);
                    const displayName = matchedUser ? matchedUser.name.split(' ')[0] : memberId;
                    
                    return (
                        <div key={memberId} className="relative group">
                            <span className="px-3 py-1 bg-white text-slate-700 rounded-lg text-xs font-bold border border-slate-200 flex items-center gap-1 shadow-sm">
                                <UserIcon size={12} className="text-slate-400" /> {displayName}
                            </span>
                            {!readOnly && (
                                <button
                                    onClick={() => handleRemoveItem(dateStr, field, memberId)}
                                    className="absolute -top-1 -right-1 bg-red-100 text-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 md:pt-20 max-w-full mx-auto space-y-8 animate-fade-in">
            {/* INLINE DOCUMENT INPUT */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".jpg,.jpeg,.png,.pdf,.docx"
                onChange={handleImportAI}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Music className="text-pink-600" size={32} />
                        Dep. Música
                    </h2>
                    <p className="text-slate-500">Programa tus equipos y especiales musicales.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <button onClick={() => changeMonth(-1)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                        <ChevronLeft />
                    </button>
                    <span className="font-extrabold text-sm uppercase tracking-widest text-slate-700 min-w-[140px] text-center">
                        {getMonthName()}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                        <ChevronRight />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* LEFT SIDEBAR: MEMBERS TO DRAG */}
                <div className="lg:col-span-1 space-y-4">
                    {!readOnly && tier === 'PREMIUM' && (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isProcessingAI}
                            className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-white font-bold transition-all shadow-lg ${
                                isProcessingAI 
                                ? 'bg-indigo-400 cursor-not-allowed' 
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:shadow-indigo-500/25'
                            }`}
                        >
                            {isProcessingAI ? (
                                <><Loader2 className="animate-spin" size={20} /> Procesando...</>
                                ) : (
                                <><Upload size={20} /> Importar Lista IA</>
                            )}
                        </button>
                    )}

                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Music className="text-pink-500" size={18} />
                            Músicos
                        </h3>
                        {musicUsers.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center p-4">No hay usuarios con el rol 'Música'.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {musicUsers.map(u => (
                                    <div
                                        key={u.id}
                                        draggable={!readOnly}
                                        onDragStart={(e) => handleDragStart(e, u.id)}
                                        className={`px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-all ${!readOnly ? 'cursor-grab active:cursor-grabbing hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700' : ''}`}
                                    >
                                        {u.name.split(' ')[0]}
                                    </div>
                                ))}
                            </div>
                        )}
                        {!readOnly && (
                            <div className="mt-6 flex items-start gap-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                <Info size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
                                    Arrastra los nombres de arriba hacia las casillas del calendario para asignarlos manualmente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT AREA: CALENDAR GRID */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-pink-500" size={32} /></div>
                    ) : serviceDays.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 border border-slate-200 border-dashed rounded-[2rem]">
                            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-bold">No hay Cultos en este mes.</p>
                            <p className="text-slate-400 text-xs mt-1">Sincroniza tus días de reunión en Configuración.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {serviceDays.map(date => {
                                const dateStr = formatDateForDB(date);
                                const todayTeam = teams.find(t => t.date === dateStr);
                                
                                return (
                                    <div key={dateStr} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col h-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 font-bold text-lg">
                                                {date.getDate()}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">{date.toLocaleString('es-ES', { month: 'long' })}</p>
                                                <p className="font-extrabold text-slate-800 text-sm">{date.toLocaleString('es-ES', { weekday: 'long' })}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            {/* Grurpos / Alabanza (memberIds) */}
                                            <div 
                                                className="bg-slate-50/50 p-3 rounded-[1.5rem] border border-slate-100 min-h-[4rem]"
                                                onDragOver={e => !readOnly && e.preventDefault()}
                                                onDrop={e => handleDrop(e, dateStr, 'memberIds')}
                                            >
                                                <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-2 px-1">Grupo / Alabanza</h4>
                                                {renderMemberChips(todayTeam?.memberIds || [], dateStr, 'memberIds')}
                                            </div>

                                            {/* Especiales ES (soloist1) */}
                                            <div 
                                                className="bg-indigo-50/30 p-3 rounded-[1.5rem] border border-indigo-50 min-h-[4rem]"
                                                onDragOver={e => !readOnly && e.preventDefault()}
                                                onDrop={e => handleDrop(e, dateStr, 'soloist1')}
                                            >
                                                <h4 className="text-[10px] uppercase font-bold text-indigo-500 mb-2 px-1 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                                    Especial E.S.
                                                </h4>
                                                {renderMemberChips(todayTeam?.soloist1 || [], dateStr, 'soloist1')}
                                            </div>

                                            {/* Especiales Culto Divino (soloist2) */}
                                            <div 
                                                className="bg-purple-50/30 p-3 rounded-[1.5rem] border border-purple-50 min-h-[4rem]"
                                                onDragOver={e => !readOnly && e.preventDefault()}
                                                onDrop={e => handleDrop(e, dateStr, 'soloist2')}
                                            >
                                                <h4 className="text-[10px] uppercase font-bold text-purple-500 mb-2 px-1 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                                    Especial Culto
                                                </h4>
                                                {renderMemberChips(todayTeam?.soloist2 || [], dateStr, 'soloist2')}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MusicDepartment;
