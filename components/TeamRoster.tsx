import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, ChurchSettings, ShiftTeam } from '../types';
import { UserCheck, Mic2, Music, Mic, Loader2, Users, Plus, Trash2, CheckCircle, Save } from 'lucide-react';

interface TeamRosterProps {
    users: User[];
    settings: ChurchSettings;
    onSaveSettings: (settings: ChurchSettings) => Promise<void>;
}

const ROLES_CONFIG = [
    { key: 'elder', label: 'Anciano de Turno', icon: UserCheck, color: 'text-blue-500 bg-blue-50', role: 'ELDER' },
    { key: 'preacher', label: 'Predicador', icon: Mic2, color: 'text-purple-500 bg-purple-50', role: 'PREACHER' },
    { key: 'musicDirector', label: 'Director de Música', icon: Music, color: 'text-pink-500 bg-pink-50', role: 'MUSIC' },
    { key: 'audioOperator', label: 'Operador de Audio', icon: Mic, color: 'text-orange-500 bg-orange-50', role: 'AUDIO' },
];

const TeamRoster: React.FC<TeamRosterProps> = ({ users, settings, onSaveSettings }) => {
    const { role } = useAuth();

    // Local state for editing settings
    const [localSettings, setLocalSettings] = useState<ChurchSettings>(settings);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when props change
    useEffect(() => {
        // Sort teams by date before setting
        const sortedTeams = [...(settings.teams || [])].sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        setLocalSettings({ ...settings, teams: sortedTeams });

        // Select first team if none selected and teams exist
        if (!selectedTeamId && sortedTeams.length > 0) {
            setSelectedTeamId(sortedTeams[0].id);
        }
    }, [settings]);

    const handleCreateTeam = () => {
        const today = new Date().toISOString().split('T')[0];
        const newTeam: ShiftTeam = {
            id: crypto.randomUUID(),
            name: `Equipo ${localSettings.teams?.length ? localSettings.teams.length + 1 : 1}`,
            date: '', // Support manual date selection
            members: {}
        };
        const updatedTeams = [...(localSettings.teams || []), newTeam].sort((a, b) => {
            // Keep sorted
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        });

        setLocalSettings({ ...localSettings, teams: updatedTeams });
        setSelectedTeamId(newTeam.id);
        setHasChanges(true);
    };

    const handleDeleteTeam = (teamId: string) => {
        if (!confirm('¿Estás seguro de eliminar este equipo?')) return;
        const updatedTeams = localSettings.teams?.filter(t => t.id !== teamId) || [];
        setLocalSettings({ ...localSettings, teams: updatedTeams });
        if (selectedTeamId === teamId) {
            setSelectedTeamId(updatedTeams.length > 0 ? updatedTeams[0].id : null);
        }
        setHasChanges(true);
    };

    const handleUpdateTeamMember = (roleKey: string, value: string) => {
        if (!selectedTeamId) return;
        const updatedTeams = localSettings.teams?.map(t => {
            if (t.id === selectedTeamId) {
                return { ...t, members: { ...t.members, [roleKey]: value } };
            }
            return t;
        }) || [];
        setLocalSettings({ ...localSettings, teams: updatedTeams });
        setHasChanges(true);
    };

    const handleUpdateTeamName = (name: string) => {
        if (!selectedTeamId) return;
        const updatedTeams = localSettings.teams?.map(t => {
            if (t.id === selectedTeamId) {
                return { ...t, name };
            }
            return t;
        }) || [];
        setLocalSettings({ ...localSettings, teams: updatedTeams });
        setHasChanges(true);
    };

    const handleUpdateTeamDate = (date: string) => {
        if (!selectedTeamId) return;
        const updatedTeams = localSettings.teams?.map(t => {
            if (t.id === selectedTeamId) {
                return { ...t, date };
            }
            return t;
        }).sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }) || [];
        setLocalSettings({ ...localSettings, teams: updatedTeams });
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveSettings(localSettings);
            setHasChanges(false);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Error al guardar los cambios.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedTeam = localSettings.teams?.find(t => t.id === selectedTeamId);
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    // Helper to determine if a team is the "Active" one (Nearest Future or Today)
    const getActiveTeamId = () => {
        if (!localSettings.teams || localSettings.teams.length === 0) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingTeams = localSettings.teams
            .filter(t => t.date && new Date(t.date + 'T00:00:00') >= today)
            .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());

        return upcomingTeams.length > 0 ? upcomingTeams[0].id : null;
    };

    const computedActiveId = getActiveTeamId();

    return (
        <div className="p-4 md:p-8 md:pt-24 space-y-8 max-w-full mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gestión de Equipos</h2>
                    <p className="text-slate-500">Crea los equipos de la semana. El más cercano será el activo.</p>
                </div>
                {hasChanges && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar: Team List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-700">Equipos Programados</h3>
                        {isAdmin && (
                            <button
                                onClick={handleCreateTeam}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                title="Crear nuevo equipo"
                            >
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {localSettings.teams?.map(team => {
                            const isActive = computedActiveId === team.id;
                            const isPast = team.date && new Date(team.date) < new Date(new Date().setHours(0, 0, 0, 0));

                            return (
                                <div
                                    key={team.id}
                                    className={`relative group w-full text-left p-4 rounded-2xl transition-all border cursor-pointer ${selectedTeamId === team.id
                                        ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                                        } ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                    onClick={() => setSelectedTeamId(team.id)}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold text-lg ${selectedTeamId === team.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                            {team.name}
                                        </span>
                                        {isActive && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                                <CheckCircle size={10} /> Activo
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center justify-between">
                                        <span>{Object.keys(team.members).length} miembros</span>
                                        {team.date && (
                                            <span className={`font-medium ${isPast ? 'text-slate-500' : 'text-indigo-500'}`}>
                                                {new Date(team.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            </span>
                                        )}
                                    </div>

                                    {isAdmin && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                                            className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            )
                        })}

                        {(!localSettings.teams || localSettings.teams.length === 0) && (
                            <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 border border-dashed border-slate-200">
                                No hay equipos creados.
                                <br />
                                <button onClick={handleCreateTeam} className="mt-2 text-indigo-500 font-bold hover:underline">Crear uno ahora</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main: Team Editor */}
                <div className="lg:col-span-2">
                    {selectedTeam ? (
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                            <div className="flex justify-between items-start mb-8">
                                {/* Date Header Block */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500 font-bold text-3xl shadow-sm">
                                        {selectedTeam.date ? new Date(selectedTeam.date).getDate() : '?'}
                                    </div>
                                    <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-pink-500 font-bold uppercase tracking-widest text-sm">
                                                {selectedTeam.date
                                                    ? new Date(selectedTeam.date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                                                    : 'Seleccionar Fecha'}
                                            </span>
                                            <div className="bg-pink-50 text-pink-500 rounded-full p-1">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 capitalize leading-none">
                                            {selectedTeam.date
                                                ? new Date(selectedTeam.date).toLocaleDateString('es-ES', { weekday: 'long' })
                                                : 'Sin Fecha'}
                                        </h2>

                                        <input
                                            type="date"
                                            value={selectedTeam.date || ''}
                                            onChange={(e) => handleUpdateTeamDate(e.target.value)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {/* Rename Input as a discrete action or just keep current "Name" field?
                                        The design doesn't show a team "Name" prominently, mostly the date.
                                        But we rely on Name in the sidebar. I will keep the Name input but perhaps more subtle or separate.
                                    */}
                                    <div className="relative group">
                                        {/* We'll put the name edit here loosely or just assume Date IS the identifier visually? 
                                            Let's keep the Name input but maybe as a small field top right or below date?
                                            Actually, let's keep it simple: Date is main header. 
                                            Name can be edited via a small pencil next to text if needed, or just a standard input.
                                            I'll add the Trash icon here as requested in design.
                                         */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteTeam(selectedTeam.id)}
                                                className="p-3 bg-white border border-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all shadow-sm"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Hidden/Subtle Name Input (Since Design focuses on Date) */}
                            <div className="mb-8">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nombre del Equipo</label>
                                <input
                                    type="text"
                                    value={selectedTeam.name}
                                    onChange={(e) => handleUpdateTeamName(e.target.value)}
                                    className="w-full text-lg font-bold text-slate-700 bg-slate-50 border-none rounded-xl px-4 py-2 focus:ring-2 ring-indigo-500/20"
                                    placeholder="Nombre del Equipo"
                                    disabled={!isAdmin}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ROLES_CONFIG.map(roleConfig => {
                                    const roleUsers = users.filter(u => u.role === roleConfig.role);
                                    const currentValue = (selectedTeam.members as any)?.[roleConfig.key] || '';
                                    const isElder = role === 'ELDER';
                                    const canEdit = isAdmin || (isElder && roleConfig.key === 'elder');

                                    return (
                                        <div key={roleConfig.key} className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                {/* Colored Icon */}
                                                <div className={`
                                                    ${roleConfig.key === 'elder' ? 'text-blue-500' : ''}
                                                    ${roleConfig.key === 'preacher' ? 'text-purple-500' : ''}
                                                    ${roleConfig.key === 'musicDirector' ? 'text-pink-500' : ''}
                                                    ${roleConfig.key === 'audioOperator' ? 'text-orange-500' : ''}
                                                `}>
                                                    <roleConfig.icon size={18} strokeWidth={2.5} />
                                                </div>
                                                <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
                                                    {roleConfig.label}
                                                </span>
                                            </div>

                                            <div className="relative">
                                                <select
                                                    value={currentValue}
                                                    onChange={(e) => handleUpdateTeamMember(roleConfig.key, e.target.value)}
                                                    disabled={!canEdit}
                                                    className="w-full appearance-none bg-white text-slate-700 font-bold px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all disabled:opacity-50 disabled:bg-slate-100"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {roleUsers.map(u => (
                                                        <option key={u.id} value={u.name}>{u.name}</option>
                                                    ))}
                                                    {currentValue && !roleUsers.find(u => u.name === currentValue) && (
                                                        <option value={currentValue}>{currentValue}</option>
                                                    )}
                                                </select>
                                                {/* Custom Arrow */}
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="m6 9 6 6 6-6" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 p-12">
                            <Users size={48} className="mb-4 opacity-50" />
                            <p className="text-lg font-medium">Selecciona un equipo para editar</p>
                            <p className="text-sm opacity-70">O crea uno nuevo desde el menú lateral</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamRoster;
