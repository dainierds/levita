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

    // Auto-select first plan if available
    React.useEffect(() => {
        if (plans.length > 0 && !selectedPlanId) {
            setSelectedPlanId(plans[0].id);
        }
    }, [plans, selectedPlanId]);

    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    const handleTeamUpdate = async (roleKey: string, name: string) => {
        if (!selectedPlan) return;
        const updatedTeam = { ...selectedPlan.team, [roleKey]: name };
        await savePlan({ ...selectedPlan, team: updatedTeam });
    };

    const applyTeamTemplate = async (team: ShiftTeam) => {
        if (!selectedPlan) return;
        if (!confirm(`¿Aplicar plantilla "${team.name}" a este servicio? Esto sobrescribirá las asignaciones actuales.`)) return;

        const updatedTeam = {
            ...selectedPlan.team,
            elder: team.members.elder || '',
            preacher: team.members.preacher || '',
            musicDirector: team.members.musicDirector || '',
            audioOperator: team.members.audioOperator || '',
        };
        await savePlan({ ...selectedPlan, team: updatedTeam });
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
                {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                    <button
                        onClick={() => setShowTeamManager(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Settings size={18} /> Gestionar Plantillas
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Plan Selector List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-700 mb-4">Próximos Servicios</h3>
                    <div className="space-y-3">
                        {plans.map(plan => (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlanId(plan.id)}
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
                    {selectedPlan ? (
                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
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
                                    const currentValue = (selectedPlan.team as any)?.[roleConfig.key] || '';

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
                                                    }`}
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
