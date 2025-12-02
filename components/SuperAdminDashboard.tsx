import React, { useState, useEffect } from 'react';
import { ChurchTenant, SubscriptionTier, TIER_LIMITS } from '../types';
import { Building2, ShieldCheck, Lock, Trash2, Plus, Ban, CheckCircle2, Crown, Zap, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useNotification } from './NotificationSystem';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy, setDoc } from 'firebase/firestore';
import { createInvitation } from '../services/invitationService';

interface SuperAdminDashboardProps {
    tenants: ChurchTenant[];
    setTenants: React.Dispatch<React.SetStateAction<ChurchTenant[]>>;
}

const TIER_BADGES = {
    BASIC: { color: 'bg-slate-100 text-slate-600', icon: Building2, label: 'Básico' },
    GOLD: { color: 'bg-yellow-100 text-yellow-700', icon: Zap, label: 'Gold' },
    PLATINUM: { color: 'bg-indigo-100 text-indigo-700', icon: Crown, label: 'Platinum' },
};

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ tenants, setTenants }) => {
    const { addNotification } = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        churchName: '',
        pastorName: '',
        pastorEmail: '',
        tier: 'GOLD' as SubscriptionTier
    });
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);

    // Fetch Tenants from Firestore on Mount
    useEffect(() => {
        const fetchTenants = async () => {
            try {
                const q = query(collection(db, 'tenants'), orderBy('joinedDate', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedTenants: ChurchTenant[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedTenants.push({ id: doc.id, ...doc.data() } as ChurchTenant);
                });
                setTenants(fetchedTenants);
            } catch (error) {
                console.error("Error fetching tenants:", error);
                addNotification('error', 'Error', 'No se pudieron cargar las iglesias.');
            }
        };

        fetchTenants();
    }, [setTenants, addNotification]);

    const handleCreateChurch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Prepare Data
            const newTenantData = {
                name: formData.churchName,
                pastorName: formData.pastorName,
                pastorEmail: formData.pastorEmail,
                tier: formData.tier,
                status: 'ACTIVE',
                joinedDate: new Date().toISOString()
            };

            // 1. Save to Firestore
            const docRef = await addDoc(collection(db, 'tenants'), newTenantData);
            const newTenant: ChurchTenant = { id: docRef.id, ...newTenantData } as ChurchTenant;

            // 2. Create Invitation
            const invitationCode = await createInvitation(
                docRef.id, // tenantId
                'ADMIN', // role
                formData.pastorName,
                'SUPER_ADMIN' // createdBy
            );

            // Construct Link
            const origin = window.location.origin;
            const link = `${origin}/join?code=${invitationCode}`;
            setGeneratedLink(link);

            // 3. Update State
            setTenants([newTenant, ...tenants]);
            addNotification('success', 'Iglesia Creada', 'Copia el enlace de invitación.');

        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo registrar la iglesia.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
            addNotification('success', 'Copiado', 'Enlace copiado al portapapeles');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setGeneratedLink(null);
        setFormData({ churchName: '', pastorName: '', pastorEmail: '', tier: 'GOLD' });
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        try {
            const newStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
            const tenantRef = doc(db, 'tenants', id);
            await updateDoc(tenantRef, { status: newStatus });

            setTenants(prev => prev.map(t =>
                t.id === id ? { ...t, status: newStatus as 'ACTIVE' | 'BLOCKED' } : t
            ));
            addNotification('success', 'Estado Actualizado', `La iglesia ahora está ${newStatus === 'ACTIVE' ? 'Activa' : 'Bloqueada'}`);
        } catch (error) {
            console.error(error);
            addNotification('error', 'Error', 'No se pudo actualizar el estado.');
        }
    };

    const deleteTenant = async (id: string) => {
        if (window.confirm('¿Está seguro de eliminar esta iglesia? Esta acción es irreversible.')) {
            try {
                await deleteDoc(doc(db, 'tenants', id));
                setTenants(prev => prev.filter(t => t.id !== id));
                addNotification('info', 'Eliminado', 'La iglesia ha sido eliminada del sistema.');
            } catch (error) {
                console.error(error);
                addNotification('error', 'Error', 'No se pudo eliminar la iglesia.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-900/50">
                                <ShieldCheck size={28} />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight">SUPER ADMIN</h1>
                        </div>
                        <p className="text-slate-400">Panel de Control de Iglesias & Suscripciones</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-500 hover:bg-indigo-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} /> Nueva Iglesia
                    </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Total Iglesias</h3>
                        <p className="text-4xl font-black text-white">{tenants.length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Suscripciones Platinum</h3>
                        <p className="text-4xl font-black text-indigo-400">{tenants.filter(t => t.tier === 'PLATINUM').length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700">
                        <h3 className="text-slate-400 font-bold text-xs uppercase mb-2">Ingresos Mensuales (Est.)</h3>
                        <p className="text-4xl font-black text-green-400">$2,450</p>
                    </div>
                </div>

                {/* Tenants Table */}
                <div className="bg-slate-800 rounded-[2.5rem] border border-slate-700 overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th className="p-6 font-bold text-slate-500 text-xs uppercase">Iglesia</th>
                                <th className="p-6 font-bold text-slate-500 text-xs uppercase">Pastor / Admin</th>
                                <th className="p-6 font-bold text-slate-500 text-xs uppercase">Plan</th>
                                <th className="p-6 font-bold text-slate-500 text-xs uppercase">Estado</th>
                                <th className="p-6 font-bold text-slate-500 text-xs uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500 italic">
                                        No hay iglesias registradas. Crea la primera arriba.
                                    </td>
                                </tr>
                            ) : (
                                tenants.map(tenant => {
                                    const TierIcon = TIER_BADGES[tenant.tier].icon;
                                    return (
                                        <tr key={tenant.id} className="hover:bg-slate-700/50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                                        {tenant.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{tenant.name}</p>
                                                        <p className="text-xs text-slate-500">ID: {tenant.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="text-slate-200 font-medium">{tenant.pastorName}</p>
                                                <p className="text-xs text-slate-500">{tenant.pastorEmail}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${TIER_BADGES[tenant.tier].color}`}>
                                                    <TierIcon size={12} /> {TIER_BADGES[tenant.tier].label}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                {tenant.status === 'ACTIVE' ? (
                                                    <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={14} /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                                                        <Ban size={14} /> Bloqueado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-6 text-right space-x-2">
                                                <button
                                                    onClick={() => toggleStatus(tenant.id, tenant.status)}
                                                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                                                    title={tenant.status === 'ACTIVE' ? 'Bloquear Acceso' : 'Desbloquear'}
                                                >
                                                    {tenant.status === 'ACTIVE' ? <Lock size={16} /> : <CheckCircle2 size={16} />}
                                                </button>
                                                <button
                                                    onClick={() => deleteTenant(tenant.id)}
                                                    className="p-2 bg-slate-700 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-slate-300 transition-colors"
                                                    title="Eliminar Iglesia"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-[2rem] max-w-lg w-full p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">Registrar Nueva Iglesia</h2>

                        {generatedLink ? (
                            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">¡Iglesia Registrada!</h3>
                                    <p className="text-slate-400">Comparte este enlace con el pastor para que active su cuenta.</p>
                                </div>

                                <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-3">
                                    <input
                                        readOnly
                                        value={generatedLink}
                                        className="bg-transparent w-full text-slate-300 text-sm outline-none"
                                    />
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                    >
                                        {copySuccess ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>

                                <button
                                    onClick={handleCloseModal}
                                    className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateChurch} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre de la Iglesia</label>
                                    <input
                                        required
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                        placeholder="Ej. Iglesia Vida Nueva"
                                        value={formData.churchName}
                                        onChange={e => setFormData({ ...formData, churchName: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Pastor</label>
                                        <input
                                            required
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                            placeholder="Ej. Juan Pérez"
                                            value={formData.pastorName}
                                            onChange={e => setFormData({ ...formData, pastorName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Pastor</label>
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                                            placeholder="juan@iglesia.com"
                                            value={formData.pastorEmail}
                                            onChange={e => setFormData({ ...formData, pastorEmail: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Nivel de Suscripción</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(['BASIC', 'GOLD', 'PLATINUM'] as SubscriptionTier[]).map(tier => (
                                            <button
                                                key={tier}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, tier })}
                                                className={`
                                            p-3 rounded-xl border-2 text-sm font-bold transition-all
                                            ${formData.tier === tier
                                                        ? 'border-indigo-500 bg-indigo-500/20 text-white'
                                                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600'}
                                        `}
                                            >
                                                {tier}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700 text-xs text-slate-400">
                                        {formData.tier === 'BASIC' && <ul className="list-disc pl-4"><li>Hasta {TIER_LIMITS.BASIC} Usuarios</li><li>Dashboard</li><li>Liturgia Básica</li></ul>}
                                        {formData.tier === 'GOLD' && <ul className="list-disc pl-4 text-yellow-500"><li>Hasta {TIER_LIMITS.GOLD} Usuarios</li><li>Eventos Admin</li><li>Gestión de Turnos</li></ul>}
                                        {formData.tier === 'PLATINUM' && <ul className="list-disc pl-4 text-indigo-400"><li>Usuarios Ilimitados</li><li>IA para Sermones</li><li>Traducción en Vivo</li></ul>}
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-indigo-900/20 flex justify-center gap-2 items-center"
                                    >
                                        {isLoading ? 'Procesando...' : <><LinkIcon size={16} /> Crear & Generar Enlace</>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
