import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, Trash2, MailOpen, Archive } from 'lucide-react';
import { PrayerRequest } from '../types';

interface PrayerRequestsAdminProps {

}

const PrayerRequestsAdmin: React.FC<PrayerRequestsAdminProps> = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        if (!user?.tenantId) return;
        setLoading(true);
        try {
            const q = query(
                collection(db, 'prayerRequests'),
                where('tenantId', '==', user.tenantId),
                // orderBy('date', 'desc') // Requires composite index if chaining multiple wheres or sorts
            );
            const snapshot = await getDocs(q);
            // Sort client-side to avoid index issues for now
            const data = snapshot.docs
                .map(d => ({ id: d.id, ...d.data() } as PrayerRequest))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setRequests(data);
        } catch (error) {
            console.error("Error fetching prayer requests:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [user?.tenantId]);

    const handleMarkAsRead = async (id: string, currentStatus: string) => {
        if (currentStatus === 'READ') return;
        try {
            await updateDoc(doc(db, 'prayerRequests', id), { status: 'READ' });
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'READ' } : r));
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta petición?')) return;
        try {
            await deleteDoc(doc(db, 'prayerRequests', id));
            setRequests(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 max-w-full mx-auto pb-20">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Buzón de Oración</h2>
                <p className="text-slate-500">Gestiona las peticiones de oración recibidas desde la app.</p>
            </header>

            {loading ? (
                <div className="flex justify-center p-12"><span className="animate-spin text-indigo-500">Cargando...</span></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                    <MailOpen className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 font-bold">No hay peticiones de oración aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {requests.map(req => (
                        <div key={req.id} className={`p-6 rounded-[2rem] border transition-all ${req.status === 'PENDING' ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50' : 'bg-slate-50 border-slate-100 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                    {req.status === 'PENDING' ? 'Nueva' : 'Leída'}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">
                                    {new Date(req.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-2">{req.author}</h3>
                            <p className="text-slate-600 text-sm leading-relaxed mb-6 bg-slate-50/50 p-4 rounded-xl italic border border-slate-50">
                                "{req.content}"
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleMarkAsRead(req.id, req.status)}
                                    disabled={req.status === 'READ'}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-colors ${req.status === 'READ' ? 'bg-slate-100 text-slate-400 cursor-default' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm'}`}
                                >
                                    <CheckCircle2 size={16} /> Marcar Leída
                                </button>
                                <button
                                    onClick={() => handleDelete(req.id)}
                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PrayerRequestsAdmin;
