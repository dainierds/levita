import React, { useState } from 'react';
import { ChurchSettings, ShiftTeam, User, Role } from '../types';
import { Plus, Trash2, Users, Save, X, User as UserIcon, Mic2, Music, Mic } from 'lucide-react';

interface TeamManagerProps {
    settings: ChurchSettings;
    users: User[];
    onSave: (settings: ChurchSettings) => Promise<void>;
    onClose: () => void;
}

const ROLES = [
    { key: 'elder', label: 'Anciano', icon: UserIcon, role: 'ELDER' },
    { key: 'preacher', label: 'Predicador', icon: Mic2, role: 'PREACHER' },
    { key: 'musicDirector', label: 'Música', icon: Music, role: 'MUSIC' },
    { key: 'audioOperator', label: 'Audio', icon: Mic, role: 'AUDIO' },
];

const TeamManager: React.FC<TeamManagerProps> = ({ settings, users, onSave, onClose }) => {
    const [teams, setTeams] = useState<ShiftTeam[]>(settings.teams || []);
    const [loading, setLoading] = useState(false);

    const handleAddTeam = () => {
        const newTeam: ShiftTeam = {
            id: Math.random().toString(36).substr(2, 9),
            name: `Equipo ${String.fromCharCode(65 + teams.length)}`, // Equipo A, B, C...
            members: {}
        };
        setTeams([...teams, newTeam]);
    };

    const handleUpdateTeamName = (id: string, name: string) => {
        setTeams(teams.map(t => t.id === id ? { ...t, name } : t));
    };

    const handleUpdateMember = (teamId: string, roleKey: string, userId: string) => {
        const user = users.find(u => u.id === userId);
        setTeams(teams.map(t => {
            if (t.id !== teamId) return t;
            return {
                ...t,
                members: {
                    ...t.members,
                    [roleKey]: user ? user.name : ''
                }
            };
        }));
    };

    const handleDeleteTeam = (id: string) => {
        if (confirm('¿Eliminar este equipo?')) {
            setTeams(teams.filter(t => t.id !== id));
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ ...settings, teams });
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error al guardar equipos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">

                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-indigo-500" /> Gestión de Equipos
                        </h3>
                        <p className="text-slate-500 text-sm">Crea equipos predefinidos para asignar rápidamente.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6 flex-1 overflow-y-auto p-1">
                    {teams.map((team, index) => (
                        <div key={team.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-200 relative group">
                            <button
                                onClick={() => handleDeleteTeam(team.id)}
                                className="absolute top-4 right-4 p-2 bg-white text-slate-300 hover:text-red-500 rounded-xl shadow-sm hover:shadow-md transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className="mb-6">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre del Equipo</label>
                                <input
                                    type="text"
                                    value={team.name}
                                    onChange={(e) => handleUpdateTeamName(team.id, e.target.value)}
                                    className="text-xl font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none w-full transition-colors placeholder-slate-300"
                                    placeholder="Nombre del Equipo"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {ROLES.map(role => (
                                    <div key={role.key}>
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase">
                                            <role.icon size={14} /> {role.label}
                                        </label>
                                        <select
                                            value={users.find(u => u.name === (team.members as any)[role.key])?.id || ''}
                                            onChange={(e) => handleUpdateMember(team.id, role.key, e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 transition-all"
                                        >
                                            <option value="">Sin asignar</option>
                                            {users.filter(u => u.role === role.role).map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleAddTeam}
                        className="w-full py-4 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 font-bold hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> Crear Nuevo Equipo
                    </button>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TeamManager;
