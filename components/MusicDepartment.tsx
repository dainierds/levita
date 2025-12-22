import React, { useState, useEffect } from 'react';
import { User, MusicTeam, SubscriptionTier } from '../types';
import { Calendar, Music, Plus, Trash2, User as UserIcon, Save, X, Mic2, Edit, Check } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { db } from '../services/firebase';
import { collection, addDoc, query, orderBy, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore'; // Added updateDoc
import { useAuth } from '../context/AuthContext';

interface MusicDepartmentProps {
    users: User[];
    tier: SubscriptionTier;
}

const MusicDepartment: React.FC<MusicDepartmentProps> = ({ users, tier }) => {
    const { user } = useAuth();
    const { addNotification } = useNotification();
    const [teams, setTeams] = useState<MusicTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // UI State for Actions
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<{
        date: string;
        selectedMembers: string[];
        note: string;
        soloist1: string;
        soloist2: string;
    }>({
        date: '',
        selectedMembers: [],
        note: '',
        soloist1: '',
        soloist2: ''
    });

    // Filter only MUSIC role users
    const musicUsers = users.filter(u => u.role === 'MUSIC');

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

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.tenantId) return;

        if (formData.selectedMembers.length === 0) {
            addNotification('warning', 'Atención', 'Selecciona al menos un miembro para el equipo.');
            return;
        }

        try {
            const teamData = {
                date: formData.date,
                memberIds: formData.selectedMembers,
                note: formData.note,
                soloist1: formData.soloist1 || '',
                soloist2: formData.soloist2 || '',
                tenantId: user.tenantId
            };

            if (editingTeamId) {
                // Update Mode
                await updateDoc(doc(db, 'tenants', user.tenantId, 'music_teams', editingTeamId), teamData);
                setTeams(teams.map(t => t.id === editingTeamId ? { ...t, ...teamData } : t));
                addNotification('success', 'Actualizado', 'El equipo ha sido actualizado.');
            } else {
                // Create Mode
                const docRef = await addDoc(collection(db, 'tenants', user.tenantId, 'music_teams'), teamData);
                setTeams([{ id: docRef.id, ...teamData } as MusicTeam, ...teams]);
                addNotification('success', 'Equipo Creado', 'El equipo de alabanza ha sido programado.');
            }

            // Reset Layout
            setShowForm(false);
            setEditingTeamId(null);
            setEditingTeamId(null);
            setFormData({ date: '', selectedMembers: [], note: '', soloist1: '', soloist2: '' });

        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo guardar el equipo.');
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!user?.tenantId) return;
        // Logic moved to inline, so this function executes the ACTUAL delete without confirm
        try {
            await deleteDoc(doc(db, 'tenants', user.tenantId, 'music_teams', id));
            setTeams(teams.filter(t => t.id !== id));
            addNotification('success', 'Eliminado', 'El equipo ha sido eliminado.');
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo eliminar.');
        }
    };

    const toggleMemberSelection = (userId: string) => {
        setFormData(prev => {
            const selected = prev.selectedMembers.includes(userId)
                ? prev.selectedMembers.filter(id => id !== userId)
                : [...prev.selectedMembers, userId];

            if (selected.length > 6) {
                return prev; // Max 6 constraint handled implicitly or silently? Let's stop it.
            }
            return { ...prev, selectedMembers: selected };
        });
    };

    return (
        <div className="p-4 md:p-8 md:pt-20 max-w-full mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Music className="text-pink-600" size={32} />
                        Dep. Música
                    </h2>
                    <p className="text-slate-500">Gestión de equipos de alabanza y programación.</p>
                </div>
                <button
                    onClick={() => {
                        if (!showForm) {
                            // Reset state when opening for new entry
                            setEditingTeamId(null);
                            setFormData({ date: '', selectedMembers: [], note: '', soloist1: '', soloist2: '' });
                        }
                        setShowForm(!showForm);
                    }}
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Cancelar' : 'Nuevo Equipo'}
                </button>
            </div>

            {/* CREATE FORM */}
            {showForm && (
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-pink-100 animate-in slide-in-from-top-4">
                    <form onSubmit={handleCreateTeam} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fecha de Servicio</label>
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <Calendar className="text-slate-400" />
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="bg-transparent w-full outline-none text-slate-700 font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nota / Descripción (Opcional)</label>
                                <textarea
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-pink-500 h-[52px]"
                                    placeholder="Ej. Especial de Navidad"
                                />
                            </div>

                            {/* SOLOIST SELECTORS */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Solista - 1er Servicio</label>
                                <div className="relative">
                                    <select
                                        value={formData.soloist1}
                                        onChange={e => setFormData({ ...formData, soloist1: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-500 appearance-none text-slate-700 font-bold"
                                    >
                                        <option value="">-- Sin Solista / General --</option>
                                        {musicUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <Mic2 size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Solista - 2do Servicio</label>
                                <div className="relative">
                                    <select
                                        value={formData.soloist2}
                                        onChange={e => setFormData({ ...formData, soloist2: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-pink-500 appearance-none text-slate-700 font-bold"
                                    >
                                        <option value="">-- Sin Solista / General --</option>
                                        {musicUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <Mic2 size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Seleccionar Integrantes (Máx 6)</label>
                                <span className={`text-xs font-bold ${formData.selectedMembers.length >= 6 ? 'text-red-500' : 'text-pink-600'}`}>
                                    {formData.selectedMembers.length} / 6
                                </span>
                            </div>

                            {musicUsers.length === 0 ? (
                                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                    <Music className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 text-sm">No hay usuarios con el rol 'Música'. <br />Ve a Gestión de Usuarios y crea algunos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {musicUsers.map(u => {
                                        const isSelected = formData.selectedMembers.includes(u.id);
                                        return (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => toggleMemberSelection(u.id)}
                                                disabled={!isSelected && formData.selectedMembers.length >= 6}
                                                className={`
                                                    relative p-3 rounded-xl border text-left transition-all
                                                    ${isSelected ? 'bg-pink-50 border-pink-500 shadow-md' : 'bg-white border-slate-200 hover:border-pink-300'}
                                                    ${(!isSelected && formData.selectedMembers.length >= 6) ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {isSelected && <div className="absolute -top-2 -right-2 bg-pink-500 text-white rounded-full p-0.5"><Check size={12} /></div>}
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-pink-200 text-pink-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <span className={`text-xs font-bold truncate w-full text-center ${isSelected ? 'text-pink-700' : 'text-slate-600'}`}>
                                                        {u.name.split(' ')[0]}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="bg-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200 flex items-center gap-2"
                            >
                                <Save size={18} /> Guardar Equipo
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TEAMS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-slate-400">Cargando equipos...</div>
                ) : teams.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                        <Mic2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No hay equipos programados.</p>
                        <p className="text-slate-400 text-sm">Crea el primero para comenzar.</p>
                    </div>
                ) : (
                    teams.map(team => {
                        const dateObj = new Date(team.date + 'T12:00:00'); // Fix timezone offset visually
                        return (
                            <div key={team.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                                            <span className="font-bold text-lg">{dateObj.getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                                                {dateObj.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                            </p>
                                            <p className="font-bold text-slate-800">
                                                {dateObj.toLocaleDateString('es-ES', { weekday: 'long' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setFormData({
                                                    date: team.date,
                                                    selectedMembers: team.memberIds,
                                                    note: team.note || '',
                                                    soloist1: team.soloist1 || '',
                                                    soloist2: team.soloist2 || ''
                                                });
                                                setEditingTeamId(team.id);
                                                setShowForm(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="text-slate-300 hover:text-indigo-500 transition-colors p-2"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>

                                        {deleteId === team.id ? (
                                            <div className="flex items-center bg-red-50 rounded-lg p-1 animate-in fade-in slide-in-from-right-4">
                                                <span className="text-[10px] font-bold text-red-500 mr-2 px-1">¿Borrar?</span>
                                                <button
                                                    onClick={() => handleDeleteTeam(team.id)}
                                                    className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors mr-1"
                                                >
                                                    <Check size={14} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteId(null)}
                                                    className="p-1 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteId(team.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        {team.memberIds.map(memberId => {
                                            const member = users.find(u => u.id === memberId);
                                            return (
                                                <span key={memberId} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold border border-slate-100 flex items-center gap-1">
                                                    <UserIcon size={10} /> {member?.name.split(' ')[0] || 'Usuario'}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>

                                {team.note && (
                                    <div className="pt-4 border-t border-slate-50 text-xs text-slate-500 italic">
                                        "{team.note}"
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MusicDepartment;
