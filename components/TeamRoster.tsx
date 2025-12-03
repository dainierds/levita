import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { User } from '../types';
import { UserCheck, Calendar, Mic2, Music, Mic, Loader2, Users } from 'lucide-react';

import TeamManager from './TeamManager';
import { ChurchSettings, ShiftTeam } from '../types';
import { Settings, Users as UsersIcon } from 'lucide-react';

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
    const { plans, loading, savePlan } = usePlans();
    const { role } = useAuth();
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [showTeamManager, setShowTeamManager] = useState(false);

    // Local state for batch updates
    const [draftTeam, setDraftTeam] = useState<any>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-select first plan if available
    React.useEffect(() => {
        if (plans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(plans[0].id);
        }
    }, [plans, selectedPlanId]);

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    // Sync draft when selected plan changes
    React.useEffect(() => {
        if (selectedPlan) {
            setDraftTeam(JSON.parse(JSON.stringify(selectedPlan.team))); // Deep copy
            setHasChanges(false);
        }
    }, [selectedPlanId, plans]);

    const handleTeamUpdate = (roleKey: string, name: string) => {
        if (!draftTeam) return;
        setDraftTeam({ ...draftTeam, [roleKey]: name });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedPlan || !draftTeam) return;
        setIsSaving(true);
        try {
            await savePlan({ ...selectedPlan, team: draftTeam });
            setHasChanges(false);
        } catch (error) {
            console.error(error);
            alert("Error al guardar cambios");
        } finally {
            setIsSaving(false);
        }
    };

    const applyTeamTemplate = (team: ShiftTeam) => {
        if (!draftTeam) return;
        if (!confirm(`¿Aplicar plantilla "${team.name}"? (Recuerda guardar los cambios)`)) return;

        const updatedTeam = {
            ...draftTeam,
            elder: team.members.elder || '',
            preacher: team.members.preacher || '',
            musicDirector: team.members.musicDirector || '',
            audioOperator: team.members.audioOperator || '',
        };
        setDraftTeam(updatedTeam);
        setHasChanges(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 md:pt-24 space-y-8 max-w-full mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Equipo de Turno</h2>
                    <p className="text-slate-500">Gestiona las asignaciones para los próximos servicios.</p>
                </div>
                <div className="flex gap-3">
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <UsersIcon size={18} />}
                            Guardar Cambios
                        </button>
                    )}
                    {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                        <button
                            onClick={() => setShowTeamManager(true)}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <Settings size={18} /> Gestionar Plantillas
                        </button>
                    )}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Plan Selector List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 mb-4">Próximos Servicios</h3>
                    <div className="space-y-3">
                        {plans.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => {
                                    if (hasChanges) {
                                        if (!confirm("Tienes cambios sin guardar. ¿Deseas descartarlos?")) return;
                                    }
                                    setSelectedPlanId(plan.id);
                                }}
                                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedPlanId === plan.id
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                    : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-lg">{plan.title}</span>
                                    {plan.isActive && (
                                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase">Activo</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-sm opacity-90">
                                    <Calendar size={14} />
                                    <span>{plan.date} • {plan.startTime}</span>
                                </div>
                            </button>
                        ))}
                        {plans.length === 0 && (
                            <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400">
                                No hay planes creados. Ve a "Orden de Cultos" para crear uno.
                            </div>
                        )}
                    </div>
                </div>

                {/* Team Editor */}
                <div className="lg:col-span-2">
                    {selectedPlan && draftTeam ? (
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                            {hasChanges && (
                                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse" />
                            )}

                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800">Asignaciones</h3>
                                        <p className="text-slate-500">Editando equipo para: <span className="font-semibold text-indigo-600">{selectedPlan.title}</span></p>
                                    </div>
                                </div>

                                {/* Quick Template Apply */}
                                {(settings.teams && settings.teams.length > 0) && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Cargar Plantilla:</span>
                                        <div className="flex gap-1">
                                            {settings.teams.map(team => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => applyTeamTemplate(team)}
                                                    className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                                                    title={`Cargar ${team.name}`}
                                                >
                                                    {team.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ROLES_CONFIG.map(roleConfig => {
                                    const roleUsers = users.filter(u => u.role === roleConfig.role);
                                    const currentValue = draftTeam[roleConfig.key] || '';

                                    // Permission Logic
                                    const isEditable =
                                        role === 'ADMIN' ||
                                        role === 'SUPER_ADMIN' ||
                                        (role === 'ELDER' && roleConfig.key === 'elder');

                                    return (
                                        <div key={roleConfig.key} className={`bg-slate-50 p-4 rounded-2xl border border-slate-100 ${!isEditable ? 'opacity-75' : ''}`}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className={`p-2 rounded-lg ${roleConfig.color}`}>
                                                    <roleConfig.icon size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 uppercase">{roleConfig.label}</span>
                                                {!isEditable && <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full ml-auto">Solo Lectura</span>}
                                            </div>

                                            <select
                                                value={currentValue}
                                                onChange={(e) => handleTeamUpdate(roleConfig.key, e.target.value)}
                                                disabled={!isEditable}
                                                className={`w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium text-slate-700 transition-all ${!isEditable ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'
                                                    } ${hasChanges && draftTeam[roleConfig.key] !== (selectedPlan.team as any)[roleConfig.key] ? 'border-indigo-300 bg-indigo-50/30' : ''}`}
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
                        <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                            Selecciona un servicio para editar el equipo
                        </div>
                    )}
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

export default TeamRoster;
