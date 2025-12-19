import React, { useState, useEffect } from 'react';
import { ChurchSettings, User } from '../types';
import { Users, Save, X, User as UserIcon, Mic2, Music, Mic, Check, Calendar, Trash2 } from 'lucide-react';

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
    // Local state for Day Pools: { "Martes": { "elder": ["id1", "id2"] } }
    const [dayPools, setDayPools] = useState<Record<string, Record<string, string[]>>>(settings.dayPools || {});
    const [loading, setLoading] = useState(false);

    // Ensure we have entries for all configured meeting days
    useEffect(() => {
        const initialPools = { ...(settings.dayPools || {}) };
        settings.meetingDays.forEach(day => {
            if (!initialPools[day]) {
                initialPools[day] = {};
            }
        });
        setDayPools(initialPools);
    }, [settings.meetingDays, settings.dayPools]);


    const handleToggleUser = (day: string, roleKey: string, userId: string) => {
        setDayPools(prev => {
            const currentDay = prev[day] || {};
            const currentRoleList = currentDay[roleKey] || [];

            let newList;
            if (currentRoleList.includes(userId)) {
                newList = currentRoleList.filter(id => id !== userId);
            } else {
                newList = [...currentRoleList, userId];
            }

            return {
                ...prev,
                [day]: {
                    ...currentDay,
                    [roleKey]: newList
                }
            };
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave({ ...settings, dayPools });
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
            <div className="bg-white rounded-[2rem] w-full max-w-6xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">

                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="text-indigo-500" /> Gestión de Voluntarios por Día
                        </h3>
                        <p className="text-slate-500 text-sm">Define quiénes pueden servir en cada día de reunión para la auto-asignación.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
                    <div className="flex gap-6 h-full min-w-max">
                        {settings.meetingDays.map((day) => (
                            <div key={day} className="w-80 flex flex-col h-full bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                {/* Column Header */}
                                <div className="p-5 bg-white border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 capitalize">{day}s</h4>
                                        <p className="text-xs text-slate-400">Poceta de Voluntarios</p>
                                    </div>
                                </div>

                                {/* Roles List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                    {ROLES.map(role => {
                                        const assignedIds = dayPools[day]?.[role.key] || [];
                                        const roleUsers = users.filter(u => u.role === role.role);

                                        return (
                                            <div key={role.key} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                                                <div className="flex items-center gap-2 mb-3 text-slate-500">
                                                    <role.icon size={14} />
                                                    <span className="text-xs font-bold uppercase tracking-wider">{role.label}s</span>
                                                    <span className="ml-auto bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                                        {assignedIds.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                                                    {roleUsers.length > 0 ? (
                                                        roleUsers.map(user => {
                                                            const isSelected = assignedIds.includes(user.id);
                                                            return (
                                                                <button
                                                                    key={user.id}
                                                                    onClick={() => handleToggleUser(day, role.key, user.id)}
                                                                    className={`w-full flex items-center gap-2 p-2 rounded-xl text-sm transition-all ${isSelected
                                                                            ? 'bg-indigo-50 text-indigo-700 font-bold ring-1 ring-indigo-500/20'
                                                                            : 'hover:bg-slate-50 text-slate-600'
                                                                        }`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'
                                                                        }`}>
                                                                        {isSelected && <Check size={10} className="text-white" />}
                                                                    </div>
                                                                    <span className="truncate">{user.name}</span>
                                                                </button>
                                                            )
                                                        })
                                                    ) : (
                                                        <p className="text-xs text-slate-300 italic p-2 text-center">No hay usuarios con este rol.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                        {settings.meetingDays.length === 0 && (
                            <div className="w-full flex flex-col items-center justify-center text-slate-400 p-12">
                                <p>No hay días de reunión configurados.</p>
                                <p className="text-sm">Ve a Configuración para agregar días.</p>
                            </div>
                        )}
                    </div>
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
                        Guardar Configuración
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TeamManager;
