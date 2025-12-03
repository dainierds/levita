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
    { key: 'worshipLeader', label: 'Director de Música', icon: Music, color: 'text-pink-500 bg-pink-50', role: 'MUSIC' },
    { key: 'audioOperator', label: 'Operador de Audio', icon: Mic, color: 'text-orange-500 bg-orange-50', role: 'AUDIO' },
];

const TeamRoster: React.FC<TeamRosterProps> = ({ users, settings, onSaveSettings }) => {
    const { role } = useAuth();

    // Local state for editing settings
    const [localSettings, setLocalSettings] = useState<ChurchSettings>(settings);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Sync local state when props change (only if not dirty, or force sync?)
    // To avoid overwriting local edits, we only sync if we haven't touched it, 
    // but for simplicity let's just initialize.
    useEffect(() => {
        setLocalSettings(settings);
        // Select first team if none selected and teams exist
        if (!selectedTeamId && settings.teams && settings.teams.length > 0) {
            setSelectedTeamId(settings.teams[0].id);
        }
    }, [settings]);

    const handleCreateTeam = () => {
        const newTeam: ShiftTeam = {
            id: crypto.randomUUID(),
            name: `Nuevo Equipo ${localSettings.teams?.length ? localSettings.teams.length + 1 : 1}`,
            members: {}
        };
        const updatedTeams = [...(localSettings.teams || []), newTeam];
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

    const handleSetActiveTeam = (teamId: string) => {
        setLocalSettings({ ...localSettings, activeTeamId: teamId });
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

    return (
        <div className="p-4 md:p-8 md:pt-24 space-y-8 max-w-full mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Gestión de Equipos</h2>
                    <p className="text-slate-500">Crea y administra los equipos de turno.</p>
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
                        <h3 className="font-bold text-slate-700">Mis Equipos</h3>
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

                    <div className="space-y-3">
                        {localSettings.teams?.map(team => (
                            <div
                                key={team.id}
                                className={`relative group w-full text-left p-4 rounded-2xl transition-all border cursor-pointer ${selectedTeamId === team.id
                                        ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                        : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                                    }`}
                                onClick={() => setSelectedTeamId(team.id)}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold text-lg ${selectedTeamId === team.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                                        {team.name}
                                    </span>
                                    {localSettings.activeTeamId === team.id && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                                            <CheckCircle size={10} /> Activo
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-slate-400">
                                    {Object.keys(team.members).length} miembros asignados
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
                        ))}

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
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                        <Users size={24} />
                                    </div>
                                    <div className="w-full">
                                        <input
                                            type="text"
                                            value={selectedTeam.name}
                                            onChange={(e) => handleUpdateTeamName(e.target.value)}
                                            className="text-2xl font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 focus:outline-none w-full transition-colors"
                                            placeholder="Nombre del Equipo"
                                            disabled={!isAdmin}
                                        />
                                        <p className="text-slate-500 text-sm">Editando integrantes</p>
                                    </div>
                                </div>

                                {isAdmin && (
                                    <button
                                        onClick={() => handleSetActiveTeam(selectedTeam.id)}
                                        disabled={localSettings.activeTeamId === selectedTeam.id}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${localSettings.activeTeamId === selectedTeam.id
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : 'bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white'
                                            }`}
                                    >
                                        {localSettings.activeTeamId === selectedTeam.id ? (
                                            <>
                                                <CheckCircle size={16} /> Equipo Activo
                                            </>
                                        ) : (
                                            'Establecer como Activo'
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ROLES_CONFIG.map(roleConfig => {
                                    const roleUsers = users.filter(u => u.role === roleConfig.role);
                                    const currentValue = (selectedTeam.members as any)?.[roleConfig.key] || '';

                                    return (
                                        <div key={roleConfig.key} className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 ${!isAdmin ? 'opacity-75' : ''}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                                                    <roleConfig.icon size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 uppercase">{roleConfig.label}</span>
                                            </div>

                                            <select
                                                value={currentValue}
                                                onChange={(e) => handleUpdateTeamMember(roleConfig.key, e.target.value)}
                                                disabled={!isAdmin}
                                                className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium text-slate-700 transition-all ${!isAdmin ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'}`}
                                            >
                                                <option value="">Sin asignar</option>
                                                {roleUsers.map(u => (
                                                    <option key={u.id} value={u.name}>{u.name}</option>
                                                ))}
                                                {/* Fallback for users not in list */}
                                                {currentValue && !roleUsers.find(u => u.name === currentValue) && (
                                                    <option value={currentValue}>{currentValue}</option>
                                                )}
                                            </select>
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
